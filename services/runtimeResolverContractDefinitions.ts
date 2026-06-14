import { RUNTIME_LIBRARY_CROSS_LINK_SCHEMA_VERSION } from './runtimeLibraryCrossLinkDefinitions.js';
import {
  RUNTIME_SELECTION_RULE_SCHEMA_VERSION,
  getRuntimeSelectionRules,
} from './runtimeSelectionRuleDefinitions.js';

export const RUNTIME_RESOLVER_CONTRACT_SCHEMA_VERSION =
  'RUNTIME-RESOLVER-CONTRACT-FINGERPRINT-v1' as const;

export const RESOLVER_INPUT_FIELDS = [
  'shot_id',
  'transition_id',
  'rule_id',
] as const;

export const RESOLVER_OUTPUT_FIELDS = [
  'compiled_shot_binding',
  'compiled_transition_binding',
  'continuity_glue',
] as const;

export const COMPILED_SHOT_BINDING_FIELDS = [
  'shot_id',
  'framing',
  'lens_behavior',
  'camera_motion',
  'subject_distance',
  'cinematic_role',
] as const;

export const COMPILED_TRANSITION_BINDING_FIELDS = [
  'transition_id',
  'from_state',
  'to_state',
  'emotional_bridge',
  'motion_bridge',
  'camera_shift',
  'lighting_shift',
  'pacing_shift',
  'continuity_glue',
] as const;

export interface RuntimeResolverMapping {
  mapping_id: string;
  rule_id: string;
  cross_link_key: string;
}

export interface RuntimeResolverContractFingerprint {
  schemaVersion: typeof RUNTIME_RESOLVER_CONTRACT_SCHEMA_VERSION;
  resolverInputs: readonly string[];
  resolverOutputs: {
    topLevel: readonly string[];
    compiled_shot_binding: readonly string[];
    compiled_transition_binding: readonly string[];
  };
  selectionRuleReferences: string[];
  crossLinkReferences: string[];
  dependencyGraph: Record<string, string[]>;
  mappingIds: string[];
  selectionRuleSchemaVersion: typeof RUNTIME_SELECTION_RULE_SCHEMA_VERSION;
  crossLinkSchemaVersion: typeof RUNTIME_LIBRARY_CROSS_LINK_SCHEMA_VERSION;
  frozenAt: string;
}

const DEPENDENCY_GRAPH: Record<string, string[]> = {
  runtime_resolver: [
    'selection_rules',
    'cross_links',
    'shot_fingerprint_library',
    'transition_dna_library',
  ],
  selection_rules: ['cross_links'],
  cross_links: ['shot_fingerprint_library', 'transition_dna_library'],
  shot_fingerprint_library: [],
  transition_dna_library: [],
};

function buildResolverMappings(): RuntimeResolverMapping[] {
  return getRuntimeSelectionRules().map((rule) => ({
    mapping_id: `RES-${rule.rule_id.replace(/^SEL-/, '')}`,
    rule_id: rule.rule_id,
    cross_link_key: `${rule.shot_id}::${rule.transition_id}`,
  }));
}

export function getRuntimeResolverMappings(): RuntimeResolverMapping[] {
  return buildResolverMappings().map((mapping) => ({ ...mapping }));
}

export function getRuntimeResolverDependencyGraph(): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(DEPENDENCY_GRAPH).map(([key, values]) => [key, [...values]])
  );
}

export function buildRuntimeResolverContractFingerprint(
  frozenAt: string
): RuntimeResolverContractFingerprint {
  const mappings = getRuntimeResolverMappings();

  return {
    schemaVersion: RUNTIME_RESOLVER_CONTRACT_SCHEMA_VERSION,
    resolverInputs: [...RESOLVER_INPUT_FIELDS],
    resolverOutputs: {
      topLevel: [...RESOLVER_OUTPUT_FIELDS],
      compiled_shot_binding: [...COMPILED_SHOT_BINDING_FIELDS],
      compiled_transition_binding: [...COMPILED_TRANSITION_BINDING_FIELDS],
    },
    selectionRuleReferences: mappings.map((mapping) => mapping.rule_id).sort(),
    crossLinkReferences: mappings.map((mapping) => mapping.cross_link_key).sort(),
    dependencyGraph: getRuntimeResolverDependencyGraph(),
    mappingIds: mappings.map((mapping) => mapping.mapping_id).sort(),
    selectionRuleSchemaVersion: RUNTIME_SELECTION_RULE_SCHEMA_VERSION,
    crossLinkSchemaVersion: RUNTIME_LIBRARY_CROSS_LINK_SCHEMA_VERSION,
    frozenAt,
  };
}

export function resolverMappingKey(mapping: RuntimeResolverMapping): string {
  return `${mapping.mapping_id}::${mapping.rule_id}::${mapping.cross_link_key}`;
}
