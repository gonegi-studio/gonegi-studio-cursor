import fs from 'node:fs';
import path from 'node:path';
import { IMAGE_DATASET_EXPORT_JSON_PATH } from './imageDatasetExport.js';
import {
  IMAGE_APP_HANDOFF_CONSUMER_TARGET,
  IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
  IMAGE_DATASET_QUALITY_REPORT_JSON_PATH,
  loadImageAppHandoffPackage,
  type ImageAppHandoffManifestAsset,
} from './imageAppHandoffPackage.js';
import { VIDEO_DATASET_EXPORT_JSON_PATH } from './videoDatasetExport.js';
import {
  VIDEO_APP_HANDOFF_CONSUMER_TARGET,
  VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
  VIDEO_DATASET_QUALITY_REPORT_JSON_PATH,
  loadVideoAppHandoffPackage,
  type VideoAppHandoffManifestAsset,
} from './videoAppHandoffPackage.js';

export const APP_HANDOFF_CONTRACT_FINGERPRINT_SCHEMA_VERSION =
  'APP-HANDOFF-CONTRACT-FINGERPRINT-PHASE-72-v1' as const;

export type AppHandoffContractFreezeAuditResult =
  | 'PASS'
  | 'FAIL_IMAGE_HANDOFF_DRIFT'
  | 'FAIL_VIDEO_HANDOFF_DRIFT'
  | 'FAIL_EXPORT_PATH_DRIFT'
  | 'FAIL_QUALITY_PATH_DRIFT'
  | 'FAIL_MANIFEST_ASSET_DRIFT'
  | 'FAIL_TARGET_APP_DRIFT';

export interface AppHandoffContractFreezeViolation {
  code: AppHandoffContractFreezeAuditResult;
  message: string;
  field?: string;
}

export interface AppHandoffContractFreezeReport {
  auditTimestamp: string;
  auditResult: AppHandoffContractFreezeAuditResult;
  violations: AppHandoffContractFreezeViolation[];
}

export interface AppHandoffContractSnapshot {
  schema_version: string;
  handoff_type: string;
  consumer_target: string;
  manifest_id: string;
  package_json_path: string;
}

export interface AppHandoffContractFingerprint {
  schemaVersion: typeof APP_HANDOFF_CONTRACT_FINGERPRINT_SCHEMA_VERSION;
  imageAppTarget: typeof IMAGE_APP_HANDOFF_CONSUMER_TARGET;
  videoAppTarget: typeof VIDEO_APP_HANDOFF_CONSUMER_TARGET;
  handoffPaths: {
    image: typeof IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH;
    video: typeof VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH;
  };
  exportPaths: {
    image: typeof IMAGE_DATASET_EXPORT_JSON_PATH;
    video: typeof VIDEO_DATASET_EXPORT_JSON_PATH;
  };
  qualityPaths: {
    image: typeof IMAGE_DATASET_QUALITY_REPORT_JSON_PATH;
    video: typeof VIDEO_DATASET_QUALITY_REPORT_JSON_PATH;
  };
  manifestAssets: {
    image: ImageAppHandoffManifestAsset[];
    video: VideoAppHandoffManifestAsset[];
  };
  imageHandoffContract: AppHandoffContractSnapshot;
  videoHandoffContract: AppHandoffContractSnapshot;
  frozenAt: string;
}

const FINGERPRINT_FILE = 'app-handoff-contract-fingerprint.json';
const REPORT_FILE = 'app-handoff-contract-freeze-report.json';

function sortedManifestAssets<T extends { asset_id: string; path: string; role: string }>(
  assets: readonly T[]
): T[] {
  return [...assets].sort((left, right) => left.asset_id.localeCompare(right.asset_id));
}

function manifestAssetsEqual<T extends { asset_id: string; path: string; role: string }>(
  left: readonly T[],
  right: readonly T[]
): boolean {
  const leftSorted = sortedManifestAssets(left);
  const rightSorted = sortedManifestAssets(right);

  if (leftSorted.length !== rightSorted.length) return false;

  return leftSorted.every(
    (asset, index) =>
      asset.asset_id === rightSorted[index]?.asset_id &&
      asset.path === rightSorted[index]?.path &&
      asset.role === rightSorted[index]?.role
  );
}

export function buildAppHandoffContractFingerprint(
  projectRoot: string,
  frozenAt: string
): AppHandoffContractFingerprint | null {
  const imageHandoff = loadImageAppHandoffPackage(projectRoot);
  const videoHandoff = loadVideoAppHandoffPackage(projectRoot);

  if (!imageHandoff || !videoHandoff) return null;

  return {
    schemaVersion: APP_HANDOFF_CONTRACT_FINGERPRINT_SCHEMA_VERSION,
    imageAppTarget: IMAGE_APP_HANDOFF_CONSUMER_TARGET,
    videoAppTarget: VIDEO_APP_HANDOFF_CONSUMER_TARGET,
    handoffPaths: {
      image: IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
      video: VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
    },
    exportPaths: {
      image: IMAGE_DATASET_EXPORT_JSON_PATH,
      video: VIDEO_DATASET_EXPORT_JSON_PATH,
    },
    qualityPaths: {
      image: IMAGE_DATASET_QUALITY_REPORT_JSON_PATH,
      video: VIDEO_DATASET_QUALITY_REPORT_JSON_PATH,
    },
    manifestAssets: {
      image: sortedManifestAssets(imageHandoff.manifest.assets),
      video: sortedManifestAssets(videoHandoff.manifest.assets),
    },
    imageHandoffContract: {
      schema_version: imageHandoff.handoff_metadata.schema_version,
      handoff_type: imageHandoff.handoff_metadata.handoff_type,
      consumer_target: imageHandoff.handoff_metadata.consumer_target,
      manifest_id: imageHandoff.manifest.manifest_id,
      package_json_path: imageHandoff.handoff_metadata.package_json_path,
    },
    videoHandoffContract: {
      schema_version: videoHandoff.handoff_metadata.schema_version,
      handoff_type: videoHandoff.handoff_metadata.handoff_type,
      consumer_target: videoHandoff.handoff_metadata.consumer_target,
      manifest_id: videoHandoff.manifest.manifest_id,
      package_json_path: videoHandoff.handoff_metadata.package_json_path,
    },
    frozenAt,
  };
}

export function compareAppHandoffContractFingerprints(
  current: AppHandoffContractFingerprint,
  frozen: AppHandoffContractFingerprint
): AppHandoffContractFreezeViolation[] {
  const violations: AppHandoffContractFreezeViolation[] = [];

  if (current.imageAppTarget !== frozen.imageAppTarget) {
    violations.push({
      code: 'FAIL_TARGET_APP_DRIFT',
      message: `Image app target drift: ${frozen.imageAppTarget} → ${current.imageAppTarget}`,
      field: 'imageAppTarget',
    });
  }

  if (current.videoAppTarget !== frozen.videoAppTarget) {
    violations.push({
      code: 'FAIL_TARGET_APP_DRIFT',
      message: `Video app target drift: ${frozen.videoAppTarget} → ${current.videoAppTarget}`,
      field: 'videoAppTarget',
    });
  }

  if (
    current.imageHandoffContract.consumer_target !== frozen.imageHandoffContract.consumer_target
  ) {
    violations.push({
      code: 'FAIL_TARGET_APP_DRIFT',
      message: 'Image handoff consumer_target drift detected',
      field: 'imageHandoffContract.consumer_target',
    });
  }

  if (
    current.videoHandoffContract.consumer_target !== frozen.videoHandoffContract.consumer_target
  ) {
    violations.push({
      code: 'FAIL_TARGET_APP_DRIFT',
      message: 'Video handoff consumer_target drift detected',
      field: 'videoHandoffContract.consumer_target',
    });
  }

  if (current.exportPaths.image !== frozen.exportPaths.image) {
    violations.push({
      code: 'FAIL_EXPORT_PATH_DRIFT',
      message: `Image export path drift: ${frozen.exportPaths.image} → ${current.exportPaths.image}`,
      field: 'exportPaths.image',
    });
  }

  if (current.exportPaths.video !== frozen.exportPaths.video) {
    violations.push({
      code: 'FAIL_EXPORT_PATH_DRIFT',
      message: `Video export path drift: ${frozen.exportPaths.video} → ${current.exportPaths.video}`,
      field: 'exportPaths.video',
    });
  }

  if (current.qualityPaths.image !== frozen.qualityPaths.image) {
    violations.push({
      code: 'FAIL_QUALITY_PATH_DRIFT',
      message: `Image quality path drift: ${frozen.qualityPaths.image} → ${current.qualityPaths.image}`,
      field: 'qualityPaths.image',
    });
  }

  if (current.qualityPaths.video !== frozen.qualityPaths.video) {
    violations.push({
      code: 'FAIL_QUALITY_PATH_DRIFT',
      message: `Video quality path drift: ${frozen.qualityPaths.video} → ${current.qualityPaths.video}`,
      field: 'qualityPaths.video',
    });
  }

  if (current.handoffPaths.image !== frozen.handoffPaths.image) {
    violations.push({
      code: 'FAIL_IMAGE_HANDOFF_DRIFT',
      message: `Image handoff path drift: ${frozen.handoffPaths.image} → ${current.handoffPaths.image}`,
      field: 'handoffPaths.image',
    });
  }

  if (current.handoffPaths.video !== frozen.handoffPaths.video) {
    violations.push({
      code: 'FAIL_VIDEO_HANDOFF_DRIFT',
      message: `Video handoff path drift: ${frozen.handoffPaths.video} → ${current.handoffPaths.video}`,
      field: 'handoffPaths.video',
    });
  }

  const imageContractFields: Array<keyof AppHandoffContractSnapshot> = [
    'schema_version',
    'handoff_type',
    'manifest_id',
    'package_json_path',
  ];

  for (const field of imageContractFields) {
    if (current.imageHandoffContract[field] !== frozen.imageHandoffContract[field]) {
      violations.push({
        code: 'FAIL_IMAGE_HANDOFF_DRIFT',
        message: `Image handoff contract ${field} drift detected`,
        field: `imageHandoffContract.${field}`,
      });
    }
  }

  const videoContractFields: Array<keyof AppHandoffContractSnapshot> = [
    'schema_version',
    'handoff_type',
    'manifest_id',
    'package_json_path',
  ];

  for (const field of videoContractFields) {
    if (current.videoHandoffContract[field] !== frozen.videoHandoffContract[field]) {
      violations.push({
        code: 'FAIL_VIDEO_HANDOFF_DRIFT',
        message: `Video handoff contract ${field} drift detected`,
        field: `videoHandoffContract.${field}`,
      });
    }
  }

  if (!manifestAssetsEqual(current.manifestAssets.image, frozen.manifestAssets.image)) {
    violations.push({
      code: 'FAIL_MANIFEST_ASSET_DRIFT',
      message: 'Image handoff manifest asset drift detected',
      field: 'manifestAssets.image',
    });
  }

  if (!manifestAssetsEqual(current.manifestAssets.video, frozen.manifestAssets.video)) {
    violations.push({
      code: 'FAIL_MANIFEST_ASSET_DRIFT',
      message: 'Video handoff manifest asset drift detected',
      field: 'manifestAssets.video',
    });
  }

  return violations;
}

function primaryFailure(
  violations: AppHandoffContractFreezeViolation[]
): AppHandoffContractFreezeAuditResult {
  const priority: AppHandoffContractFreezeAuditResult[] = [
    'FAIL_TARGET_APP_DRIFT',
    'FAIL_MANIFEST_ASSET_DRIFT',
    'FAIL_EXPORT_PATH_DRIFT',
    'FAIL_QUALITY_PATH_DRIFT',
    'FAIL_IMAGE_HANDOFF_DRIFT',
    'FAIL_VIDEO_HANDOFF_DRIFT',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function loadAppHandoffContractFingerprint(
  projectRoot: string
): AppHandoffContractFingerprint | null {
  const fingerprintPath = path.join(projectRoot, 'exports', FINGERPRINT_FILE);
  if (!fs.existsSync(fingerprintPath)) return null;
  return JSON.parse(fs.readFileSync(fingerprintPath, 'utf8')) as AppHandoffContractFingerprint;
}

export function writeAppHandoffContractFingerprint(
  projectRoot: string,
  fingerprint: AppHandoffContractFingerprint
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const fingerprintPath = path.join(exportsDir, FINGERPRINT_FILE);
  fs.writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  return fingerprintPath;
}

export function writeAppHandoffContractFreezeReport(
  projectRoot: string,
  report: AppHandoffContractFreezeReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runAppHandoffContractFreezeAudit(
  projectRoot: string
): AppHandoffContractFreezeReport {
  const auditTimestamp = new Date().toISOString();
  const current = buildAppHandoffContractFingerprint(projectRoot, auditTimestamp);
  const frozen = loadAppHandoffContractFingerprint(projectRoot);

  if (!current) {
    const report: AppHandoffContractFreezeReport = {
      auditTimestamp,
      auditResult: 'FAIL_IMAGE_HANDOFF_DRIFT',
      violations: [
        {
          code: 'FAIL_IMAGE_HANDOFF_DRIFT',
          message: 'Unable to read image/video handoff packages for contract freeze',
          field: 'handoffPaths',
        },
      ],
    };
    writeAppHandoffContractFreezeReport(projectRoot, report);
    return report;
  }

  if (!frozen) {
    writeAppHandoffContractFingerprint(projectRoot, current);
    const report: AppHandoffContractFreezeReport = {
      auditTimestamp,
      auditResult: 'PASS',
      violations: [],
    };
    writeAppHandoffContractFreezeReport(projectRoot, report);
    return report;
  }

  const violations = compareAppHandoffContractFingerprints(current, frozen);
  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: AppHandoffContractFreezeReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeAppHandoffContractFreezeReport(projectRoot, report);
  return report;
}
