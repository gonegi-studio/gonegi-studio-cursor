import fs from 'node:fs';
import path from 'node:path';
import {
  IMAGE_DATASET_EXPORT_JSON_PATH,
  VIDEO_DATASET_EXPORT_JSON_PATH,
  type VideoDatasetExport,
} from './videoDatasetExport.js';
import { loadVideoDatasetExport } from './videoDatasetExportAudit.js';
import {
  VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
  loadVideoAppHandoffPackage,
  type VideoAppHandoffPackage,
} from './videoAppHandoffPackage.js';

export const DATASET_BOUNDARY_FINGERPRINT_SCHEMA_VERSION =
  'DATASET-BOUNDARY-FINGERPRINT-PHASE-64-v1' as const;

export const IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH =
  'exports/image-app-handoff-package.json' as const;
export const IMAGE_APP_HANDOFF_REPORT_JSON_PATH =
  'exports/image-app-handoff-report.json' as const;

export const CANONICAL_IMAGE_DATASET_ASSETS = [
  IMAGE_DATASET_EXPORT_JSON_PATH,
] as const;

export const CANONICAL_VIDEO_DATASET_ASSETS = [
  VIDEO_DATASET_EXPORT_JSON_PATH,
  'exports/video-dataset-quality-report.json',
  'exports/video-dataset-export-report.json',
  'exports/video-dataset-builder-preview.json',
  'exports/video-dataset-builder-report.json',
] as const;

export const CANONICAL_IMAGE_HANDOFF_ASSETS = [
  IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
  IMAGE_APP_HANDOFF_REPORT_JSON_PATH,
] as const;

export const CANONICAL_VIDEO_HANDOFF_ASSETS = [
  VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
  'exports/video-app-handoff-report.json',
] as const;

export const VIDEO_SCENE_ID_PREFIX = 'VDS-' as const;
export const VIDEO_RUNTIME_SOURCE_PREFIX = 'ASM-' as const;
export const IMAGE_SCENE_ID_PREFIX = 'IDS-' as const;
export const IMAGE_RUNTIME_SOURCE_PREFIX = 'IMS-' as const;

export type DatasetBoundaryAuditResult =
  | 'PASS'
  | 'FAIL_IMAGE_CONTAMINATION'
  | 'FAIL_VIDEO_CONTAMINATION'
  | 'FAIL_SHARED_ASSET'
  | 'FAIL_SHARED_RUNTIME'
  | 'FAIL_HANDOFF_BOUNDARY'
  | 'FAIL_DATASET_OWNERSHIP';

export interface DatasetBoundaryViolation {
  code: DatasetBoundaryAuditResult;
  message: string;
  field?: string;
}

export interface DatasetBoundaryReport {
  auditTimestamp: string;
  auditResult: DatasetBoundaryAuditResult;
  violations: DatasetBoundaryViolation[];
}

export interface DatasetBoundaryFingerprint {
  schemaVersion: typeof DATASET_BOUNDARY_FINGERPRINT_SCHEMA_VERSION;
  boundary: 'image_dataset|video_dataset|image_handoff|video_handoff';
  imageDatasetAssets: readonly string[];
  videoDatasetAssets: readonly string[];
  imageHandoffAssets: readonly string[];
  videoHandoffAssets: readonly string[];
  frozenAt: string;
}

interface LooseImageDatasetExport {
  export_metadata?: {
    export_type?: string;
    active_export?: string;
    export_json_path?: string;
    video_dataset_export_path?: string;
    image_dataset_export_separate?: boolean;
  };
  scene_records?: Array<{ scene_id?: string; runtime_source?: string }>;
}

interface LooseImageAppHandoffPackage {
  handoff_metadata?: {
    handoff_type?: string;
    video_app_handoff_included?: boolean;
    image_app_handoff_included?: boolean;
  };
  manifest?: {
    assets?: Array<{ asset_id?: string; path?: string }>;
  };
}

const FINGERPRINT_FILE = 'dataset-boundary-fingerprint.json';
const REPORT_FILE = 'dataset-boundary-report.json';

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function intersect(left: readonly string[], right: readonly string[]): string[] {
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value)).sort();
}

function fileExists(projectRoot: string, relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function loadImageDatasetExport(projectRoot: string): LooseImageDatasetExport | null {
  const exportPath = path.join(projectRoot, IMAGE_DATASET_EXPORT_JSON_PATH);
  if (!fs.existsSync(exportPath)) return null;
  return JSON.parse(fs.readFileSync(exportPath, 'utf8')) as LooseImageDatasetExport;
}

function loadImageAppHandoffPackage(projectRoot: string): LooseImageAppHandoffPackage | null {
  const packagePath = path.join(projectRoot, IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH);
  if (!fs.existsSync(packagePath)) return null;
  return JSON.parse(fs.readFileSync(packagePath, 'utf8')) as LooseImageAppHandoffPackage;
}

export function buildDatasetBoundaryFingerprint(frozenAt: string): DatasetBoundaryFingerprint {
  return {
    schemaVersion: DATASET_BOUNDARY_FINGERPRINT_SCHEMA_VERSION,
    boundary: 'image_dataset|video_dataset|image_handoff|video_handoff',
    imageDatasetAssets: sortedUnique(CANONICAL_IMAGE_DATASET_ASSETS),
    videoDatasetAssets: sortedUnique(CANONICAL_VIDEO_DATASET_ASSETS),
    imageHandoffAssets: sortedUnique(CANONICAL_IMAGE_HANDOFF_ASSETS),
    videoHandoffAssets: sortedUnique(CANONICAL_VIDEO_HANDOFF_ASSETS),
    frozenAt,
  };
}

function auditFingerprintDisjointSets(
  fingerprint: DatasetBoundaryFingerprint
): DatasetBoundaryViolation[] {
  const violations: DatasetBoundaryViolation[] = [];
  const imageVideoAssetOverlap = intersect(
    fingerprint.imageDatasetAssets,
    fingerprint.videoDatasetAssets
  );
  if (imageVideoAssetOverlap.length > 0) {
    violations.push({
      code: 'FAIL_SHARED_ASSET',
      message: `Dataset asset overlap detected: ${imageVideoAssetOverlap.join(', ')}`,
      field: 'imageDatasetAssets|videoDatasetAssets',
    });
  }

  const imageVideoHandoffOverlap = intersect(
    fingerprint.imageHandoffAssets,
    fingerprint.videoHandoffAssets
  );
  if (imageVideoHandoffOverlap.length > 0) {
    violations.push({
      code: 'FAIL_SHARED_ASSET',
      message: `Handoff asset overlap detected: ${imageVideoHandoffOverlap.join(', ')}`,
      field: 'imageHandoffAssets|videoHandoffAssets',
    });
  }

  const datasetHandoffOverlap = intersect(
    [...fingerprint.imageDatasetAssets, ...fingerprint.videoDatasetAssets],
    [...fingerprint.imageHandoffAssets, ...fingerprint.videoHandoffAssets]
  );
  if (datasetHandoffOverlap.length > 0) {
    violations.push({
      code: 'FAIL_SHARED_ASSET',
      message: `Dataset and handoff asset overlap detected: ${datasetHandoffOverlap.join(', ')}`,
      field: 'dataset|handoff',
    });
  }

  return violations;
}

function auditVideoExportContamination(
  exportData: VideoDatasetExport
): DatasetBoundaryViolation[] {
  const violations: DatasetBoundaryViolation[] = [];
  const metadata = exportData.export_metadata;

  if (metadata.export_type !== 'video_dataset') {
    violations.push({
      code: 'FAIL_VIDEO_CONTAMINATION',
      message: 'Video export export_type must remain video_dataset',
      field: 'export_metadata.export_type',
    });
  }

  if (metadata.active_export !== 'video_dataset') {
    violations.push({
      code: 'FAIL_VIDEO_CONTAMINATION',
      message: 'Video export active_export must remain video_dataset',
      field: 'export_metadata.active_export',
    });
  }

  if (metadata.export_json_path !== VIDEO_DATASET_EXPORT_JSON_PATH) {
    violations.push({
      code: 'FAIL_VIDEO_CONTAMINATION',
      message: 'Video export must not claim image-dataset-export.json as active export path',
      field: 'export_metadata.export_json_path',
    });
  }

  if (metadata.image_dataset_export_separate !== true) {
    violations.push({
      code: 'FAIL_VIDEO_CONTAMINATION',
      message: 'Video export must keep image dataset boundary separation flag',
      field: 'export_metadata.image_dataset_export_separate',
    });
  }

  for (const record of exportData.scene_records) {
    if (!record.scene_id.startsWith(VIDEO_SCENE_ID_PREFIX)) {
      violations.push({
        code: 'FAIL_VIDEO_CONTAMINATION',
        message: `Video export contains non-video scene_id: ${record.scene_id}`,
        field: 'scene_records',
      });
    }

    if (record.scene_id.startsWith(IMAGE_SCENE_ID_PREFIX)) {
      violations.push({
        code: 'FAIL_VIDEO_CONTAMINATION',
        message: `Video export contains image scene_id: ${record.scene_id}`,
        field: 'scene_records',
      });
    }

    if (!record.runtime_source.startsWith(VIDEO_RUNTIME_SOURCE_PREFIX)) {
      violations.push({
        code: 'FAIL_VIDEO_CONTAMINATION',
        message: `Video export contains non-video runtime_source: ${record.runtime_source}`,
        field: 'scene_records',
      });
    }

    if (record.runtime_source.startsWith(IMAGE_RUNTIME_SOURCE_PREFIX)) {
      violations.push({
        code: 'FAIL_VIDEO_CONTAMINATION',
        message: `Video export contains image runtime_source: ${record.runtime_source}`,
        field: 'scene_records',
      });
    }
  }

  return violations;
}

function auditImageExportContamination(
  imageExport: LooseImageDatasetExport
): DatasetBoundaryViolation[] {
  const violations: DatasetBoundaryViolation[] = [];
  const metadata = imageExport.export_metadata;

  if (!metadata) {
    violations.push({
      code: 'FAIL_IMAGE_CONTAMINATION',
      message: 'Image export missing export_metadata',
      field: 'export_metadata',
    });
    return violations;
  }

  if (metadata.export_type !== 'image_dataset') {
    violations.push({
      code: 'FAIL_IMAGE_CONTAMINATION',
      message: 'Image export export_type must remain image_dataset',
      field: 'export_metadata.export_type',
    });
  }

  if (metadata.active_export !== 'image_dataset') {
    violations.push({
      code: 'FAIL_IMAGE_CONTAMINATION',
      message: 'Image export active_export must remain image_dataset',
      field: 'export_metadata.active_export',
    });
  }

  if (metadata.export_json_path !== IMAGE_DATASET_EXPORT_JSON_PATH) {
    violations.push({
      code: 'FAIL_IMAGE_CONTAMINATION',
      message: 'Image export must not claim video-dataset-export.json as active export path',
      field: 'export_metadata.export_json_path',
    });
  }

  if (metadata.video_dataset_export_path !== VIDEO_DATASET_EXPORT_JSON_PATH) {
    violations.push({
      code: 'FAIL_IMAGE_CONTAMINATION',
      message: 'Image export must reference video dataset path as separate boundary only',
      field: 'export_metadata.video_dataset_export_path',
    });
  }

  for (const record of imageExport.scene_records ?? []) {
    if (record.scene_id?.startsWith(VIDEO_SCENE_ID_PREFIX)) {
      violations.push({
        code: 'FAIL_IMAGE_CONTAMINATION',
        message: `Image export contains video scene_id: ${record.scene_id}`,
        field: 'scene_records',
      });
    }

    if (record.runtime_source?.startsWith(VIDEO_RUNTIME_SOURCE_PREFIX)) {
      violations.push({
        code: 'FAIL_IMAGE_CONTAMINATION',
        message: `Image export contains video runtime_source: ${record.runtime_source}`,
        field: 'scene_records',
      });
    }

    if (record.scene_id && !record.scene_id.startsWith(IMAGE_SCENE_ID_PREFIX)) {
      violations.push({
        code: 'FAIL_IMAGE_CONTAMINATION',
        message: `Image export contains non-image scene_id: ${record.scene_id}`,
        field: 'scene_records',
      });
    }

    if (record.runtime_source && !record.runtime_source.startsWith(IMAGE_RUNTIME_SOURCE_PREFIX)) {
      violations.push({
        code: 'FAIL_IMAGE_CONTAMINATION',
        message: `Image export contains non-image runtime_source: ${record.runtime_source}`,
        field: 'scene_records',
      });
    }
  }

  return violations;
}

function auditSharedRuntimeLeakage(
  videoExport: VideoDatasetExport | null,
  imageExport: LooseImageDatasetExport | null
): DatasetBoundaryViolation[] {
  const violations: DatasetBoundaryViolation[] = [];

  if (!videoExport || !imageExport) return violations;

  const videoSceneIds = new Set(videoExport.scene_records.map((record) => record.scene_id));
  const imageSceneIds = new Set(
    (imageExport.scene_records ?? [])
      .map((record) => record.scene_id)
      .filter((sceneId): sceneId is string => typeof sceneId === 'string')
  );

  const sharedSceneIds = [...videoSceneIds].filter((sceneId) => imageSceneIds.has(sceneId)).sort();
  if (sharedSceneIds.length > 0) {
    violations.push({
      code: 'FAIL_SHARED_RUNTIME',
      message: `Shared scene_id detected across dataset exports: ${sharedSceneIds.join(', ')}`,
      field: 'scene_records',
    });
  }

  const videoRuntimeSources = new Set(
    videoExport.scene_records.map((record) => record.runtime_source)
  );
  const imageRuntimeSources = new Set(
    (imageExport.scene_records ?? [])
      .map((record) => record.runtime_source)
      .filter((runtimeSource): runtimeSource is string => typeof runtimeSource === 'string')
  );

  const sharedRuntimeSources = [...videoRuntimeSources]
    .filter((runtimeSource) => imageRuntimeSources.has(runtimeSource))
    .sort();

  if (sharedRuntimeSources.length > 0) {
    violations.push({
      code: 'FAIL_SHARED_RUNTIME',
      message: `Shared runtime_source detected across dataset exports: ${sharedRuntimeSources.join(', ')}`,
      field: 'scene_records',
    });
  }

  return violations;
}

function auditVideoHandoffBoundary(
  handoffPackage: VideoAppHandoffPackage
): DatasetBoundaryViolation[] {
  const violations: DatasetBoundaryViolation[] = [];

  if (handoffPackage.handoff_metadata.handoff_type !== 'video_app') {
    violations.push({
      code: 'FAIL_HANDOFF_BOUNDARY',
      message: 'Video handoff package must remain video_app type',
      field: 'handoff_metadata.handoff_type',
    });
  }

  if (handoffPackage.handoff_metadata.image_app_handoff_included !== false) {
    violations.push({
      code: 'FAIL_HANDOFF_BOUNDARY',
      message: 'Video handoff must not include image app handoff assets',
      field: 'handoff_metadata.image_app_handoff_included',
    });
  }

  for (const asset of handoffPackage.manifest.assets) {
    if (CANONICAL_IMAGE_DATASET_ASSETS.includes(asset.path as (typeof CANONICAL_IMAGE_DATASET_ASSETS)[number])) {
      violations.push({
        code: 'FAIL_HANDOFF_BOUNDARY',
        message: `Video handoff manifest includes image dataset asset: ${asset.path}`,
        field: 'manifest.assets',
      });
    }

    if (CANONICAL_IMAGE_HANDOFF_ASSETS.includes(asset.path as (typeof CANONICAL_IMAGE_HANDOFF_ASSETS)[number])) {
      violations.push({
        code: 'FAIL_HANDOFF_BOUNDARY',
        message: `Video handoff manifest includes image handoff asset: ${asset.path}`,
        field: 'manifest.assets',
      });
    }
  }

  return violations;
}

function auditImageHandoffBoundary(
  handoffPackage: LooseImageAppHandoffPackage
): DatasetBoundaryViolation[] {
  const violations: DatasetBoundaryViolation[] = [];
  const metadata = handoffPackage.handoff_metadata;

  if (!metadata) {
    violations.push({
      code: 'FAIL_HANDOFF_BOUNDARY',
      message: 'Image handoff package missing handoff_metadata',
      field: 'handoff_metadata',
    });
    return violations;
  }

  if (metadata.handoff_type !== 'image_app') {
    violations.push({
      code: 'FAIL_HANDOFF_BOUNDARY',
      message: 'Image handoff package must remain image_app type',
      field: 'handoff_metadata.handoff_type',
    });
  }

  if (metadata.video_app_handoff_included === true) {
    violations.push({
      code: 'FAIL_HANDOFF_BOUNDARY',
      message: 'Image handoff must not include video app handoff assets',
      field: 'handoff_metadata.video_app_handoff_included',
    });
  }

  for (const asset of handoffPackage.manifest?.assets ?? []) {
    if (!asset.path) continue;

    if (CANONICAL_VIDEO_DATASET_ASSETS.includes(asset.path as (typeof CANONICAL_VIDEO_DATASET_ASSETS)[number])) {
      violations.push({
        code: 'FAIL_HANDOFF_BOUNDARY',
        message: `Image handoff manifest includes video dataset asset: ${asset.path}`,
        field: 'manifest.assets',
      });
    }

    if (CANONICAL_VIDEO_HANDOFF_ASSETS.includes(asset.path as (typeof CANONICAL_VIDEO_HANDOFF_ASSETS)[number])) {
      violations.push({
        code: 'FAIL_HANDOFF_BOUNDARY',
        message: `Image handoff manifest includes video handoff asset: ${asset.path}`,
        field: 'manifest.assets',
      });
    }
  }

  return violations;
}

function auditDatasetOwnership(
  projectRoot: string,
  fingerprint: DatasetBoundaryFingerprint
): DatasetBoundaryViolation[] {
  const violations: DatasetBoundaryViolation[] = [];
  const imageDatasetSet = new Set(fingerprint.imageDatasetAssets);
  const videoDatasetSet = new Set(fingerprint.videoDatasetAssets);
  const imageHandoffSet = new Set(fingerprint.imageHandoffAssets);
  const videoHandoffSet = new Set(fingerprint.videoHandoffAssets);

  for (const assetPath of CANONICAL_VIDEO_DATASET_ASSETS) {
    if (!fileExists(projectRoot, assetPath)) continue;
    if (!videoDatasetSet.has(assetPath)) {
      violations.push({
        code: 'FAIL_DATASET_OWNERSHIP',
        message: `Video dataset asset missing from video ownership bucket: ${assetPath}`,
        field: 'videoDatasetAssets',
      });
    }
    if (imageDatasetSet.has(assetPath)) {
      violations.push({
        code: 'FAIL_DATASET_OWNERSHIP',
        message: `Video dataset asset incorrectly owned by image dataset bucket: ${assetPath}`,
        field: 'imageDatasetAssets',
      });
    }
  }

  for (const assetPath of CANONICAL_IMAGE_DATASET_ASSETS) {
    if (!fileExists(projectRoot, assetPath)) continue;
    if (!imageDatasetSet.has(assetPath)) {
      violations.push({
        code: 'FAIL_DATASET_OWNERSHIP',
        message: `Image dataset asset missing from image ownership bucket: ${assetPath}`,
        field: 'imageDatasetAssets',
      });
    }
    if (videoDatasetSet.has(assetPath)) {
      violations.push({
        code: 'FAIL_DATASET_OWNERSHIP',
        message: `Image dataset asset incorrectly owned by video dataset bucket: ${assetPath}`,
        field: 'videoDatasetAssets',
      });
    }
  }

  for (const assetPath of CANONICAL_VIDEO_HANDOFF_ASSETS) {
    if (!fileExists(projectRoot, assetPath)) continue;
    if (!videoHandoffSet.has(assetPath)) {
      violations.push({
        code: 'FAIL_DATASET_OWNERSHIP',
        message: `Video handoff asset missing from video handoff bucket: ${assetPath}`,
        field: 'videoHandoffAssets',
      });
    }
    if (imageHandoffSet.has(assetPath)) {
      violations.push({
        code: 'FAIL_DATASET_OWNERSHIP',
        message: `Video handoff asset incorrectly owned by image handoff bucket: ${assetPath}`,
        field: 'imageHandoffAssets',
      });
    }
  }

  for (const assetPath of CANONICAL_IMAGE_HANDOFF_ASSETS) {
    if (!fileExists(projectRoot, assetPath)) continue;
    if (!imageHandoffSet.has(assetPath)) {
      violations.push({
        code: 'FAIL_DATASET_OWNERSHIP',
        message: `Image handoff asset missing from image handoff bucket: ${assetPath}`,
        field: 'imageHandoffAssets',
      });
    }
    if (videoHandoffSet.has(assetPath)) {
      violations.push({
        code: 'FAIL_DATASET_OWNERSHIP',
        message: `Image handoff asset incorrectly owned by video handoff bucket: ${assetPath}`,
        field: 'videoHandoffAssets',
      });
    }
  }

  return violations;
}

function auditSharedAssetLeakage(
  videoHandoff: VideoAppHandoffPackage | null,
  imageHandoff: LooseImageAppHandoffPackage | null
): DatasetBoundaryViolation[] {
  const violations: DatasetBoundaryViolation[] = [];

  if (videoHandoff) {
    const videoManifestPaths = videoHandoff.manifest.assets.map((asset) => asset.path);
    const leakedImageAssets = intersect(videoManifestPaths, CANONICAL_IMAGE_DATASET_ASSETS);
    if (leakedImageAssets.length > 0) {
      violations.push({
        code: 'FAIL_SHARED_ASSET',
        message: `Video handoff leaked image dataset assets: ${leakedImageAssets.join(', ')}`,
        field: 'manifest.assets',
      });
    }

    const leakedImageHandoffAssets = intersect(videoManifestPaths, CANONICAL_IMAGE_HANDOFF_ASSETS);
    if (leakedImageHandoffAssets.length > 0) {
      violations.push({
        code: 'FAIL_SHARED_ASSET',
        message: `Video handoff leaked image handoff assets: ${leakedImageHandoffAssets.join(', ')}`,
        field: 'manifest.assets',
      });
    }
  }

  if (imageHandoff) {
    const imageManifestPaths = (imageHandoff.manifest?.assets ?? [])
      .map((asset) => asset.path)
      .filter((assetPath): assetPath is string => typeof assetPath === 'string');

    const leakedVideoAssets = intersect(imageManifestPaths, CANONICAL_VIDEO_DATASET_ASSETS);
    if (leakedVideoAssets.length > 0) {
      violations.push({
        code: 'FAIL_SHARED_ASSET',
        message: `Image handoff leaked video dataset assets: ${leakedVideoAssets.join(', ')}`,
        field: 'manifest.assets',
      });
    }

    const leakedVideoHandoffAssets = intersect(imageManifestPaths, CANONICAL_VIDEO_HANDOFF_ASSETS);
    if (leakedVideoHandoffAssets.length > 0) {
      violations.push({
        code: 'FAIL_SHARED_ASSET',
        message: `Image handoff leaked video handoff assets: ${leakedVideoHandoffAssets.join(', ')}`,
        field: 'manifest.assets',
      });
    }
  }

  return violations;
}

export function auditDatasetBoundary(
  projectRoot: string,
  fingerprint: DatasetBoundaryFingerprint
): DatasetBoundaryViolation[] {
  const violations: DatasetBoundaryViolation[] = [];
  const videoExport = loadVideoDatasetExport(projectRoot);
  const imageExport = loadImageDatasetExport(projectRoot);
  const videoHandoff = loadVideoAppHandoffPackage(projectRoot);
  const imageHandoff = loadImageAppHandoffPackage(projectRoot);

  violations.push(...auditFingerprintDisjointSets(fingerprint));
  violations.push(...auditDatasetOwnership(projectRoot, fingerprint));

  if (videoExport) {
    violations.push(...auditVideoExportContamination(videoExport));
  }

  if (imageExport) {
    violations.push(...auditImageExportContamination(imageExport));
  }

  violations.push(...auditSharedRuntimeLeakage(videoExport, imageExport));
  violations.push(...auditSharedAssetLeakage(videoHandoff, imageHandoff));

  if (videoHandoff) {
    violations.push(...auditVideoHandoffBoundary(videoHandoff));
  }

  if (imageHandoff) {
    violations.push(...auditImageHandoffBoundary(imageHandoff));
  }

  return violations;
}

function primaryFailure(violations: DatasetBoundaryViolation[]): DatasetBoundaryAuditResult {
  const priority: DatasetBoundaryAuditResult[] = [
    'FAIL_SHARED_ASSET',
    'FAIL_SHARED_RUNTIME',
    'FAIL_HANDOFF_BOUNDARY',
    'FAIL_DATASET_OWNERSHIP',
    'FAIL_IMAGE_CONTAMINATION',
    'FAIL_VIDEO_CONTAMINATION',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function writeDatasetBoundaryFingerprint(
  projectRoot: string,
  fingerprint: DatasetBoundaryFingerprint
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const fingerprintPath = path.join(exportsDir, FINGERPRINT_FILE);
  fs.writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  return fingerprintPath;
}

export function writeDatasetBoundaryReport(
  projectRoot: string,
  report: DatasetBoundaryReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runDatasetBoundaryAudit(projectRoot: string): DatasetBoundaryReport {
  const auditTimestamp = new Date().toISOString();
  const fingerprint = buildDatasetBoundaryFingerprint(auditTimestamp);
  writeDatasetBoundaryFingerprint(projectRoot, fingerprint);

  const violations = auditDatasetBoundary(projectRoot, fingerprint);
  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: DatasetBoundaryReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeDatasetBoundaryReport(projectRoot, report);
  return report;
}
