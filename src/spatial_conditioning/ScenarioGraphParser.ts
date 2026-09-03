import type { RuntimeSpatialGraph, Vec3 } from './types.js';
import { parseVec3 } from './CharacterRegionConstraints.js';

function parseBlockingCharacters(scenario: string): Array<{
  character_id: string;
  position: Vec3;
  rotation: Vec3;
  depth_layer: string;
}> {
  const blockingSection = scenario.match(/\[BLOCKING\]\s+characters:(.*?)\| interactions:/)?.[1] ?? '';
  const entries = [...blockingSection.matchAll(/(CHAR-[a-z]+)\s+depth=([a-z_]+)\s+position=(\[[^\]]+\])\s+rotation=(\[[^\]]+\])/g)];

  return entries.map((match) => ({
    character_id: match[1],
    depth_layer: match[2],
    position: parseVec3(match[3]),
    rotation: parseVec3(match[4]),
  }));
}

function parseGazeEdges(
  scenario: string,
  characters: Array<{ character_id: string; position: Vec3 }>
): RuntimeSpatialGraph['gaze_edges'] {
  const gazeSection = scenario.match(/\[GAZE\]\s+(.*?)\s+\[FOREGROUND\]/)?.[1] ?? '';
  const entries = [
    ...gazeSection.matchAll(
      /(CHAR-[a-z]+)->(CHAR-[a-z]+)\s+origin=(\[[^\]]+\])\s+direction=(\[[^\]]+\])/g
    ),
  ];

  return entries.map((match, index) => ({
    edge_id: `gaze_${index + 1}`,
    source_node_id: match[1],
    target_node_id: match[2],
    origin: parseVec3(match[3]),
    direction: parseVec3(match[4]),
  }));
}

function parseEnvironment(scenario: string): RuntimeSpatialGraph['environment_nodes'] {
  const section =
    scenario.match(
      /\[ENVIRONMENT_ANCHOR\]\s+anchor_id=([^\s]+)\s+environment_type=([^\s]+)\s+scene_category=([^\s]+)\s+position=(\[[^\]]+\])/
    ) ?? [];
  if (!section[1]) return [];

  return [
    {
      node_id: 'env_1',
      anchor_id: section[1],
      environment_type: section[2],
      scene_category: section[3],
      position: parseVec3(section[4]),
    },
  ];
}

function parseProps(scenario: string): RuntimeSpatialGraph['prop_nodes'] {
  const section =
    scenario.match(
      /\[PROP_ANCHOR\]\s+([^\s]+)\s+depth=([^\s]+)\s+position=(\[[^\]]+\])/
    ) ?? [];
  if (!section[1]) return [];

  return [
    {
      node_id: 'prop_1',
      prop_id: section[1],
      depth_layer: section[2],
      position: parseVec3(section[3]),
    },
  ];
}

function parseCamera(scenario: string): RuntimeSpatialGraph['camera_nodes'] {
  const distance = Number(scenario.match(/\[CAMERA_DISTANCE\]\s+([0-9.]+)/)?.[1] ?? 3);
  const height = scenario.match(/\[CAMERA_HEIGHT\]\s+([^\s\[]+)/)?.[1] ?? 'eye_level';
  const shotType = scenario.match(/\[SHOT_TYPE\]\s+([^\s\[]+)/)?.[1] ?? 'medium_shot';

  return [
    {
      node_id: 'camera_1',
      position: [0.5, 0.5, 3.5],
      rotation: [0, 0, 0],
      camera_distance: distance,
      camera_height: height,
      camera_target: [0.5, 0.485, 1.64],
      shot_type: shotType,
    },
  ];
}

export function runtimeSpatialGraphFromScenario(scenario: string): RuntimeSpatialGraph {
  const sceneId = scenario.match(/scene_id=([^\s]+)/)?.[1] ?? 'unknown_scene';
  const movieId = scenario.match(/movie_id=([^\s]+)/)?.[1] ?? 'unknown_movie';
  const graphId = scenario.match(/graph_id=([^\s]+)/)?.[1] ?? `graph_${sceneId}`;
  const spatialId = scenario.match(/spatial_id=([^\s]+)/)?.[1] ?? `spatial_${sceneId}`;
  const characters = parseBlockingCharacters(scenario);

  return {
    graph_id: graphId,
    movie_id: movieId,
    scene_id: sceneId,
    spatial_id: spatialId,
    camera_nodes: parseCamera(scenario),
    character_nodes: characters.map((entry, index) => ({
      node_id: `char_${index + 1}`,
      character_id: entry.character_id,
      position: entry.position,
      rotation: entry.rotation,
      depth_layer: entry.depth_layer,
    })),
    prop_nodes: parseProps(scenario),
    environment_nodes: parseEnvironment(scenario),
    gaze_edges: parseGazeEdges(scenario, characters),
    depth_edges: [],
  };
}
