import fs from 'node:fs';
import path from 'node:path';
import {
  FORBIDDEN_HANDOFF_ASSET_PATHS,
  REQUIRED_HANDOFF_MANIFEST_ASSET_IDS,
  VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
  VIDEO_DATASET_QUALITY_REPORT_JSON_PATH,
  buildVideoAppHandoffPackage,
  writeVideoAppHandoffPackage,
  type VideoAppHandoffPackage,
} from './videoAppHandoffPackage.js';
import { VIDEO_DATASET_EXPORT_JSON_PATH } from './videoDatasetExport.js';
import { loadVideoDatasetExport } from './videoDatasetExportAudit.js';
import { loadVideoDatasetQualityReport } from './videoDatasetQualityAudit.js';

export type VideoAppHandoffAuditResult =
  | 'PASS'
  | 'FAIL_HANDOFF_COMPLETENESS'
  | 'FAIL_EXPORT_MISSING'
  | 'FAIL_QUALITY_REPORT_MISSING'
  | 'FAIL_MANIFEST_INTEGRITY'
  | 'FAIL_DUPLICATE_ASSET'
  | 'FAIL_MISSING_ASSET';

export interface VideoAppHandoffViolation {
  code: VideoAppHandoffAuditResult;
  message: string;
  field?: string;
}

export interface VideoAppHandoffReport {
  auditTimestamp: string;
  auditResult: VideoAppHandoffAuditResult;
  violations: VideoAppHandoffViolation[];
}

const REPORT_FILE = 'video-app-handoff-report.json';

function fileExists(projectRoot: string, relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function assertVideoHandoffOnly(handoffPackage: VideoAppHandoffPackage): VideoAppHandoffViolation[] {
  const violations: VideoAppHandoffViolation[] = [];
  const { handoff_metadata: metadata } = handoffPackage;

  if (metadata.handoff_type !== 'video_app') {
    violations.push({
      code: 'FAIL_HANDOFF_COMPLETENESS',
      message: 'Handoff package must be video_app type only',
      field: 'handoff_metadata.handoff_type',
    });
  }

  if (metadata.image_app_handoff_included !== false) {
    violations.push({
      code: 'FAIL_HANDOFF_COMPLETENESS',
      message: 'Image app handoff must not be included',
      field: 'handoff_metadata.image_app_handoff_included',
    });
  }

  if (metadata.image_dataset_export_separate !== true) {
    violations.push({
      code: 'FAIL_HANDOFF_COMPLETENESS',
      message: 'Video and image dataset exports must remain separated',
      field: 'handoff_metadata.image_dataset_export_separate',
    });
  }

  if (metadata.consumer_target !== 'video_app_v82_6_handoff') {
    violations.push({
      code: 'FAIL_HANDOFF_COMPLETENESS',
      message: 'Consumer target must be video_app_v82_6_handoff',
      field: 'handoff_metadata.consumer_target',
    });
  }

  if (metadata.package_json_path !== VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH) {
    violations.push({
      code: 'FAIL_HANDOFF_COMPLETENESS',
      message: 'package_json_path must reference video-app-handoff-package.json',
      field: 'handoff_metadata.package_json_path',
    });
  }

  return violations;
}

export function auditVideoAppHandoff(
  projectRoot: string,
  handoffPackage: VideoAppHandoffPackage
): VideoAppHandoffViolation[] {
  const violations: VideoAppHandoffViolation[] = [];
  const exportData = loadVideoDatasetExport(projectRoot);
  const qualityReport = loadVideoDatasetQualityReport(projectRoot);

  violations.push(...assertVideoHandoffOnly(handoffPackage));

  if (!exportData) {
    violations.push({
      code: 'FAIL_EXPORT_MISSING',
      message: 'video-dataset-export.json not found on disk',
      field: VIDEO_DATASET_EXPORT_JSON_PATH,
    });
  }

  if (!qualityReport) {
    violations.push({
      code: 'FAIL_QUALITY_REPORT_MISSING',
      message: 'video-dataset-quality-report.json not found on disk',
      field: VIDEO_DATASET_QUALITY_REPORT_JSON_PATH,
    });
  }

  if (!fileExists(projectRoot, VIDEO_DATASET_EXPORT_JSON_PATH)) {
    violations.push({
      code: 'FAIL_EXPORT_MISSING',
      message: 'Export asset missing from exports directory',
      field: VIDEO_DATASET_EXPORT_JSON_PATH,
    });
  }

  if (!fileExists(projectRoot, VIDEO_DATASET_QUALITY_REPORT_JSON_PATH)) {
    violations.push({
      code: 'FAIL_QUALITY_REPORT_MISSING',
      message: 'Quality report asset missing from exports directory',
      field: VIDEO_DATASET_QUALITY_REPORT_JSON_PATH,
    });
  }

  const seenAssetIds = new Set<string>();
  const seenAssetPaths = new Set<string>();

  for (const asset of handoffPackage.manifest.assets) {
    if (seenAssetIds.has(asset.asset_id)) {
      violations.push({
        code: 'FAIL_DUPLICATE_ASSET',
        message: `Duplicate manifest asset_id: ${asset.asset_id}`,
        field: 'manifest.assets',
      });
    }
    seenAssetIds.add(asset.asset_id);

    if (seenAssetPaths.has(asset.path)) {
      violations.push({
        code: 'FAIL_DUPLICATE_ASSET',
        message: `Duplicate manifest asset path: ${asset.path}`,
        field: 'manifest.assets',
      });
    }
    seenAssetPaths.add(asset.path);

    if (FORBIDDEN_HANDOFF_ASSET_PATHS.includes(asset.path as (typeof FORBIDDEN_HANDOFF_ASSET_PATHS)[number])) {
      violations.push({
        code: 'FAIL_MANIFEST_INTEGRITY',
        message: `Forbidden image handoff asset in manifest: ${asset.path}`,
        field: 'manifest.assets',
      });
    }

    if (asset.required && !fileExists(projectRoot, asset.path)) {
      violations.push({
        code: 'FAIL_MISSING_ASSET',
        message: `Required handoff asset missing: ${asset.path}`,
        field: 'manifest.assets',
      });
    }
  }

  for (const assetId of REQUIRED_HANDOFF_MANIFEST_ASSET_IDS) {
    if (!handoffPackage.manifest.assets.some((asset) => asset.asset_id === assetId)) {
      violations.push({
        code: 'FAIL_MISSING_ASSET',
        message: `Required manifest asset_id missing: ${assetId}`,
        field: 'manifest.assets',
      });
    }
  }

  if (handoffPackage.export_reference.asset_id !== 'video-dataset-export') {
    violations.push({
      code: 'FAIL_MANIFEST_INTEGRITY',
      message: 'export_reference asset_id must be video-dataset-export',
      field: 'export_reference.asset_id',
    });
  }

  if (handoffPackage.export_reference.path !== VIDEO_DATASET_EXPORT_JSON_PATH) {
    violations.push({
      code: 'FAIL_MANIFEST_INTEGRITY',
      message: 'export_reference path must be exports/video-dataset-export.json',
      field: 'export_reference.path',
    });
  }

  if (handoffPackage.quality_reference.asset_id !== 'video-dataset-quality-report') {
    violations.push({
      code: 'FAIL_MANIFEST_INTEGRITY',
      message: 'quality_reference asset_id must be video-dataset-quality-report',
      field: 'quality_reference.asset_id',
    });
  }

  if (handoffPackage.quality_reference.path !== VIDEO_DATASET_QUALITY_REPORT_JSON_PATH) {
    violations.push({
      code: 'FAIL_MANIFEST_INTEGRITY',
      message: 'quality_reference path must be exports/video-dataset-quality-report.json',
      field: 'quality_reference.path',
    });
  }

  const exportManifestAsset = handoffPackage.manifest.assets.find(
    (asset) => asset.asset_id === 'video-dataset-export'
  );
  const qualityManifestAsset = handoffPackage.manifest.assets.find(
    (asset) => asset.asset_id === 'video-dataset-quality-report'
  );

  if (!exportManifestAsset || exportManifestAsset.path !== handoffPackage.export_reference.path) {
    violations.push({
      code: 'FAIL_MANIFEST_INTEGRITY',
      message: 'Manifest export asset does not match export_reference',
      field: 'manifest.assets',
    });
  }

  if (!qualityManifestAsset || qualityManifestAsset.path !== handoffPackage.quality_reference.path) {
    violations.push({
      code: 'FAIL_MANIFEST_INTEGRITY',
      message: 'Manifest quality asset does not match quality_reference',
      field: 'manifest.assets',
    });
  }

  if (handoffPackage.manifest.manifest_id !== 'video-app-handoff-manifest-v1') {
    violations.push({
      code: 'FAIL_MANIFEST_INTEGRITY',
      message: 'Invalid handoff manifest id',
      field: 'manifest.manifest_id',
    });
  }

  if (exportData) {
    if (
      handoffPackage.export_reference.export_metadata.schema_version !==
      exportData.export_metadata.schema_version
    ) {
      violations.push({
        code: 'FAIL_HANDOFF_COMPLETENESS',
        message: 'export_reference metadata schema_version mismatch',
        field: 'export_reference.export_metadata.schema_version',
      });
    }

    if (handoffPackage.handoff_metadata.scene_count !== exportData.export_metadata.scene_count) {
      violations.push({
        code: 'FAIL_HANDOFF_COMPLETENESS',
        message: 'handoff_metadata.scene_count does not match export scene_count',
        field: 'handoff_metadata.scene_count',
      });
    }

    if (exportData.export_metadata.export_type !== 'video_dataset') {
      violations.push({
        code: 'FAIL_HANDOFF_COMPLETENESS',
        message: 'Referenced export must be video_dataset type',
        field: 'export_reference.export_metadata.export_type',
      });
    }
  }

  if (qualityReport) {
    if (handoffPackage.quality_reference.auditResult !== qualityReport.auditResult) {
      violations.push({
        code: 'FAIL_MANIFEST_INTEGRITY',
        message: 'quality_reference auditResult does not match quality report file',
        field: 'quality_reference.auditResult',
      });
    }

    if (qualityReport.auditResult !== 'PASS') {
      violations.push({
        code: 'FAIL_HANDOFF_COMPLETENESS',
        message: 'Quality report must PASS before video app handoff',
        field: 'quality_reference.auditResult',
      });
    }

    if (handoffPackage.quality_reference.quality_score !== qualityReport.quality_score) {
      violations.push({
        code: 'FAIL_MANIFEST_INTEGRITY',
        message: 'quality_reference quality_score does not match quality report file',
        field: 'quality_reference.quality_score',
      });
    }
  }

  if (
    handoffPackage.quality_reference.total_scene_count !== handoffPackage.handoff_metadata.scene_count
  ) {
    violations.push({
      code: 'FAIL_HANDOFF_COMPLETENESS',
      message: 'quality_reference total_scene_count does not match handoff scene_count',
      field: 'quality_reference.total_scene_count',
    });
  }

  return violations;
}

function primaryFailure(violations: VideoAppHandoffViolation[]): VideoAppHandoffAuditResult {
  const priority: VideoAppHandoffAuditResult[] = [
    'FAIL_DUPLICATE_ASSET',
    'FAIL_MISSING_ASSET',
    'FAIL_EXPORT_MISSING',
    'FAIL_QUALITY_REPORT_MISSING',
    'FAIL_MANIFEST_INTEGRITY',
    'FAIL_HANDOFF_COMPLETENESS',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function writeVideoAppHandoffReport(
  projectRoot: string,
  report: VideoAppHandoffReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runVideoAppHandoffAudit(projectRoot: string): VideoAppHandoffReport {
  const auditTimestamp = new Date().toISOString();
  const exportData = loadVideoDatasetExport(projectRoot);
  const qualityReport = loadVideoDatasetQualityReport(projectRoot);
  const violations: VideoAppHandoffViolation[] = [];

  if (!exportData) {
    violations.push({
      code: 'FAIL_EXPORT_MISSING',
      message: 'Cannot build handoff package without video-dataset-export.json',
      field: VIDEO_DATASET_EXPORT_JSON_PATH,
    });
  }

  if (!qualityReport) {
    violations.push({
      code: 'FAIL_QUALITY_REPORT_MISSING',
      message: 'Cannot build handoff package without video-dataset-quality-report.json',
      field: VIDEO_DATASET_QUALITY_REPORT_JSON_PATH,
    });
  }

  let handoffPackage: VideoAppHandoffPackage | null = null;

  if (exportData && qualityReport) {
    handoffPackage = buildVideoAppHandoffPackage(auditTimestamp, exportData, qualityReport);
    writeVideoAppHandoffPackage(projectRoot, handoffPackage);
    violations.push(...auditVideoAppHandoff(projectRoot, handoffPackage));
  }

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);
  const report: VideoAppHandoffReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeVideoAppHandoffReport(projectRoot, report);
  return report;
}
