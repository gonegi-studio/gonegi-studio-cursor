import fs from 'node:fs';
import path from 'node:path';
import { ensureImageDatasetExport } from './imageDatasetExportAudit.js';
import {
  IMAGE_DATASET_EXPORT_JSON_PATH,
  type ImageDatasetExport,
} from './imageDatasetExport.js';
import {
  loadImageDatasetQualityReport,
  runImageDatasetQualityAudit,
  type ImageDatasetQualityReport,
} from './imageDatasetQualityAudit.js';
import {
  FORBIDDEN_IMAGE_HANDOFF_ASSET_PATHS,
  IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
  IMAGE_DATASET_QUALITY_REPORT_JSON_PATH,
  REQUIRED_IMAGE_HANDOFF_MANIFEST_ASSET_IDS,
  buildImageAppHandoffPackage,
  writeImageAppHandoffPackage,
  type ImageAppHandoffManifestAsset,
  type ImageAppHandoffMetadata,
  type ImageAppHandoffPackage,
  type ImageAppHandoffExportReference,
  type ImageAppHandoffQualityReference,
} from './imageAppHandoffPackage.js';

export type ImageAppHandoffAuditResult =
  | 'PASS'
  | 'FAIL_HANDOFF_COMPLETENESS'
  | 'FAIL_EXPORT_MISSING'
  | 'FAIL_QUALITY_REPORT_MISSING'
  | 'FAIL_MANIFEST_INTEGRITY'
  | 'FAIL_DUPLICATE_ASSET'
  | 'FAIL_MISSING_ASSET';

export interface ImageAppHandoffViolation {
  code: ImageAppHandoffAuditResult;
  message: string;
  field?: string;
}

export interface ImageAppHandoffReport {
  auditTimestamp: string;
  auditResult: ImageAppHandoffAuditResult;
  violations: ImageAppHandoffViolation[];
}

export interface ImageAppHandoffFingerprint {
  schemaVersion: 'IMAGE-APP-HANDOFF-FINGERPRINT-PHASE-66-v1';
  handoff_metadata: ImageAppHandoffMetadata;
  export_reference: ImageAppHandoffExportReference;
  quality_reference: ImageAppHandoffQualityReference;
  manifest_assets: ImageAppHandoffManifestAsset[];
  frozenAt: string;
}

const REPORT_FILE = 'image-app-handoff-report.json';
const FINGERPRINT_FILE = 'image-app-handoff-fingerprint.json';

function fileExists(projectRoot: string, relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function assertImageHandoffOnly(handoffPackage: ImageAppHandoffPackage): ImageAppHandoffViolation[] {
  const violations: ImageAppHandoffViolation[] = [];
  const { handoff_metadata: metadata } = handoffPackage;

  if (metadata.handoff_type !== 'image_app') {
    violations.push({
      code: 'FAIL_HANDOFF_COMPLETENESS',
      message: 'Handoff package must be image_app type only',
      field: 'handoff_metadata.handoff_type',
    });
  }

  if (metadata.video_app_handoff_included !== false) {
    violations.push({
      code: 'FAIL_HANDOFF_COMPLETENESS',
      message: 'Video app handoff must not be included',
      field: 'handoff_metadata.video_app_handoff_included',
    });
  }

  if (metadata.video_dataset_export_separate !== true) {
    violations.push({
      code: 'FAIL_HANDOFF_COMPLETENESS',
      message: 'Image and video dataset exports must remain separated',
      field: 'handoff_metadata.video_dataset_export_separate',
    });
  }

  if (metadata.consumer_target !== 'image_app_v17_handoff') {
    violations.push({
      code: 'FAIL_HANDOFF_COMPLETENESS',
      message: 'Consumer target must be image_app_v17_handoff',
      field: 'handoff_metadata.consumer_target',
    });
  }

  if (metadata.package_json_path !== IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH) {
    violations.push({
      code: 'FAIL_HANDOFF_COMPLETENESS',
      message: 'package_json_path must reference image-app-handoff-package.json',
      field: 'handoff_metadata.package_json_path',
    });
  }

  return violations;
}

export function buildImageAppHandoffFingerprint(
  handoffPackage: ImageAppHandoffPackage,
  frozenAt: string
): ImageAppHandoffFingerprint {
  return {
    schemaVersion: 'IMAGE-APP-HANDOFF-FINGERPRINT-PHASE-66-v1',
    handoff_metadata: { ...handoffPackage.handoff_metadata },
    export_reference: {
      ...handoffPackage.export_reference,
      export_metadata: { ...handoffPackage.export_reference.export_metadata },
    },
    quality_reference: { ...handoffPackage.quality_reference },
    manifest_assets: handoffPackage.manifest.assets.map((asset) => ({ ...asset })),
    frozenAt,
  };
}

export function auditImageAppHandoff(
  projectRoot: string,
  handoffPackage: ImageAppHandoffPackage,
  exportData: ImageDatasetExport | null,
  qualityReport: ImageDatasetQualityReport | null
): ImageAppHandoffViolation[] {
  const violations: ImageAppHandoffViolation[] = [];

  violations.push(...assertImageHandoffOnly(handoffPackage));

  if (!exportData) {
    violations.push({
      code: 'FAIL_EXPORT_MISSING',
      message: 'image-dataset-export.json not found on disk',
      field: IMAGE_DATASET_EXPORT_JSON_PATH,
    });
  }

  if (!qualityReport) {
    violations.push({
      code: 'FAIL_QUALITY_REPORT_MISSING',
      message: 'image-dataset-quality-report.json not found on disk',
      field: IMAGE_DATASET_QUALITY_REPORT_JSON_PATH,
    });
  }

  if (!fileExists(projectRoot, IMAGE_DATASET_EXPORT_JSON_PATH)) {
    violations.push({
      code: 'FAIL_EXPORT_MISSING',
      message: 'Export asset missing from exports directory',
      field: IMAGE_DATASET_EXPORT_JSON_PATH,
    });
  }

  if (!fileExists(projectRoot, IMAGE_DATASET_QUALITY_REPORT_JSON_PATH)) {
    violations.push({
      code: 'FAIL_QUALITY_REPORT_MISSING',
      message: 'Quality report asset missing from exports directory',
      field: IMAGE_DATASET_QUALITY_REPORT_JSON_PATH,
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

    if (
      FORBIDDEN_IMAGE_HANDOFF_ASSET_PATHS.includes(
        asset.path as (typeof FORBIDDEN_IMAGE_HANDOFF_ASSET_PATHS)[number]
      )
    ) {
      violations.push({
        code: 'FAIL_MANIFEST_INTEGRITY',
        message: `Forbidden video handoff asset in manifest: ${asset.path}`,
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

  for (const assetId of REQUIRED_IMAGE_HANDOFF_MANIFEST_ASSET_IDS) {
    if (!handoffPackage.manifest.assets.some((asset) => asset.asset_id === assetId)) {
      violations.push({
        code: 'FAIL_MISSING_ASSET',
        message: `Required manifest asset_id missing: ${assetId}`,
        field: 'manifest.assets',
      });
    }
  }

  if (handoffPackage.export_reference.asset_id !== 'image-dataset-export') {
    violations.push({
      code: 'FAIL_MANIFEST_INTEGRITY',
      message: 'export_reference asset_id must be image-dataset-export',
      field: 'export_reference.asset_id',
    });
  }

  if (handoffPackage.export_reference.path !== IMAGE_DATASET_EXPORT_JSON_PATH) {
    violations.push({
      code: 'FAIL_MANIFEST_INTEGRITY',
      message: 'export_reference path must be exports/image-dataset-export.json',
      field: 'export_reference.path',
    });
  }

  if (handoffPackage.quality_reference.asset_id !== 'image-dataset-quality-report') {
    violations.push({
      code: 'FAIL_MANIFEST_INTEGRITY',
      message: 'quality_reference asset_id must be image-dataset-quality-report',
      field: 'quality_reference.asset_id',
    });
  }

  if (handoffPackage.quality_reference.path !== IMAGE_DATASET_QUALITY_REPORT_JSON_PATH) {
    violations.push({
      code: 'FAIL_MANIFEST_INTEGRITY',
      message: 'quality_reference path must be exports/image-dataset-quality-report.json',
      field: 'quality_reference.path',
    });
  }

  const exportManifestAsset = handoffPackage.manifest.assets.find(
    (asset) => asset.asset_id === 'image-dataset-export'
  );
  const qualityManifestAsset = handoffPackage.manifest.assets.find(
    (asset) => asset.asset_id === 'image-dataset-quality-report'
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

  if (handoffPackage.manifest.manifest_id !== 'image-app-handoff-manifest-v1') {
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

    if (exportData.export_metadata.export_type !== 'image_dataset') {
      violations.push({
        code: 'FAIL_HANDOFF_COMPLETENESS',
        message: 'Referenced export must be image_dataset type',
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
        message: 'Quality report must PASS before image app handoff',
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

function primaryFailure(violations: ImageAppHandoffViolation[]): ImageAppHandoffAuditResult {
  const priority: ImageAppHandoffAuditResult[] = [
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

export function writeImageAppHandoffReport(
  projectRoot: string,
  report: ImageAppHandoffReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function writeImageAppHandoffFingerprint(
  projectRoot: string,
  fingerprint: ImageAppHandoffFingerprint
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const fingerprintPath = path.join(exportsDir, FINGERPRINT_FILE);
  fs.writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  return fingerprintPath;
}

export function runImageAppHandoffAudit(projectRoot: string): ImageAppHandoffReport {
  const auditTimestamp = new Date().toISOString();
  const violations: ImageAppHandoffViolation[] = [];

  const exportData = ensureImageDatasetExport(projectRoot);
  const qualityReport = runImageDatasetQualityAudit(projectRoot);

  if (qualityReport.auditResult !== 'PASS') {
    violations.push({
      code: 'FAIL_QUALITY_REPORT_MISSING',
      message: 'Image dataset quality audit must PASS before handoff',
      field: IMAGE_DATASET_QUALITY_REPORT_JSON_PATH,
    });
  }

  let handoffPackage: ImageAppHandoffPackage | null = null;

  if (qualityReport.auditResult === 'PASS') {
    handoffPackage = buildImageAppHandoffPackage(auditTimestamp, exportData, qualityReport);
    writeImageAppHandoffPackage(projectRoot, handoffPackage);
    violations.push(
      ...auditImageAppHandoff(
        projectRoot,
        handoffPackage,
        exportData,
        loadImageDatasetQualityReport(projectRoot)
      )
    );

    writeImageAppHandoffFingerprint(
      projectRoot,
      buildImageAppHandoffFingerprint(handoffPackage, auditTimestamp)
    );
  }

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);
  const report: ImageAppHandoffReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeImageAppHandoffReport(projectRoot, report);
  return report;
}
