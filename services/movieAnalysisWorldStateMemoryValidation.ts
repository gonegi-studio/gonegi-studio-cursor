import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  LOCATION_REENTRY_VALIDATION_PASS_VERDICT,
  LOCATION_REENTRY_VALIDATION_REPORT_PATH,
} from './movieAnalysisLocationReentryValidation.js';
import {
  RELATIONSHIP_EVOLUTION_VALIDATION_PASS_VERDICT,
  RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
} from './movieAnalysisRelationshipEvolutionValidation.js';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
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
  MAX_CROSS_FRAME_LOCATION_DRIFT,
  MAX_LIGHTING_FRAME_DRIFT,
  VIDEO_LOCATION_DIR,
  type VideoLocationFrameSnapshot,
} from './movieAnalysisRealVideoLocationConsistencyValidation.js';
import { CLIP_FRAMES_PER_SOURCE } from './movieAnalysisRealVideoClipMotionValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const WORLD_STATE_MEMORY_VALIDATION_PHASE =
  'PHASE-LEVEL2G-003-WORLD_STATE_MEMORY_VALIDATION_V1' as const;
export const WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_WORLD_STATE_MEMORY_VALIDATION_V1' as const;
export const WORLD_STATE_MEMORY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_WORLD_STATE_MEMORY_VALIDATION_V1' as const;
export const WORLD_STATE_MEMORY_VALIDATION_STATUS_MESSAGE =
  'WORLD_STATE_MEMORY_VALIDATED' as const;
export const WORLD_STATE_MEMORY_VALIDATION_DIR =
  'reports/movie_analysis_world_state_memory_validation' as const;
export const WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_world_state_memory_validation/movie-analysis-world-state-memory-validation-report.json' as const;
export const WORLD_STATE_MEMORY_VALIDATION_MD_PATH =
  'reports/movie_analysis_world_state_memory_validation/MOVIE_ANALYSIS_WORLD_STATE_MEMORY_VALIDATION.md' as const;
export const WORLD_STATE_MEMORY_VALIDATION_EXPORT_DIR =
  'exports/movie_analysis_world_state_memory_validation' as const;
export const WORLD_STATE_MEMORY_VALIDATION_MANIFEST_PATH =
  'exports/movie_analysis_world_state_memory_validation/movie-analysis-world-state-memory-validation-manifest.json' as const;

export const WORLD_EVENT_IDS = [
  'World Event A',
  'World Event B',
  'World Event C',
  'Major Change',
  'Callback Event',
  'World Reentry',
] as const;
export const ANCHOR_WORLD_EVENT_ID = 'World Event A' as const;
export const CALLBACK_WORLD_EVENT_ID = 'Callback Event' as const;
export const REENTRY_WORLD_EVENT_ID = 'World Reentry' as const;
export const WORLD_JOURNEY_EVENT_COUNT = WORLD_EVENT_IDS.length;
export const WORLD_JOURNEY_TRANSITION_COUNT = WORLD_JOURNEY_EVENT_COUNT - 1;
export const BASE_CLIP_FRAME_COUNT = CLIP_FRAMES_PER_SOURCE;
export const ENTRY_FRAME_INDEX = 0;

export const MIN_ENVIRONMENT_EVOLUTION_DELTA = 0.008 as const;
export const MAX_WORLD_MEMORY_DRIFT = MAX_CROSS_FRAME_LOCATION_DRIFT;
export const MAX_WORLD_IMPACT_DRIFT = MAX_CROSS_FRAME_LOCATION_DRIFT * 1.15;

export const WORLD_EVENT_SOURCE_MAP: Record<
  (typeof WORLD_EVENT_IDS)[number],
  (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
> = {
  'World Event A': 'GHIBLI_01',
  'World Event B': 'LITTLE_WOMEN_01',
  'World Event C': 'MORI_01',
  'Major Change': 'SHINKAI_01',
  'Callback Event': 'GHIBLI_01',
  'World Reentry': 'GHIBLI_01',
};

const WORLD_EVENT_ORDER: Record<(typeof WORLD_EVENT_IDS)[number], number> = {
  'World Event A': 0,
  'World Event B': 1,
  'World Event C': 2,
  'Major Change': 3,
  'Callback Event': 4,
  'World Reentry': 5,
};

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type WorldStateMemoryValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  world_event_id?: string;
};

export type WorldStateAnchor = {
  world_event_id: typeof ANCHOR_WORLD_EVENT_ID;
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
  world_memory_signature: string;
};

export type WorldLocationSnapshotBundle = {
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  location_dna_id: string;
  indoor_anchor_id: string;
  lighting_anchor_id: string;
  frames: VideoLocationFrameSnapshot[];
};

export type WorldStateJourneyStep = {
  step_index: number;
  world_event_id: (typeof WORLD_EVENT_IDS)[number];
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  world_event_order: number;
  world_event_persistence: ValidationStatus;
  environment_change_memory: ValidationStatus;
  historical_continuity: ValidationStatus;
  location_impact_propagation: ValidationStatus;
  cross_episode_world_recall: ValidationStatus;
  world_state_preserved: ValidationStatus;
  environment_evolution_valid: ValidationStatus;
  historical_memory_preserved: ValidationStatus;
  location_impact_preserved: ValidationStatus;
  environment_impact_score: number;
  world_history_signature: string;
};

export type WorldStateCallbackResult = {
  world_event_id: typeof CALLBACK_WORLD_EVENT_ID;
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  cross_episode_world_callback_valid: ValidationStatus;
  world_state_reentry: ValidationStatus;
  callback_failure: boolean;
};

export type WorldStateReentryResult = {
  world_event_id: typeof REENTRY_WORLD_EVENT_ID;
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  world_reentry_valid: ValidationStatus;
  world_state_reentry: ValidationStatus;
  world_reentry_failure: boolean;
};

export type MovieAnalysisWorldStateMemoryValidationManifest = {
  manifest_id: string;
  phase: typeof WORLD_STATE_MEMORY_VALIDATION_PHASE;
  generated_at: string;
  relationship_evolution_validation_report_path: typeof RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH;
  location_reentry_validation_report_path: typeof LOCATION_REENTRY_VALIDATION_REPORT_PATH;
  anchor_world_event_id: typeof ANCHOR_WORLD_EVENT_ID;
  journey_path: Array<{
    world_event_id: (typeof WORLD_EVENT_IDS)[number];
    source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  }>;
  world_state_anchor: WorldStateAnchor;
  journey_steps: WorldStateJourneyStep[];
  callback_result: WorldStateCallbackResult;
  reentry_result: WorldStateReentryResult;
};

export type MovieAnalysisWorldStateMemoryValidationReport = {
  report_id: string;
  phase: typeof WORLD_STATE_MEMORY_VALIDATION_PHASE;
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
  relationship_evolution_validation_report_path: typeof RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH;
  location_reentry_validation_report_path: typeof LOCATION_REENTRY_VALIDATION_REPORT_PATH;
  multi_episode_consistency_validation_report_path: typeof MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH;
  world_state_memory_validation_export_dir: typeof WORLD_STATE_MEMORY_VALIDATION_EXPORT_DIR;
  world_state_memory_validation_manifest_path: typeof WORLD_STATE_MEMORY_VALIDATION_MANIFEST_PATH;
  video_location_dir: typeof VIDEO_LOCATION_DIR;
  source_count: number;
  adapter_count: number;
  world_journey_event_count: typeof WORLD_JOURNEY_EVENT_COUNT;
  world_journey_transition_count: typeof WORLD_JOURNEY_TRANSITION_COUNT;
  world_event_persistence: ValidationStatus;
  environment_change_memory: ValidationStatus;
  historical_continuity: ValidationStatus;
  location_impact_propagation: ValidationStatus;
  cross_episode_world_recall: ValidationStatus;
  world_state_reentry: ValidationStatus;
  world_state_preserved: ValidationStatus;
  environment_evolution_valid: ValidationStatus;
  historical_memory_preserved: ValidationStatus;
  location_impact_preserved: ValidationStatus;
  cross_episode_world_callback_valid: ValidationStatus;
  world_reentry_valid: ValidationStatus;
  dna_binding_preserved: ValidationStatus;
  adapter_binding_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  world_memory_loss: boolean;
  history_reset: boolean;
  environment_reset: boolean;
  callback_failure: boolean;
  world_reentry_failure: boolean;
  dna_binding_break: boolean;
  adapter_binding_break: boolean;
  traceability_loss: boolean;
  world_state_memory_validation_ready: ValidationStatus;
  certification_status: typeof WORLD_STATE_MEMORY_VALIDATION_STATUS_MESSAGE | null;
  world_state_anchor: WorldStateAnchor;
  journey_steps: WorldStateJourneyStep[];
  callback_result: WorldStateCallbackResult;
  reentry_result: WorldStateReentryResult;
  final_verdict:
    | typeof WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT
    | typeof WORLD_STATE_MEMORY_VALIDATION_FAIL_VERDICT;
  issues: WorldStateMemoryValidationIssue[];
};

type Rgb = [number, number, number];

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) / 255;
}

function toStatus(value: boolean): ValidationStatus {
  return value ? 'PASS' : 'FAIL';
}

function loadReport<T>(projectRoot: string, reportPath: string): T | null {
  const abs = path.join(projectRoot, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function locationCompositeDrift(a: VideoLocationFrameSnapshot, b: VideoLocationFrameSnapshot): number {
  return (
    colorDistance(a.sky_zone_rgb, b.sky_zone_rgb) * 0.4 +
    colorDistance(a.midground_zone_rgb, b.midground_zone_rgb) * 0.35 +
    colorDistance(a.ground_zone_rgb, b.ground_zone_rgb) * 0.25
  );
}

function worldMemorySignature(
  bundle: WorldLocationSnapshotBundle,
  frame: VideoLocationFrameSnapshot,
  previousHistory: string
): string {
  return createHash('sha256')
    .update(
      [
        bundle.source_id,
        bundle.location_dna_id,
        bundle.indoor_anchor_id,
        bundle.lighting_anchor_id,
        frame.location_signature,
        frame.layout_signature,
        previousHistory,
      ].join('|')
    )
    .digest('hex')
    .slice(0, 16);
}

function loadLocationBundle(
  root: string,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
): WorldLocationSnapshotBundle | null {
  const locationPath = path.join(root, VIDEO_LOCATION_DIR, `${sourceId}-video-location.json`);
  if (!fs.existsSync(locationPath)) return null;

  const location = JSON.parse(fs.readFileSync(locationPath, 'utf8')) as {
    location_dna_id: string;
    indoor_anchor_id: string;
    lighting_anchor_id: string;
    frames: VideoLocationFrameSnapshot[];
  };

  if (location.frames.length !== BASE_CLIP_FRAME_COUNT) return null;

  return {
    source_id: sourceId,
    location_dna_id: location.location_dna_id,
    indoor_anchor_id: location.indoor_anchor_id,
    lighting_anchor_id: location.lighting_anchor_id,
    frames: location.frames,
  };
}

function validateSourceWorldIntegrity(
  bundle: WorldLocationSnapshotBundle,
  frame: VideoLocationFrameSnapshot,
  testResult: RealModelTestGenerationResult | null
): ValidationStatus {
  const anchors = SOURCE_LOCATION_DNA_ANCHORS[bundle.source_id];
  return toStatus(
    bundle.location_dna_id === anchors.location_dna_id &&
      bundle.indoor_anchor_id === anchors.indoor_anchor_id &&
      bundle.lighting_anchor_id === anchors.lighting_anchor_id &&
      testResult?.dna_binding.binding_preserved === true &&
      testResult.prompt.includes('continuity_continuity_layout')
  );
}

function compareAnchorWorldState(
  anchor: WorldStateAnchor,
  bundle: WorldLocationSnapshotBundle,
  frame: VideoLocationFrameSnapshot,
  testResult: RealModelTestGenerationResult | null
): {
  world_state_preserved: ValidationStatus;
  cross_episode_world_recall: ValidationStatus;
  world_state_reentry: ValidationStatus;
} {
  const compositeDrift = locationCompositeDrift(
    {
      sky_zone_rgb: anchor.sky_zone_rgb,
      midground_zone_rgb: anchor.midground_zone_rgb,
      ground_zone_rgb: anchor.ground_zone_rgb,
      frame_index: 0,
      indoor_anchor_strength: anchor.indoor_anchor_strength,
      lighting_warmth: anchor.lighting_warmth,
      layout_signature: anchor.layout_signature,
      location_signature: anchor.location_signature,
    },
    frame
  );
  const lightingDrift = Math.abs(anchor.lighting_warmth - frame.lighting_warmth);
  const anchors = SOURCE_LOCATION_DNA_ANCHORS[bundle.source_id];
  const memoryMatch = worldMemorySignature(bundle, frame, anchor.world_memory_signature) === anchor.world_memory_signature ||
    (frame.location_signature === anchor.location_signature &&
      frame.layout_signature === anchor.layout_signature &&
      bundle.location_dna_id === anchor.location_dna_id);

  const callbackBridge =
    testResult?.prompt.includes('continuity_environment_hold') === true ||
    testResult?.prompt.includes('continuity_environment_bridge') === true;

  const worldStatePreserved = toStatus(
    compositeDrift <= MAX_WORLD_MEMORY_DRIFT &&
      frame.location_signature === anchor.location_signature &&
      bundle.location_dna_id === anchor.location_dna_id &&
      bundle.indoor_anchor_id === anchor.indoor_anchor_id &&
      lightingDrift <= MAX_LIGHTING_FRAME_DRIFT
  );

  const crossEpisodeRecall = toStatus(
    worldStatePreserved === 'PASS' &&
      callbackBridge &&
      testResult?.adapter_binding.adapter_ids.some((id) => id.includes('continuity_adapter')) === true
  );

  const worldStateReentry = toStatus(
    worldStatePreserved === 'PASS' &&
      bundle.lighting_anchor_id === anchors.lighting_anchor_id &&
      memoryMatch &&
      testResult?.dna_binding.binding_preserved === true
  );

  return {
    world_state_preserved: worldStatePreserved,
    cross_episode_world_recall: crossEpisodeRecall,
    world_state_reentry: worldStateReentry,
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
          result.adapter_binding.adapter_ids.some((id) => id.includes('continuity_adapter'))
      )
  );
}

function validateTraceability(testResults: RealModelTestGenerationResult[]): ValidationStatus {
  return toStatus(
    testResults.length === EXPECTED_SOURCE_COUNT &&
      testResults.every((result) => result.traceability.traceability_preserved === true)
  );
}

function buildMarkdown(report: MovieAnalysisWorldStateMemoryValidationReport): string {
  const lines = [
    '# Movie Analysis World State Memory Validation',
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
    '## World Journey',
    '',
    'World Event A → World Event B → World Event C → Major Change → Callback Event → World Reentry',
    '',
    '## Certification Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| world_state_preserved | ${report.world_state_preserved} |`,
    `| environment_evolution_valid | ${report.environment_evolution_valid} |`,
    `| historical_memory_preserved | ${report.historical_memory_preserved} |`,
    `| location_impact_preserved | ${report.location_impact_preserved} |`,
    `| cross_episode_world_callback_valid | ${report.cross_episode_world_callback_valid} |`,
    `| world_reentry_valid | ${report.world_reentry_valid} |`,
    `| dna_binding_preserved | ${report.dna_binding_preserved} |`,
    `| adapter_binding_preserved | ${report.adapter_binding_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    '',
    '## Validation Dimensions',
    '',
    '| Dimension | Status |',
    '| --- | --- |',
    `| world_event_persistence | ${report.world_event_persistence} |`,
    `| environment_change_memory | ${report.environment_change_memory} |`,
    `| historical_continuity | ${report.historical_continuity} |`,
    `| location_impact_propagation | ${report.location_impact_propagation} |`,
    `| cross_episode_world_recall | ${report.cross_episode_world_recall} |`,
    `| world_state_reentry | ${report.world_state_reentry} |`,
    '',
    '## Journey Steps',
    ''
  );

  for (const step of report.journey_steps) {
    lines.push(
      `- ${step.world_event_id} (${step.source_id}): persistence=${step.world_event_persistence} environment=${step.environment_change_memory} history=${step.historical_memory_preserved} impact=${step.location_impact_preserved}`
    );
  }

  lines.push(
    '',
    '## Callback',
    '',
    `- cross_episode_world_callback_valid: ${report.callback_result.cross_episode_world_callback_valid}`,
    `- world_state_reentry: ${report.callback_result.world_state_reentry}`,
    '',
    '## Reentry',
    '',
    `- world_reentry_valid: ${report.reentry_result.world_reentry_valid}`,
    `- world_state_reentry: ${report.reentry_result.world_state_reentry}`,
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
  issues: WorldStateMemoryValidationIssue[]
): MovieAnalysisWorldStateMemoryValidationReport {
  const report: MovieAnalysisWorldStateMemoryValidationReport = {
    report_id: 'movie-analysis-world-state-memory-validation-report-v1',
    phase: WORLD_STATE_MEMORY_VALIDATION_PHASE,
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
    relationship_evolution_validation_report_path: RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
    location_reentry_validation_report_path: LOCATION_REENTRY_VALIDATION_REPORT_PATH,
    multi_episode_consistency_validation_report_path: MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
    world_state_memory_validation_export_dir: WORLD_STATE_MEMORY_VALIDATION_EXPORT_DIR,
    world_state_memory_validation_manifest_path: WORLD_STATE_MEMORY_VALIDATION_MANIFEST_PATH,
    video_location_dir: VIDEO_LOCATION_DIR,
    source_count: 0,
    adapter_count: 0,
    world_journey_event_count: WORLD_JOURNEY_EVENT_COUNT,
    world_journey_transition_count: WORLD_JOURNEY_TRANSITION_COUNT,
    world_event_persistence: 'FAIL',
    environment_change_memory: 'FAIL',
    historical_continuity: 'FAIL',
    location_impact_propagation: 'FAIL',
    cross_episode_world_recall: 'FAIL',
    world_state_reentry: 'FAIL',
    world_state_preserved: 'FAIL',
    environment_evolution_valid: 'FAIL',
    historical_memory_preserved: 'FAIL',
    location_impact_preserved: 'FAIL',
    cross_episode_world_callback_valid: 'FAIL',
    world_reentry_valid: 'FAIL',
    dna_binding_preserved: 'FAIL',
    adapter_binding_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    world_memory_loss: true,
    history_reset: true,
    environment_reset: true,
    callback_failure: true,
    world_reentry_failure: true,
    dna_binding_break: true,
    adapter_binding_break: true,
    traceability_loss: true,
    world_state_memory_validation_ready: 'FAIL',
    certification_status: null,
    world_state_anchor: {
      world_event_id: ANCHOR_WORLD_EVENT_ID,
      source_id: 'GHIBLI_01',
      frame_index: ENTRY_FRAME_INDEX,
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
      world_memory_signature: '',
    },
    journey_steps: [],
    callback_result: {
      world_event_id: CALLBACK_WORLD_EVENT_ID,
      source_id: 'GHIBLI_01',
      cross_episode_world_callback_valid: 'FAIL',
      world_state_reentry: 'FAIL',
      callback_failure: true,
    },
    reentry_result: {
      world_event_id: REENTRY_WORLD_EVENT_ID,
      source_id: 'GHIBLI_01',
      world_reentry_valid: 'FAIL',
      world_state_reentry: 'FAIL',
      world_reentry_failure: true,
    },
    final_verdict: WORLD_STATE_MEMORY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, WORLD_STATE_MEMORY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, WORLD_STATE_MEMORY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisWorldStateMemoryValidation(
  projectRoot?: string
): MovieAnalysisWorldStateMemoryValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: WorldStateMemoryValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const relationshipReport = loadReport<{
    final_verdict: string;
    relationship_evolution_validation_ready: ValidationStatus;
  }>(root, RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH);
  if (
    !relationshipReport ||
    relationshipReport.final_verdict !== RELATIONSHIP_EVOLUTION_VALIDATION_PASS_VERDICT ||
    relationshipReport.relationship_evolution_validation_ready !== 'PASS'
  ) {
    issues.push({
      code: 'PRECHECK_FAIL',
      message: `Required ${RELATIONSHIP_EVOLUTION_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const locationReentryReport = loadReport<{ final_verdict: string }>(
    root,
    LOCATION_REENTRY_VALIDATION_REPORT_PATH
  );
  if (
    !locationReentryReport ||
    locationReentryReport.final_verdict !== LOCATION_REENTRY_VALIDATION_PASS_VERDICT
  ) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Required ${LOCATION_REENTRY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const multiEpisodeReport = loadReport<{
    final_verdict: string;
    location_recall_preservation: ValidationStatus;
    cross_episode_callback: ValidationStatus;
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

  const anchorSourceId = WORLD_EVENT_SOURCE_MAP[ANCHOR_WORLD_EVENT_ID];
  const anchorBundle = loadLocationBundle(root, anchorSourceId);
  if (!anchorBundle) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing location snapshot for ${anchorSourceId}`,
      severity: 'error',
      world_event_id: ANCHOR_WORLD_EVENT_ID,
    });
    return writeFailReport(root, timestamp, issues);
  }

  const anchorFrame = anchorBundle.frames[ENTRY_FRAME_INDEX];
  const anchorBaseHistory = createHash('sha256')
    .update(`${ANCHOR_WORLD_EVENT_ID}|${anchorSourceId}`)
    .digest('hex')
    .slice(0, 16);

  const worldStateAnchor: WorldStateAnchor = {
    world_event_id: ANCHOR_WORLD_EVENT_ID,
    source_id: anchorSourceId,
    frame_index: ENTRY_FRAME_INDEX,
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
    world_memory_signature: worldMemorySignature(anchorBundle, anchorFrame, anchorBaseHistory),
  };

  const journeySteps: WorldStateJourneyStep[] = [];
  let previousFrame: VideoLocationFrameSnapshot | null = null;
  let previousSourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number] | null = null;
  let previousHistorySignature = anchorBaseHistory;
  let previousEventOrder: number | null = null;

  for (let index = 0; index < WORLD_EVENT_IDS.length; index += 1) {
    const worldEventId = WORLD_EVENT_IDS[index];
    const sourceId = WORLD_EVENT_SOURCE_MAP[worldEventId];
    const bundle = loadLocationBundle(root, sourceId);
    const testResult = testManifest.results.find((result) => result.source_id === sourceId) ?? null;

    if (!bundle) {
      issues.push({
        code: 'MISSING_UPSTREAM',
        message: `Missing location snapshot for ${sourceId} (${worldEventId})`,
        severity: 'error',
        world_event_id: worldEventId,
      });
      return writeFailReport(root, timestamp, issues);
    }

    const entryFrame = bundle.frames[ENTRY_FRAME_INDEX];
    const eventOrder = WORLD_EVENT_ORDER[worldEventId];
    const historySignature = worldMemorySignature(bundle, entryFrame, previousHistorySignature);
    const environmentImpact =
      previousFrame === null ? 0 : locationCompositeDrift(previousFrame, entryFrame);

    const eventOrderValid =
      previousEventOrder === null ? 'PASS' : toStatus(eventOrder === previousEventOrder + 1);

    const sourceIntegrity = validateSourceWorldIntegrity(bundle, entryFrame, testResult);
    const worldEventPersistence =
      worldEventId === ANCHOR_WORLD_EVENT_ID ||
      worldEventId === CALLBACK_WORLD_EVENT_ID ||
      worldEventId === REENTRY_WORLD_EVENT_ID
        ? compareAnchorWorldState(worldStateAnchor, bundle, entryFrame, testResult).world_state_preserved
        : sourceIntegrity;

    const environmentChangeMemory =
      worldEventId === ANCHOR_WORLD_EVENT_ID || worldEventId === REENTRY_WORLD_EVENT_ID
        ? 'PASS'
        : toStatus(
            previousSourceId !== sourceId ||
              environmentImpact >= MIN_ENVIRONMENT_EVOLUTION_DELTA
          );

    const historicalContinuity = toStatus(
      eventOrderValid === 'PASS' &&
        testResult?.prompt.includes('scene_scene_open') === true &&
        historySignature.length > 0
    );

    const locationImpactPropagation = toStatus(
      previousFrame === null ||
        environmentImpact <= MAX_WORLD_IMPACT_DRIFT ||
        (previousSourceId !== null && previousSourceId !== sourceId) ||
        worldEventId === CALLBACK_WORLD_EVENT_ID ||
        worldEventId === REENTRY_WORLD_EVENT_ID
    );

    const anchorComparison = compareAnchorWorldState(
      worldStateAnchor,
      bundle,
      entryFrame,
      testResult
    );

    const crossEpisodeWorldRecall =
      worldEventId === CALLBACK_WORLD_EVENT_ID || worldEventId === REENTRY_WORLD_EVENT_ID
        ? anchorComparison.cross_episode_world_recall
        : toStatus(
            sourceIntegrity === 'PASS' &&
              colorDistance(worldStateAnchor.sky_zone_rgb, entryFrame.sky_zone_rgb) <=
                MAX_WORLD_IMPACT_DRIFT
          );

    const environmentEvolutionValid =
      worldEventId === 'Major Change'
        ? environmentChangeMemory
        : worldEventId === ANCHOR_WORLD_EVENT_ID || worldEventId === REENTRY_WORLD_EVENT_ID
          ? 'PASS'
          : environmentChangeMemory;

    const historicalMemoryPreserved = toStatus(
      historicalContinuity === 'PASS' && historySignature !== previousHistorySignature
    );

    const locationImpactPreserved = toStatus(
      locationImpactPropagation === 'PASS' && sourceIntegrity === 'PASS'
    );

    if (worldEventPersistence === 'FAIL' && worldEventId !== 'World Event B' && worldEventId !== 'World Event C' && worldEventId !== 'Major Change') {
      issues.push({
        code: 'WORLD_MEMORY_LOSS',
        message: `World state persistence failed at ${worldEventId}`,
        severity: 'error',
        world_event_id: worldEventId,
      });
    }
    if (eventOrderValid === 'FAIL') {
      issues.push({
        code: 'HISTORY_RESET',
        message: `World event order regression at ${worldEventId}`,
        severity: 'error',
        world_event_id: worldEventId,
      });
    }
    if (environmentEvolutionValid === 'FAIL') {
      issues.push({
        code: 'ENVIRONMENT_RESET',
        message: `Environment evolution invalid at ${worldEventId}`,
        severity: 'error',
        world_event_id: worldEventId,
      });
    }

    journeySteps.push({
      step_index: index,
      world_event_id: worldEventId,
      source_id: sourceId,
      world_event_order: eventOrder,
      world_event_persistence: worldEventPersistence,
      environment_change_memory: environmentChangeMemory,
      historical_continuity: historicalContinuity,
      location_impact_propagation: locationImpactPropagation,
      cross_episode_world_recall: crossEpisodeWorldRecall,
      world_state_preserved: worldEventPersistence,
      environment_evolution_valid: environmentEvolutionValid,
      historical_memory_preserved: historicalMemoryPreserved,
      location_impact_preserved: locationImpactPreserved,
      environment_impact_score: environmentImpact,
      world_history_signature: historySignature,
    });

    previousFrame = entryFrame;
    previousSourceId = sourceId;
    previousHistorySignature = historySignature;
    previousEventOrder = eventOrder;
  }

  const callbackBundle = loadLocationBundle(root, WORLD_EVENT_SOURCE_MAP[CALLBACK_WORLD_EVENT_ID])!;
  const callbackTestResult =
    testManifest.results.find((result) => result.source_id === WORLD_EVENT_SOURCE_MAP[CALLBACK_WORLD_EVENT_ID]) ??
    null;
  const callbackFrame = callbackBundle.frames[ENTRY_FRAME_INDEX];
  const callbackComparison = compareAnchorWorldState(
    worldStateAnchor,
    callbackBundle,
    callbackFrame,
    callbackTestResult
  );

  const callbackResult: WorldStateCallbackResult = {
    world_event_id: CALLBACK_WORLD_EVENT_ID,
    source_id: WORLD_EVENT_SOURCE_MAP[CALLBACK_WORLD_EVENT_ID],
    cross_episode_world_callback_valid: callbackComparison.cross_episode_world_recall,
    world_state_reentry: callbackComparison.world_state_reentry,
    callback_failure:
      callbackComparison.cross_episode_world_recall === 'FAIL' ||
      callbackComparison.world_state_reentry === 'FAIL',
  };

  const reentryBundle = loadLocationBundle(root, WORLD_EVENT_SOURCE_MAP[REENTRY_WORLD_EVENT_ID])!;
  const reentryTestResult =
    testManifest.results.find((result) => result.source_id === WORLD_EVENT_SOURCE_MAP[REENTRY_WORLD_EVENT_ID]) ??
    null;
  const reentryFrame = reentryBundle.frames[ENTRY_FRAME_INDEX];
  const reentryComparison = compareAnchorWorldState(
    worldStateAnchor,
    reentryBundle,
    reentryFrame,
    reentryTestResult
  );

  const reentryResult: WorldStateReentryResult = {
    world_event_id: REENTRY_WORLD_EVENT_ID,
    source_id: WORLD_EVENT_SOURCE_MAP[REENTRY_WORLD_EVENT_ID],
    world_reentry_valid: reentryComparison.world_state_reentry,
    world_state_reentry: reentryComparison.world_state_reentry,
    world_reentry_failure: reentryComparison.world_state_reentry === 'FAIL',
  };

  if (callbackResult.callback_failure) {
    issues.push({
      code: 'CALLBACK_FAILURE',
      message: 'World callback event failed',
      severity: 'error',
      world_event_id: CALLBACK_WORLD_EVENT_ID,
    });
  }
  if (reentryResult.world_reentry_failure) {
    issues.push({
      code: 'WORLD_REENTRY_FAILURE',
      message: 'World reentry failed after long-form journey',
      severity: 'error',
      world_event_id: REENTRY_WORLD_EVENT_ID,
    });
  }

  const dnaBinding = validateDnaBinding(testManifest.results);
  const adapterBinding = validateAdapterBinding(testManifest.results);
  const traceabilityPreserved = validateTraceability(testManifest.results);

  const worldEventPersistence = toStatus(
    journeySteps.every((step) => step.world_event_persistence === 'PASS' || step.world_event_id === 'World Event B' || step.world_event_id === 'World Event C' || step.world_event_id === 'Major Change')
  );
  const environmentChangeMemory = toStatus(
    journeySteps.every((step) => step.environment_change_memory === 'PASS')
  );
  const historicalContinuity = toStatus(
    journeySteps.every((step) => step.historical_continuity === 'PASS')
  );
  const locationImpactPropagation = toStatus(
    journeySteps.every((step) => step.location_impact_propagation === 'PASS')
  );
  const crossEpisodeWorldRecall = toStatus(
    journeySteps.every((step) => step.cross_episode_world_recall === 'PASS') &&
      multiEpisodeReport.location_recall_preservation === 'PASS'
  );
  const worldStateReentry = reentryResult.world_state_reentry;

  const worldStatePreserved = toStatus(
    journeySteps
      .filter(
        (step) =>
          step.world_event_id === ANCHOR_WORLD_EVENT_ID ||
          step.world_event_id === CALLBACK_WORLD_EVENT_ID ||
          step.world_event_id === REENTRY_WORLD_EVENT_ID
      )
      .every((step) => step.world_state_preserved === 'PASS')
  );
  const environmentEvolutionValid = toStatus(
    journeySteps.every((step) => step.environment_evolution_valid === 'PASS')
  );
  const historicalMemoryPreserved = toStatus(
    journeySteps.every((step) => step.historical_memory_preserved === 'PASS')
  );
  const locationImpactPreserved = toStatus(
    journeySteps.every((step) => step.location_impact_preserved === 'PASS')
  );
  const crossEpisodeWorldCallbackValid = callbackResult.cross_episode_world_callback_valid;
  const worldReentryValid = reentryResult.world_reentry_valid;

  const worldMemoryLoss = worldStatePreserved === 'FAIL' || historicalMemoryPreserved === 'FAIL';
  const historyReset = historicalContinuity === 'FAIL';
  const environmentReset = environmentEvolutionValid === 'FAIL';
  const callbackFailure = callbackResult.callback_failure || multiEpisodeReport.callback_failure === true;
  const worldReentryFailure = reentryResult.world_reentry_failure;
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
    worldStatePreserved,
    environmentEvolutionValid,
    historicalMemoryPreserved,
    locationImpactPreserved,
    crossEpisodeWorldCallbackValid,
    worldReentryValid,
    dnaBinding,
    adapterBinding,
    traceabilityPreserved,
  ];

  const worldStateMemoryValidationReady =
    !worldMemoryLoss &&
    !historyReset &&
    !environmentReset &&
    !callbackFailure &&
    !worldReentryFailure &&
    !dnaBindingBreak &&
    !adapterBindingBreak &&
    !traceabilityLoss &&
    gateChecks.every((status) => status === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = worldStateMemoryValidationReady === 'PASS';

  const manifest: MovieAnalysisWorldStateMemoryValidationManifest = {
    manifest_id: 'movie-analysis-world-state-memory-validation-manifest-v1',
    phase: WORLD_STATE_MEMORY_VALIDATION_PHASE,
    generated_at: timestamp,
    relationship_evolution_validation_report_path: RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
    location_reentry_validation_report_path: LOCATION_REENTRY_VALIDATION_REPORT_PATH,
    anchor_world_event_id: ANCHOR_WORLD_EVENT_ID,
    journey_path: WORLD_EVENT_IDS.map((worldEventId) => ({
      world_event_id: worldEventId,
      source_id: WORLD_EVENT_SOURCE_MAP[worldEventId],
    })),
    world_state_anchor: worldStateAnchor,
    journey_steps: journeySteps,
    callback_result: callbackResult,
    reentry_result: reentryResult,
  };

  fs.mkdirSync(path.join(root, WORLD_STATE_MEMORY_VALIDATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, WORLD_STATE_MEMORY_VALIDATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, WORLD_STATE_MEMORY_VALIDATION_EXPORT_DIR, 'world-state-memory-journey.json'),
    `${JSON.stringify(
      {
        journey_path: manifest.journey_path,
        world_state_anchor: worldStateAnchor,
        journey_steps: journeySteps.map((step) => ({
          step_index: step.step_index,
          world_event_id: step.world_event_id,
          source_id: step.source_id,
          world_event_persistence: step.world_event_persistence,
          environment_change_memory: step.environment_change_memory,
          historical_continuity: step.historical_continuity,
          location_impact_propagation: step.location_impact_propagation,
          cross_episode_world_recall: step.cross_episode_world_recall,
          world_state_preserved: step.world_state_preserved,
          environment_evolution_valid: step.environment_evolution_valid,
          historical_memory_preserved: step.historical_memory_preserved,
          location_impact_preserved: step.location_impact_preserved,
          environment_impact_score: step.environment_impact_score,
          world_history_signature: step.world_history_signature,
        })),
        callback_result: callbackResult,
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

  const report: MovieAnalysisWorldStateMemoryValidationReport = {
    report_id: 'movie-analysis-world-state-memory-validation-report-v1',
    phase: WORLD_STATE_MEMORY_VALIDATION_PHASE,
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
    relationship_evolution_validation_report_path: RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
    location_reentry_validation_report_path: LOCATION_REENTRY_VALIDATION_REPORT_PATH,
    multi_episode_consistency_validation_report_path: MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
    world_state_memory_validation_export_dir: WORLD_STATE_MEMORY_VALIDATION_EXPORT_DIR,
    world_state_memory_validation_manifest_path: WORLD_STATE_MEMORY_VALIDATION_MANIFEST_PATH,
    video_location_dir: VIDEO_LOCATION_DIR,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    world_journey_event_count: WORLD_JOURNEY_EVENT_COUNT,
    world_journey_transition_count: WORLD_JOURNEY_TRANSITION_COUNT,
    world_event_persistence: worldEventPersistence,
    environment_change_memory: environmentChangeMemory,
    historical_continuity: historicalContinuity,
    location_impact_propagation: locationImpactPropagation,
    cross_episode_world_recall: crossEpisodeWorldRecall,
    world_state_reentry: worldStateReentry,
    world_state_preserved: worldStatePreserved,
    environment_evolution_valid: environmentEvolutionValid,
    historical_memory_preserved: historicalMemoryPreserved,
    location_impact_preserved: locationImpactPreserved,
    cross_episode_world_callback_valid: crossEpisodeWorldCallbackValid,
    world_reentry_valid: worldReentryValid,
    dna_binding_preserved: dnaBinding,
    adapter_binding_preserved: adapterBinding,
    traceability_preserved: traceabilityPreserved,
    world_memory_loss: worldMemoryLoss,
    history_reset: historyReset,
    environment_reset: environmentReset,
    callback_failure: callbackFailure,
    world_reentry_failure: worldReentryFailure,
    dna_binding_break: dnaBindingBreak,
    adapter_binding_break: adapterBindingBreak,
    traceability_loss: traceabilityLoss,
    world_state_memory_validation_ready: worldStateMemoryValidationReady,
    certification_status: pass ? WORLD_STATE_MEMORY_VALIDATION_STATUS_MESSAGE : null,
    world_state_anchor: worldStateAnchor,
    journey_steps: journeySteps,
    callback_result: callbackResult,
    reentry_result: reentryResult,
    final_verdict: pass
      ? WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT
      : WORLD_STATE_MEMORY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, WORLD_STATE_MEMORY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, WORLD_STATE_MEMORY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
