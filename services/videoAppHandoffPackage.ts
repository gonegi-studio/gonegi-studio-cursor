import fs from 'node:fs';
import path from 'node:path';
import {
  IMAGE_DATASET_EXPORT_JSON_PATH,
  VIDEO_DATASET_EXPORT_JSON_PATH,
  type VideoDatasetExport,
  type VideoDatasetExportMetadata,
} from './videoDatasetExport.js';
import { loadVideoDatasetExport } from './videoDatasetExportAudit.js';
import {
  loadVideoDatasetQualityReport,
  type VideoDatasetQualityReport,
} from './videoDatasetQualityAudit.js';

export const VIDEO_APP_HANDOFF_PACKAGE_SCHEMA_VERSION =
  'VIDEO-APP-HANDOFF-PACKAGE-PHASE-63-v1' as const;
export const VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH =
  'exports/video-app-handoff-package.json' as const;
export const VIDEO_DATASET_QUALITY_REPORT_JSON_PATH =
  'exports/video-dataset-quality-report.json' as const;
export const VIDEO_APP_HANDOFF_CONSUMER_TARGET = 'video_app_v82_6_handoff' as const;

export const REQUIRED_HANDOFF_MANIFEST_ASSET_IDS = [
  'video-dataset-export',
  'video-dataset-quality-report',
] as const;

export const FORBIDDEN_HANDOFF_ASSET_PATHS = [
  'exports/image-dataset-export.json',
  'exports/image-app-handoff-package.json',
] as const;

export interface VideoAppHandoffMetadata {
  schema_version: typeof VIDEO_APP_HANDOFF_PACKAGE_SCHEMA_VERSION;
  handoff_type: 'video_app';
  consumer_target: typeof VIDEO_APP_HANDOFF_CONSUMER_TARGET;
  source_layer: 'video_dataset_handoff_layer';
  image_app_handoff_included: false;
  image_dataset_export_separate: true;
  image_dataset_export_path: typeof IMAGE_DATASET_EXPORT_JSON_PATH;
  phase: 'PHASE-63';
  generated_at: string;
  package_json_path: typeof VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH;
  scene_count: number;
}

export interface VideoAppHandoffExportReference {
  asset_id: 'video-dataset-export';
  path: typeof VIDEO_DATASET_EXPORT_JSON_PATH;
  export_metadata: VideoDatasetExportMetadata;
}

export interface VideoAppHandoffQualityReference {
  asset_id: 'video-dataset-quality-report';
  path: typeof VIDEO_DATASET_QUALITY_REPORT_JSON_PATH;
  auditResult: VideoDatasetQualityReport['auditResult'];
  auditTimestamp: string;
  quality_score: number;
  total_scene_count: number;
}

export interface VideoAppHandoffManifestAsset {
  asset_id: string;
  path: string;
  role: 'video_dataset_export' | 'quality_report';
  required: true;
}

export interface VideoAppHandoffManifest {
  manifest_id: 'video-app-handoff-manifest-v1';
  assets: VideoAppHandoffManifestAsset[];
}

export interface VideoAppHandoffPackage {
  handoff_metadata: VideoAppHandoffMetadata;
  export_reference: VideoAppHandoffExportReference;
  quality_reference: VideoAppHandoffQualityReference;
  manifest: VideoAppHandoffManifest;
}

const PACKAGE_FILE = 'video-app-handoff-package.json';

function buildManifest(): VideoAppHandoffManifest {
  return {
    manifest_id: 'video-app-handoff-manifest-v1',
    assets: [
      {
        asset_id: 'video-dataset-export',
        path: VIDEO_DATASET_EXPORT_JSON_PATH,
        role: 'video_dataset_export',
        required: true,
      },
      {
        asset_id: 'video-dataset-quality-report',
        path: VIDEO_DATASET_QUALITY_REPORT_JSON_PATH,
        role: 'quality_report',
        required: true,
      },
    ],
  };
}

export function buildVideoAppHandoffPackage(
  generatedAt: string,
  exportData: VideoDatasetExport,
  qualityReport: VideoDatasetQualityReport
): VideoAppHandoffPackage {
  return {
    handoff_metadata: {
      schema_version: VIDEO_APP_HANDOFF_PACKAGE_SCHEMA_VERSION,
      handoff_type: 'video_app',
      consumer_target: VIDEO_APP_HANDOFF_CONSUMER_TARGET,
      source_layer: 'video_dataset_handoff_layer',
      image_app_handoff_included: false,
      image_dataset_export_separate: true,
      image_dataset_export_path: IMAGE_DATASET_EXPORT_JSON_PATH,
      phase: 'PHASE-63',
      generated_at: generatedAt,
      package_json_path: VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
      scene_count: exportData.export_metadata.scene_count,
    },
    export_reference: {
      asset_id: 'video-dataset-export',
      path: VIDEO_DATASET_EXPORT_JSON_PATH,
      export_metadata: { ...exportData.export_metadata },
    },
    quality_reference: {
      asset_id: 'video-dataset-quality-report',
      path: VIDEO_DATASET_QUALITY_REPORT_JSON_PATH,
      auditResult: qualityReport.auditResult,
      auditTimestamp: qualityReport.auditTimestamp,
      quality_score: qualityReport.quality_score,
      total_scene_count: qualityReport.total_scene_count,
    },
    manifest: buildManifest(),
  };
}

export function writeVideoAppHandoffPackage(
  projectRoot: string,
  handoffPackage: VideoAppHandoffPackage
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const packagePath = path.join(exportsDir, PACKAGE_FILE);
  fs.writeFileSync(packagePath, `${JSON.stringify(handoffPackage, null, 2)}\n`, 'utf8');
  return packagePath;
}

export function loadVideoAppHandoffPackage(
  projectRoot: string
): VideoAppHandoffPackage | null {
  const packagePath = path.join(projectRoot, 'exports', PACKAGE_FILE);
  if (!fs.existsSync(packagePath)) return null;
  return JSON.parse(fs.readFileSync(packagePath, 'utf8')) as VideoAppHandoffPackage;
}

export function runVideoAppHandoffPackageBuild(projectRoot: string): VideoAppHandoffPackage | null {
  const generatedAt = new Date().toISOString();
  const exportData = loadVideoDatasetExport(projectRoot);
  const qualityReport = loadVideoDatasetQualityReport(projectRoot);

  if (!exportData || !qualityReport) return null;

  const handoffPackage = buildVideoAppHandoffPackage(generatedAt, exportData, qualityReport);
  writeVideoAppHandoffPackage(projectRoot, handoffPackage);
  return handoffPackage;
}
