export type Vec3 = [number, number, number];

export type HorizontalRegion =
  | 'LEFT'
  | 'CENTER_LEFT'
  | 'CENTER'
  | 'CENTER_RIGHT'
  | 'RIGHT';

export type DepthLayerLabel = 'FOREGROUND' | 'MIDGROUND' | 'BACKGROUND';

export interface RuntimeSpatialGraph {
  graph_id: string;
  movie_id: string;
  scene_id: string;
  spatial_id: string;
  camera_nodes: Array<{
    node_id: string;
    position: Vec3;
    rotation: Vec3;
    camera_distance: number;
    camera_height: string;
    camera_target: Vec3;
    shot_type?: string;
  }>;
  character_nodes: Array<{
    node_id: string;
    character_id: string;
    position: Vec3;
    rotation: Vec3;
    depth_layer: string;
  }>;
  prop_nodes: Array<{
    node_id: string;
    prop_id: string;
    position: Vec3;
    depth_layer: string;
  }>;
  environment_nodes: Array<{
    node_id: string;
    anchor_id: string;
    position: Vec3;
    environment_type: string;
    scene_category: string;
  }>;
  gaze_edges: Array<{
    edge_id: string;
    source_node_id: string;
    target_node_id: string | null;
    origin: Vec3;
    direction: Vec3;
  }>;
  depth_edges: Array<{
    edge_id: string;
    source_node_id: string;
    depth_layer: string;
    depth_range: [number, number];
  }>;
}

export interface NormalizedLayoutElement {
  element_id: string;
  element_type: 'character' | 'environment' | 'prop' | 'camera';
  normalized_x: number;
  normalized_y: number;
  normalized_z: number;
  depth_layer: DepthLayerLabel;
  horizontal_region: HorizontalRegion;
}

export interface SpatialLayoutMap {
  scene_id: string;
  graph_id: string;
  layout_elements: NormalizedLayoutElement[];
  depth_layers: {
    foreground: string[];
    midground: string[];
    background: string[];
  };
  camera_frame: {
    position: Vec3;
    rotation: Vec3;
    distance: number;
  };
}

export interface CharacterRegionConstraint {
  character_id: string;
  horizontal_region: HorizontalRegion;
  screen_x: number;
  screen_y: number;
  depth_layer: DepthLayerLabel;
  region_lock: 'hard';
  position: Vec3;
}

export interface DepthConstraint {
  element_id: string;
  element_type: 'character' | 'environment' | 'prop';
  depth_layer: DepthLayerLabel;
  z_coordinate: number;
  generation_priority: number;
}

export interface EnvironmentAnchorConstraint {
  anchor_id: string;
  anchor_kind: string;
  position: Vec3;
  depth_layer: DepthLayerLabel;
  importance: number;
  environment_type: string;
  scene_category: string;
}

export interface PropAnchorConstraint {
  prop_id: string;
  position: Vec3;
  depth_layer: DepthLayerLabel;
  spatial_persistence_score: number;
}

export interface CameraConstraint {
  camera_position: Vec3;
  camera_rotation: Vec3;
  camera_distance: number;
  shot_type: string;
  camera_height: string;
  framing_lock: 'hard';
}

export interface GazeConstraint {
  source_character_id: string;
  target_character_id: string | null;
  origin: Vec3;
  direction: Vec3;
  eye_target_relationship: string;
  face_direction_lock: 'hard';
}

export interface SpatialConsistencyEntry {
  scene_id: string;
  character_positions: Record<string, Vec3>;
  prop_positions: Record<string, Vec3>;
  environment_anchors: Record<string, Vec3>;
}

export interface SpatialConsistencyMemory {
  movie_id: string;
  entries: SpatialConsistencyEntry[];
  active: true;
}

export interface SpatialConditioningBundle {
  phase: 'PHASE-SPATIAL-CONDITIONING-001';
  system_id: 'SPATIAL_GRAPH_CONDITIONING_V1';
  scene_id: string;
  graph_id: string;
  layout_map: SpatialLayoutMap;
  character_regions: CharacterRegionConstraint[];
  depth_constraints: DepthConstraint[];
  environment_constraints: EnvironmentAnchorConstraint[];
  prop_constraints: PropAnchorConstraint[];
  camera_constraint: CameraConstraint;
  gaze_constraints: GazeConstraint[];
  consistency_memory: SpatialConsistencyMemory;
  generation_constraints: string[];
}
