import fs from 'node:fs';
import path from 'node:path';
import { resolveCanonicalGonegiArtStyle } from './canonicalGonegiArtStyle.js';
import {
  ImageAppNativeImportSlot,
} from './movieMasterDatasetBinding.js';
import {
  loadCharacterSimpleLibrary,
  loadTimeSettingLibrary,
} from './scenarioGenerator/scenario-generator-foundation.js';
import {
  MovieSpatialGraph,
  MovieSpatialGraphDataset,
  SPATIAL_GRAPH_OUTPUTS,
  loadAllMovieSpatialGraphDatasets,
} from './movieSpatialGraphBuilder.js';
import {
  MovieSpatialEngineDataset,
  MovieSpatialSceneRecord,
  loadAllMovieSpatialEngineDatasets,
} from './movieSpatialEngineBuilder.js';
import { writeMovieArtstyleLockReport } from './movieArtstyleLockValidation.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_SCENARIO_HARDENING_PHASE = 'PHASE-MOVIE-SPATIAL-013B' as const;
export const MOVIE_SCENARIO_HARDENING_SYSTEM_ID = 'MOVIE_SCENARIO_HARDENING_V1' as const;
export const MOVIE_SCENARIO_HARDENING_PASS_VERDICT = 'PASS_MOVIE_SCENARIO_HARDENING_V1' as const;
export const MOVIE_SCENARIO_HARDENING_FAIL_VERDICT = 'FAIL_MOVIE_SCENARIO_HARDENING_V1' as const;

export const MOVIE_SCENARIO_HARDENING_REPORT_PATH =
  'reports/movie_spatial/MOVIE_SCENARIO_HARDENING_REPORT.json' as const;
export const MOVIE_SCENARIO_HARDENING_SCHEMA_PATH =
  'datasets/movie_spatial/movie-image-app-native-import-v2.schema.json' as const;

export const NATIVE_IMPORT_V2_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: 'exports/movie_spatial/titanic-image-app-native-import-v2.json',
  },
  {
    movie_id: 'spirited_away',
    output_path: 'exports/movie_spatial/spirited-away-image-app-native-import-v2.json',
  },
] as const;

export const HARDENED_SCENARIO_MARKERS = [
  '[CAMERA_LANGUAGE]',
  '[CAMERA_DISTANCE]',
  '[CAMERA_HEIGHT]',
  '[SHOT_TYPE]',
  '[BLOCKING]',
  '[GAZE]',
  '[FOREGROUND]',
  '[MIDGROUND]',
  '[BACKGROUND]',
  '[ENVIRONMENT_ANCHOR]',
  '[PROP_ANCHOR]',
  '[SEMANTIC_ANCHOR]',
] as const;

export const FORBIDDEN_SUMMARY_MARKERS = [
  'Atmosphere remains cinematic',
  'music-drama compatible',
  'one primary location and one primary action',
  'Spatial depth layers preserved from movie replica blocking.',
  'Primary semantic anchor ',
] as const;

export const FORBIDDEN_COMPRESSED_PATTERNS = [
  /^A [a-z_]+ within a [a-z_ ]+ environment\.$/m,
  /Foreground elements \d+, midground characters \d+, background anchors \d+\./,
] as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

const CHARACTER_ID_MAP: Record<string, string> = {
  'CHAR-gonagi': 'gonegi',
  'CHAR-dana': 'dana',
  gonagi: 'gonegi',
  dana: 'dana',
};

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface HardenedScenarioPresenceChecks {
  camera_language_present: boolean;
  blocking_present: boolean;
  gaze_present: boolean;
  depth_layers_present: boolean;
  environment_anchor_present: boolean;
  prop_anchor_present: boolean;
  semantic_anchor_present: boolean;
}

export interface HardenedScenarioSlotResult {
  scene_id: string;
  slot_index: number;
  scenario_length: number;
  checks: HardenedScenarioPresenceChecks;
  forbidden_summary_detected: boolean;
  forbidden_compressed_detected: boolean;
  hardening_passed: boolean;
}

export interface MovieImageAppNativeImportV2Dataset {
  native_import_id: string;
  phase: typeof MOVIE_SCENARIO_HARDENING_PHASE;
  system_id: typeof MOVIE_SCENARIO_HARDENING_SYSTEM_ID;
  version: 'v2';
  movie_id: string;
  source_spatial_graph_ref: string;
  source_binding_ref: string;
  generated_at: string;
  slot_count: number;
  scenario_hardening: true;
  scenario_reconstruction_ready: boolean;
  image_app_prompt_ready: boolean;
  music_drama_import_ready: boolean;
  slots: ImageAppNativeImportSlot[];
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface MovieScenarioHardeningReport {
  report_id: string;
  phase: typeof MOVIE_SCENARIO_HARDENING_PHASE;
  system_id: typeof MOVIE_SCENARIO_HARDENING_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  scenario_reconstruction_ready: boolean;
  image_app_prompt_ready: boolean;
  upstream_artstyle_lock_verdict: string;
  checks: {
    camera_language_present: boolean;
    blocking_present: boolean;
    gaze_present: boolean;
    depth_layers_present: boolean;
    environment_anchor_present: boolean;
    prop_anchor_present: boolean;
    semantic_anchor_present: boolean;
  };
  metrics: {
    movie_count: number;
    scene_count: number;
    hardened_slot_count: number;
    average_scenario_length: number;
    hardening_pass_rate: number;
  };
  movie_summaries: Array<{
    movie_id: string;
    output_path: string;
    slot_count: number;
    hardening_pass_count: number;
  }>;
  slot_results_sample: HardenedScenarioSlotResult[];
  issues: ValidationIssue[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function refForMovie<T extends { movie_id: string; output_path: string }>(
  specs: readonly T[],
  movieId: string
): string {
  const spec = specs.find((entry) => entry.movie_id === movieId);
  if (!spec) throw new Error(`Missing ref spec for movie_id=${movieId}`);
  return spec.output_path;
}

function resolveCharacterId(characterId: string): string {
  return CHARACTER_ID_MAP[characterId] ?? characterId.replace(/^CHAR-/, '').toLowerCase();
}

function formatVec3(value: [number, number, number]): string {
  return `[${value.map((entry) => entry.toFixed(4)).join(',')}]`;
}

function formatDirection(value: [number, number, number]): string {
  return `[${value.map((entry) => entry.toFixed(4)).join(',')}]`;
}

function humanizeToken(value: string): string {
  return value.replace(/_/g, ' ');
}

function deriveShotType(cameraDistance: number): string {
  if (cameraDistance >= 4.5) return 'wide_shot';
  if (cameraDistance >= 2.5) return 'medium_shot';
  if (cameraDistance >= 1.8) return 'medium_close_shot';
  return 'close_up_shot';
}

function deriveCameraDistanceLabel(cameraDistance: number): string {
  if (cameraDistance >= 4.5) return 'wide';
  if (cameraDistance >= 2.5) return 'medium';
  if (cameraDistance >= 1.8) return 'medium_close';
  return 'close';
}

function deriveCameraLanguage(graph: MovieSpatialGraph): string {
  const camera = graph.camera_nodes[0];
  const cameraHeight = camera?.camera_height ?? 'eye_level';
  const shotType = deriveShotType(camera?.camera_distance ?? 3);
  const cameraEdges = graph.spatial_edges.filter(
    (edge) => edge.source_node_id.includes('cam_node') || edge.edge_type.includes('camera')
  );
  const edgeLanguage =
    cameraEdges.length > 0
      ? cameraEdges
          .map((edge) => `${edge.edge_type}${edge.distance_hint ? `:${edge.distance_hint}` : ''}`)
          .join('; ')
      : 'camera_observes_scene:framed_subject';
  return `${humanizeToken(cameraHeight)} ${humanizeToken(shotType)} ${edgeLanguage}`;
}

function resolveNodeLabel(graph: MovieSpatialGraph, nodeId: string): string {
  const character = graph.character_nodes.find((node) => node.node_id === nodeId);
  if (character) return character.character_id;
  const prop = graph.prop_nodes.find((node) => node.node_id === nodeId);
  if (prop) return prop.prop_id;
  const environment = graph.environment_nodes.find((node) => node.node_id === nodeId);
  if (environment) return environment.anchor_id;
  if (nodeId.includes('cam_node')) return 'camera';
  return nodeId;
}

function serializeBlocking(graph: MovieSpatialGraph): string {
  const characterBlocking = graph.character_nodes
    .map(
      (node) =>
        `${node.character_id} depth=${node.depth_layer} position=${formatVec3(node.position)} rotation=${formatVec3(node.rotation)}`
    )
    .join('; ');
  const interactionBlocking = graph.interaction_edges
    .map(
      (edge) =>
        `${resolveNodeLabel(graph, edge.source_node_id)}->${resolveNodeLabel(graph, edge.target_node_id)} type=${edge.interaction_type}`
    )
    .join('; ');
  return `characters: ${characterBlocking || 'none'} | interactions: ${interactionBlocking || 'scene_preservation'}`;
}

function serializeGaze(graph: MovieSpatialGraph): string {
  if (graph.gaze_edges.length === 0) {
    return 'no explicit gaze edges; preserve replica gaze toward scene partner';
  }
  return graph.gaze_edges
    .map((edge) => {
      const source = resolveNodeLabel(graph, edge.source_node_id);
      const target = edge.target_node_id ? resolveNodeLabel(graph, edge.target_node_id) : 'scene_focal_point';
      return `${source}->${target} origin=${formatVec3(edge.origin)} direction=${formatDirection(edge.direction)}`;
    })
    .join('; ');
}

function serializeDepthLayer(
  label: 'FOREGROUND' | 'MIDGROUND' | 'BACKGROUND',
  layout: MovieSpatialSceneRecord['foreground_layout'] | undefined,
  fallbackIds: string[]
): string {
  const elementIds = layout?.element_ids ?? fallbackIds;
  const depthRange = layout?.depth_range ?? [0, 1];
  const layerId = layout?.layer_id ?? label.toLowerCase();
  const elements = elementIds.length > 0 ? elementIds.join(', ') : 'none';
  return `layer_id=${layerId} depth_range=${depthRange[0]}-${depthRange[1]} elements=${elements}`;
}

function serializeEnvironmentAnchor(
  graph: MovieSpatialGraph,
  spatialScene: MovieSpatialSceneRecord | null
): string {
  const environment = graph.environment_nodes[0];
  const anchor = spatialScene?.environment_anchor;
  const anchorId = anchor?.anchor_id ?? environment?.anchor_id ?? graph.scene_id;
  const envType = anchor?.environment_type ?? environment?.environment_type ?? 'scene_environment';
  const category = anchor?.scene_category ?? environment?.scene_category ?? 'general_scene';
  const position = anchor?.position ?? environment?.position ?? ([0.5, 0.5, 3.5] as [number, number, number]);
  return `anchor_id=${anchorId} environment_type=${envType} scene_category=${category} position=${formatVec3(position)}`;
}

function serializePropAnchors(graph: MovieSpatialGraph): string {
  if (graph.prop_nodes.length === 0) {
    return 'none';
  }
  return graph.prop_nodes
    .map(
      (prop) =>
        `${prop.prop_id} depth=${prop.depth_layer} position=${formatVec3(prop.position)}`
    )
    .join('; ');
}

function serializeSemanticAnchor(graph: MovieSpatialGraph, spatialScene: MovieSpatialSceneRecord | null): string {
  const anchorId =
    spatialScene?.environment_anchor.anchor_id ??
    graph.environment_nodes[0]?.anchor_id ??
    graph.scene_id;
  return `semantic_anchor_id=${anchorId} scene_id=${graph.scene_id} spatial_id=${graph.spatial_id}`;
}

export function generateHardenedScenarioFromSpatialGraph(
  graph: MovieSpatialGraph,
  spatialScene: MovieSpatialSceneRecord | null
): string {
  const camera = graph.camera_nodes[0];
  const cameraDistance = camera?.camera_distance ?? spatialScene?.camera_distance ?? 3;
  const cameraHeight = camera?.camera_height ?? spatialScene?.camera_height ?? 'eye_level';
  const shotType = deriveShotType(cameraDistance);
  const cameraLanguage = deriveCameraLanguage(graph);

  const foregroundIds =
    spatialScene?.foreground_layout.element_ids ??
    graph.prop_nodes.filter((node) => node.depth_layer === 'foreground').map((node) => node.prop_id);
  const midgroundIds =
    spatialScene?.midground_layout.element_ids ??
    graph.character_nodes.map((node) => node.character_id);
  const backgroundIds =
    spatialScene?.background_layout.element_ids ??
    graph.prop_nodes.filter((node) => node.depth_layer === 'background').map((node) => node.prop_id);

  return [
    `[SCENE_RECONSTRUCTION] scene_id=${graph.scene_id} movie_id=${graph.movie_id} graph_id=${graph.graph_id}`,
    `[CAMERA_LANGUAGE] ${cameraLanguage}`,
    `[CAMERA_DISTANCE] ${cameraDistance.toFixed(4)} units label=${deriveCameraDistanceLabel(cameraDistance)}`,
    `[CAMERA_HEIGHT] ${cameraHeight}`,
    `[SHOT_TYPE] ${shotType}`,
    `[BLOCKING] ${serializeBlocking(graph)}`,
    `[GAZE] ${serializeGaze(graph)}`,
    `[FOREGROUND] ${serializeDepthLayer('FOREGROUND', spatialScene?.foreground_layout, foregroundIds)}`,
    `[MIDGROUND] ${serializeDepthLayer('MIDGROUND', spatialScene?.midground_layout, midgroundIds)}`,
    `[BACKGROUND] ${serializeDepthLayer('BACKGROUND', spatialScene?.background_layout, backgroundIds)}`,
    `[ENVIRONMENT_ANCHOR] ${serializeEnvironmentAnchor(graph, spatialScene)}`,
    `[PROP_ANCHOR] ${serializePropAnchors(graph)}`,
    `[SEMANTIC_ANCHOR] ${serializeSemanticAnchor(graph, spatialScene)}`,
    `[REPLICA_PRESERVATION] preserve movie spatial graph blocking, camera framing, depth layering, gaze vectors, environment anchors, and prop anchors without summary compression.`,
  ].join(' ');
}

export { generateConditionedScenarioFromSpatialGraph } from './spatialConditioningAdapter.js';

export function evaluateHardenedScenarioPresence(scenario: string): HardenedScenarioPresenceChecks {
  return {
    camera_language_present: scenario.includes('[CAMERA_LANGUAGE]'),
    blocking_present: scenario.includes('[BLOCKING]'),
    gaze_present: scenario.includes('[GAZE]'),
    depth_layers_present:
      scenario.includes('[FOREGROUND]') &&
      scenario.includes('[MIDGROUND]') &&
      scenario.includes('[BACKGROUND]'),
    environment_anchor_present: scenario.includes('[ENVIRONMENT_ANCHOR]'),
    prop_anchor_present: scenario.includes('[PROP_ANCHOR]'),
    semantic_anchor_present: scenario.includes('[SEMANTIC_ANCHOR]'),
  };
}

export function detectForbiddenSummaryScenario(scenario: string): boolean {
  if (FORBIDDEN_SUMMARY_MARKERS.some((marker) => scenario.includes(marker))) {
    return true;
  }
  return FORBIDDEN_COMPRESSED_PATTERNS.some((pattern) => pattern.test(scenario));
}

function selectTimeSettingId(graph: MovieSpatialGraph): string {
  const environment = graph.environment_nodes[0];
  const category = environment?.scene_category?.toLowerCase() ?? '';
  const envType = environment?.environment_type?.toLowerCase() ?? '';

  if (envType.includes('spirit') || category.includes('bath')) return 'blue_hour';
  if (envType.includes('luxury') || category.includes('promenade')) return 'golden_hour';
  if (category.includes('harbor') || category.includes('dock')) return 'morning_sunshine';
  return 'afternoon_work';
}

function buildCharacterField(graph: MovieSpatialGraph): string {
  const characterLibrary = loadCharacterSimpleLibrary() as {
    characters: Array<{
      character_id: string;
      display_name_en: string;
      visual_identity: string;
      hair: string;
      clothing: string;
    }>;
  };
  const lines: string[] = [];

  for (const node of graph.character_nodes) {
    const profileId = resolveCharacterId(node.character_id);
    const profile = characterLibrary.characters.find((entry) => entry.character_id === profileId);
    if (profile) {
      lines.push(
        `${profile.display_name_en}: ${profile.visual_identity}. ${profile.hair}. ${profile.clothing}.`
      );
    } else {
      lines.push(`${profileId}: active scene character at ${node.depth_layer} depth.`);
    }
  }

  return lines.join(' ');
}

function buildNativeImportV2Slot(
  graph: MovieSpatialGraph,
  spatialScene: MovieSpatialSceneRecord | null,
  canonicalArtStyle: string
): ImageAppNativeImportSlot {
  const timeSettingLibrary = loadTimeSettingLibrary();
  const timeSettingId = selectTimeSettingId(graph);
  const timeSettingEntry =
    timeSettingLibrary.items.find((entry) => entry.time_setting_id === timeSettingId) ??
    timeSettingLibrary.items[0];

  return {
    artStyle: canonicalArtStyle,
    timeSetting: timeSettingEntry.raw_timeSetting,
    scenario: generateHardenedScenarioFromSpatialGraph(graph, spatialScene),
    character: buildCharacterField(graph),
  };
}

function validateHardenedSlot(
  prefix: string,
  slot: ImageAppNativeImportSlot
): { issues: ValidationIssue[]; result: HardenedScenarioSlotResult } {
  const checks = evaluateHardenedScenarioPresence(slot.scenario);
  const forbiddenSummary = detectForbiddenSummaryScenario(slot.scenario);
  const forbiddenCompressed = FORBIDDEN_COMPRESSED_PATTERNS.some((pattern) =>
    pattern.test(slot.scenario)
  );
  const issues: ValidationIssue[] = [];

  for (const marker of HARDENED_SCENARIO_MARKERS) {
    if (!slot.scenario.includes(marker)) {
      issues.push({
        code: 'HARDENED_MARKER_MISSING',
        message: `${prefix}: missing required marker ${marker}`,
        severity: 'error',
      });
    }
  }

  if (forbiddenSummary) {
    issues.push({
      code: 'FORBIDDEN_SUMMARY_SCENARIO',
      message: `${prefix}: scenario contains forbidden summary-level narration`,
      severity: 'error',
    });
  }

  if (forbiddenCompressed) {
    issues.push({
      code: 'FORBIDDEN_COMPRESSED_SCENARIO',
      message: `${prefix}: scenario contains forbidden compressed description pattern`,
      severity: 'error',
    });
  }

  if (!slot.scenario.includes('[CAMERA_DISTANCE]') || !slot.scenario.includes('[CAMERA_HEIGHT]') || !slot.scenario.includes('[SHOT_TYPE]')) {
    issues.push({
      code: 'CAMERA_SERIALIZATION_INCOMPLETE',
      message: `${prefix}: camera distance, height, or shot type not serialized`,
      severity: 'error',
    });
  }

  const hardeningPassed =
    Object.values(checks).every(Boolean) &&
    !forbiddenSummary &&
    !forbiddenCompressed &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  return {
    issues,
    result: {
      scene_id: prefix,
      slot_index: 0,
      scenario_length: slot.scenario.length,
      checks,
      forbidden_summary_detected: forbiddenSummary,
      forbidden_compressed_detected: forbiddenCompressed,
      hardening_passed: hardeningPassed,
    },
  };
}

export function buildMovieImageAppNativeImportV2Dataset(
  graphDataset: MovieSpatialGraphDataset,
  engineDataset: MovieSpatialEngineDataset,
  canonicalArtStyle: string
): MovieImageAppNativeImportV2Dataset {
  const spatialSceneById = new Map(
    engineDataset.spatial_scenes.map((scene) => [scene.scene_id, scene])
  );
  const slots = graphDataset.spatial_graphs.map((graph) =>
    buildNativeImportV2Slot(graph, spatialSceneById.get(graph.scene_id) ?? null, canonicalArtStyle)
  );

  const slotResults = slots.map((slot, index) =>
    validateHardenedSlot(graphDataset.spatial_graphs[index].scene_id, slot)
  );
  const allPassed = slotResults.every((entry) => entry.result.hardening_passed);

  return {
    native_import_id: `${graphDataset.movie_id}-image-app-native-import-v2`,
    phase: MOVIE_SCENARIO_HARDENING_PHASE,
    system_id: MOVIE_SCENARIO_HARDENING_SYSTEM_ID,
    version: 'v2',
    movie_id: graphDataset.movie_id,
    source_spatial_graph_ref: refForMovie(SPATIAL_GRAPH_OUTPUTS, graphDataset.movie_id),
    source_binding_ref: `datasets/movie_spatial/${graphDataset.movie_id.replace('_', '-')}/${graphDataset.movie_id}-master-dataset-binding.json`,
    generated_at: new Date().toISOString(),
    slot_count: slots.length,
    scenario_hardening: true,
    scenario_reconstruction_ready: allPassed,
    image_app_prompt_ready: allPassed,
    music_drama_import_ready: slots.length > 0,
    slots,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function runMovieScenarioHardening(root: string): MovieScenarioHardeningReport {
  const artstyleLockReport = writeMovieArtstyleLockReport(root);
  const canonicalArtStyle = resolveCanonicalGonegiArtStyle(root).value;
  const graphDatasets = loadAllMovieSpatialGraphDatasets(root);
  const engineDatasets = loadAllMovieSpatialEngineDatasets(root);

  const issues: ValidationIssue[] = [];
  const slotResults: HardenedScenarioSlotResult[] = [];
  const movieSummaries: MovieScenarioHardeningReport['movie_summaries'] = [];
  let totalScenarioLength = 0;
  let hardenedSlotCount = 0;
  let hardeningPassCount = 0;

  for (const spec of NATIVE_IMPORT_V2_OUTPUTS) {
    const graphDataset = graphDatasets.find((entry) => entry.movie_id === spec.movie_id);
    const engineDataset = engineDatasets.find((entry) => entry.movie_id === spec.movie_id);
    if (!graphDataset || !engineDataset) {
      issues.push({
        code: 'SOURCE_DATASET_MISSING',
        message: `Missing spatial graph or engine dataset for movie_id=${spec.movie_id}`,
        severity: 'error',
      });
      continue;
    }

    const dataset = buildMovieImageAppNativeImportV2Dataset(
      graphDataset,
      engineDataset,
      canonicalArtStyle
    );
    writeJson(root, spec.output_path, dataset);

    let moviePassCount = 0;
    dataset.slots.forEach((slot, index) => {
      const graph = graphDataset.spatial_graphs[index];
      const validation = validateHardenedSlot(graph.scene_id, slot);
      issues.push(...validation.issues);
      slotResults.push({
        ...validation.result,
        scene_id: graph.scene_id,
        slot_index: index,
      });
      totalScenarioLength += slot.scenario.length;
      hardenedSlotCount += 1;
      if (validation.result.hardening_passed) {
        hardeningPassCount += 1;
        moviePassCount += 1;
      }
    });

    movieSummaries.push({
      movie_id: spec.movie_id,
      output_path: spec.output_path,
      slot_count: dataset.slot_count,
      hardening_pass_count: moviePassCount,
    });

    if (!dataset.scenario_reconstruction_ready || !dataset.image_app_prompt_ready) {
      issues.push({
        code: 'DATASET_HARDENING_FLAG_FALSE',
        message: `${spec.output_path}: scenario_reconstruction_ready or image_app_prompt_ready is false`,
        severity: 'error',
      });
    }
  }

  const aggregateChecks = {
    camera_language_present: slotResults.every((entry) => entry.checks.camera_language_present),
    blocking_present: slotResults.every((entry) => entry.checks.blocking_present),
    gaze_present: slotResults.every((entry) => entry.checks.gaze_present),
    depth_layers_present: slotResults.every((entry) => entry.checks.depth_layers_present),
    environment_anchor_present: slotResults.every((entry) => entry.checks.environment_anchor_present),
    prop_anchor_present: slotResults.every((entry) => entry.checks.prop_anchor_present),
    semantic_anchor_present: slotResults.every((entry) => entry.checks.semantic_anchor_present),
  };

  const errors = issues.filter((issue) => issue.severity === 'error');
  const hardeningPassRate =
    hardenedSlotCount > 0 ? Math.round((hardeningPassCount / hardenedSlotCount) * 10000) / 10000 : 0;
  const scenarioReconstructionReady =
    hardeningPassCount === hardenedSlotCount &&
    Object.values(aggregateChecks).every(Boolean) &&
    errors.length === 0;
  const imageAppPromptReady = scenarioReconstructionReady;

  const validationPassed =
    scenarioReconstructionReady &&
    imageAppPromptReady &&
    artstyleLockReport.final_verdict.startsWith('PASS');

  return {
    report_id: `movie_scenario_hardening_report_${Date.now().toString(36)}`,
    phase: MOVIE_SCENARIO_HARDENING_PHASE,
    system_id: MOVIE_SCENARIO_HARDENING_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_SCENARIO_HARDENING_PASS_VERDICT
      : MOVIE_SCENARIO_HARDENING_FAIL_VERDICT,
    validation_passed: validationPassed,
    scenario_reconstruction_ready: scenarioReconstructionReady,
    image_app_prompt_ready: imageAppPromptReady,
    upstream_artstyle_lock_verdict: artstyleLockReport.final_verdict,
    checks: aggregateChecks,
    metrics: {
      movie_count: movieSummaries.length,
      scene_count: hardenedSlotCount,
      hardened_slot_count: hardenedSlotCount,
      average_scenario_length:
        hardenedSlotCount > 0
          ? Math.round((totalScenarioLength / hardenedSlotCount) * 100) / 100
          : 0,
      hardening_pass_rate: hardeningPassRate,
    },
    movie_summaries: movieSummaries,
    slot_results_sample: slotResults.slice(0, 3),
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeMovieScenarioHardeningReport(projectRoot?: string): MovieScenarioHardeningReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runMovieScenarioHardening(root);
  writeJson(root, MOVIE_SCENARIO_HARDENING_REPORT_PATH, report);
  return report;
}

export function loadMovieImageAppNativeImportV2Dataset(
  root: string,
  movieId: string
): MovieImageAppNativeImportV2Dataset | null {
  const spec = NATIVE_IMPORT_V2_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieImageAppNativeImportV2Dataset;
}

export { SAFE_CREATE_POLICY };
