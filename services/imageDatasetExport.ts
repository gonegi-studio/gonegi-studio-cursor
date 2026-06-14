import {
  getVideoDatasetSceneAssemblies,
  type CompiledShotBindingRef,
  type CompiledTransitionBindingRef,
  type VideoDatasetSceneAssembly,
} from './runtimeAssemblyDefinitions.js';
import { VIDEO_DATASET_EXPORT_JSON_PATH } from './videoDatasetExport.js';

export const IMAGE_DATASET_EXPORT_SCHEMA_VERSION = 'IMAGE-DATASET-EXPORT-PHASE-66-v1' as const;
export const IMAGE_DATASET_EXPORT_JSON_PATH = 'exports/image-dataset-export.json' as const;

export interface ImageDatasetExportMetadata {
  schema_version: typeof IMAGE_DATASET_EXPORT_SCHEMA_VERSION;
  export_type: 'image_dataset';
  active_export: 'image_dataset';
  source_layer: 'image_dataset_layer';
  video_dataset_export_separate: true;
  video_dataset_export_path: typeof VIDEO_DATASET_EXPORT_JSON_PATH;
  export_json_path: typeof IMAGE_DATASET_EXPORT_JSON_PATH;
  phase: 'PHASE-66';
  generated_at: string;
  scene_count: number;
}

export interface ImageDatasetIndexEntry {
  index: number;
  scene_id: string;
  runtime_source: string;
  shot_id: string;
  transition_id: string;
}

export interface ImageDatasetContinuityGlue {
  glue: string;
  transition_id: string;
}

export interface ImageDatasetRecord {
  scene_id: string;
  shot_binding: CompiledShotBindingRef;
  transition_binding: CompiledTransitionBindingRef;
  continuity_glue: ImageDatasetContinuityGlue;
  runtime_source: string;
}

export interface ImageDatasetExport {
  export_metadata: ImageDatasetExportMetadata;
  dataset_index: ImageDatasetIndexEntry[];
  scene_records: ImageDatasetRecord[];
}

function assemblyToSceneId(assemblyId: string): string {
  return `IDS-${assemblyId.replace(/^ASM-/, '')}`;
}

function assemblyToRuntimeSource(assemblyId: string): string {
  return `IMS-${assemblyId.replace(/^ASM-/, '')}`;
}

function buildImageDatasetRecord(assembly: VideoDatasetSceneAssembly): ImageDatasetRecord {
  return {
    scene_id: assemblyToSceneId(assembly.scene_assembly_id),
    runtime_source: assemblyToRuntimeSource(assembly.scene_assembly_id),
    shot_binding: { ...assembly.shot_binding },
    transition_binding: { ...assembly.transition_binding },
    continuity_glue: {
      glue: assembly.continuity_glue,
      transition_id: assembly.transition_binding.transition_id,
    },
  };
}

function buildDatasetIndex(records: ImageDatasetRecord[]): ImageDatasetIndexEntry[] {
  return records.map((record, index) => ({
    index,
    scene_id: record.scene_id,
    runtime_source: record.runtime_source,
    shot_id: record.shot_binding.shot_id,
    transition_id: record.transition_binding.transition_id,
  }));
}

export function buildImageDatasetRecords(): ImageDatasetRecord[] {
  return getVideoDatasetSceneAssemblies()
    .map((assembly) => buildImageDatasetRecord(assembly))
    .sort((left, right) => left.scene_id.localeCompare(right.scene_id));
}

export function buildImageDatasetExport(generatedAt: string): ImageDatasetExport {
  const scene_records = buildImageDatasetRecords();

  return {
    export_metadata: {
      schema_version: IMAGE_DATASET_EXPORT_SCHEMA_VERSION,
      export_type: 'image_dataset',
      active_export: 'image_dataset',
      source_layer: 'image_dataset_layer',
      video_dataset_export_separate: true,
      video_dataset_export_path: VIDEO_DATASET_EXPORT_JSON_PATH,
      export_json_path: IMAGE_DATASET_EXPORT_JSON_PATH,
      phase: 'PHASE-66',
      generated_at: generatedAt,
      scene_count: scene_records.length,
    },
    dataset_index: buildDatasetIndex(scene_records),
    scene_records: scene_records.map((record) => ({
      ...record,
      shot_binding: { ...record.shot_binding },
      transition_binding: { ...record.transition_binding },
      continuity_glue: { ...record.continuity_glue },
    })),
  };
}
