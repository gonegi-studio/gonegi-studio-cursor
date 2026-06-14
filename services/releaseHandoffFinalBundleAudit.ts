import fs from 'node:fs';
import path from 'node:path';
import { loadDatasetReleaseLock } from './datasetReleaseLock.js';
import { type DatasetReleaseLockReport } from './datasetReleaseLockAudit.js';
import { IMAGE_DATASET_EXPORT_JSON_PATH } from './imageDatasetExport.js';
import {
  FORBIDDEN_IMAGE_HANDOFF_ASSET_PATHS,
  IMAGE_APP_HANDOFF_CONSUMER_TARGET,
  IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
  loadImageAppHandoffPackage,
} from './imageAppHandoffPackage.js';
import { RELEASE_CERTIFICATION_VERSION } from './releaseCertificationReport.js';
import {
  FINAL_BUNDLE_ASSETS,
  buildReleaseHandoffFinalBundle,
  computeFinalBundleChecksums,
  loadReleaseCertificationReport,
  loadReleaseHandoffFinalBundle,
  writeReleaseHandoffFinalBundle,
  type ReleaseHandoffFinalBundle,
} from './releaseHandoffFinalBundle.js';
import { VIDEO_DATASET_EXPORT_JSON_PATH } from './videoDatasetExport.js';
import {
  FORBIDDEN_HANDOFF_ASSET_PATHS,
  VIDEO_APP_HANDOFF_CONSUMER_TARGET,
  VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
  loadVideoAppHandoffPackage,
} from './videoAppHandoffPackage.js';

export type ReleaseHandoffFinalBundleAuditResult =
  | 'PASS'
  | 'FAIL_CERTIFICATION'
  | 'FAIL_RELEASE_LOCK'
  | 'FAIL_REQUIRED_ASSET'
  | 'FAIL_CHECKSUM_INTEGRITY'
  | 'FAIL_TARGET_INTEGRITY'
  | 'FAIL_CROSS_DOMAIN_ASSET';

export interface ReleaseHandoffFinalBundleViolation {
  code: ReleaseHandoffFinalBundleAuditResult;
  message: string;
  field?: string;
}

export interface ReleaseHandoffFinalBundleReport {
  auditTimestamp: string;
  auditResult: ReleaseHandoffFinalBundleAuditResult;
  violations: ReleaseHandoffFinalBundleViolation[];
}

const REPORT_FILE = 'release-handoff-final-bundle-report.json';

function fileExists(projectRoot: string, relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function loadDatasetReleaseLockReport(projectRoot: string): DatasetReleaseLockReport | null {
  const reportPath = path.join(projectRoot, 'exports', 'dataset-release-lock-report.json');
  if (!fs.existsSync(reportPath)) return null;
  return JSON.parse(fs.readFileSync(reportPath, 'utf8')) as DatasetReleaseLockReport;
}

function auditCertification(projectRoot: string): ReleaseHandoffFinalBundleViolation[] {
  const violations: ReleaseHandoffFinalBundleViolation[] = [];
  const certification = loadReleaseCertificationReport(projectRoot);

  if (!certification) {
    violations.push({
      code: 'FAIL_CERTIFICATION',
      message: 'release-certification-report.json not found',
      field: 'exports/release-certification-report.json',
    });
    return violations;
  }

  if (certification.certification_version !== RELEASE_CERTIFICATION_VERSION) {
    violations.push({
      code: 'FAIL_CERTIFICATION',
      message: 'Release certification version mismatch',
      field: 'certification_version',
    });
  }

  if (certification.audit_result !== 'PASS') {
    violations.push({
      code: 'FAIL_CERTIFICATION',
      message: `Release certification audit_result is ${certification.audit_result}`,
      field: 'audit_result',
    });
  }

  if (certification.certified !== true) {
    violations.push({
      code: 'FAIL_CERTIFICATION',
      message: 'Release certification certified flag must be true',
      field: 'certified',
    });
  }

  if (!certification.dual_dataset_release_ready) {
    violations.push({
      code: 'FAIL_CERTIFICATION',
      message: 'Dual dataset release must be ready for final bundle',
      field: 'dual_dataset_release_ready',
    });
  }

  return violations;
}

function auditReleaseLock(projectRoot: string): ReleaseHandoffFinalBundleViolation[] {
  const violations: ReleaseHandoffFinalBundleViolation[] = [];
  const lockReport = loadDatasetReleaseLockReport(projectRoot);
  const releaseLock = loadDatasetReleaseLock(projectRoot);

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

  if (!releaseLock) {
    violations.push({
      code: 'FAIL_RELEASE_LOCK',
      message: 'dataset-release-lock.json not found',
      field: 'exports/dataset-release-lock.json',
    });
  } else if (releaseLock.release_locked !== true) {
    violations.push({
      code: 'FAIL_RELEASE_LOCK',
      message: 'Release lock release_locked must be true',
      field: 'release_locked',
    });
  }

  return violations;
}

function auditRequiredBundleAssets(projectRoot: string): ReleaseHandoffFinalBundleViolation[] {
  const violations: ReleaseHandoffFinalBundleViolation[] = [];

  for (const asset of FINAL_BUNDLE_ASSETS) {
    if (!fileExists(projectRoot, asset.path)) {
      violations.push({
        code: 'FAIL_REQUIRED_ASSET',
        message: `Required bundle asset missing: ${asset.path}`,
        field: asset.path,
      });
    }
  }

  return violations;
}

function auditChecksumIntegrity(
  projectRoot: string,
  bundle: ReleaseHandoffFinalBundle,
  frozenBundle: ReleaseHandoffFinalBundle | null,
  releaseLock: ReturnType<typeof loadDatasetReleaseLock>
): ReleaseHandoffFinalBundleViolation[] {
  const violations: ReleaseHandoffFinalBundleViolation[] = [];
  const currentChecksums = computeFinalBundleChecksums(projectRoot);

  for (const asset of FINAL_BUNDLE_ASSETS) {
    const current = currentChecksums[asset.path];
    const bundled = bundle.checksums[asset.path];

    if (!current) {
      violations.push({
        code: 'FAIL_CHECKSUM_INTEGRITY',
        message: `Unable to compute checksum for bundle asset: ${asset.path}`,
        field: asset.path,
      });
      continue;
    }

    if (bundled !== current) {
      violations.push({
        code: 'FAIL_CHECKSUM_INTEGRITY',
        message: `Bundle checksum mismatch for ${asset.path}`,
        field: `checksums.${asset.path}`,
      });
    }

    const lockedAsset = releaseLock?.locked_assets.find((item) => item.path === asset.path);
    if (lockedAsset && lockedAsset.checksum !== current) {
      violations.push({
        code: 'FAIL_CHECKSUM_INTEGRITY',
        message: `Bundle asset checksum drift from release lock: ${asset.path}`,
        field: asset.path,
      });
    }
  }

  if (frozenBundle) {
    for (const asset of FINAL_BUNDLE_ASSETS) {
      const frozen = frozenBundle.checksums[asset.path];
      const current = currentChecksums[asset.path];
      if (frozen && current && frozen !== current) {
        violations.push({
          code: 'FAIL_CHECKSUM_INTEGRITY',
          message: `Frozen bundle checksum drift detected: ${asset.path}`,
          field: `checksums.${asset.path}`,
        });
      }
    }
  }

  return violations;
}

function auditTargetIntegrity(
  projectRoot: string,
  bundle: ReleaseHandoffFinalBundle
): ReleaseHandoffFinalBundleViolation[] {
  const violations: ReleaseHandoffFinalBundleViolation[] = [];
  const imageHandoff = loadImageAppHandoffPackage(projectRoot);
  const videoHandoff = loadVideoAppHandoffPackage(projectRoot);
  const certification = loadReleaseCertificationReport(projectRoot);

  if (bundle.image_app_ready !== true) {
    violations.push({
      code: 'FAIL_TARGET_INTEGRITY',
      message: 'Final bundle image_app_ready must be true',
      field: 'image_app_ready',
    });
  }

  if (bundle.video_app_ready !== true) {
    violations.push({
      code: 'FAIL_TARGET_INTEGRITY',
      message: 'Final bundle video_app_ready must be true',
      field: 'video_app_ready',
    });
  }

  if (certification && bundle.image_app_ready !== certification.image_app_ready) {
    violations.push({
      code: 'FAIL_TARGET_INTEGRITY',
      message: 'Bundle image_app_ready does not match certification report',
      field: 'image_app_ready',
    });
  }

  if (certification && bundle.video_app_ready !== certification.video_app_ready) {
    violations.push({
      code: 'FAIL_TARGET_INTEGRITY',
      message: 'Bundle video_app_ready does not match certification report',
      field: 'video_app_ready',
    });
  }

  if (imageHandoff?.handoff_metadata.consumer_target !== IMAGE_APP_HANDOFF_CONSUMER_TARGET) {
    violations.push({
      code: 'FAIL_TARGET_INTEGRITY',
      message: 'Image handoff consumer target mismatch in final bundle',
      field: 'handoff_metadata.consumer_target',
    });
  }

  if (videoHandoff?.handoff_metadata.consumer_target !== VIDEO_APP_HANDOFF_CONSUMER_TARGET) {
    violations.push({
      code: 'FAIL_TARGET_INTEGRITY',
      message: 'Video handoff consumer target mismatch in final bundle',
      field: 'handoff_metadata.consumer_target',
    });
  }

  if (imageHandoff?.export_reference.path !== IMAGE_DATASET_EXPORT_JSON_PATH) {
    violations.push({
      code: 'FAIL_TARGET_INTEGRITY',
      message: 'Image handoff export reference mismatch in final bundle',
      field: 'export_reference.path',
    });
  }

  if (videoHandoff?.export_reference.path !== VIDEO_DATASET_EXPORT_JSON_PATH) {
    violations.push({
      code: 'FAIL_TARGET_INTEGRITY',
      message: 'Video handoff export reference mismatch in final bundle',
      field: 'export_reference.path',
    });
  }

  return violations;
}

function auditCrossDomainAssets(projectRoot: string): ReleaseHandoffFinalBundleViolation[] {
  const violations: ReleaseHandoffFinalBundleViolation[] = [];
  const imageHandoff = loadImageAppHandoffPackage(projectRoot);
  const videoHandoff = loadVideoAppHandoffPackage(projectRoot);

  const bundlePathSet = new Set(FINAL_BUNDLE_ASSETS.map((asset) => asset.path));
  if (bundlePathSet.size !== FINAL_BUNDLE_ASSETS.length) {
    violations.push({
      code: 'FAIL_CROSS_DOMAIN_ASSET',
      message: 'Final bundle asset list contains duplicate paths',
      field: 'bundle_assets',
    });
  }

  for (const asset of imageHandoff?.manifest.assets ?? []) {
    if (FORBIDDEN_IMAGE_HANDOFF_ASSET_PATHS.includes(asset.path as (typeof FORBIDDEN_IMAGE_HANDOFF_ASSET_PATHS)[number])) {
      violations.push({
        code: 'FAIL_CROSS_DOMAIN_ASSET',
        message: `Image handoff contains cross-domain asset: ${asset.path}`,
        field: 'manifest.assets',
      });
    }
    if (asset.path === VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH) {
      violations.push({
        code: 'FAIL_CROSS_DOMAIN_ASSET',
        message: 'Image handoff must not bundle video app handoff package',
        field: 'manifest.assets',
      });
    }
  }

  for (const asset of videoHandoff?.manifest.assets ?? []) {
    if (FORBIDDEN_HANDOFF_ASSET_PATHS.includes(asset.path as (typeof FORBIDDEN_HANDOFF_ASSET_PATHS)[number])) {
      violations.push({
        code: 'FAIL_CROSS_DOMAIN_ASSET',
        message: `Video handoff contains cross-domain asset: ${asset.path}`,
        field: 'manifest.assets',
      });
    }
    if (asset.path === IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH) {
      violations.push({
        code: 'FAIL_CROSS_DOMAIN_ASSET',
        message: 'Video handoff must not bundle image app handoff package',
        field: 'manifest.assets',
      });
    }
  }

  if (imageHandoff?.handoff_metadata.video_app_handoff_included !== false) {
    violations.push({
      code: 'FAIL_CROSS_DOMAIN_ASSET',
      message: 'Image handoff must not include video app handoff',
      field: 'handoff_metadata.video_app_handoff_included',
    });
  }

  if (videoHandoff?.handoff_metadata.image_app_handoff_included !== false) {
    violations.push({
      code: 'FAIL_CROSS_DOMAIN_ASSET',
      message: 'Video handoff must not include image app handoff',
      field: 'handoff_metadata.image_app_handoff_included',
    });
  }

  return violations;
}

function primaryFailure(
  violations: ReleaseHandoffFinalBundleViolation[]
): ReleaseHandoffFinalBundleAuditResult {
  const priority: ReleaseHandoffFinalBundleAuditResult[] = [
    'FAIL_CROSS_DOMAIN_ASSET',
    'FAIL_CHECKSUM_INTEGRITY',
    'FAIL_TARGET_INTEGRITY',
    'FAIL_REQUIRED_ASSET',
    'FAIL_CERTIFICATION',
    'FAIL_RELEASE_LOCK',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditReleaseHandoffFinalBundle(
  projectRoot: string,
  bundle: ReleaseHandoffFinalBundle,
  frozenBundle: ReleaseHandoffFinalBundle | null
): ReleaseHandoffFinalBundleViolation[] {
  const releaseLock = loadDatasetReleaseLock(projectRoot);
  const violations: ReleaseHandoffFinalBundleViolation[] = [];

  violations.push(...auditCertification(projectRoot));
  violations.push(...auditReleaseLock(projectRoot));
  violations.push(...auditRequiredBundleAssets(projectRoot));
  violations.push(...auditChecksumIntegrity(projectRoot, bundle, frozenBundle, releaseLock));
  violations.push(...auditTargetIntegrity(projectRoot, bundle));
  violations.push(...auditCrossDomainAssets(projectRoot));

  if (bundle.certified !== true && violations.length === 0) {
    violations.push({
      code: 'FAIL_CERTIFICATION',
      message: 'Final bundle certified flag must be true',
      field: 'certified',
    });
  }

  return violations;
}

export function writeReleaseHandoffFinalBundleReport(
  projectRoot: string,
  report: ReleaseHandoffFinalBundleReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runReleaseHandoffFinalBundleAudit(
  projectRoot: string
): ReleaseHandoffFinalBundleReport {
  const auditTimestamp = new Date().toISOString();
  const certification = loadReleaseCertificationReport(projectRoot);
  const frozenBundle = loadReleaseHandoffFinalBundle(projectRoot);
  const bundle = buildReleaseHandoffFinalBundle(projectRoot, certification);

  const violations = auditReleaseHandoffFinalBundle(projectRoot, bundle, frozenBundle);
  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  if (auditResult === 'PASS') {
    writeReleaseHandoffFinalBundle(projectRoot, bundle);
  }

  const report: ReleaseHandoffFinalBundleReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeReleaseHandoffFinalBundleReport(projectRoot, report);
  return report;
}
