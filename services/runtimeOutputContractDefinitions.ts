import {
  COMPILED_SHOT_BINDING_FIELDS,
  COMPILED_TRANSITION_BINDING_FIELDS,
  RESOLVER_OUTPUT_FIELDS,
  RUNTIME_RESOLVER_CONTRACT_SCHEMA_VERSION,
  getRuntimeResolverMappings,
} from './runtimeResolverContractDefinitions.js';

export const RUNTIME_OUTPUT_CONTRACT_SCHEMA_VERSION =
  'RUNTIME-OUTPUT-CONTRACT-FINGERPRINT-v1' as const;

export const VIDEO_RUNTIME_CONSUMER_LAYER = 'video_runtime_consumer' as const;

export const CONSUMER_HANDOFF_TARGETS = [
  'image_app_v17_handoff',
  'video_app_v82_6_handoff',
] as const;

export const VIDEO_RUNTIME_CONSUMER_REQUIRED_FIELDS = [
  'shot_bindings',
  'transition_bindings',
  'continuity_glue',
  'consumer_handoff_ref',
] as const;

export interface RuntimeOutputMapping {
  output_mapping_id: string;
  resolver_mapping_id: string;
  consumer_layer: typeof VIDEO_RUNTIME_CONSUMER_LAYER;
  handoff_targets: readonly string[];
}

export interface RuntimeOutputContractFingerprint {
  schemaVersion: typeof RUNTIME_OUTPUT_CONTRACT_SCHEMA_VERSION;
  outputSchema: {
    topLevel: readonly string[];
    compiled_shot_binding: readonly string[];
    compiled_transition_binding: readonly string[];
    consumer_wrapper: readonly string[];
  };
  requiredFields: readonly string[];
  consumerCompatibility: {
    consumerLayer: typeof VIDEO_RUNTIME_CONSUMER_LAYER;
    handoffTargets: readonly string[];
    resolverFieldCoverage: Record<string, readonly string[]>;
  };
  outputDependencyGraph: Record<string, string[]>;
  outputMappingIds: string[];
  resolverMappingReferences: string[];
  resolverContractSchemaVersion: typeof RUNTIME_RESOLVER_CONTRACT_SCHEMA_VERSION;
  frozenAt: string;
}

const OUTPUT_DEPENDENCY_GRAPH: Record<string, string[]> = {
  runtime_output: ['runtime_resolver', 'video_runtime_consumer'],
  runtime_resolver: ['selection_rules', 'cross_links'],
  video_runtime_consumer: ['STAGE-8-consumer_integration'],
};

const RESOLVER_TO_CONSUMER_FIELD_COVERAGE: Record<string, readonly string[]> = {
  compiled_shot_binding: COMPILED_SHOT_BINDING_FIELDS,
  compiled_transition_binding: COMPILED_TRANSITION_BINDING_FIELDS,
  continuity_glue: ['continuity_glue'],
};

function buildOutputMappings(): RuntimeOutputMapping[] {
  return getRuntimeResolverMappings().map((mapping) => ({
    output_mapping_id: `OUT-${mapping.mapping_id.replace(/^RES-/, '')}`,
    resolver_mapping_id: mapping.mapping_id,
    consumer_layer: VIDEO_RUNTIME_CONSUMER_LAYER,
    handoff_targets: [...CONSUMER_HANDOFF_TARGETS],
  }));
}

export function getRuntimeOutputMappings(): RuntimeOutputMapping[] {
  return buildOutputMappings().map((mapping) => ({
    ...mapping,
    handoff_targets: [...mapping.handoff_targets],
  }));
}

export function getRuntimeOutputDependencyGraph(): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(OUTPUT_DEPENDENCY_GRAPH).map(([key, values]) => [key, [...values]])
  );
}

export function buildRuntimeOutputContractFingerprint(
  frozenAt: string
): RuntimeOutputContractFingerprint {
  const mappings = getRuntimeOutputMappings();

  return {
    schemaVersion: RUNTIME_OUTPUT_CONTRACT_SCHEMA_VERSION,
    outputSchema: {
      topLevel: [...RESOLVER_OUTPUT_FIELDS],
      compiled_shot_binding: [...COMPILED_SHOT_BINDING_FIELDS],
      compiled_transition_binding: [...COMPILED_TRANSITION_BINDING_FIELDS],
      consumer_wrapper: [...VIDEO_RUNTIME_CONSUMER_REQUIRED_FIELDS],
    },
    requiredFields: [...VIDEO_RUNTIME_CONSUMER_REQUIRED_FIELDS],
    consumerCompatibility: {
      consumerLayer: VIDEO_RUNTIME_CONSUMER_LAYER,
      handoffTargets: [...CONSUMER_HANDOFF_TARGETS],
      resolverFieldCoverage: { ...RESOLVER_TO_CONSUMER_FIELD_COVERAGE },
    },
    outputDependencyGraph: getRuntimeOutputDependencyGraph(),
    outputMappingIds: mappings.map((mapping) => mapping.output_mapping_id).sort(),
    resolverMappingReferences: mappings.map((mapping) => mapping.resolver_mapping_id).sort(),
    resolverContractSchemaVersion: RUNTIME_RESOLVER_CONTRACT_SCHEMA_VERSION,
    frozenAt,
  };
}

export function outputMappingKey(mapping: RuntimeOutputMapping): string {
  return `${mapping.output_mapping_id}::${mapping.resolver_mapping_id}`;
}
