import {
  getVideoDatasetSceneAssemblies,
  type CompiledShotBindingRef,
  type CompiledTransitionBindingRef,
  type VideoDatasetSceneAssembly,
} from './runtimeAssemblyDefinitions.js';

export const VIDEO_DATASET_BUILDER_SCHEMA_VERSION = 'VIDEO-DATASET-BUILDER-PREVIEW-v1' as const;

export const REQUIRED_SHOT_BINDING_FIELDS = [
  'shot_id',
  'framing',
  'lens_behavior',
  'camera_motion',
  'subject_distance',
  'cinematic_role',
] as const;

export const REQUIRED_TRANSITION_BINDING_FIELDS = [
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

export interface VideoDatasetContinuityGlue {
  glue: string;
  transition_id: string;
}

export interface VideoDatasetRecord {
  scene_id: string;
  shot_binding: CompiledShotBindingRef;
  transition_binding: CompiledTransitionBindingRef;
  continuity_glue: VideoDatasetContinuityGlue;
  runtime_source: string;
}

export interface VideoDatasetBuilderPreview {
  schema_version: typeof VIDEO_DATASET_BUILDER_SCHEMA_VERSION;
  record_count: number;
  records: VideoDatasetRecord[];
  generated_at: string;
}

function assemblyToSceneId(assemblyId: string): string {
  return `VDS-${assemblyId.replace(/^ASM-/, '')}`;
}

function buildContinuityGlueRef(
  assembly: VideoDatasetSceneAssembly
): VideoDatasetContinuityGlue {
  return {
    glue: assembly.continuity_glue,
    transition_id: assembly.transition_binding.transition_id,
  };
}

export function buildVideoDatasetRecord(
  assembly: VideoDatasetSceneAssembly
): VideoDatasetRecord {
  return {
    scene_id: assemblyToSceneId(assembly.scene_assembly_id),
    shot_binding: { ...assembly.shot_binding },
    transition_binding: { ...assembly.transition_binding },
    continuity_glue: buildContinuityGlueRef(assembly),
    runtime_source: assembly.scene_assembly_id,
  };
}

export function buildVideoDatasetRecords(): VideoDatasetRecord[] {
  return getVideoDatasetSceneAssemblies()
    .map((assembly) => buildVideoDatasetRecord(assembly))
    .sort((a, b) => a.scene_id.localeCompare(b.scene_id));
}

export function buildVideoDatasetBuilderPreview(generatedAt: string): VideoDatasetBuilderPreview {
  const records = buildVideoDatasetRecords();
  return {
    schema_version: VIDEO_DATASET_BUILDER_SCHEMA_VERSION,
    record_count: records.length,
    records,
    generated_at: generatedAt,
  };
}

export function getVideoDatasetRecordByRuntimeSource(
  runtimeSource: string
): VideoDatasetRecord | undefined {
  return buildVideoDatasetRecords().find((record) => record.runtime_source === runtimeSource);
}
