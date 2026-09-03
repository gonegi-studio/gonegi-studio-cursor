import type { SpatialConditioningBundle } from './types.js';
import {
  buildCharacterRegionConstraints,
  formatCharacterRegionConstraints,
} from './CharacterRegionConstraints.js';
import { buildDepthConstraints, formatDepthConstraints } from './DepthConditioning.js';
import {
  buildEnvironmentAnchorConstraints,
  formatEnvironmentConstraints,
} from './EnvironmentAnchorConditioning.js';
import { buildPropAnchorConstraints, formatPropConstraints } from './PropAnchorConditioning.js';
import { buildCameraConstraint, formatCameraConstraint } from './CameraConditioning.js';
import { buildGazeConstraints, formatGazeConstraints } from './GazeConditioning.js';
import { buildSpatialLayoutMap } from './SpatialLayoutMap.js';
import { SpatialConsistencyMemoryStore } from './SpatialConsistencyMemory.js';
import type { RuntimeSpatialGraph } from './types.js';

export function buildSpatialConditioningBundle(
  graph: RuntimeSpatialGraph,
  memoryStore?: SpatialConsistencyMemoryStore
): SpatialConditioningBundle {
  const layout_map = buildSpatialLayoutMap(graph);
  const character_regions = buildCharacterRegionConstraints(graph);
  const depth_constraints = buildDepthConstraints(graph);
  const environment_constraints = buildEnvironmentAnchorConstraints(graph);
  const prop_constraints = buildPropAnchorConstraints(graph);
  const camera_constraint = buildCameraConstraint(graph);
  const gaze_constraints = buildGazeConstraints(graph);
  const store = memoryStore ?? new SpatialConsistencyMemoryStore(graph.movie_id);
  const consistency_memory = store.recordGraph(graph);

  const generation_constraints = [
    '[SPATIAL_CONDITIONING] active=true source=RuntimeSpatialGraph',
    `[LAYOUT_MAP] scene_id=${graph.scene_id} elements=${layout_map.layout_elements.length}`,
    `[CHARACTER_REGION] ${formatCharacterRegionConstraints(character_regions).join('; ')}`,
    `[DEPTH_CONDITIONING] ${formatDepthConstraints(depth_constraints).join('; ')}`,
    `[ENVIRONMENT_CONDITIONING] ${formatEnvironmentConstraints(environment_constraints).join('; ')}`,
    `[PROP_CONDITIONING] ${formatPropConstraints(prop_constraints).join('; ')}`,
    `[CAMERA_CONDITIONING] ${formatCameraConstraint(camera_constraint)}`,
    `[GAZE_CONDITIONING] ${formatGazeConstraints(gaze_constraints).join('; ')}`,
    `[SPATIAL_CONSISTENCY_MEMORY] movie_id=${consistency_memory.movie_id} entries=${consistency_memory.entries.length} active=${consistency_memory.active}`,
  ];

  return {
    phase: 'PHASE-SPATIAL-CONDITIONING-001',
    system_id: 'SPATIAL_GRAPH_CONDITIONING_V1',
    scene_id: graph.scene_id,
    graph_id: graph.graph_id,
    layout_map,
    character_regions,
    depth_constraints,
    environment_constraints,
    prop_constraints,
    camera_constraint,
    gaze_constraints,
    consistency_memory,
    generation_constraints,
  };
}

export function buildConditionedGenerationPrompt(
  bundle: SpatialConditioningBundle,
  legacyScenario?: string
): string {
  const reconstructionHeader = legacyScenario
    ? legacyScenario.split('[CAMERA_LANGUAGE]')[0]?.trim()
    : `[SCENE_RECONSTRUCTION] scene_id=${bundle.scene_id} graph_id=${bundle.graph_id}`;

  return [
    reconstructionHeader,
    ...bundle.generation_constraints,
    '[GENERATION_CONSTRAINT_PRIORITY] character_region>gaze_origin>depth_layer>camera_framing>environment_anchor>prop_persistence',
    '[RECONSTRUCTION_OBJECTIVE] movie_reconstruction_accuracy_primary=true text_prompt_secondary=true',
  ].join(' ');
}
