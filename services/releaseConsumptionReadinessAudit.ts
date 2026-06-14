import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { computeFileChecksum } from './datasetReleaseManifest.js';
import {
  DATASET_RELEASE_LOCK_JSON_PATH,
  loadDatasetReleaseLock,
  type DatasetReleaseLock,
} from './datasetReleaseLock.js';
import { type DatasetReleaseLockReport } from './datasetReleaseLockAudit.js';
import { IMAGE_DATASET_EXPORT_JSON_PATH } from './imageDatasetExport.js';
import { loadImageDatasetExport } from './imageDatasetExportAudit.js';
import {
  IMAGE_APP_HANDOFF_CONSUMER_TARGET,
  IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
  IMAGE_DATASET_QUALITY_REPORT_JSON_PATH,
  loadImageAppHandoffPackage,
} from './imageAppHandoffPackage.js';
import { VIDEO_DATASET_EXPORT_JSON_PATH } from './videoDatasetExport.js';
import { loadVideoDatasetExport } from './videoDatasetExportAudit.js';
import {
  VIDEO_APP_HANDOFF_CONSUMER_TARGET,
  VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
  VIDEO_DATASET_QUALITY_REPORT_JSON_PATH,
  loadVideoAppHandoffPackage,
} from './videoAppHandoffPackage.js';

export const RELEASE_CONSUMPTION_READINESS_FINGERPRINT_SCHEMA_VERSION =
  'RELEASE-CONSUMPTION-READINESS-FINGERPRINT-PHASE-70-v1' as const;

export type ReleaseConsumptionReadinessAuditResult =
  | 'PASS'
  | 'FAIL_RELEASE_LOCK'
  | 'FAIL_IMAGE_APP_CONSUMPTION'
  | 'FAIL_VIDEO_APP_CONSUMPTION'
  | 'FAIL_IMAGE_EXPORT_READ'
  | 'FAIL_VIDEO_EXPORT_READ'
  | 'FAIL_CHECKSUM_INTEGRITY'
  | 'FAIL_TARGET_MAPPING';

export interface ReleaseConsumptionReadinessViolation {
  code: ReleaseConsumptionReadinessAuditResult;
  message: string;
  field?: string;
}

export interface ConsumableAssetMapEntry {
  handoff_package: string;
  dataset_export: string;
  quality_report: string;
}

export interface ReleaseConsumptionReadinessFingerprint {
  schemaVersion: typeof RELEASE_CONSUMPTION_READINESS_FINGERPRINT_SCHEMA_VERSION;
  releaseLockChecksum: string;
  imageAppTarget: typeof IMAGE_APP_HANDOFF_CONSUMER_TARGET;
  videoAppTarget: typeof VIDEO_APP_HANDOFF_CONSUMER_TARGET;
  consumableAssetMap: Record<
    typeof IMAGE_APP_HANDOFF_CONSUMER_TARGET | typeof VIDEO_APP_HANDOFF_CONSUMER_TARGET,
    ConsumableAssetMapEntry
  >;
  frozenAt: string;
}

export interface ReleaseConsumptionReadinessReport {
  auditTimestamp: string;
  auditResult: ReleaseConsumptionReadinessAuditResult;
  violations: ReleaseConsumptionReadinessViolation[];
  image_app_ready: boolean;
  video_app_ready: boolean;
  release_consumption_ready: boolean;
}

const REPORT_FILE = 'release-consumption-readiness-report.json';
const FINGERPRINT_FILE = 'release-consumption-readiness-fingerprint.json';

function fileExists(projectRoot: string, relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function loadJsonFile<T>(projectRoot: string, relativePath: string): T | null {
  const filePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function computeReleaseLockFileChecksum(projectRoot: string): string | null {
  const lockPath = path.join(projectRoot, DATASET_RELEASE_LOCK_JSON_PATH);
  if (!fs.existsSync(lockPath)) return null;
  const content = fs.readFileSync(lockPath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function loadDatasetReleaseLockReport(projectRoot: string): DatasetReleaseLockReport | null {
  return loadJsonFile<DatasetReleaseLockReport>(projectRoot, 'exports/dataset-release-lock-report.json');
}

function buildConsumableAssetMap(): ReleaseConsumptionReadinessFingerprint['consumableAssetMap'] {
  return {
    [IMAGE_APP_HANDOFF_CONSUMER_TARGET]: {
      handoff_package: IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
      dataset_export: IMAGE_DATASET_EXPORT_JSON_PATH,
      quality_report: IMAGE_DATASET_QUALITY_REPORT_JSON_PATH,
    },
    [VIDEO_APP_HANDOFF_CONSUMER_TARGET]: {
      handoff_package: VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
      dataset_export: VIDEO_DATASET_EXPORT_JSON_PATH,
      quality_report: VIDEO_DATASET_QUALITY_REPORT_JSON_PATH,
    },
  };
}

export function buildReleaseConsumptionReadinessFingerprint(
  projectRoot: string,
  frozenAt: string
): ReleaseConsumptionReadinessFingerprint | null {
  const releaseLockChecksum = computeReleaseLockFileChecksum(projectRoot);
  if (!releaseLockChecksum) return null;

  return {
    schemaVersion: RELEASE_CONSUMPTION_READINESS_FINGERPRINT_SCHEMA_VERSION,
    releaseLockChecksum,
    imageAppTarget: IMAGE_APP_HANDOFF_CONSUMER_TARGET,
    videoAppTarget: VIDEO_APP_HANDOFF_CONSUMER_TARGET,
    consumableAssetMap: buildConsumableAssetMap(),
    frozenAt,
  };
}

function auditReleaseLock(
  projectRoot: string,
  releaseLock: DatasetReleaseLock | null
): ReleaseConsumptionReadinessViolation[] {
  const violations: ReleaseConsumptionReadinessViolation[] = [];
  const lockReport = loadDatasetReleaseLockReport(projectRoot);

  if (!releaseLock) {
    violations.push({
      code: 'FAIL_RELEASE_LOCK',
      message: 'dataset-release-lock.json not found',
      field: DATASET_RELEASE_LOCK_JSON_PATH,
    });
    return violations;
  }

  if (!lockReport) {
    violations.push({
      code: 'FAIL_RELEASE_LOCK',
      message: 'dataset-release-lock-report.json not found',
      field: 'exports/dataset-release-lock-report.json',
    });
  } else if (lockReport.auditResult !== 'PASS') {
    violations.push({
      code: 'FAIL_RELEASE_LOCK',
      message: `Release lock audit result is ${lockReport.auditResult}`,
      field: 'dataset-release-lock-report.auditResult',
    });
  }

  if (releaseLock.release_locked !== true) {
    violations.push({
      code: 'FAIL_RELEASE_LOCK',
      message: 'Release lock release_locked must be true',
      field: 'release_locked',
    });
  }

  if (releaseLock.lock_version !== 'DATASET-RELEASE-LOCK-PHASE-69-v1') {
    violations.push({
      code: 'FAIL_RELEASE_LOCK',
      message: 'Invalid release lock version',
      field: 'lock_version',
    });
  }

  return violations;
}

function auditImageAppHandoffConsumption(
  projectRoot: string
): ReleaseConsumptionReadinessViolation[] {
  const violations: ReleaseConsumptionReadinessViolation[] = [];
  const handoff = loadImageAppHandoffPackage(projectRoot);

  if (!handoff) {
    violations.push({
      code: 'FAIL_IMAGE_APP_CONSUMPTION',
      message: 'Image app handoff package not readable',
      field: IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
    });
    return violations;
  }

  if (handoff.handoff_metadata.handoff_type !== 'image_app') {
    violations.push({
      code: 'FAIL_IMAGE_APP_CONSUMPTION',
      message: 'Image handoff must be image_app type for consumption',
      field: 'handoff_metadata.handoff_type',
    });
  }

  if (handoff.handoff_metadata.consumer_target !== IMAGE_APP_HANDOFF_CONSUMER_TARGET) {
    violations.push({
      code: 'FAIL_IMAGE_APP_CONSUMPTION',
      message: 'Image handoff consumer_target mismatch',
      field: 'handoff_metadata.consumer_target',
    });
  }

  if (handoff.quality_reference.auditResult !== 'PASS') {
    violations.push({
      code: 'FAIL_IMAGE_APP_CONSUMPTION',
      message: 'Image handoff quality reference must PASS for consumption',
      field: 'quality_reference.auditResult',
    });
  }

  for (const asset of handoff.manifest.assets) {
    if (!fileExists(projectRoot, asset.path)) {
      violations.push({
        code: 'FAIL_IMAGE_APP_CONSUMPTION',
        message: `Image handoff manifest asset missing: ${asset.path}`,
        field: 'manifest.assets',
      });
    }
  }

  return violations;
}

function auditVideoAppHandoffConsumption(
  projectRoot: string
): ReleaseConsumptionReadinessViolation[] {
  const violations: ReleaseConsumptionReadinessViolation[] = [];
  const handoff = loadVideoAppHandoffPackage(projectRoot);

  if (!handoff) {
    violations.push({
      code: 'FAIL_VIDEO_APP_CONSUMPTION',
      message: 'Video app handoff package not readable',
      field: VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
    });
    return violations;
  }

  if (handoff.handoff_metadata.handoff_type !== 'video_app') {
    violations.push({
      code: 'FAIL_VIDEO_APP_CONSUMPTION',
      message: 'Video handoff must be video_app type for consumption',
      field: 'handoff_metadata.handoff_type',
    });
  }

  if (handoff.handoff_metadata.consumer_target !== VIDEO_APP_HANDOFF_CONSUMER_TARGET) {
    violations.push({
      code: 'FAIL_VIDEO_APP_CONSUMPTION',
      message: 'Video handoff consumer_target mismatch',
      field: 'handoff_metadata.consumer_target',
    });
  }

  if (handoff.quality_reference.auditResult !== 'PASS') {
    violations.push({
      code: 'FAIL_VIDEO_APP_CONSUMPTION',
      message: 'Video handoff quality reference must PASS for consumption',
      field: 'quality_reference.auditResult',
    });
  }

  for (const asset of handoff.manifest.assets) {
    if (!fileExists(projectRoot, asset.path)) {
      violations.push({
        code: 'FAIL_VIDEO_APP_CONSUMPTION',
        message: `Video handoff manifest asset missing: ${asset.path}`,
        field: 'manifest.assets',
      });
    }
  }

  return violations;
}

function auditImageExportRead(projectRoot: string): ReleaseConsumptionReadinessViolation[] {
  const violations: ReleaseConsumptionReadinessViolation[] = [];
  const exportData = loadImageDatasetExport(projectRoot);

  if (!exportData) {
    violations.push({
      code: 'FAIL_IMAGE_EXPORT_READ',
      message: 'image-dataset-export.json not readable',
      field: IMAGE_DATASET_EXPORT_JSON_PATH,
    });
    return violations;
  }

  if (exportData.export_metadata.export_type !== 'image_dataset') {
    violations.push({
      code: 'FAIL_IMAGE_EXPORT_READ',
      message: 'Image export export_type must be image_dataset',
      field: 'export_metadata.export_type',
    });
  }

  if (exportData.export_metadata.active_export !== 'image_dataset') {
    violations.push({
      code: 'FAIL_IMAGE_EXPORT_READ',
      message: 'Image export active_export must be image_dataset',
      field: 'export_metadata.active_export',
    });
  }

  if (exportData.scene_records.length === 0) {
    violations.push({
      code: 'FAIL_IMAGE_EXPORT_READ',
      message: 'Image export scene_records must not be empty',
      field: 'scene_records',
    });
  }

  if (exportData.dataset_index.length !== exportData.scene_records.length) {
    violations.push({
      code: 'FAIL_IMAGE_EXPORT_READ',
      message: 'Image export dataset_index length mismatch',
      field: 'dataset_index',
    });
  }

  return violations;
}

function auditVideoExportRead(projectRoot: string): ReleaseConsumptionReadinessViolation[] {
  const violations: ReleaseConsumptionReadinessViolation[] = [];
  const exportData = loadVideoDatasetExport(projectRoot);

  if (!exportData) {
    violations.push({
      code: 'FAIL_VIDEO_EXPORT_READ',
      message: 'video-dataset-export.json not readable',
      field: VIDEO_DATASET_EXPORT_JSON_PATH,
    });
    return violations;
  }

  if (exportData.export_metadata.export_type !== 'video_dataset') {
    violations.push({
      code: 'FAIL_VIDEO_EXPORT_READ',
      message: 'Video export export_type must be video_dataset',
      field: 'export_metadata.export_type',
    });
  }

  if (exportData.export_metadata.active_export !== 'video_dataset') {
    violations.push({
      code: 'FAIL_VIDEO_EXPORT_READ',
      message: 'Video export active_export must be video_dataset',
      field: 'export_metadata.active_export',
    });
  }

  if (exportData.scene_records.length === 0) {
    violations.push({
      code: 'FAIL_VIDEO_EXPORT_READ',
      message: 'Video export scene_records must not be empty',
      field: 'scene_records',
    });
  }

  if (exportData.dataset_index.length !== exportData.scene_records.length) {
    violations.push({
      code: 'FAIL_VIDEO_EXPORT_READ',
      message: 'Video export dataset_index length mismatch',
      field: 'dataset_index',
    });
  }

  return violations;
}

function auditChecksumIntegrity(
  projectRoot: string,
  releaseLock: DatasetReleaseLock | null
): ReleaseConsumptionReadinessViolation[] {
  const violations: ReleaseConsumptionReadinessViolation[] = [];

  if (!releaseLock) return violations;

  for (const asset of releaseLock.locked_assets) {
    const currentChecksum = computeFileChecksum(projectRoot, asset.path);
    if (!currentChecksum) {
      violations.push({
        code: 'FAIL_CHECKSUM_INTEGRITY',
        message: `Locked asset not readable for checksum: ${asset.path}`,
        field: asset.path,
      });
      continue;
    }

    if (currentChecksum !== asset.checksum) {
      violations.push({
        code: 'FAIL_CHECKSUM_INTEGRITY',
        message: `Checksum mismatch for locked asset: ${asset.path}`,
        field: asset.path,
      });
    }
  }

  return violations;
}

function auditTargetMappingIntegrity(
  projectRoot: string,
  releaseLock: DatasetReleaseLock | null
): ReleaseConsumptionReadinessViolation[] {
  const violations: ReleaseConsumptionReadinessViolation[] = [];
  const assetMap = buildConsumableAssetMap();
  const imageHandoff = loadImageAppHandoffPackage(projectRoot);
  const videoHandoff = loadVideoAppHandoffPackage(projectRoot);

  const imageLockedHandoff = releaseLock?.locked_assets.find(
    (asset) => asset.asset_id === 'image_app_handoff'
  );
  const videoLockedHandoff = releaseLock?.locked_assets.find(
    (asset) => asset.asset_id === 'video_app_handoff'
  );
  const imageLockedExport = releaseLock?.locked_assets.find(
    (asset) => asset.asset_id === 'image_dataset_export'
  );
  const videoLockedExport = releaseLock?.locked_assets.find(
    (asset) => asset.asset_id === 'video_dataset_export'
  );

  if (imageLockedHandoff?.path !== assetMap[IMAGE_APP_HANDOFF_CONSUMER_TARGET].handoff_package) {
    violations.push({
      code: 'FAIL_TARGET_MAPPING',
      message: 'Image app target handoff_package mapping mismatch with release lock',
      field: 'consumableAssetMap.image_app_v17_handoff.handoff_package',
    });
  }

  if (videoLockedHandoff?.path !== assetMap[VIDEO_APP_HANDOFF_CONSUMER_TARGET].handoff_package) {
    violations.push({
      code: 'FAIL_TARGET_MAPPING',
      message: 'Video app target handoff_package mapping mismatch with release lock',
      field: 'consumableAssetMap.video_app_v82_6_handoff.handoff_package',
    });
  }

  if (imageLockedExport?.path !== assetMap[IMAGE_APP_HANDOFF_CONSUMER_TARGET].dataset_export) {
    violations.push({
      code: 'FAIL_TARGET_MAPPING',
      message: 'Image app target dataset_export mapping mismatch with release lock',
      field: 'consumableAssetMap.image_app_v17_handoff.dataset_export',
    });
  }

  if (videoLockedExport?.path !== assetMap[VIDEO_APP_HANDOFF_CONSUMER_TARGET].dataset_export) {
    violations.push({
      code: 'FAIL_TARGET_MAPPING',
      message: 'Video app target dataset_export mapping mismatch with release lock',
      field: 'consumableAssetMap.video_app_v82_6_handoff.dataset_export',
    });
  }

  if (
    imageHandoff &&
    imageHandoff.export_reference.path !== assetMap[IMAGE_APP_HANDOFF_CONSUMER_TARGET].dataset_export
  ) {
    violations.push({
      code: 'FAIL_TARGET_MAPPING',
      message: 'Image handoff export_reference does not map to consumable dataset export',
      field: 'export_reference.path',
    });
  }

  if (
    videoHandoff &&
    videoHandoff.export_reference.path !== assetMap[VIDEO_APP_HANDOFF_CONSUMER_TARGET].dataset_export
  ) {
    violations.push({
      code: 'FAIL_TARGET_MAPPING',
      message: 'Video handoff export_reference does not map to consumable dataset export',
      field: 'export_reference.path',
    });
  }

  if (
    imageHandoff &&
    imageHandoff.quality_reference.path !==
      assetMap[IMAGE_APP_HANDOFF_CONSUMER_TARGET].quality_report
  ) {
    violations.push({
      code: 'FAIL_TARGET_MAPPING',
      message: 'Image handoff quality_reference does not map to consumable quality report',
      field: 'quality_reference.path',
    });
  }

  if (
    videoHandoff &&
    videoHandoff.quality_reference.path !==
      assetMap[VIDEO_APP_HANDOFF_CONSUMER_TARGET].quality_report
  ) {
    violations.push({
      code: 'FAIL_TARGET_MAPPING',
      message: 'Video handoff quality_reference does not map to consumable quality report',
      field: 'quality_reference.path',
    });
  }

  return violations;
}

function computeReadinessFlags(violations: ReleaseConsumptionReadinessViolation[]): Pick<
  ReleaseConsumptionReadinessReport,
  'image_app_ready' | 'video_app_ready' | 'release_consumption_ready'
> {
  const imageCodes: ReleaseConsumptionReadinessAuditResult[] = [
    'FAIL_RELEASE_LOCK',
    'FAIL_IMAGE_APP_CONSUMPTION',
    'FAIL_IMAGE_EXPORT_READ',
    'FAIL_CHECKSUM_INTEGRITY',
    'FAIL_TARGET_MAPPING',
  ];
  const videoCodes: ReleaseConsumptionReadinessAuditResult[] = [
    'FAIL_RELEASE_LOCK',
    'FAIL_VIDEO_APP_CONSUMPTION',
    'FAIL_VIDEO_EXPORT_READ',
    'FAIL_CHECKSUM_INTEGRITY',
    'FAIL_TARGET_MAPPING',
  ];

  const hasCode = (codes: ReleaseConsumptionReadinessAuditResult[]) =>
    violations.some((violation) => codes.includes(violation.code));

  const image_app_ready = !hasCode(imageCodes);
  const video_app_ready = !hasCode(videoCodes);
  const release_consumption_ready =
    image_app_ready && video_app_ready && violations.length === 0;

  return { image_app_ready, video_app_ready, release_consumption_ready };
}

function primaryFailure(
  violations: ReleaseConsumptionReadinessViolation[]
): ReleaseConsumptionReadinessAuditResult {
  const priority: ReleaseConsumptionReadinessAuditResult[] = [
    'FAIL_RELEASE_LOCK',
    'FAIL_CHECKSUM_INTEGRITY',
    'FAIL_TARGET_MAPPING',
    'FAIL_IMAGE_EXPORT_READ',
    'FAIL_VIDEO_EXPORT_READ',
    'FAIL_IMAGE_APP_CONSUMPTION',
    'FAIL_VIDEO_APP_CONSUMPTION',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditReleaseConsumptionReadiness(
  projectRoot: string
): ReleaseConsumptionReadinessViolation[] {
  const releaseLock = loadDatasetReleaseLock(projectRoot);
  const violations: ReleaseConsumptionReadinessViolation[] = [];

  violations.push(...auditReleaseLock(projectRoot, releaseLock));
  violations.push(...auditChecksumIntegrity(projectRoot, releaseLock));
  violations.push(...auditTargetMappingIntegrity(projectRoot, releaseLock));
  violations.push(...auditImageExportRead(projectRoot));
  violations.push(...auditVideoExportRead(projectRoot));
  violations.push(...auditImageAppHandoffConsumption(projectRoot));
  violations.push(...auditVideoAppHandoffConsumption(projectRoot));

  return violations;
}

export function writeReleaseConsumptionReadinessReport(
  projectRoot: string,
  report: ReleaseConsumptionReadinessReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function writeReleaseConsumptionReadinessFingerprint(
  projectRoot: string,
  fingerprint: ReleaseConsumptionReadinessFingerprint
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const fingerprintPath = path.join(exportsDir, FINGERPRINT_FILE);
  fs.writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  return fingerprintPath;
}

export function runReleaseConsumptionReadinessAudit(
  projectRoot: string
): ReleaseConsumptionReadinessReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditReleaseConsumptionReadiness(projectRoot);
  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);
  const readiness = computeReadinessFlags(violations);

  const report: ReleaseConsumptionReadinessReport = {
    auditTimestamp,
    auditResult,
    violations,
    ...readiness,
    release_consumption_ready: auditResult === 'PASS' && readiness.release_consumption_ready,
  };

  writeReleaseConsumptionReadinessReport(projectRoot, report);

  const fingerprint = buildReleaseConsumptionReadinessFingerprint(projectRoot, auditTimestamp);
  if (fingerprint) {
    writeReleaseConsumptionReadinessFingerprint(projectRoot, fingerprint);
  }

  return report;
}
