import fs from 'node:fs';
import path from 'node:path';
import {
  DATASET_RELEASE_MANIFEST_JSON_PATH,
  EXPECTED_RELEASE_ASSET_COUNT,
  buildDatasetReleaseLockFromManifest,
  computeManifestFileChecksum,
  loadDatasetReleaseLock,
  loadReleaseManifestOrNull,
  verifyAssetChecksumsUnchanged,
  verifyReleaseAssetCount,
  writeDatasetReleaseLock,
  type DatasetReleaseLock,
} from './datasetReleaseLock.js';
import { type DatasetReleaseManifest } from './datasetReleaseManifest.js';

export type DatasetReleaseLockAuditResult =
  | 'PASS'
  | 'FAIL_MANIFEST_MISSING'
  | 'FAIL_RELEASE_NOT_READY'
  | 'FAIL_CHECKSUM_DRIFT'
  | 'FAIL_LOCK_INTEGRITY'
  | 'FAIL_DUPLICATE_LOCK_ASSET'
  | 'FAIL_MISSING_LOCK_ASSET';

export interface DatasetReleaseLockViolation {
  code: DatasetReleaseLockAuditResult;
  message: string;
  field?: string;
}

export interface DatasetReleaseLockReport {
  auditTimestamp: string;
  auditResult: DatasetReleaseLockAuditResult;
  violations: DatasetReleaseLockViolation[];
}

const REPORT_FILE = 'dataset-release-lock-report.json';

function fileExists(projectRoot: string, relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function auditManifestPresence(
  projectRoot: string,
  manifest: DatasetReleaseManifest | null
): DatasetReleaseLockViolation[] {
  const violations: DatasetReleaseLockViolation[] = [];

  if (!manifest) {
    violations.push({
      code: 'FAIL_MANIFEST_MISSING',
      message: 'dataset-release-manifest.json not found',
      field: DATASET_RELEASE_MANIFEST_JSON_PATH,
    });
    return violations;
  }

  if (!fileExists(projectRoot, DATASET_RELEASE_MANIFEST_JSON_PATH)) {
    violations.push({
      code: 'FAIL_MANIFEST_MISSING',
      message: 'Release manifest file missing from exports directory',
      field: DATASET_RELEASE_MANIFEST_JSON_PATH,
    });
  }

  return violations;
}

function auditReleaseReady(manifest: DatasetReleaseManifest | null): DatasetReleaseLockViolation[] {
  const violations: DatasetReleaseLockViolation[] = [];

  if (!manifest) return violations;

  if (manifest.release_ready !== true) {
    violations.push({
      code: 'FAIL_RELEASE_NOT_READY',
      message: 'Release manifest release_ready must be true before lock',
      field: 'release_ready',
    });
  }

  if (!verifyReleaseAssetCount(manifest)) {
    violations.push({
      code: 'FAIL_RELEASE_NOT_READY',
      message: `Release manifest must contain ${EXPECTED_RELEASE_ASSET_COUNT} assets`,
      field: 'release_assets',
    });
  }

  return violations;
}

function auditChecksumDrift(
  projectRoot: string,
  manifest: DatasetReleaseManifest | null
): DatasetReleaseLockViolation[] {
  const violations: DatasetReleaseLockViolation[] = [];

  if (!manifest) return violations;

  const driftedPaths = verifyAssetChecksumsUnchanged(projectRoot, manifest);
  for (const assetPath of driftedPaths) {
    violations.push({
      code: 'FAIL_CHECKSUM_DRIFT',
      message: `Asset checksum drift detected: ${assetPath}`,
      field: `checksums.${assetPath}`,
    });
  }

  return violations;
}

function auditLockIntegrity(
  projectRoot: string,
  manifest: DatasetReleaseManifest | null,
  releaseLock: DatasetReleaseLock | null,
  expectLocked: boolean
): DatasetReleaseLockViolation[] {
  const violations: DatasetReleaseLockViolation[] = [];

  if (!manifest || !releaseLock) return violations;

  const currentManifestChecksum = computeManifestFileChecksum(projectRoot);

  if (releaseLock.lock_version !== 'DATASET-RELEASE-LOCK-PHASE-69-v1') {
    violations.push({
      code: 'FAIL_LOCK_INTEGRITY',
      message: 'Invalid lock_version in release lock',
      field: 'lock_version',
    });
  }

  if (currentManifestChecksum && releaseLock.manifest_checksum !== currentManifestChecksum) {
    violations.push({
      code: 'FAIL_LOCK_INTEGRITY',
      message: 'Release lock manifest_checksum does not match manifest file',
      field: 'manifest_checksum',
    });
  }

  if (releaseLock.locked_assets.length !== EXPECTED_RELEASE_ASSET_COUNT) {
    violations.push({
      code: 'FAIL_LOCK_INTEGRITY',
      message: `Release lock must contain ${EXPECTED_RELEASE_ASSET_COUNT} locked assets`,
      field: 'locked_assets',
    });
  }

  for (const asset of manifest.release_assets) {
    const lockedAsset = releaseLock.locked_assets.find((item) => item.asset_id === asset.asset_id);
    if (!lockedAsset) continue;

    if (lockedAsset.path !== asset.path) {
      violations.push({
        code: 'FAIL_LOCK_INTEGRITY',
        message: `Locked asset path mismatch for ${asset.asset_id}`,
        field: `locked_assets.${asset.asset_id}`,
      });
    }

    if (lockedAsset.checksum !== manifest.checksums[asset.path]) {
      violations.push({
        code: 'FAIL_LOCK_INTEGRITY',
        message: `Locked asset checksum mismatch for ${asset.asset_id}`,
        field: `locked_assets.${asset.asset_id}.checksum`,
      });
    }
  }

  if (expectLocked && releaseLock.release_locked !== true) {
    violations.push({
      code: 'FAIL_LOCK_INTEGRITY',
      message: 'release_locked must be true when lock integrity passes',
      field: 'release_locked',
    });
  }

  return violations;
}

function auditDuplicateLockAssets(
  releaseLock: DatasetReleaseLock | null
): DatasetReleaseLockViolation[] {
  const violations: DatasetReleaseLockViolation[] = [];

  if (!releaseLock) return violations;

  const seenAssetIds = new Set<string>();
  const seenPaths = new Set<string>();

  for (const asset of releaseLock.locked_assets) {
    if (seenAssetIds.has(asset.asset_id)) {
      violations.push({
        code: 'FAIL_DUPLICATE_LOCK_ASSET',
        message: `Duplicate locked asset_id: ${asset.asset_id}`,
        field: 'locked_assets',
      });
    }
    seenAssetIds.add(asset.asset_id);

    if (seenPaths.has(asset.path)) {
      violations.push({
        code: 'FAIL_DUPLICATE_LOCK_ASSET',
        message: `Duplicate locked asset path: ${asset.path}`,
        field: 'locked_assets',
      });
    }
    seenPaths.add(asset.path);
  }

  return violations;
}

function auditMissingLockAssets(
  projectRoot: string,
  manifest: DatasetReleaseManifest | null,
  releaseLock: DatasetReleaseLock | null
): DatasetReleaseLockViolation[] {
  const violations: DatasetReleaseLockViolation[] = [];

  if (!manifest || !releaseLock) return violations;

  for (const asset of manifest.release_assets) {
    const lockedAsset = releaseLock.locked_assets.find((item) => item.asset_id === asset.asset_id);
    if (!lockedAsset) {
      violations.push({
        code: 'FAIL_MISSING_LOCK_ASSET',
        message: `Missing locked asset_id: ${asset.asset_id}`,
        field: 'locked_assets',
      });
      continue;
    }

    if (!fileExists(projectRoot, asset.path)) {
      violations.push({
        code: 'FAIL_MISSING_LOCK_ASSET',
        message: `Locked asset file missing on disk: ${asset.path}`,
        field: asset.path,
      });
    }

    if (!lockedAsset.checksum) {
      violations.push({
        code: 'FAIL_MISSING_LOCK_ASSET',
        message: `Missing checksum for locked asset: ${asset.asset_id}`,
        field: `locked_assets.${asset.asset_id}.checksum`,
      });
    }
  }

  return violations;
}

function primaryFailure(
  violations: DatasetReleaseLockViolation[]
): DatasetReleaseLockAuditResult {
  const priority: DatasetReleaseLockAuditResult[] = [
    'FAIL_CHECKSUM_DRIFT',
    'FAIL_DUPLICATE_LOCK_ASSET',
    'FAIL_MISSING_LOCK_ASSET',
    'FAIL_LOCK_INTEGRITY',
    'FAIL_RELEASE_NOT_READY',
    'FAIL_MANIFEST_MISSING',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditDatasetReleaseLock(
  projectRoot: string,
  manifest: DatasetReleaseManifest | null,
  releaseLock: DatasetReleaseLock | null
): DatasetReleaseLockViolation[] {
  const violations: DatasetReleaseLockViolation[] = [];
  const candidateLock =
    releaseLock ??
    (manifest ? buildDatasetReleaseLockFromManifest(projectRoot, manifest, true) : null);

  violations.push(...auditManifestPresence(projectRoot, manifest));
  violations.push(...auditReleaseReady(manifest));
  violations.push(...auditChecksumDrift(projectRoot, manifest));
  violations.push(...auditDuplicateLockAssets(candidateLock));
  violations.push(...auditMissingLockAssets(projectRoot, manifest, candidateLock));
  violations.push(...auditLockIntegrity(projectRoot, manifest, candidateLock, true));

  return violations;
}

export function writeDatasetReleaseLockReport(
  projectRoot: string,
  report: DatasetReleaseLockReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runDatasetReleaseLockAudit(projectRoot: string): DatasetReleaseLockReport {
  const auditTimestamp = new Date().toISOString();
  const manifest = loadReleaseManifestOrNull(projectRoot);
  const frozenLock = loadDatasetReleaseLock(projectRoot);

  const violations = auditDatasetReleaseLock(projectRoot, manifest, frozenLock);
  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  if (auditResult === 'PASS' && manifest) {
    const releaseLock = buildDatasetReleaseLockFromManifest(projectRoot, manifest, true);
    if (releaseLock) {
      writeDatasetReleaseLock(projectRoot, releaseLock);
    }
  }

  const report: DatasetReleaseLockReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeDatasetReleaseLockReport(projectRoot, report);
  return report;
}
