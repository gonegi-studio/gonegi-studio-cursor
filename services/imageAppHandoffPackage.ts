import fs from 'node:fs';
import path from 'node:path';
import {
  IMAGE_DATASET_EXPORT_JSON_PATH,
  type ImageDatasetExport,
  type ImageDatasetExportMetadata,
} from './imageDatasetExport.js';
import { VIDEO_DATASET_EXPORT_JSON_PATH } from './videoDatasetExport.js';
import { loadImageDatasetExport } from './imageDatasetExportAudit.js';
import {
  loadImageDatasetQualityReport,
  type ImageDatasetQualityReport,
} from './imageDatasetQualityAudit.js';

export const IMAGE_APP_HANDOFF_PACKAGE_SCHEMA_VERSION =
  'IMAGE-APP-HANDOFF-PACKAGE-PHASE-66-v1' as const;
export const IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH =
  'exports/image-app-handoff-package.json' as const;
export const IMAGE_DATASET_QUALITY_REPORT_JSON_PATH =
  'exports/image-dataset-quality-report.json' as const;
export const IMAGE_APP_HANDOFF_CONSUMER_TARGET = 'image_app_v17_handoff' as const;

export const REQUIRED_IMAGE_HANDOFF_MANIFEST_ASSET_IDS = [
  'image-dataset-export',
  'image-dataset-quality-report',
] as const;

export const FORBIDDEN_IMAGE_HANDOFF_ASSET_PATHS = [
  VIDEO_DATASET_EXPORT_JSON_PATH,
  'exports/video-app-handoff-package.json',
  'exports/video-dataset-quality-report.json',
  'exports/video-app-handoff-report.json',
] as const;

export interface ImageAppHandoffMetadata {
  schema_version: typeof IMAGE_APP_HANDOFF_PACKAGE_SCHEMA_VERSION;
  handoff_type: 'image_app';
  consumer_target: typeof IMAGE_APP_HANDOFF_CONSUMER_TARGET;
  source_layer: 'image_dataset_handoff_layer';
  video_app_handoff_included: false;
  video_dataset_export_separate: true;
  video_dataset_export_path: typeof VIDEO_DATASET_EXPORT_JSON_PATH;
  phase: 'PHASE-66';
  generated_at: string;
  package_json_path: typeof IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH;
  scene_count: number;
}

export interface ImageAppHandoffExportReference {
  asset_id: 'image-dataset-export';
  path: typeof IMAGE_DATASET_EXPORT_JSON_PATH;
  export_metadata: ImageDatasetExportMetadata;
}

export interface ImageAppHandoffQualityReference {
  asset_id: 'image-dataset-quality-report';
  path: typeof IMAGE_DATASET_QUALITY_REPORT_JSON_PATH;
  auditResult: ImageDatasetQualityReport['auditResult'];
  auditTimestamp: string;
  quality_score: number;
  total_scene_count: number;
}

export interface ImageAppHandoffManifestAsset {
  asset_id: string;
  path: string;
  role: 'image_dataset_export' | 'quality_report';
  required: true;
}

export interface ImageAppHandoffManifest {
  manifest_id: 'image-app-handoff-manifest-v1';
  assets: ImageAppHandoffManifestAsset[];
}

export interface ImageAppHandoffPackage {
  handoff_metadata: ImageAppHandoffMetadata;
  export_reference: ImageAppHandoffExportReference;
  quality_reference: ImageAppHandoffQualityReference;
  manifest: ImageAppHandoffManifest;
}

const PACKAGE_FILE = 'image-app-handoff-package.json';

function buildManifest(): ImageAppHandoffManifest {
  return {
    manifest_id: 'image-app-handoff-manifest-v1',
    assets: [
      {
        asset_id: 'image-dataset-export',
        path: IMAGE_DATASET_EXPORT_JSON_PATH,
        role: 'image_dataset_export',
        required: true,
      },
      {
        asset_id: 'image-dataset-quality-report',
        path: IMAGE_DATASET_QUALITY_REPORT_JSON_PATH,
        role: 'quality_report',
        required: true,
      },
    ],
  };
}

export function buildImageAppHandoffPackage(
  generatedAt: string,
  exportData: ImageDatasetExport,
  qualityReport: ImageDatasetQualityReport
): ImageAppHandoffPackage {
  return {
    handoff_metadata: {
      schema_version: IMAGE_APP_HANDOFF_PACKAGE_SCHEMA_VERSION,
      handoff_type: 'image_app',
      consumer_target: IMAGE_APP_HANDOFF_CONSUMER_TARGET,
      source_layer: 'image_dataset_handoff_layer',
      video_app_handoff_included: false,
      video_dataset_export_separate: true,
      video_dataset_export_path: VIDEO_DATASET_EXPORT_JSON_PATH,
      phase: 'PHASE-66',
      generated_at: generatedAt,
      package_json_path: IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
      scene_count: exportData.export_metadata.scene_count,
    },
    export_reference: {
      asset_id: 'image-dataset-export',
      path: IMAGE_DATASET_EXPORT_JSON_PATH,
      export_metadata: { ...exportData.export_metadata },
    },
    quality_reference: {
      asset_id: 'image-dataset-quality-report',
      path: IMAGE_DATASET_QUALITY_REPORT_JSON_PATH,
      auditResult: qualityReport.auditResult,
      auditTimestamp: qualityReport.auditTimestamp,
      quality_score: qualityReport.quality_score,
      total_scene_count: qualityReport.total_scene_count,
    },
    manifest: buildManifest(),
  };
}

export function writeImageAppHandoffPackage(
  projectRoot: string,
  handoffPackage: ImageAppHandoffPackage
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const packagePath = path.join(exportsDir, PACKAGE_FILE);
  fs.writeFileSync(packagePath, `${JSON.stringify(handoffPackage, null, 2)}\n`, 'utf8');
  return packagePath;
}

export function loadImageAppHandoffPackage(
  projectRoot: string
): ImageAppHandoffPackage | null {
  const packagePath = path.join(projectRoot, 'exports', PACKAGE_FILE);
  if (!fs.existsSync(packagePath)) return null;
  return JSON.parse(fs.readFileSync(packagePath, 'utf8')) as ImageAppHandoffPackage;
}
