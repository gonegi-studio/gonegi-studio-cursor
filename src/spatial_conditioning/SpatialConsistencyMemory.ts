import type { RuntimeSpatialGraph, SpatialConsistencyMemory } from './types.js';

export class SpatialConsistencyMemoryStore {
  private readonly movieId: string;
  private entries: SpatialConsistencyMemory['entries'] = [];

  constructor(movieId: string) {
    this.movieId = movieId;
  }

  recordGraph(graph: RuntimeSpatialGraph): SpatialConsistencyMemory {
    const entry = {
      scene_id: graph.scene_id,
      character_positions: Object.fromEntries(
        graph.character_nodes.map((node) => [node.character_id, node.position])
      ),
      prop_positions: Object.fromEntries(
        graph.prop_nodes.map((node) => [node.prop_id, node.position])
      ),
      environment_anchors: Object.fromEntries(
        graph.environment_nodes.map((node) => [node.anchor_id, node.position])
      ),
    };

    const existingIndex = this.entries.findIndex((item) => item.scene_id === graph.scene_id);
    if (existingIndex >= 0) {
      this.entries[existingIndex] = entry;
    } else {
      this.entries.push(entry);
    }

    return {
      movie_id: this.movieId,
      entries: [...this.entries],
      active: true,
    };
  }

  getMemory(): SpatialConsistencyMemory {
    return {
      movie_id: this.movieId,
      entries: [...this.entries],
      active: true,
    };
  }
}
