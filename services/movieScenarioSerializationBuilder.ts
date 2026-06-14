import { MovieSpatialGraph } from './movieSpatialGraphBuilder.js';
import { MovieSpatialSceneRecord } from './movieSpatialEngineBuilder.js';
import {
  COPY_ONLY_MODE,
  GENERATION_CONTEXT_CHARACTER_REF,
  copyCanonicalCharacterFieldFromGraph,
} from './generationContextLoader.js';
import { generateHardenedScenarioFromSpatialGraph } from './movieScenarioHardening.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_SCENARIO_SERIALIZATION_PHASE = 'PHASE-GENERATION-CONTEXT-001' as const;
export const MOVIE_SCENARIO_SERIALIZATION_SYSTEM_ID = 'MOVIE_SCENARIO_SERIALIZATION_V1' as const;

export interface SerializedScenarioOutput {
  serialization_id: string;
  movie_id: string;
  scene_id: string;
  spatial_graph_id: string;
  scenario_field: string;
  character_field: string;
  character_source_ref: typeof GENERATION_CONTEXT_CHARACTER_REF;
  copy_only_mode: typeof COPY_ONLY_MODE;
}

export function buildSerializedScenarioFromSpatialGraph(
  graph: MovieSpatialGraph,
  spatialScene: MovieSpatialSceneRecord | null,
  projectRoot?: string
): SerializedScenarioOutput {
  const root = resolveProjectRoot(projectRoot);

  return {
    serialization_id: `${graph.movie_id}_serialized_${graph.scene_id}`,
    movie_id: graph.movie_id,
    scene_id: graph.scene_id,
    spatial_graph_id: graph.graph_id,
    scenario_field: generateHardenedScenarioFromSpatialGraph(graph, spatialScene),
    character_field: copyCanonicalCharacterFieldFromGraph(graph, root),
    character_source_ref: GENERATION_CONTEXT_CHARACTER_REF,
    copy_only_mode: COPY_ONLY_MODE,
  };
}
