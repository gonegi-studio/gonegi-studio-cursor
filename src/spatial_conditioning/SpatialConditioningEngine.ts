import type { RuntimeSpatialGraph, SpatialConditioningBundle } from './types.js';
import {
  buildConditionedGenerationPrompt,
  buildSpatialConditioningBundle,
} from './ConditionedPromptBuilder.js';
import { SpatialConsistencyMemoryStore } from './SpatialConsistencyMemory.js';

export class SpatialConditioningEngine {
  private readonly memoryStore: SpatialConsistencyMemoryStore;

  constructor(movieId: string) {
    this.memoryStore = new SpatialConsistencyMemoryStore(movieId);
  }

  conditionGraph(graph: RuntimeSpatialGraph): SpatialConditioningBundle {
    return buildSpatialConditioningBundle(graph, this.memoryStore);
  }

  buildPrompt(graph: RuntimeSpatialGraph, legacyScenario?: string): string {
    const bundle = this.conditionGraph(graph);
    return buildConditionedGenerationPrompt(bundle, legacyScenario);
  }

  getMemoryStore(): SpatialConsistencyMemoryStore {
    return this.memoryStore;
  }
}

export {
  buildSpatialConditioningBundle,
  buildConditionedGenerationPrompt,
} from './ConditionedPromptBuilder.js';
export { runtimeSpatialGraphFromScenario } from './ScenarioGraphParser.js';
export type { RuntimeSpatialGraph, SpatialConditioningBundle } from './types.js';
