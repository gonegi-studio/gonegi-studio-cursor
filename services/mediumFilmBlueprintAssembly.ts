import fs from 'node:fs';
import path from 'node:path';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  MEDIUM_FILM_CONTINUITY_SPEC_V2_PATH,
  MEDIUM_FILM_FOUNDATION_READY_STATUS,
  MEDIUM_FILM_FOUNDATION_REPORT_PATH,
  MEDIUM_FILM_LIBRARY_PATH,
  MEDIUM_FILM_PRODUCTION_FOUNDATION_PASS_VERDICT,
  MEDIUM_FILM_PRODUCTION_FOUNDATION_PHASE,
} from './mediumFilmProductionFoundation.js';

export const MEDIUM_FILM_BLUEPRINT_ASSEMBLY_PHASE = 'PHASE-L3-MEDIUM-002' as const;
export const MEDIUM_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT =
  'PASS_MEDIUM_FILM_BLUEPRINT_ASSEMBLY_V1' as const;
export const MEDIUM_FILM_BLUEPRINT_ASSEMBLY_FAIL_VERDICT =
  'FAIL_MEDIUM_FILM_BLUEPRINT_ASSEMBLY_V1' as const;
export const MEDIUM_FILM_BLUEPRINT_READY_STATUS = 'MEDIUM_FILM_BLUEPRINT_READY' as const;

export const MEDIUM_FILM_BLUEPRINT_EXPORT_DIR = 'exports/medium_film_blueprint' as const;
export const MEDIUM_FILM_BLUEPRINT_PATH =
  'exports/medium_film_blueprint/medium-film-blueprint.json' as const;
export const MEDIUM_FILM_ACT_MAP_PATH =
  'exports/medium_film_blueprint/medium-film-act-map.json' as const;
export const MEDIUM_FILM_CONTINUITY_MAP_PATH =
  'exports/medium_film_blueprint/medium-film-continuity-map.json' as const;
export const MEDIUM_FILM_ARC_NETWORK_PATH =
  'exports/medium_film_blueprint/medium-film-arc-network.json' as const;

export const MEDIUM_FILM_BLUEPRINT_ASSEMBLY_DIR = 'reports/medium_film_blueprint' as const;
export const MEDIUM_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH =
  'reports/medium_film_blueprint/MEDIUM_FILM_BLUEPRINT_ASSEMBLY_REPORT.json' as const;

const TARGET_ARCHETYPE_IDS = [
  'harbor_saga_medium',
  'mediterranean_chronicle_medium',
  'correspondence_saga_medium',
] as const;

const ACT_DISTRIBUTION = {
  act1_percent: 22,
  act2_percent: 56,
  act3_percent: 22,
} as const;

const CONTINUITY_V2_DIMENSIONS = [
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
] as const;

const ARC_ASSEMBLY_FIELDS = [
  'main_arc',
  'subplot_arc',
  'parallel_arc',
  'relationship_arc',
  'world_arc',
] as const;

type IssueSeverity = 'error' | 'warning';

interface AssemblyIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface MediumArchetypeRecord {
  medium_film_archetype_id: string;
  theme: string;
  scene_count_range: string;
  short_film_source_ref: string;
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
  multi_callback_chain: string[];
}

export interface MediumFilmBlueprintAssemblyReport {
  report_id: string;
  phase: typeof MEDIUM_FILM_BLUEPRINT_ASSEMBLY_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    medium_film_foundation_ready: boolean;
    pass_medium_film_foundation_v1: boolean;
    precheck_passed: boolean;
  };
  policy: {
    foundation_artifacts_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  assembly_summary: {
    archetype_count: number;
    act_structure: number;
    continuity_v2_dimensions: number;
    arc_assembly_fields: string[];
    target_archetypes: string[];
  };
  outputs: {
    blueprint_path: string;
    act_map_path: string;
    continuity_map_path: string;
    arc_network_path: string;
  };
  issues: AssemblyIssue[];
  medium_film_blueprint_ready: boolean;
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

function distributeActs(totalScenes: number): ActDistributionEntry[] {
  const act1 = Math.round(totalScenes * (ACT_DISTRIBUTION.act1_percent / 100));
  const act3 = Math.round(totalScenes * (ACT_DISTRIBUTION.act3_percent / 100));
  const act2 = totalScenes - act1 - act3;
  const act1End = act1;
  const act2End = act1 + act2;

  return [
    {
      act_index: 1,
      act_name: 'setup',
      percent: ACT_DISTRIBUTION.act1_percent,
      scene_count: act1,
      scene_range: `1-${act1End}`,
    },
    {
      act_index: 2,
      act_name: 'confrontation',
      percent: ACT_DISTRIBUTION.act2_percent,
      scene_count: act2,
      scene_range: `${act1End + 1}-${act2End}`,
    },
    {
      act_index: 3,
      act_name: 'resolution',
      percent: ACT_DISTRIBUTION.act3_percent,
      scene_count: act3,
      scene_range: `${act2End + 1}-${totalScenes}`,
    },
  ];
}

function buildWorldArc(archetype: MediumArchetypeRecord): Record<string, unknown> {
  const locationFlow = (archetype.location_arc.location_flow as string[]) ?? [];
  return {
    arc_type: 'world_change_story',
    purpose: 'character_story + world_change_story',
    world_state_stages: [
      'established_community',
      'disruption_event',
      'transformation_period',
      'renewed_world_order',
    ],
    location_transformations: locationFlow.map((locationId, index) => ({
      location_id: locationId,
      transformation_stage: index,
      world_impact: index === 0 ? 'baseline' : index === locationFlow.length - 1 ? 'renewed' : 'evolving',
    })),
    community_evolution: archetype.relationship_network.evolution_stages,
    timeline_markers: archetype.timeline_arc.timeline_markers,
  };
}

function buildMainArc(archetype: MediumArchetypeRecord): Record<string, unknown> {
  const primary = archetype.story_arcs[0];
  return {
    arc_id: primary?.arc_id ?? 'main_arc',
    arc_type: primary?.arc_type ?? 'primary',
    beats: primary?.beats ?? [],
    character_group: primary?.primary_character_group,
    scene_count_target: midpointSceneCount(archetype.scene_count_range),
  };
}

function buildCallbackLayer(archetype: MediumArchetypeRecord): {
  entries: CallbackLayerEntry[];
  multi_callback_chains: { chain_id: string; layer_ids: string[]; anchor_ids: string[] }[];
} {
  const entries: CallbackLayerEntry[] = [];
  const chains: { chain_id: string; layer_ids: string[]; anchor_ids: string[] }[] = [];

  for (const layer of archetype.multi_callback_arc.callback_layers) {
    const layerAnchors: string[] = [];
    for (const pair of layer.foreshadow_payoff_pairs) {
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
        multi_callback_chain: [chainId, layer.layer_id, pair.anchor_id],
      });
      layerAnchors.push(pair.anchor_id);
    }
    chains.push({
      chain_id: `multi_callback_${layer.layer_id}`,
      layer_ids: [layer.layer_id],
      anchor_ids: layerAnchors,
    });
  }

  return { entries, multi_callback_chains: chains };
}

function buildArcNetwork(archetype: MediumArchetypeRecord): Record<string, unknown> {
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
  ];

  const edges = [
    { from: 'main_arc', to: archetype.subplot_arc.subplots[0]?.subplot_id ?? 'subplot', relationship: 'contains_subplot' },
    { from: 'main_arc', to: archetype.parallel_arc.parallel_tracks[0]?.track_id ?? 'parallel', relationship: 'parallel_counterpoint' },
    { from: 'main_arc', to: 'relationship_arc', relationship: 'character_story' },
    { from: 'main_arc', to: 'world_arc', relationship: 'world_change_story' },
    { from: 'world_arc', to: 'relationship_arc', relationship: 'community_evolution' },
    ...archetype.parallel_arc.parallel_tracks.map((track) => ({
      from: track.track_id,
      to: 'main_arc',
      relationship: 'converges_at_resolution',
    })),
  ];

  return {
    network_id: `${archetype.medium_film_archetype_id}_arc_network_v1`,
    purpose: 'arc_relationship_tracking',
    nodes,
    edges,
    relationship_network_ref: archetype.relationship_network,
  };
}

function assembleBlueprint(archetype: MediumArchetypeRecord): Record<string, unknown> {
  const sceneCountTarget = midpointSceneCount(archetype.scene_count_range);
  const actDistribution = distributeActs(sceneCountTarget);
  const callbackLayer = buildCallbackLayer(archetype);
  const worldArc = buildWorldArc(archetype);
  const recommendedArcCount =
    archetype.story_arcs.length +
    archetype.subplot_arc.subplots.length +
    archetype.parallel_arc.parallel_tracks.length +
    2;
  const recommendedCallbackDepth = archetype.multi_callback_arc.callback_layers.length;

  const act1End = parseSceneRange(actDistribution[0].scene_range).max;
  const act2End = parseSceneRange(actDistribution[1].scene_range).max;

  return {
    medium_film_archetype_id: archetype.medium_film_archetype_id,
    theme: archetype.theme,
    scene_count_target: sceneCountTarget,
    scene_count_range: archetype.scene_count_range,
    recommended_scene_range: archetype.scene_count_range,
    recommended_arc_count: recommendedArcCount,
    recommended_callback_depth: recommendedCallbackDepth,
    short_film_source_ref: archetype.short_film_source_ref,
    act_structure: {
      act_count: 3,
      act_distribution: ACT_DISTRIBUTION,
      act_scene_count: actDistribution.map((act) => ({
        act_index: act.act_index,
        scene_count: act.scene_count,
        percent: act.percent,
      })),
      act_transition_points: [
        { act_boundary: 'act1_to_act2', scene_index: act1End, transition_type: 'act_break' },
        { act_boundary: 'act2_to_act3', scene_index: act2End, transition_type: 'act_break' },
      ],
      acts: actDistribution,
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
    callback_layer: {
      enabled: true,
      entries: callbackLayer.entries,
      multi_callback_chains: callbackLayer.multi_callback_chains,
    },
    continuity_v2: {
      character_arc: { dimension: 'character_arc', ref: archetype.character_arc, requirements: archetype.continuity_requirements.character_continuity ?? [] },
      location_arc: { dimension: 'location_arc', ref: archetype.location_arc, requirements: archetype.continuity_requirements.location_continuity ?? [] },
      lighting_arc: { dimension: 'lighting_arc', ref: archetype.lighting_arc, requirements: archetype.continuity_requirements.lighting_continuity ?? [] },
      relationship_arc: { dimension: 'relationship_arc', ref: archetype.relationship_arc, requirements: archetype.continuity_requirements.relationship_continuity ?? [] },
      timeline_arc: { dimension: 'timeline_arc', ref: archetype.timeline_arc, requirements: archetype.continuity_requirements.timeline_continuity ?? [] },
      memory_callback_arc: { dimension: 'memory_callback_arc', ref: archetype.memory_callback_arc, requirements: archetype.continuity_requirements.memory_callback_continuity ?? [] },
      subplot_arc: { dimension: 'subplot_arc', ref: archetype.subplot_arc, requirements: archetype.continuity_requirements.subplot_continuity ?? [] },
      parallel_arc: { dimension: 'parallel_arc', ref: archetype.parallel_arc, requirements: archetype.continuity_requirements.parallel_continuity ?? [] },
      multi_callback_arc: { dimension: 'multi_callback_arc', ref: archetype.multi_callback_arc, requirements: archetype.continuity_requirements.memory_callback_continuity ?? [] },
      relationship_network: { dimension: 'relationship_network', ref: archetype.relationship_network, requirements: archetype.continuity_requirements.relationship_network_continuity ?? [] },
      world_arc: { dimension: 'world_arc', ref: worldArc, requirements: archetype.continuity_requirements.location_continuity ?? [] },
    },
    continuity_requirements: archetype.continuity_requirements,
    assembly_metadata: {
      phase: MEDIUM_FILM_BLUEPRINT_ASSEMBLY_PHASE,
      foundation_phase: MEDIUM_FILM_PRODUCTION_FOUNDATION_PHASE,
      foundation_library_ref: MEDIUM_FILM_LIBRARY_PATH,
      continuity_spec_ref: MEDIUM_FILM_CONTINUITY_SPEC_V2_PATH,
    },
  };
}

function runPrecheck(root: string): {
  medium_film_foundation_ready: boolean;
  pass_medium_film_foundation_v1: boolean;
  precheck_passed: boolean;
  issues: AssemblyIssue[];
} {
  const issues: AssemblyIssue[] = [];
  const reportPath = path.join(root, MEDIUM_FILM_FOUNDATION_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'FOUNDATION_REPORT_MISSING',
      message: `Missing foundation report at ${MEDIUM_FILM_FOUNDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return {
      medium_film_foundation_ready: false,
      pass_medium_film_foundation_v1: false,
      precheck_passed: false,
      issues,
    };
  }

  const foundationReport = readJson<Record<string, unknown>>(root, MEDIUM_FILM_FOUNDATION_REPORT_PATH);
  const foundationStatus = String(foundationReport.foundation_status ?? '');
  const foundationVerdict = String(foundationReport.final_verdict ?? '');

  const medium_film_foundation_ready = foundationStatus === MEDIUM_FILM_FOUNDATION_READY_STATUS;
  const pass_medium_film_foundation_v1 =
    foundationVerdict === MEDIUM_FILM_PRODUCTION_FOUNDATION_PASS_VERDICT;

  if (!medium_film_foundation_ready) {
    issues.push({
      code: 'FOUNDATION_NOT_READY',
      message: `Expected foundation_status=${MEDIUM_FILM_FOUNDATION_READY_STATUS}`,
      severity: 'error',
    });
  }
  if (!pass_medium_film_foundation_v1) {
    issues.push({
      code: 'FOUNDATION_VERDICT_FAIL',
      message: `Expected final_verdict=${MEDIUM_FILM_PRODUCTION_FOUNDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return {
    medium_film_foundation_ready,
    pass_medium_film_foundation_v1,
    precheck_passed: medium_film_foundation_ready && pass_medium_film_foundation_v1,
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
    const id = String(blueprint.medium_film_archetype_id ?? 'unknown');

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
    const distribution = actStructure?.act_distribution as Record<string, number> | undefined;
    if (!distribution || actStructure?.act_count !== 3) {
      issues.push({ code: 'ACT_STRUCTURE_INVALID', message: `${id}: invalid act structure`, severity: 'error' });
    } else {
      if (distribution.act1_percent < 20 || distribution.act1_percent > 25) {
        issues.push({ code: 'ACT1_OUT_OF_RANGE', message: `${id}: act1 out of range`, severity: 'error' });
      }
      if (distribution.act2_percent < 50 || distribution.act2_percent > 60) {
        issues.push({ code: 'ACT2_OUT_OF_RANGE', message: `${id}: act2 out of range`, severity: 'error' });
      }
      if (distribution.act3_percent < 20 || distribution.act3_percent > 25) {
        issues.push({ code: 'ACT3_OUT_OF_RANGE', message: `${id}: act3 out of range`, severity: 'error' });
      }
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

    const continuityV2 = blueprint.continuity_v2 as Record<string, unknown> | undefined;
    for (const dimension of CONTINUITY_V2_DIMENSIONS) {
      if (!continuityV2?.[dimension]) {
        issues.push({
          code: 'MISSING_CONTINUITY_V2_DIMENSION',
          message: `${id}: continuity_v2.${dimension} required`,
          severity: 'error',
        });
      }
    }

    const callbackLayer = blueprint.callback_layer as {
      entries?: { callback_seed: number; callback_reference: number | null; callback_resolution: number | null; multi_callback_chain: string[] }[];
      multi_callback_chains?: unknown[];
    } | undefined;

    if (!callbackLayer?.entries?.length) {
      issues.push({
        code: 'CALLBACK_LAYER_MISSING',
        message: `${id}: callback_layer entries required`,
        severity: 'error',
      });
    } else {
      for (const entry of callbackLayer.entries) {
        for (const field of ['callback_seed', 'callback_reference', 'callback_resolution', 'multi_callback_chain'] as const) {
          if (!(field in entry)) {
            issues.push({
              code: 'MISSING_CALLBACK_LAYER_FIELD',
              message: `${id}: callback_layer entry missing ${field}`,
              severity: 'error',
            });
          }
        }
      }
    }
    if (!callbackLayer?.multi_callback_chains?.length) {
      issues.push({
        code: 'MULTI_CALLBACK_CHAIN_MISSING',
        message: `${id}: multi_callback_chains required`,
        severity: 'error',
      });
    }
  }

  return issues;
}

export function writeMediumFilmBlueprintAssembly(
  projectRoot?: string
): MediumFilmBlueprintAssemblyReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: AssemblyIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const library = readJson<{ archetypes: MediumArchetypeRecord[] }>(root, MEDIUM_FILM_LIBRARY_PATH);
  const archetypes = library.archetypes.filter((archetype) =>
    (TARGET_ARCHETYPE_IDS as readonly string[]).includes(archetype.medium_film_archetype_id)
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
  const assemblyReady = precheck.precheck_passed && errors.length === 0;

  const actMap = {
    map_id: 'medium-film-act-map-v1',
    phase: MEDIUM_FILM_BLUEPRINT_ASSEMBLY_PHASE,
    act_structure: 3,
    act_distribution: ACT_DISTRIBUTION,
    archetypes: assembledBlueprints.map((blueprint) => {
      const actStructure = blueprint.act_structure as Record<string, unknown>;
      return {
        medium_film_archetype_id: blueprint.medium_film_archetype_id,
        scene_count_target: blueprint.scene_count_target,
        recommended_scene_range: blueprint.recommended_scene_range,
        act_distribution: actStructure.act_distribution,
        act_scene_count: actStructure.act_scene_count,
        act_transition_points: actStructure.act_transition_points,
        acts: actStructure.acts,
      };
    }),
  };

  const continuityMap = {
    map_id: 'medium-film-continuity-map-v1',
    phase: MEDIUM_FILM_BLUEPRINT_ASSEMBLY_PHASE,
    continuity_v2_dimensions: CONTINUITY_V2_DIMENSIONS.length,
    dimension_list: [...CONTINUITY_V2_DIMENSIONS],
    archetypes: assembledBlueprints.map((blueprint) => ({
      medium_film_archetype_id: blueprint.medium_film_archetype_id,
      continuity_v2: blueprint.continuity_v2,
      continuity_requirements: blueprint.continuity_requirements,
    })),
  };

  const arcNetwork = {
    map_id: 'medium-film-arc-network-v1',
    phase: MEDIUM_FILM_BLUEPRINT_ASSEMBLY_PHASE,
    purpose: 'arc_relationship_tracking',
    archetypes: archetypes.map((archetype) => ({
      medium_film_archetype_id: archetype.medium_film_archetype_id,
      ...buildArcNetwork(archetype),
    })),
  };

  const blueprintArtifact = {
    artifact_id: 'medium-film-blueprint-v1',
    phase: MEDIUM_FILM_BLUEPRINT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    foundation_ref: MEDIUM_FILM_FOUNDATION_REPORT_PATH,
    foundation_library_ref: MEDIUM_FILM_LIBRARY_PATH,
    archetype_count: assembledBlueprints.length,
    act_structure: 3,
    continuity_v2_dimensions: CONTINUITY_V2_DIMENSIONS.length,
    blueprints: assembledBlueprints,
  };

  const report: MediumFilmBlueprintAssemblyReport = {
    report_id: 'medium-film-blueprint-assembly-report-v1',
    phase: MEDIUM_FILM_BLUEPRINT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: assemblyReady
      ? MEDIUM_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT
      : MEDIUM_FILM_BLUEPRINT_ASSEMBLY_FAIL_VERDICT,
    status: assemblyReady ? MEDIUM_FILM_BLUEPRINT_READY_STATUS : 'MEDIUM_FILM_BLUEPRINT_INCOMPLETE',
    precheck,
    policy: {
      foundation_artifacts_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    assembly_summary: {
      archetype_count: assembledBlueprints.length,
      act_structure: 3,
      continuity_v2_dimensions: CONTINUITY_V2_DIMENSIONS.length,
      arc_assembly_fields: [...ARC_ASSEMBLY_FIELDS],
      target_archetypes: [...TARGET_ARCHETYPE_IDS],
    },
    outputs: {
      blueprint_path: MEDIUM_FILM_BLUEPRINT_PATH,
      act_map_path: MEDIUM_FILM_ACT_MAP_PATH,
      continuity_map_path: MEDIUM_FILM_CONTINUITY_MAP_PATH,
      arc_network_path: MEDIUM_FILM_ARC_NETWORK_PATH,
    },
    issues,
    medium_film_blueprint_ready: assemblyReady,
  };

  fs.mkdirSync(path.join(root, MEDIUM_FILM_BLUEPRINT_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, MEDIUM_FILM_BLUEPRINT_ASSEMBLY_DIR), { recursive: true });

  fs.writeFileSync(
    path.join(root, MEDIUM_FILM_BLUEPRINT_PATH),
    `${JSON.stringify(blueprintArtifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MEDIUM_FILM_ACT_MAP_PATH),
    `${JSON.stringify(actMap, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MEDIUM_FILM_CONTINUITY_MAP_PATH),
    `${JSON.stringify(continuityMap, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MEDIUM_FILM_ARC_NETWORK_PATH),
    `${JSON.stringify(arcNetwork, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MEDIUM_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
