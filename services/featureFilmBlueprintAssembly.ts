import fs from 'node:fs';
import path from 'node:path';
import {
  FEATURE_CONTINUITY_SPEC_DATASET_PATH,
  FEATURE_DEPENDENCY_SPEC_DATASET_PATH,
  FEATURE_FILM_CONTINUITY_SPEC_EXPORT_PATH,
  FEATURE_FILM_FOUNDATION_PASS_VERDICT,
  FEATURE_FILM_FOUNDATION_PHASE,
  FEATURE_FILM_FOUNDATION_READY_STATUS,
  FEATURE_FILM_FOUNDATION_REPORT_PATH,
  FEATURE_FILM_LIBRARY_PATH,
  FEATURE_SCALE_RULES_DATASET_PATH,
} from './featureFilmFoundation.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const FEATURE_FILM_BLUEPRINT_ASSEMBLY_PHASE = 'PHASE-L3-FEATURE-002' as const;
export const FEATURE_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT =
  'PASS_FEATURE_FILM_BLUEPRINT_ASSEMBLY_V1' as const;
export const FEATURE_FILM_BLUEPRINT_ASSEMBLY_FAIL_VERDICT =
  'FAIL_FEATURE_FILM_BLUEPRINT_ASSEMBLY_V1' as const;
export const FEATURE_FILM_BLUEPRINT_READY_STATUS = 'FEATURE_FILM_BLUEPRINT_READY' as const;

export const FEATURE_FILM_BLUEPRINT_EXPORT_DIR = 'exports/feature_film_blueprint' as const;
export const FEATURE_FILM_BLUEPRINT_PATH =
  'exports/feature_film_blueprint/feature-film-blueprint.json' as const;
export const FEATURE_FILM_ACT_MAP_PATH =
  'exports/feature_film_blueprint/feature-film-act-map.json' as const;
export const FEATURE_FILM_ARC_NETWORK_PATH =
  'exports/feature_film_blueprint/feature-film-arc-network.json' as const;
export const FEATURE_FILM_CALLBACK_LAYER_PATH =
  'exports/feature_film_blueprint/feature-film-callback-layer.json' as const;

export const FEATURE_FILM_BLUEPRINT_ASSEMBLY_DIR = 'reports/feature_film_blueprint' as const;
export const FEATURE_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH =
  'reports/feature_film_blueprint/FEATURE_FILM_BLUEPRINT_ASSEMBLY_REPORT.json' as const;

const TARGET_ARCHETYPE_IDS = [
  'harbor_saga_feature',
  'mediterranean_epoch_feature',
  'correspondence_ledger_feature',
] as const;

const CALLBACK_DEPTH_MIN = 3;
const CALLBACK_DEPTH_MAX = 5;

const CONTINUITY_DIMENSIONS = [
  'character_arc',
  'location_arc',
  'lighting_arc',
  'relationship_arc',
  'timeline_arc',
  'memory_callback_arc',
  'subplot_arc',
  'parallel_arc',
  'multi_callback_arc',
  'relationship_network',
  'world_arc',
  'world_state_arc',
  'theme_arc',
  'legacy_callback_arc',
] as const;

const ARC_ASSEMBLY_FIELDS = [
  'main_arc',
  'subplot_arc',
  'parallel_arc',
  'relationship_arc',
  'world_arc',
  'world_state_arc',
  'theme_arc',
  'legacy_callback_arc',
] as const;

const DEPENDENCY_DIMENSIONS = [
  'act_dependency',
  'arc_dependency',
  'callback_dependency',
  'timeline_dependency',
  'world_dependency',
  'theme_dependency',
  'relationship_dependency',
] as const;

type IssueSeverity = 'error' | 'warning';

interface AssemblyIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface FeatureArchetypeRecord {
  feature_film_archetype_id: string;
  theme: string;
  scene_count_range: string;
  medium_film_source_ref: string;
  story_arcs: { arc_id: string; arc_type: string; beats: string[]; primary_character_group?: string }[];
  parallel_narrative_flows: { flow_id: string; flow_type: string; scene_range: string; interleave_interval: number }[];
  character_groups: { group_id: string; member_ids: string[]; group_role: string }[];
  character_arc: Record<string, unknown>;
  location_arc: Record<string, unknown>;
  lighting_arc: Record<string, unknown>;
  relationship_arc: Record<string, unknown>;
  timeline_arc: {
    arc_type: string;
    long_range_dependencies: { from_scene: number; to_scene: number; dependency_type: string }[];
    timeline_markers: string[];
  };
  memory_callback_arc: {
    anchor_id: string;
    callback_seed: number;
    callback_resolution: number | null;
    callback_completion_state: string;
  }[];
  subplot_arc: { subplots: { subplot_id: string; beats: string[]; scene_range: string }[] };
  parallel_arc: { parallel_tracks: { track_id: string; arc_ref: string; scene_range: string }[] };
  multi_callback_arc: {
    callback_layers: {
      layer_id: string;
      anchors: string[];
      foreshadow_payoff_pairs: { foreshadow_scene: number; payoff_scene: number; anchor_id: string }[];
    }[];
  };
  relationship_network: {
    nodes: string[];
    edges: { from: string; to: string; relationship_type: string }[];
    evolution_stages: string[];
  };
  world_arc: {
    world_state_stages: string[];
    location_transformations: { location_id: string; transformation_stage: number }[];
  };
  world_state_arc: { stages: string[]; act_alignment: Record<string, string> };
  theme_arc: { primary_theme: string; theme_beats: string[]; symbolic_motifs: string[] };
  legacy_callback_arc: {
    legacy_anchors: { anchor_id: string; seed_scene: number; payoff_scene: number; generation_span: number }[];
    callback_depth: number;
  };
  continuity_requirements: Record<string, string[]>;
}

interface ActDistributionEntry {
  act_index: number;
  act_name: string;
  percent: number;
  scene_count: number;
  scene_range: string;
}

interface CallbackLayerEntry {
  anchor_id: string;
  layer_id: string;
  callback_seed: number;
  callback_reference: number | null;
  callback_resolution: number | null;
  callback_completion_state: string;
  callback_depth: number;
  multi_callback_chain: string[];
  legacy_chain: boolean;
}

export interface FeatureFilmBlueprintAssemblyReport {
  report_id: string;
  phase: typeof FEATURE_FILM_BLUEPRINT_ASSEMBLY_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    feature_film_foundation_ready: boolean;
    pass_feature_film_foundation_v1: boolean;
    precheck_passed: boolean;
  };
  policy: {
    foundation_artifacts_read_only: boolean;
    all_previous_outputs_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  assembly_summary: {
    archetype_count: number;
    act_structure_range: string;
    continuity_dimension_count: number;
    callback_depth_range: string;
    multi_callback_chain: boolean;
    arc_assembly_fields: string[];
    dependency_dimensions: string[];
    blueprint_integrity: string;
    dependency_integrity: string;
    traceability_integrity: string;
    target_archetypes: string[];
  };
  outputs: {
    blueprint_path: string;
    act_map_path: string;
    arc_network_path: string;
    callback_layer_path: string;
  };
  issues: AssemblyIssue[];
  feature_film_blueprint_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function parseSceneRange(range: string): { min: number; max: number } {
  const match = /^(\d+)-(\d+)$/.exec(range);
  if (!match) throw new Error(`Invalid scene range: ${range}`);
  return { min: Number(match[1]), max: Number(match[2]) };
}

function midpointSceneCount(range: string): number {
  const { min, max } = parseSceneRange(range);
  return Math.round((min + max) / 2);
}

function resolveActCount(sceneCount: number): number {
  if (sceneCount >= 2000) return 5;
  if (sceneCount >= 1400) return 4;
  return 3;
}

function distributeActs(totalScenes: number): {
  act_count: number;
  act_distribution: Record<string, number>;
  acts: ActDistributionEntry[];
} {
  const actCount = resolveActCount(totalScenes);
  const percents =
    actCount === 5
      ? [12, 22, 36, 20, 10]
      : actCount === 4
        ? [18, 32, 35, 15]
        : [22, 56, 22];

  const actNames =
    actCount === 5
      ? ['setup', 'rising_action', 'confrontation', 'climax', 'resolution']
      : actCount === 4
        ? ['setup', 'rising_action', 'confrontation', 'resolution']
        : ['setup', 'confrontation', 'resolution'];

  const counts = percents.map((percent) => Math.round(totalScenes * (percent / 100)));
  const diff = totalScenes - counts.reduce((sum, count) => sum + count, 0);
  counts[counts.length - 1] += diff;

  let cursor = 1;
  const acts: ActDistributionEntry[] = counts.map((sceneCount, index) => {
    const start = cursor;
    const end = cursor + sceneCount - 1;
    cursor = end + 1;
    return {
      act_index: index + 1,
      act_name: actNames[index],
      percent: percents[index],
      scene_count: sceneCount,
      scene_range: `${start}-${end}`,
    };
  });

  const act_distribution: Record<string, number> = {};
  acts.forEach((act) => {
    act_distribution[`act${act.act_index}_percent`] = act.percent;
  });

  return { act_count: actCount, act_distribution, acts };
}

function buildWorldArc(archetype: FeatureArchetypeRecord): Record<string, unknown> {
  const locationFlow = (archetype.location_arc.location_flow as string[]) ?? [];
  return {
    arc_type: 'world_change_story',
    purpose: 'character_story + world_change_story + generational_legacy',
    world_state_stages: archetype.world_arc.world_state_stages,
    location_transformations: locationFlow.map((locationId, index) => ({
      location_id: locationId,
      transformation_stage: index,
      world_impact: index === 0 ? 'baseline' : index === locationFlow.length - 1 ? 'renewed' : 'evolving',
    })),
    community_evolution: archetype.relationship_network.evolution_stages,
    timeline_markers: archetype.timeline_arc.timeline_markers,
  };
}

function buildMainArc(archetype: FeatureArchetypeRecord): Record<string, unknown> {
  const primary = archetype.story_arcs[0];
  return {
    arc_id: primary?.arc_id ?? 'main_arc',
    arc_type: primary?.arc_type ?? 'primary',
    beats: primary?.beats ?? [],
    character_group: primary?.primary_character_group,
    scene_count_target: midpointSceneCount(archetype.scene_count_range),
  };
}

function buildCallbackLayer(archetype: FeatureArchetypeRecord): {
  entries: CallbackLayerEntry[];
  multi_callback_chains: { chain_id: string; layer_ids: string[]; anchor_ids: string[] }[];
  callback_depth: number;
  multi_callback_chain_enabled: boolean;
} {
  const entries: CallbackLayerEntry[] = [];
  const chains: { chain_id: string; layer_ids: string[]; anchor_ids: string[] }[] = [];
  let depth = 0;

  for (const layer of archetype.multi_callback_arc.callback_layers) {
    const layerAnchors: string[] = [];
    for (const pair of layer.foreshadow_payoff_pairs) {
      depth += 1;
      const memoryEntry = archetype.memory_callback_arc.find(
        (entry) => entry.anchor_id === pair.anchor_id
      );
      const chainId = `chain_${layer.layer_id}_${pair.anchor_id}`;
      entries.push({
        anchor_id: pair.anchor_id,
        layer_id: layer.layer_id,
        callback_seed: pair.foreshadow_scene,
        callback_reference: memoryEntry?.callback_seed ?? pair.foreshadow_scene,
        callback_resolution: pair.payoff_scene,
        callback_completion_state: memoryEntry?.callback_completion_state ?? 'seeded',
        callback_depth: depth,
        multi_callback_chain: [chainId, layer.layer_id, pair.anchor_id],
        legacy_chain: false,
      });
      layerAnchors.push(pair.anchor_id);
    }
    chains.push({
      chain_id: `multi_callback_${layer.layer_id}`,
      layer_ids: [layer.layer_id],
      anchor_ids: layerAnchors,
    });
  }

  for (const legacy of archetype.legacy_callback_arc.legacy_anchors) {
    depth += 1;
    const chainId = `legacy_chain_${legacy.anchor_id}`;
    entries.push({
      anchor_id: legacy.anchor_id,
      layer_id: 'legacy_layer',
      callback_seed: legacy.seed_scene,
      callback_reference: legacy.seed_scene,
      callback_resolution: legacy.payoff_scene,
      callback_completion_state: 'seeded',
      callback_depth: depth,
      multi_callback_chain: [chainId, 'legacy_layer', legacy.anchor_id],
      legacy_chain: true,
    });
    chains.push({
      chain_id: chainId,
      layer_ids: ['legacy_layer'],
      anchor_ids: [legacy.anchor_id],
    });
  }

  return {
    entries,
    multi_callback_chains: chains,
    callback_depth: archetype.legacy_callback_arc.callback_depth,
    multi_callback_chain_enabled: true,
  };
}

function buildDependencyDesign(
  archetype: FeatureArchetypeRecord,
  acts: ActDistributionEntry[]
): Record<string, unknown> {
  const actDeps = acts.slice(0, -1).map((act, index) => ({
    from_act: act.act_index,
    to_act: acts[index + 1].act_index,
    dependency_type: 'act_dependency',
    transition_scene: parseSceneRange(act.scene_range).max,
  }));

  const arcDeps = archetype.story_arcs.map((arc) => ({
    arc_ref: arc.arc_id,
    dependency_type: 'arc_dependency',
    character_group: arc.primary_character_group,
  }));

  const callbackDeps = archetype.timeline_arc.long_range_dependencies.map((dep) => ({
    ...dep,
    dependency_type: 'callback_dependency',
  }));

  const timelineDeps = archetype.timeline_arc.long_range_dependencies.map((dep) => ({
    ...dep,
    dependency_type: 'timeline_dependency',
  }));

  const worldDeps = archetype.world_arc.location_transformations.map((transform) => ({
    location_id: transform.location_id,
    transformation_stage: transform.transformation_stage,
    dependency_type: 'world_dependency',
  }));

  const themeDeps = archetype.theme_arc.theme_beats.map((beat, index) => ({
    theme_beat: beat,
    act_index: Math.min(acts.length, index + 1),
    dependency_type: 'theme_dependency',
  }));

  const relationshipDeps = archetype.relationship_network.edges.map((edge) => ({
    ...edge,
    dependency_type: 'relationship_dependency',
  }));

  return {
    dependency_dimensions: [...DEPENDENCY_DIMENSIONS],
    act_dependency: actDeps,
    arc_dependency: arcDeps,
    callback_dependency: callbackDeps,
    timeline_dependency: timelineDeps,
    world_dependency: worldDeps,
    theme_dependency: themeDeps,
    relationship_dependency: relationshipDeps,
  };
}

function buildArcNetwork(archetype: FeatureArchetypeRecord): Record<string, unknown> {
  const mainArcId = archetype.story_arcs[0]?.arc_id ?? 'main_arc';
  const nodes = [
    { node_id: 'main_arc', arc_type: 'main_arc', ref: mainArcId },
    ...archetype.subplot_arc.subplots.map((subplot) => ({
      node_id: subplot.subplot_id,
      arc_type: 'subplot_arc',
      ref: subplot.subplot_id,
    })),
    ...archetype.parallel_arc.parallel_tracks.map((track) => ({
      node_id: track.track_id,
      arc_type: 'parallel_arc',
      ref: track.arc_ref,
    })),
    { node_id: 'relationship_arc', arc_type: 'relationship_arc', ref: 'relationship_network' },
    { node_id: 'world_arc', arc_type: 'world_arc', ref: 'world_change_story' },
    { node_id: 'world_state_arc', arc_type: 'world_state_arc', ref: 'world_state_evolution' },
    { node_id: 'theme_arc', arc_type: 'theme_arc', ref: archetype.theme_arc.primary_theme },
    { node_id: 'legacy_callback_arc', arc_type: 'legacy_callback_arc', ref: 'legacy_chains' },
  ];

  const edges = [
    { from: 'main_arc', to: archetype.subplot_arc.subplots[0]?.subplot_id ?? 'subplot', relationship: 'contains_subplot' },
    { from: 'main_arc', to: archetype.parallel_arc.parallel_tracks[0]?.track_id ?? 'parallel', relationship: 'parallel_counterpoint' },
    { from: 'main_arc', to: 'relationship_arc', relationship: 'character_story' },
    { from: 'main_arc', to: 'world_arc', relationship: 'world_change_story' },
    { from: 'main_arc', to: 'world_state_arc', relationship: 'macro_world_evolution' },
    { from: 'main_arc', to: 'theme_arc', relationship: 'thematic_through_line' },
    { from: 'theme_arc', to: 'legacy_callback_arc', relationship: 'legacy_payoff_alignment' },
    { from: 'world_arc', to: 'world_state_arc', relationship: 'state_stage_alignment' },
    { from: 'world_state_arc', to: 'relationship_arc', relationship: 'community_evolution' },
    ...archetype.parallel_arc.parallel_tracks.map((track) => ({
      from: track.track_id,
      to: 'main_arc',
      relationship: 'converges_at_resolution',
    })),
  ];

  return {
    network_id: `${archetype.feature_film_archetype_id}_arc_network_v1`,
    purpose: 'feature_arc_relationship_tracking',
    nodes,
    edges,
    relationship_network_ref: archetype.relationship_network,
  };
}

function assembleBlueprint(archetype: FeatureArchetypeRecord): Record<string, unknown> {
  const sceneCountTarget = midpointSceneCount(archetype.scene_count_range);
  const { act_count, act_distribution, acts } = distributeActs(sceneCountTarget);
  const callbackLayer = buildCallbackLayer(archetype);
  const worldArc = buildWorldArc(archetype);
  const dependencyDesign = buildDependencyDesign(archetype, acts);

  const actTransitions = acts.slice(0, -1).map((act, index) => ({
    act_boundary: `act${act.act_index}_to_act${acts[index + 1].act_index}`,
    scene_index: parseSceneRange(act.scene_range).max,
    transition_type: 'act_break',
  }));

  const recommendedArcCount =
    archetype.story_arcs.length +
    archetype.subplot_arc.subplots.length +
    archetype.parallel_arc.parallel_tracks.length +
    3;

  return {
    feature_film_archetype_id: archetype.feature_film_archetype_id,
    theme: archetype.theme,
    scene_count_target: sceneCountTarget,
    scene_count_range: archetype.scene_count_range,
    recommended_scene_range: archetype.scene_count_range,
    recommended_arc_count: recommendedArcCount,
    recommended_callback_depth: callbackLayer.callback_depth,
    medium_film_source_ref: archetype.medium_film_source_ref,
    act_structure: {
      act_count,
      act_distribution,
      act_scene_count: acts.map((act) => ({
        act_index: act.act_index,
        scene_count: act.scene_count,
        percent: act.percent,
      })),
      act_transition_points: actTransitions,
      acts,
    },
    arc_assembly: {
      main_arc: buildMainArc(archetype),
      subplot_arc: archetype.subplot_arc,
      parallel_arc: archetype.parallel_arc,
      relationship_arc: {
        ...archetype.relationship_arc,
        network: archetype.relationship_network,
      },
      world_arc: worldArc,
      world_state_arc: archetype.world_state_arc,
      theme_arc: archetype.theme_arc,
      legacy_callback_arc: archetype.legacy_callback_arc,
    },
    character_arc: archetype.character_arc,
    location_arc: archetype.location_arc,
    lighting_arc: archetype.lighting_arc,
    relationship_arc: archetype.relationship_arc,
    timeline_arc: archetype.timeline_arc,
    memory_callback_arc: archetype.memory_callback_arc,
    subplot_arc: archetype.subplot_arc,
    parallel_arc: archetype.parallel_arc,
    multi_callback_arc: archetype.multi_callback_arc,
    relationship_network: archetype.relationship_network,
    world_arc: worldArc,
    world_state_arc: archetype.world_state_arc,
    theme_arc: archetype.theme_arc,
    legacy_callback_arc: archetype.legacy_callback_arc,
    callback_layer: {
      enabled: true,
      callback_depth: callbackLayer.callback_depth,
      multi_callback_chain: callbackLayer.multi_callback_chain_enabled,
      entries: callbackLayer.entries,
      multi_callback_chains: callbackLayer.multi_callback_chains,
    },
    dependency_design: dependencyDesign,
    continuity_v1: Object.fromEntries(
      CONTINUITY_DIMENSIONS.map((dimension) => {
        const refMap: Record<string, unknown> = {
          character_arc: archetype.character_arc,
          location_arc: archetype.location_arc,
          lighting_arc: archetype.lighting_arc,
          relationship_arc: archetype.relationship_arc,
          timeline_arc: archetype.timeline_arc,
          memory_callback_arc: archetype.memory_callback_arc,
          subplot_arc: archetype.subplot_arc,
          parallel_arc: archetype.parallel_arc,
          multi_callback_arc: archetype.multi_callback_arc,
          relationship_network: archetype.relationship_network,
          world_arc: worldArc,
          world_state_arc: archetype.world_state_arc,
          theme_arc: archetype.theme_arc,
          legacy_callback_arc: archetype.legacy_callback_arc,
        };
        return [
          dimension,
          {
            dimension,
            ref: refMap[dimension],
            requirements: archetype.continuity_requirements[`${dimension.replace('_arc', '')}_continuity`] ?? [],
          },
        ];
      })
    ),
    continuity_requirements: archetype.continuity_requirements,
    assembly_metadata: {
      phase: FEATURE_FILM_BLUEPRINT_ASSEMBLY_PHASE,
      foundation_phase: FEATURE_FILM_FOUNDATION_PHASE,
      foundation_library_ref: FEATURE_FILM_LIBRARY_PATH,
      continuity_spec_ref: FEATURE_FILM_CONTINUITY_SPEC_EXPORT_PATH,
      dependency_spec_ref: FEATURE_DEPENDENCY_SPEC_DATASET_PATH,
      scale_rules_ref: FEATURE_SCALE_RULES_DATASET_PATH,
    },
  };
}

function runPrecheck(root: string): {
  feature_film_foundation_ready: boolean;
  pass_feature_film_foundation_v1: boolean;
  precheck_passed: boolean;
  issues: AssemblyIssue[];
} {
  const issues: AssemblyIssue[] = [];
  const reportPath = path.join(root, FEATURE_FILM_FOUNDATION_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'FOUNDATION_REPORT_MISSING',
      message: `Missing foundation report at ${FEATURE_FILM_FOUNDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return {
      feature_film_foundation_ready: false,
      pass_feature_film_foundation_v1: false,
      precheck_passed: false,
      issues,
    };
  }

  const foundationReport = readJson<Record<string, unknown>>(root, FEATURE_FILM_FOUNDATION_REPORT_PATH);
  const foundationStatus = String(foundationReport.foundation_status ?? '');
  const foundationVerdict = String(foundationReport.final_verdict ?? '');

  const feature_film_foundation_ready = foundationStatus === FEATURE_FILM_FOUNDATION_READY_STATUS;
  const pass_feature_film_foundation_v1 = foundationVerdict === FEATURE_FILM_FOUNDATION_PASS_VERDICT;

  if (!feature_film_foundation_ready) {
    issues.push({
      code: 'FOUNDATION_NOT_READY',
      message: `Expected foundation_status=${FEATURE_FILM_FOUNDATION_READY_STATUS}`,
      severity: 'error',
    });
  }
  if (!pass_feature_film_foundation_v1) {
    issues.push({
      code: 'FOUNDATION_VERDICT_FAIL',
      message: `Expected final_verdict=${FEATURE_FILM_FOUNDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return {
    feature_film_foundation_ready,
    pass_feature_film_foundation_v1,
    precheck_passed: feature_film_foundation_ready && pass_feature_film_foundation_v1,
    issues,
  };
}

function validateAssemblyOutputs(blueprints: Record<string, unknown>[]): AssemblyIssue[] {
  const issues: AssemblyIssue[] = [];

  if (blueprints.length !== TARGET_ARCHETYPE_IDS.length) {
    issues.push({
      code: 'BLUEPRINT_COUNT_MISMATCH',
      message: `Expected ${TARGET_ARCHETYPE_IDS.length} blueprints`,
      severity: 'error',
    });
  }

  for (const blueprint of blueprints) {
    const id = String(blueprint.feature_film_archetype_id ?? 'unknown');

    for (const field of ['recommended_scene_range', 'recommended_arc_count', 'recommended_callback_depth']) {
      if (blueprint[field] === undefined || blueprint[field] === null) {
        issues.push({
          code: 'MISSING_RECOMMENDATION_FIELD',
          message: `${id}: missing ${field}`,
          severity: 'error',
        });
      }
    }

    const actStructure = blueprint.act_structure as Record<string, unknown> | undefined;
    const actCount = Number(actStructure?.act_count ?? 0);
    if (actCount < 3 || actCount > 5) {
      issues.push({ code: 'ACT_STRUCTURE_INVALID', message: `${id}: act_count must be 3-5`, severity: 'error' });
    }

    const arcAssembly = blueprint.arc_assembly as Record<string, unknown> | undefined;
    for (const field of ARC_ASSEMBLY_FIELDS) {
      if (!arcAssembly?.[field]) {
        issues.push({
          code: 'MISSING_ARC_ASSEMBLY_FIELD',
          message: `${id}: arc_assembly.${field} required`,
          severity: 'error',
        });
      }
    }

    const continuity = blueprint.continuity_v1 as Record<string, unknown> | undefined;
    for (const dimension of CONTINUITY_DIMENSIONS) {
      if (!continuity?.[dimension]) {
        issues.push({
          code: 'MISSING_CONTINUITY_DIMENSION',
          message: `${id}: continuity_v1.${dimension} required`,
          severity: 'error',
        });
      }
    }

    const callbackDepth = Number(
      (blueprint.callback_layer as { callback_depth?: number })?.callback_depth ?? 0
    );
    if (callbackDepth < CALLBACK_DEPTH_MIN || callbackDepth > CALLBACK_DEPTH_MAX) {
      issues.push({
        code: 'CALLBACK_DEPTH_INVALID',
        message: `${id}: callback_depth must be ${CALLBACK_DEPTH_MIN}-${CALLBACK_DEPTH_MAX}`,
        severity: 'error',
      });
    }

    const callbackLayer = blueprint.callback_layer as {
      entries?: CallbackLayerEntry[];
      multi_callback_chains?: unknown[];
      multi_callback_chain?: boolean;
    } | undefined;

    if (!callbackLayer?.entries?.length) {
      issues.push({
        code: 'CALLBACK_LAYER_MISSING',
        message: `${id}: callback_layer entries required`,
        severity: 'error',
      });
    }
    if (!callbackLayer?.multi_callback_chains?.length) {
      issues.push({
        code: 'MULTI_CALLBACK_CHAIN_MISSING',
        message: `${id}: multi_callback_chains required`,
        severity: 'error',
      });
    }
    if (callbackLayer?.multi_callback_chain !== true) {
      issues.push({
        code: 'MULTI_CALLBACK_CHAIN_DISABLED',
        message: `${id}: multi_callback_chain must be true`,
        severity: 'error',
      });
    }

    const dependencyDesign = blueprint.dependency_design as Record<string, unknown> | undefined;
    for (const dimension of DEPENDENCY_DIMENSIONS) {
      const deps = dependencyDesign?.[dimension];
      if (!Array.isArray(deps) || deps.length === 0) {
        issues.push({
          code: 'MISSING_DEPENDENCY_DIMENSION',
          message: `${id}: dependency_design.${dimension} required`,
          severity: 'error',
        });
      }
    }

    if (!blueprint.medium_film_source_ref) {
      issues.push({
        code: 'TRACEABILITY_MISSING',
        message: `${id}: medium_film_source_ref required`,
        severity: 'error',
      });
    }
  }

  return issues;
}

export function writeFeatureFilmBlueprintAssembly(
  projectRoot?: string
): FeatureFilmBlueprintAssemblyReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: AssemblyIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const library = readJson<{ archetypes: FeatureArchetypeRecord[] }>(root, FEATURE_FILM_LIBRARY_PATH);
  const archetypes = library.archetypes.filter((archetype) =>
    (TARGET_ARCHETYPE_IDS as readonly string[]).includes(archetype.feature_film_archetype_id)
  );

  if (archetypes.length !== TARGET_ARCHETYPE_IDS.length) {
    issues.push({
      code: 'TARGET_ARCHETYPE_MISSING',
      message: 'Not all target archetypes found in library',
      severity: 'error',
    });
  }

  const assembledBlueprints = archetypes.map(assembleBlueprint);
  issues.push(...validateAssemblyOutputs(assembledBlueprints));

  const errors = issues.filter((issue) => issue.severity === 'error');
  const blueprintIntegrity = errors.length === 0 ? 'PASS' : 'FAIL';
  const dependencyIntegrity =
    assembledBlueprints.every((bp) => {
      const deps = bp.dependency_design as Record<string, unknown>;
      return DEPENDENCY_DIMENSIONS.every(
        (dim) => Array.isArray(deps?.[dim]) && (deps[dim] as unknown[]).length > 0
      );
    }) && errors.length === 0
      ? 'PASS'
      : 'FAIL';
  const traceabilityIntegrity =
    assembledBlueprints.every((bp) => Boolean(bp.medium_film_source_ref)) && errors.length === 0
      ? 'PASS'
      : 'FAIL';

  const assemblyReady =
    precheck.precheck_passed &&
    errors.length === 0 &&
    blueprintIntegrity === 'PASS' &&
    dependencyIntegrity === 'PASS' &&
    traceabilityIntegrity === 'PASS';

  const actMap = {
    map_id: 'feature-film-act-map-v1',
    phase: FEATURE_FILM_BLUEPRINT_ASSEMBLY_PHASE,
    act_structure_range: '3-5',
    archetypes: assembledBlueprints.map((blueprint) => {
      const actStructure = blueprint.act_structure as Record<string, unknown>;
      return {
        feature_film_archetype_id: blueprint.feature_film_archetype_id,
        scene_count_target: blueprint.scene_count_target,
        recommended_scene_range: blueprint.recommended_scene_range,
        act_count: actStructure.act_count,
        act_distribution: actStructure.act_distribution,
        act_scene_count: actStructure.act_scene_count,
        act_transition_points: actStructure.act_transition_points,
        acts: actStructure.acts,
      };
    }),
  };

  const arcNetwork = {
    map_id: 'feature-film-arc-network-v1',
    phase: FEATURE_FILM_BLUEPRINT_ASSEMBLY_PHASE,
    purpose: 'feature_arc_relationship_tracking',
    archetypes: archetypes.map((archetype) => ({
      feature_film_archetype_id: archetype.feature_film_archetype_id,
      ...buildArcNetwork(archetype),
    })),
  };

  const callbackLayerArtifact = {
    layer_id: 'feature-film-callback-layer-v1',
    phase: FEATURE_FILM_BLUEPRINT_ASSEMBLY_PHASE,
    callback_depth_range: `${CALLBACK_DEPTH_MIN}-${CALLBACK_DEPTH_MAX}`,
    multi_callback_chain: true,
    archetypes: assembledBlueprints.map((blueprint) => ({
      feature_film_archetype_id: blueprint.feature_film_archetype_id,
      callback_depth: (blueprint.callback_layer as { callback_depth: number }).callback_depth,
      multi_callback_chain: (blueprint.callback_layer as { multi_callback_chain: boolean }).multi_callback_chain,
      entries: (blueprint.callback_layer as { entries: CallbackLayerEntry[] }).entries,
      multi_callback_chains: (blueprint.callback_layer as { multi_callback_chains: unknown[] }).multi_callback_chains,
    })),
  };

  const blueprintArtifact = {
    artifact_id: 'feature-film-blueprint-v1',
    phase: FEATURE_FILM_BLUEPRINT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    foundation_ref: FEATURE_FILM_FOUNDATION_REPORT_PATH,
    foundation_library_ref: FEATURE_FILM_LIBRARY_PATH,
    continuity_spec_ref: FEATURE_CONTINUITY_SPEC_DATASET_PATH,
    archetype_count: assembledBlueprints.length,
    continuity_dimension_count: CONTINUITY_DIMENSIONS.length,
    callback_depth_range: `${CALLBACK_DEPTH_MIN}-${CALLBACK_DEPTH_MAX}`,
    multi_callback_chain: true,
    blueprints: assembledBlueprints,
  };

  const report: FeatureFilmBlueprintAssemblyReport = {
    report_id: 'feature-film-blueprint-assembly-report-v1',
    phase: FEATURE_FILM_BLUEPRINT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: assemblyReady
      ? FEATURE_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT
      : FEATURE_FILM_BLUEPRINT_ASSEMBLY_FAIL_VERDICT,
    status: assemblyReady ? FEATURE_FILM_BLUEPRINT_READY_STATUS : 'FEATURE_FILM_BLUEPRINT_INCOMPLETE',
    precheck,
    policy: {
      foundation_artifacts_read_only: true,
      all_previous_outputs_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    assembly_summary: {
      archetype_count: assembledBlueprints.length,
      act_structure_range: '3-5',
      continuity_dimension_count: CONTINUITY_DIMENSIONS.length,
      callback_depth_range: `${CALLBACK_DEPTH_MIN}-${CALLBACK_DEPTH_MAX}`,
      multi_callback_chain: true,
      arc_assembly_fields: [...ARC_ASSEMBLY_FIELDS],
      dependency_dimensions: [...DEPENDENCY_DIMENSIONS],
      blueprint_integrity: blueprintIntegrity,
      dependency_integrity: dependencyIntegrity,
      traceability_integrity: traceabilityIntegrity,
      target_archetypes: [...TARGET_ARCHETYPE_IDS],
    },
    outputs: {
      blueprint_path: FEATURE_FILM_BLUEPRINT_PATH,
      act_map_path: FEATURE_FILM_ACT_MAP_PATH,
      arc_network_path: FEATURE_FILM_ARC_NETWORK_PATH,
      callback_layer_path: FEATURE_FILM_CALLBACK_LAYER_PATH,
    },
    issues,
    feature_film_blueprint_ready: assemblyReady,
  };

  fs.mkdirSync(path.join(root, FEATURE_FILM_BLUEPRINT_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, FEATURE_FILM_BLUEPRINT_ASSEMBLY_DIR), { recursive: true });

  fs.writeFileSync(
    path.join(root, FEATURE_FILM_BLUEPRINT_PATH),
    `${JSON.stringify(blueprintArtifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_ACT_MAP_PATH),
    `${JSON.stringify(actMap, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_ARC_NETWORK_PATH),
    `${JSON.stringify(arcNetwork, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_CALLBACK_LAYER_PATH),
    `${JSON.stringify(callbackLayerArtifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
