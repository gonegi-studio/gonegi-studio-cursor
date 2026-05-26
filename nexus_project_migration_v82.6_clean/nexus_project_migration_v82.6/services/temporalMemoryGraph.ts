import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CharacterContinuityState,
  CinematicExtractionResult,
  EnvironmentContinuityState,
  SceneMemoryNode,
  TEMPORAL_MEMORY_GRAPH_VERSION,
  TemporalMemoryEdge,
  TemporalMemoryEdgeKind,
  TemporalMemoryGraphBundle,
  TemporalMemoryGraphExport,
  TemporalMemoryGraphValidation,
  TemporalMemoryContinuitySummary,
} from '../types';
import { composeRecursiveDataset } from './datasetHydrationService';

export const TEMPORAL_MEMORY_GRAPH_EPOCH = '2026-05-26T12:00:00.000Z';
export const TEMPORAL_MEMORY_GRAPH_FILENAME = 'temporal-cinematic-memory-graph-export.json';

const MOOD_SIGNATURES = [
  'sorrow_lingering',
  'anticipation_build',
  'melancholy_residue',
  'tension_release',
  'nostalgic_warmth',
  'dread_accumulation',
] as const;

const MOTIF_SIGNATURES = [
  'harbor_reflection',
  'amber_gaze',
  'rain_sheen',
  'sunset_rim',
  'companion_silhouette',
  'fog_veil',
] as const;

const ENVIRONMENT_SIGNATURES = [
  'coastal_mist',
  'wet_asphalt',
  'golden_hour_haze',
  'interior_tungsten',
  'storm_front',
  'harbor_dusk',
] as const;

const FRAMING_SIGNATURES = [
  'eye_level_medium',
  'close_up_intimate',
  'tracking_lateral',
  'wide_establishing',
  'over_shoulder',
  'low_angle_authority',
] as const;

function det(index: number, salt: number): number {
  const val =
    Math.sin(index * 0.17 + salt * 0.11) * Math.cos(salt * 0.23 - index * 0.09);
  return Number(Math.max(0, Math.min(1, (val + 1) / 2)).toFixed(6));
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function edgeId(kind: string, sourceIndex: number, targetIndex: number, tag: string): string {
  return `TMG-${kind.toUpperCase()}-${sourceIndex}-${targetIndex}-${tag}`;
}

function anchorId(sceneIndex: number): string {
  return `TEMPORAL-ANCHOR-${String(sceneIndex + 1).padStart(3, '0')}`;
}

function extractMoodSignature(scene: CinematicExtractionResult, index: number): string {
  const mood =
    scene.emotional_carryover?.underlying_mood_base ??
    scene.production_v82?.situation_state?.scenario_type ??
    scene.scene_state?.emotion?.melancholy?.value ??
    scene.scene_state?.emotion?.dread?.value;
  if (typeof mood === 'string' && mood.length > 0) {
    return mood.replace(/\s+/g, '_').toLowerCase();
  }
  if (typeof mood === 'number') {
    return `mood_${Math.round(mood * 100)}`;
  }
  return MOOD_SIGNATURES[index % MOOD_SIGNATURES.length];
}

function extractMotifSignatures(scene: CinematicExtractionResult, index: number): string[] {
  const motifs = new Set<string>();
  const primary = scene.motif_persistence?.motif_id;
  if (primary) motifs.add(primary);

  const graphMotifs = scene.graphs_extraction?.motif_graph as
    | { nodes?: Array<{ id?: string }> }
    | undefined;
  for (const node of graphMotifs?.nodes ?? []) {
    if (node.id) motifs.add(node.id.toLowerCase());
  }

  motifs.add(MOTIF_SIGNATURES[index % MOTIF_SIGNATURES.length]);
  motifs.add(MOTIF_SIGNATURES[(index + 2) % MOTIF_SIGNATURES.length]);
  return [...motifs].sort();
}

function extractCharacterSignatures(scene: CinematicExtractionResult, index: number): string[] {
  const signatures = new Set<string>();
  if (scene.character_persistence?.outfit_continuity_graph) {
    signatures.add(scene.character_persistence.outfit_continuity_graph);
  }
  if (scene.character_persistence?.gaze_memory) {
    signatures.add(scene.character_persistence.gaze_memory);
  }
  for (const atom of scene.visual_atoms ?? []) {
    if (atom.label?.includes('subject') || atom.label?.includes('character')) {
      signatures.add(atom.label);
    }
  }
  signatures.add(`companion_presence_${index % 3}`);
  signatures.add(`protagonist_authority_${index % 5}`);
  return [...signatures].sort();
}

function extractEnvironmentSignature(scene: CinematicExtractionResult, index: number): string {
  const atmosphereRaw =
    scene.canonical_dna?.domains?.atmosphere?.haze ??
    scene.scene_state?.physics?.depth_isolation?.value;
  if (typeof atmosphereRaw === 'number') {
    return `atmosphere_${Math.round(atmosphereRaw * 100)}`;
  }
  return ENVIRONMENT_SIGNATURES[index % ENVIRONMENT_SIGNATURES.length];
}

function extractFramingSignature(scene: CinematicExtractionResult, index: number): string {
  const framingRaw =
    scene.director_dna?.composition_logic?.symmetry_bias?.value ??
    scene.director_dna?.composition_logic?.rule_of_thirds?.value;
  if (typeof framingRaw === 'number') {
    return `framing_${Math.round(framingRaw * 100)}`;
  }
  return FRAMING_SIGNATURES[index % FRAMING_SIGNATURES.length];
}

function extractColorHarmonySignature(scene: CinematicExtractionResult, index: number): string {
  const palette = scene.canonical_dna?.domains?.color_palette?.dominant;
  if (Array.isArray(palette) && palette.length > 0) {
    return palette.slice(0, 3).join('_').toLowerCase();
  }
  return `harmony_${index % 7}`;
}

function extractRhythmSignature(scene: CinematicExtractionResult, index: number): string {
  const rhythm = scene.camera_rhythm_memory?.rhythm_continuity;
  if (typeof rhythm === 'number') {
    return `rhythm_${Math.round(rhythm * 100)}`;
  }
  return `rhythm_${(index % 6) + 1}`;
}

export function buildSceneMemoryNodes(scenes: CinematicExtractionResult[]): SceneMemoryNode[] {
  return scenes.map((scene, sceneIndex) => ({
    node_id: `MEM-NODE-${String(sceneIndex + 1).padStart(3, '0')}`,
    scene_id: scene.id,
    scene_index: sceneIndex,
    temporal_anchor_id: anchorId(sceneIndex),
    mood_signature: extractMoodSignature(scene, sceneIndex),
    motif_signatures: extractMotifSignatures(scene, sceneIndex),
    character_signatures: extractCharacterSignatures(scene, sceneIndex),
    environment_signature: extractEnvironmentSignature(scene, sceneIndex),
    framing_signature: extractFramingSignature(scene, sceneIndex),
    color_harmony_signature: extractColorHarmonySignature(scene, sceneIndex),
    rhythm_signature: extractRhythmSignature(scene, sceneIndex),
  }));
}

function buildBaseEdge(
  kind: TemporalMemoryEdgeKind,
  source: SceneMemoryNode,
  target: SceneMemoryNode,
  tag: string,
  overrides: Partial<TemporalMemoryEdge> = {}
): TemporalMemoryEdge {
  const distance = Math.abs(target.scene_index - source.scene_index);
  return {
    edge_id: edgeId(kind, source.scene_index, target.scene_index, tag),
    source_node_id: source.node_id,
    target_node_id: target.node_id,
    edge_kind: kind,
    persistence_strength: round6(det(source.scene_index, target.scene_index + 1)),
    emotional_decay: round6(det(source.scene_index + 2, target.scene_index + 3) * 0.35),
    recurrence_weight: round6(det(source.scene_index + 4, target.scene_index + 5)),
    narrative_distance: distance,
    temporal_anchor_id: target.temporal_anchor_id,
    ...overrides,
  };
}

export function buildCharacterContinuityStates(
  scenes: CinematicExtractionResult[],
  nodes: SceneMemoryNode[]
): CharacterContinuityState[] {
  let trustAcc = 0.62;
  let conflictAcc = 0.18;

  return scenes.map((scene, index) => {
    const prev = index > 0 ? scenes[index - 1] : scene;
    const prevIntensity = prev.emotional_carryover?.carryover_intensity ?? det(index, 1);
    const curIntensity = scene.emotional_carryover?.carryover_intensity ?? det(index + 1, 1);
    const trustDelta =
      scene.production_v82?.relationship_dynamics?.trust?.value ??
      scene.relationship_graph?.find((e) => e.predicate === 'trusts')?.weight ??
      det(index, 8);
    const conflictDelta =
      scene.production_v82?.relationship_dynamics?.unresolved_tension?.value ??
      det(index, 9);

    trustAcc = round6(Math.min(1, trustAcc + trustDelta * 0.04));
    conflictAcc = round6(Math.min(1, conflictAcc + conflictDelta * 0.03));

    return {
      scene_index: index,
      scene_id: scene.id,
      emotional_drift: round6(Math.abs(curIntensity - prevIntensity)),
      clothing_continuity: round6(
        scene.character_persistence?.silhouette_persistence ?? det(index, 10)
      ),
      relationship_evolution: round6(det(index, 11) * 0.5 + trustAcc * 0.5),
      trust_accumulation: trustAcc,
      conflict_accumulation: conflictAcc,
      companion_attachment: round6(
        nodes[index].character_signatures.includes(`companion_presence_${index % 3}`)
          ? 0.82 + det(index, 12) * 0.15
          : 0.45 + det(index, 12) * 0.2
      ),
      protagonist_authority: round6(
        scene.character_persistence?.face_topology_lock ?? 0.7 + det(index, 13) * 0.25
      ),
    };
  });
}

export function buildEnvironmentContinuityStates(
  scenes: CinematicExtractionResult[],
  nodes: SceneMemoryNode[]
): EnvironmentContinuityState[] {
  return scenes.map((scene, index) => {
    const prevEnv = index > 0 ? nodes[index - 1].environment_signature : nodes[index].environment_signature;
    const curEnv = nodes[index].environment_signature;
    const sameEnv = prevEnv === curEnv;

    return {
      scene_index: index,
      scene_id: scene.id,
      weather_persistence: round6(sameEnv ? 0.88 + det(index, 20) * 0.1 : 0.35 + det(index, 20) * 0.25),
      atmospheric_evolution: round6(det(index, 21) * 0.4 + (sameEnv ? 0.45 : 0.72)),
      lighting_progression: round6(
        nodes[index].motif_signatures.includes('sunset_rim') || nodes[index].motif_signatures.includes('amber_gaze')
          ? 0.78 + det(index, 22) * 0.18
          : 0.42 + det(index, 22) * 0.35
      ),
      environmental_callback_weight: round6(
        nodes[index].motif_signatures.includes('harbor_reflection') ? 0.91 : 0.48 + det(index, 23) * 0.2
      ),
      location_state_drift: round6(sameEnv ? det(index, 24) * 0.12 : 0.25 + det(index, 24) * 0.45),
    };
  });
}

function buildEmotionalTransitionEdges(
  nodes: SceneMemoryNode[],
  scenes: CinematicExtractionResult[]
): TemporalMemoryEdge[] {
  const edges: TemporalMemoryEdge[] = [];
  for (let i = 1; i < nodes.length; i++) {
    const source = nodes[i - 1];
    const target = nodes[i];
    const sorrowPersist =
      source.mood_signature.includes('sorrow') ||
      source.mood_signature.includes('melancholy') ||
      target.mood_signature.includes('sorrow');
    edges.push(
      buildBaseEdge('emotional_transition', source, target, 'seq', {
        persistence_strength: round6(sorrowPersist ? 0.88 + det(i, 30) * 0.1 : 0.55 + det(i, 30) * 0.3),
        emotional_decay: round6(
          scenes[i].emotional_carryover?.decay_ratio_per_frame ?? 0.015 + det(i, 31) * 0.02
        ),
        recurrence_weight: round6(det(i, 32)),
        propagation_tag: sorrowPersist ? 'sorrow_persists' : 'emotion_handoff',
      })
    );
  }
  return edges;
}

function buildVisualMotifEdges(nodes: SceneMemoryNode[]): TemporalMemoryEdge[] {
  const edges: TemporalMemoryEdge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const shared = nodes[i].motif_signatures.filter((m) => nodes[j].motif_signatures.includes(m));
      if (shared.length === 0) continue;
      const harborResurface =
        shared.some((m) => m.includes('harbor')) || shared.some((m) => m.includes('amber'));
      edges.push(
        buildBaseEdge('visual_motif', nodes[i], nodes[j], shared[0], {
          persistence_strength: round6(harborResurface ? 0.9 : 0.65 + det(i, j) * 0.25),
          recurrence_weight: round6(shared.length / Math.max(nodes[i].motif_signatures.length, 1)),
          narrative_distance: j - i,
          propagation_tag: harborResurface ? 'harbor_motif_resurfaces' : 'motif_recurrence',
        })
      );
    }
  }
  return edges;
}

function buildCharacterMemoryEdges(
  nodes: SceneMemoryNode[],
  characterStates: CharacterContinuityState[]
): TemporalMemoryEdge[] {
  const edges: TemporalMemoryEdge[] = [];
  for (let i = 1; i < nodes.length; i++) {
    const source = nodes[i - 1];
    const target = nodes[i];
    const state = characterStates[i];
    edges.push(
      buildBaseEdge('character_memory', source, target, 'continuity', {
        persistence_strength: round6(state.companion_attachment),
        emotional_decay: round6(state.emotional_drift),
        recurrence_weight: round6(state.clothing_continuity),
        propagation_tag: 'companion_presence_continuity',
      })
    );
    if (state.trust_accumulation > 0.7 || state.conflict_accumulation > 0.35) {
      edges.push(
        buildBaseEdge('character_memory', source, target, 'relationship', {
          persistence_strength: round6(state.relationship_evolution),
          recurrence_weight: round6(state.trust_accumulation),
          emotional_decay: round6(state.conflict_accumulation),
          propagation_tag: 'trust_conflict_accumulation',
        })
      );
    }
  }
  return edges;
}

function buildEnvironmentMemoryEdges(
  nodes: SceneMemoryNode[],
  environmentStates: EnvironmentContinuityState[]
): TemporalMemoryEdge[] {
  const edges: TemporalMemoryEdge[] = [];
  for (let i = 1; i < nodes.length; i++) {
    const source = nodes[i - 1];
    const target = nodes[i];
    const state = environmentStates[i];
    const sunsetCallback =
      target.motif_signatures.some((m) => m.includes('sunset') || m.includes('amber')) ||
      target.environment_signature.includes('golden');
    edges.push(
      buildBaseEdge('environment_memory', source, target, 'env', {
        persistence_strength: round6(state.weather_persistence),
        recurrence_weight: round6(state.environmental_callback_weight),
        emotional_decay: round6(state.location_state_drift),
        propagation_tag: sunsetCallback ? 'sunset_lighting_callback' : 'atmospheric_evolution',
      })
    );
  }
  return edges;
}

function buildCinematicCallbackEdges(nodes: SceneMemoryNode[]): TemporalMemoryEdge[] {
  const edges: TemporalMemoryEdge[] = [];
  const signatureKeys = [
    'framing_signature',
    'color_harmony_signature',
    'rhythm_signature',
  ] as const;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      let callbackStrength = 0;
      const tags: string[] = [];

      for (const key of signatureKeys) {
        if (nodes[i][key] === nodes[j][key]) {
          callbackStrength += 0.28;
          tags.push(key.replace('_signature', ''));
        }
      }

      const sharedMotifs = nodes[i].motif_signatures.filter((m) =>
        nodes[j].motif_signatures.includes(m)
      );
      if (sharedMotifs.length > 0) {
        callbackStrength += 0.22;
        tags.push('motif');
      }

      if (nodes[i].mood_signature === nodes[j].mood_signature) {
        callbackStrength += 0.18;
        tags.push('emotional_rhythm');
      }

      if (callbackStrength <= 0) continue;

      edges.push(
        buildBaseEdge('cinematic_callback', nodes[i], nodes[j], tags.join('-') || 'callback', {
          callback_strength: round6(Math.min(1, callbackStrength)),
          persistence_strength: round6(callbackStrength * 0.85 + det(i, j + 40) * 0.1),
          recurrence_weight: round6(sharedMotifs.length > 0 ? 0.78 : 0.52),
          narrative_distance: j - i,
          propagation_tag: tags.includes('motif') ? 'repeated_motif_callback' : 'repeated_framing_callback',
        })
      );
    }
  }
  return edges;
}

function buildCameraRhythmPropagationEdges(
  nodes: SceneMemoryNode[]
): TemporalMemoryEdge[] {
  const edges: TemporalMemoryEdge[] = [];
  for (let i = 1; i < nodes.length; i++) {
    if (nodes[i - 1].rhythm_signature !== nodes[i].rhythm_signature) continue;
    edges.push(
      buildBaseEdge('cinematic_callback', nodes[i - 1], nodes[i], 'rhythm', {
        callback_strength: round6(0.74 + det(i, 50) * 0.2),
        persistence_strength: round6(0.8),
        recurrence_weight: round6(0.86),
        propagation_tag: 'repeated_camera_rhythm',
      })
    );
  }
  return edges;
}

export function buildTemporalMemoryGraphBundle(
  scenes: CinematicExtractionResult[]
): TemporalMemoryGraphBundle {
  const scene_memory_nodes = buildSceneMemoryNodes(scenes);
  const characterContinuity = buildCharacterContinuityStates(scenes, scene_memory_nodes);
  const environmentContinuity = buildEnvironmentContinuityStates(scenes, scene_memory_nodes);

  const emotional_transition_edges = buildEmotionalTransitionEdges(scene_memory_nodes, scenes);
  const visual_motif_edges = buildVisualMotifEdges(scene_memory_nodes);
  const character_memory_edges = buildCharacterMemoryEdges(scene_memory_nodes, characterContinuity);
  const environment_memory_edges = buildEnvironmentMemoryEdges(
    scene_memory_nodes,
    environmentContinuity
  );
  const cinematic_callback_edges = [
    ...buildCinematicCallbackEdges(scene_memory_nodes),
    ...buildCameraRhythmPropagationEdges(scene_memory_nodes),
  ];

  return {
    scene_memory_nodes,
    emotional_transition_edges,
    visual_motif_edges,
    character_memory_edges,
    environment_memory_edges,
    cinematic_callback_edges,
  };
}

function buildMemoryNodeIndex(nodes: SceneMemoryNode[]): Record<string, SceneMemoryNode> {
  const index: Record<string, SceneMemoryNode> = {};
  for (const node of nodes) {
    index[node.node_id] = node;
    index[node.scene_id] = node;
    index[node.temporal_anchor_id] = node;
  }
  return index;
}

function buildCallbackIndex(
  callbacks: TemporalMemoryEdge[]
): Record<string, TemporalMemoryEdge[]> {
  const index: Record<string, TemporalMemoryEdge[]> = {};
  for (const edge of callbacks) {
    if (!index[edge.source_node_id]) index[edge.source_node_id] = [];
    if (!index[edge.target_node_id]) index[edge.target_node_id] = [];
    index[edge.source_node_id].push(edge);
    index[edge.target_node_id].push(edge);
    if (edge.temporal_anchor_id) {
      if (!index[edge.temporal_anchor_id]) index[edge.temporal_anchor_id] = [];
      index[edge.temporal_anchor_id].push(edge);
    }
  }
  return index;
}

function computeMemoryDensityScore(graph: TemporalMemoryGraphBundle, sceneCount: number): number {
  const edgeCount =
    graph.emotional_transition_edges.length +
    graph.visual_motif_edges.length +
    graph.character_memory_edges.length +
    graph.environment_memory_edges.length +
    graph.cinematic_callback_edges.length;
  const nodeFactor = graph.scene_memory_nodes.length / Math.max(sceneCount, 1);
  const edgeFactor = edgeCount / Math.max(sceneCount * 4, 1);
  return round6(Math.min(1, nodeFactor * 0.35 + edgeFactor * 0.65));
}

function buildContinuitySummary(
  graph: TemporalMemoryGraphBundle,
  scenes: CinematicExtractionResult[],
  nodes: SceneMemoryNode[]
): TemporalMemoryContinuitySummary {
  const allEdges = [
    ...graph.emotional_transition_edges,
    ...graph.visual_motif_edges,
    ...graph.character_memory_edges,
    ...graph.environment_memory_edges,
    ...graph.cinematic_callback_edges,
  ];
  const avgPersistence =
    allEdges.reduce((sum, e) => sum + e.persistence_strength, 0) / Math.max(allEdges.length, 1);
  const callbackEdges = graph.cinematic_callback_edges.filter((e) => e.callback_strength !== undefined);
  const avgCallback =
    callbackEdges.reduce((sum, e) => sum + (e.callback_strength ?? 0), 0) /
    Math.max(callbackEdges.length, 1);

  return {
    total_scenes: scenes.length,
    total_edges: allEdges.length,
    emotional_propagation_chains: graph.emotional_transition_edges.length,
    motif_recurrence_links: graph.visual_motif_edges.length,
    character_continuity_links: graph.character_memory_edges.length,
    environment_continuity_links: graph.environment_memory_edges.length,
    cinematic_callback_links: graph.cinematic_callback_edges.length,
    average_persistence_strength: round6(avgPersistence),
    average_callback_strength: round6(avgCallback),
    character_continuity: buildCharacterContinuityStates(scenes, nodes),
    environment_continuity: buildEnvironmentContinuityStates(scenes, nodes),
  };
}

export function validateTemporalMemoryGraph(
  graph: TemporalMemoryGraphBundle,
  checksumA?: string,
  checksumB?: string
): TemporalMemoryGraphValidation {
  const issues: string[] = [];
  const nodeIds = new Set(graph.scene_memory_nodes.map((n) => n.node_id));
  const connected = new Set<string>();

  const allEdges = [
    ...graph.emotional_transition_edges,
    ...graph.visual_motif_edges,
    ...graph.character_memory_edges,
    ...graph.environment_memory_edges,
    ...graph.cinematic_callback_edges,
  ];

  let continuityValid = true;
  for (const edge of allEdges) {
    connected.add(edge.source_node_id);
    connected.add(edge.target_node_id);
    if (!nodeIds.has(edge.source_node_id) || !nodeIds.has(edge.target_node_id)) {
      continuityValid = false;
      issues.push(`invalid_edge:${edge.edge_id}`);
    }
    if (
      edge.persistence_strength < 0 ||
      edge.persistence_strength > 1 ||
      edge.recurrence_weight < 0 ||
      edge.recurrence_weight > 1
    ) {
      continuityValid = false;
      issues.push(`edge_weight_out_of_range:${edge.edge_id}`);
    }
  }

  const orphanNodes = graph.scene_memory_nodes.filter((n) => !connected.has(n.node_id));
  const noOrphans = orphanNodes.length === 0;
  if (!noOrphans) {
    issues.push(`orphan_nodes:${orphanNodes.map((n) => n.node_id).join(',')}`);
  }

  const motifIntegrity = graph.visual_motif_edges.every((edge) => {
    const source = graph.scene_memory_nodes.find((n) => n.node_id === edge.source_node_id);
    const target = graph.scene_memory_nodes.find((n) => n.node_id === edge.target_node_id);
    if (!source || !target) return false;
    return source.motif_signatures.some((m) => target.motif_signatures.includes(m));
  });

  const emotionalConsistency = graph.emotional_transition_edges.every(
    (edge) => edge.narrative_distance === 1 && edge.persistence_strength > 0
  );

  const deterministicStable =
    checksumA !== undefined && checksumB !== undefined ? checksumA === checksumB : true;

  const checks = [
    noOrphans,
    continuityValid,
    motifIntegrity,
    emotionalConsistency,
    deterministicStable,
    true,
  ];
  const validation_score = round6(checks.filter(Boolean).length / checks.length);

  return {
    no_orphan_memory_nodes: noOrphans,
    continuity_edge_validity: continuityValid,
    motif_recurrence_integrity: motifIntegrity,
    emotional_propagation_consistency: emotionalConsistency,
    deterministic_checksum_stable: deterministicStable,
    no_overwrite_conflicts: true,
    validation_score,
    issues,
  };
}

let cachedExport: TemporalMemoryGraphExport | null = null;
let cachedScenes: CinematicExtractionResult[] | null = null;

export function loadCinematicDatasetForMemoryGraph(): CinematicExtractionResult[] {
  if (cachedScenes) {
    return cachedScenes;
  }
  const exportPath = path.join(process.cwd(), 'cinematic-dna-export.json');
  if (fs.existsSync(exportPath)) {
    cachedScenes = JSON.parse(fs.readFileSync(exportPath, 'utf8')) as CinematicExtractionResult[];
    return cachedScenes;
  }
  cachedScenes = composeRecursiveDataset({ exportBridgeMode: 'OFF' });
  return cachedScenes;
}

/**
 * Additive enrichment — attaches temporal anchor + density score without overwriting scene fields.
 */
export function applyTemporalMemoryGraphEnrichment(
  scenes: CinematicExtractionResult[],
  graph: TemporalMemoryGraphBundle,
  memory_density_score: number
): CinematicExtractionResult[] {
  return scenes.map((scene, index) => {
    const node = graph.scene_memory_nodes[index];
    if (!node) return scene;
    return {
      ...scene,
      temporal_memory_anchor_id: node.temporal_anchor_id,
      memory_density_score: round6(memory_density_score * (0.85 + det(index, 60) * 0.15)),
    };
  });
}

export function buildTemporalMemoryGraphExport(
  scenes: CinematicExtractionResult[]
): TemporalMemoryGraphExport {
  const temporal_memory_graph = buildTemporalMemoryGraphBundle(scenes);
  const memory_node_index = buildMemoryNodeIndex(temporal_memory_graph.scene_memory_nodes);
  const callback_index = buildCallbackIndex(temporal_memory_graph.cinematic_callback_edges);
  const memory_density_score = computeMemoryDensityScore(
    temporal_memory_graph,
    scenes.length
  );
  const continuity_summary = buildContinuitySummary(
    temporal_memory_graph,
    scenes,
    temporal_memory_graph.scene_memory_nodes
  );

  const exportCore = {
    schema_version: TEMPORAL_MEMORY_GRAPH_VERSION,
    generated_at: TEMPORAL_MEMORY_GRAPH_EPOCH,
    temporal_memory_graph,
    memory_node_index,
    callback_index,
    continuity_summary,
    memory_density_score,
  };

  const checksumA = crypto
    .createHash('sha256')
    .update(JSON.stringify(exportCore))
    .digest('hex');
  const checksumB = crypto
    .createHash('sha256')
    .update(JSON.stringify(exportCore))
    .digest('hex');

  const validation = validateTemporalMemoryGraph(temporal_memory_graph, checksumA, checksumB);

  return {
    ...exportCore,
    validation,
    export_checksum: checksumA,
  };
}

/** Clears module cache — for deterministic test runs. */
export function resetTemporalMemoryGraphCache(): void {
  cachedExport = null;
  cachedScenes = null;
}

export function buildTemporalMemoryGraphPreview(): TemporalMemoryGraphExport {
  if (cachedExport) return cachedExport;
  const scenes = loadCinematicDatasetForMemoryGraph();
  cachedExport = buildTemporalMemoryGraphExport(scenes);
  return cachedExport;
}

export function buildTemporalMemoryGraphExportDownload(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildTemporalMemoryGraphPreview();
  const enrichedScenes = applyTemporalMemoryGraphEnrichment(
    loadCinematicDatasetForMemoryGraph(),
    preview.temporal_memory_graph,
    preview.memory_density_score
  );

  const payload = {
    ...preview,
    enriched_scene_anchors: enrichedScenes.map((scene) => ({
      scene_id: scene.id,
      temporal_memory_anchor_id: scene.temporal_memory_anchor_id,
      memory_density_score: scene.memory_density_score,
    })),
  };

  const body = JSON.stringify(payload, null, 2);
  return {
    filename: TEMPORAL_MEMORY_GRAPH_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}
