import {
  VIDEO_DATASET_BUILDER_SCHEMA_VERSION,
  buildVideoDatasetRecords,
  type VideoDatasetRecord,
} from './videoDatasetBuilder.js';

export const VIDEO_DATASET_EXPORT_SCHEMA_VERSION = 'VIDEO-DATASET-EXPORT-PHASE-61-v1' as const;
export const VIDEO_DATASET_EXPORT_JSON_PATH = 'exports/video-dataset-export.json' as const;
export const IMAGE_DATASET_EXPORT_JSON_PATH = 'exports/image-dataset-export.json' as const;

export interface VideoDatasetExportMetadata {
  schema_version: typeof VIDEO_DATASET_EXPORT_SCHEMA_VERSION;
  export_type: 'video_dataset';
  active_export: 'video_dataset';
  source_layer: 'video_dataset_layer';
  image_dataset_export_separate: true;
  image_dataset_export_path: typeof IMAGE_DATASET_EXPORT_JSON_PATH;
  export_json_path: typeof VIDEO_DATASET_EXPORT_JSON_PATH;
  builder_schema_version: typeof VIDEO_DATASET_BUILDER_SCHEMA_VERSION;
  phase: 'PHASE-61';
  generated_at: string;
  scene_count: number;
}

export interface VideoDatasetIndexEntry {
  index: number;
  scene_id: string;
  runtime_source: string;
  shot_id: string;
  transition_id: string;
}

export interface VideoDatasetExport {
  export_metadata: VideoDatasetExportMetadata;
  dataset_index: VideoDatasetIndexEntry[];
  scene_records: VideoDatasetRecord[];
}

function buildDatasetIndex(records: VideoDatasetRecord[]): VideoDatasetIndexEntry[] {
  return records.map((record, index) => ({
    index,
    scene_id: record.scene_id,
    runtime_source: record.runtime_source,
    shot_id: record.shot_binding.shot_id,
    transition_id: record.transition_binding.transition_id,
  }));
}

export function buildVideoDatasetExport(generatedAt: string): VideoDatasetExport {
  const scene_records = buildVideoDatasetRecords();

  return {
    export_metadata: {
      schema_version: VIDEO_DATASET_EXPORT_SCHEMA_VERSION,
      export_type: 'video_dataset',
      active_export: 'video_dataset',
      source_layer: 'video_dataset_layer',
      image_dataset_export_separate: true,
      image_dataset_export_path: IMAGE_DATASET_EXPORT_JSON_PATH,
      export_json_path: VIDEO_DATASET_EXPORT_JSON_PATH,
      builder_schema_version: VIDEO_DATASET_BUILDER_SCHEMA_VERSION,
      phase: 'PHASE-61',
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

export function getVideoDatasetExportSceneIds(exportData: VideoDatasetExport): string[] {
  return exportData.scene_records.map((record) => record.scene_id).sort();
}
