import { getShotFingerprintLibrary } from './shotFingerprintContractDefinitions.js';
import { getTransitionDnaLibrary } from './transitionDnaContractDefinitions.js';
import {
  RUNTIME_OUTPUT_CONTRACT_SCHEMA_VERSION,
  getRuntimeOutputMappings,
} from './runtimeOutputContractDefinitions.js';
import {
  getRuntimeResolverMappings,
  type RuntimeResolverMapping,
} from './runtimeResolverContractDefinitions.js';
import { getRuntimeSelectionRules } from './runtimeSelectionRuleDefinitions.js';

export const RUNTIME_ASSEMBLY_SCHEMA_VERSION = 'RUNTIME-ASSEMBLY-FINGERPRINT-v1' as const;

export interface CompiledShotBindingRef {
  shot_id: string;
  framing: string;
  lens_behavior: string;
  camera_motion: string;
  subject_distance: string;
  cinematic_role: string;
}

export interface CompiledTransitionBindingRef {
  transition_id: string;
  from_state: string;
  to_state: string;
  emotional_bridge: string;
  motion_bridge: string;
  camera_shift: string;
  lighting_shift: string;
  pacing_shift: string;
  continuity_glue: string;
}

export interface VideoDatasetSceneAssembly {
  scene_assembly_id: string;
  resolver_mapping_id: string;
  output_mapping_id: string;
  rule_id: string;
  shot_binding: CompiledShotBindingRef;
  transition_binding: CompiledTransitionBindingRef;
  continuity_glue: string;
}

export interface RuntimeAssemblyFingerprint {
  schemaVersion: typeof RUNTIME_ASSEMBLY_SCHEMA_VERSION;
  sceneAssemblyIds: string[];
  resolverReferences: Record<string, string>;
  shotBindings: Record<string, string>;
  transitionBindings: Record<string, string>;
  continuityGlue: Record<string, string>;
  outputContractSchemaVersion: typeof RUNTIME_OUTPUT_CONTRACT_SCHEMA_VERSION;
  frozenAt: string;
}

function buildContinuityGlue(transition: Record<string, string | string[]>): string {
  const keywords = Array.isArray(transition.continuity_keywords)
    ? [...transition.continuity_keywords].sort().join(', ')
    : String(transition.continuity_keywords ?? '');

  return [
    transition.emotional_bridge,
    transition.motion_bridge,
    transition.camera_shift,
    transition.lighting_shift,
    transition.pacing_shift,
    keywords,
  ]
    .filter((value) => typeof value === 'string' && value.length > 0)
    .join(', ');
}

function toShotBinding(fields: Record<string, string | string[]>): CompiledShotBindingRef {
  return {
    shot_id: String(fields.shot_id),
    framing: String(fields.framing),
    lens_behavior: String(fields.lens_behavior),
    camera_motion: String(fields.camera_motion),
    subject_distance: String(fields.subject_distance),
    cinematic_role: String(fields.cinematic_role),
  };
}

function toTransitionBinding(
  fields: Record<string, string | string[]>
): CompiledTransitionBindingRef {
  const continuity_glue = buildContinuityGlue(fields);
  return {
    transition_id: String(fields.transition_id),
    from_state: String(fields.from_state),
    to_state: String(fields.to_state),
    emotional_bridge: String(fields.emotional_bridge),
    motion_bridge: String(fields.motion_bridge),
    camera_shift: String(fields.camera_shift),
    lighting_shift: String(fields.lighting_shift),
    pacing_shift: String(fields.pacing_shift),
    continuity_glue,
  };
}

function resolverToAssemblyId(mapping: RuntimeResolverMapping): string {
  return `ASM-${mapping.mapping_id.replace(/^RES-/, '')}`;
}

function buildSceneAssemblies(): VideoDatasetSceneAssembly[] {
  const resolverMappings = getRuntimeResolverMappings();
  const outputMappings = getRuntimeOutputMappings();
  const shots = new Map(
    getShotFingerprintLibrary().map((entry) => [entry.fingerprint_id, entry.fields])
  );
  const transitions = new Map(
    getTransitionDnaLibrary().map((entry) => [entry.transition_id, entry.fields])
  );
  const outputByResolver = new Map(
    outputMappings.map((mapping) => [mapping.resolver_mapping_id, mapping.output_mapping_id])
  );

  return resolverMappings.map((mapping) => {
    const [shotId, transitionId] = mapping.cross_link_key.split('::');
    const shotFields = shots.get(shotId);
    const transitionFields = transitions.get(transitionId);
    if (!shotFields || !transitionFields) {
      throw new Error(`Missing library entry for assembly ${mapping.mapping_id}`);
    }

    const rule = getRuntimeSelectionRules().find(
      (entry) => entry.shot_id === shotId && entry.transition_id === transitionId
    );
    if (!rule) {
      throw new Error(`Missing selection rule for resolver mapping ${mapping.mapping_id}`);
    }

    const transition_binding = toTransitionBinding(transitionFields);

    return {
      scene_assembly_id: resolverToAssemblyId(mapping),
      resolver_mapping_id: mapping.mapping_id,
      output_mapping_id: outputByResolver.get(mapping.mapping_id) ?? '',
      rule_id: rule.rule_id,
      shot_binding: toShotBinding(shotFields),
      transition_binding,
      continuity_glue: transition_binding.continuity_glue,
    };
  });
}

export function getVideoDatasetSceneAssemblies(): VideoDatasetSceneAssembly[] {
  return buildSceneAssemblies().map((assembly) => ({
    ...assembly,
    shot_binding: { ...assembly.shot_binding },
    transition_binding: { ...assembly.transition_binding },
  }));
}

export function buildRuntimeAssemblyFingerprint(frozenAt: string): RuntimeAssemblyFingerprint {
  const assemblies = getVideoDatasetSceneAssemblies();
  const resolverReferences: Record<string, string> = {};
  const shotBindings: Record<string, string> = {};
  const transitionBindings: Record<string, string> = {};
  const continuityGlue: Record<string, string> = {};

  for (const assembly of assemblies) {
    resolverReferences[assembly.scene_assembly_id] = assembly.resolver_mapping_id;
    shotBindings[assembly.scene_assembly_id] = assembly.shot_binding.shot_id;
    transitionBindings[assembly.scene_assembly_id] = assembly.transition_binding.transition_id;
    continuityGlue[assembly.scene_assembly_id] = assembly.continuity_glue;
  }

  return {
    schemaVersion: RUNTIME_ASSEMBLY_SCHEMA_VERSION,
    sceneAssemblyIds: assemblies.map((assembly) => assembly.scene_assembly_id).sort(),
    resolverReferences,
    shotBindings,
    transitionBindings,
    continuityGlue,
    outputContractSchemaVersion: RUNTIME_OUTPUT_CONTRACT_SCHEMA_VERSION,
    frozenAt,
  };
}

export function sceneAssemblyKey(assembly: VideoDatasetSceneAssembly): string {
  return `${assembly.scene_assembly_id}::${assembly.resolver_mapping_id}::${assembly.output_mapping_id}`;
}

export function getSceneAssemblyByResolverMappingId(
  resolverMappingId: string
): VideoDatasetSceneAssembly | undefined {
  return getVideoDatasetSceneAssemblies().find(
    (assembly) => assembly.resolver_mapping_id === resolverMappingId
  );
}
