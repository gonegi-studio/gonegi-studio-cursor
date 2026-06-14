import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  DATASET_RELEASE_MANIFEST_JSON_PATH,
  computeFileChecksum,
  loadDatasetReleaseManifest,
  type DatasetReleaseManifest,
} from './datasetReleaseManifest.js';

export const DATASET_RELEASE_LOCK_VERSION = 'DATASET-RELEASE-LOCK-PHASE-69-v1' as const;
export const DATASET_RELEASE_LOCK_JSON_PATH = 'exports/dataset-release-lock.json' as const;

export const EXPECTED_RELEASE_ASSET_COUNT = 8 as const;

export interface DatasetReleaseLockedAsset {
  asset_id: string;
  path: string;
  checksum: string;
}

export interface DatasetReleaseLock {
  lock_version: typeof DATASET_RELEASE_LOCK_VERSION;
  manifest_checksum: string;
  locked_assets: DatasetReleaseLockedAsset[];
  release_locked: boolean;
}

const LOCK_FILE = 'dataset-release-lock.json';

export function computeManifestFileChecksum(projectRoot: string): string | null {
  const manifestPath = path.join(projectRoot, 'exports', 'dataset-release-manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  const content = fs.readFileSync(manifestPath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function buildDatasetReleaseLock(manifest: DatasetReleaseManifest): DatasetReleaseLock | null {
  const locked_assets: DatasetReleaseLockedAsset[] = [];

  for (const asset of manifest.release_assets) {
    const checksum = manifest.checksums[asset.path];
    if (!checksum) return null;

    locked_assets.push({
      asset_id: asset.asset_id,
      path: asset.path,
      checksum,
    });
  }

  return {
    lock_version: DATASET_RELEASE_LOCK_VERSION,
    manifest_checksum: '',
    locked_assets,
    release_locked: false,
  };
}

export function buildDatasetReleaseLockFromManifest(
  projectRoot: string,
  manifest: DatasetReleaseManifest,
  releaseLocked: boolean
): DatasetReleaseLock | null {
  const manifestChecksum = computeManifestFileChecksum(projectRoot);
  const lock = buildDatasetReleaseLock(manifest);
  if (!lock || !manifestChecksum) return null;

  if (lock.locked_assets.length !== EXPECTED_RELEASE_ASSET_COUNT) return null;
  if (lock.locked_assets.length !== manifest.release_assets.length) return null;

  return {
    ...lock,
    manifest_checksum: manifestChecksum,
    release_locked: releaseLocked,
  };
}

export function loadDatasetReleaseLock(projectRoot: string): DatasetReleaseLock | null {
  const lockPath = path.join(projectRoot, 'exports', LOCK_FILE);
  if (!fs.existsSync(lockPath)) return null;
  return JSON.parse(fs.readFileSync(lockPath, 'utf8')) as DatasetReleaseLock;
}

export function writeDatasetReleaseLock(
  projectRoot: string,
  releaseLock: DatasetReleaseLock
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const lockPath = path.join(exportsDir, LOCK_FILE);
  fs.writeFileSync(lockPath, `${JSON.stringify(releaseLock, null, 2)}\n`, 'utf8');
  return lockPath;
}

export function verifyReleaseAssetCount(manifest: DatasetReleaseManifest): boolean {
  return (
    manifest.release_assets.length === EXPECTED_RELEASE_ASSET_COUNT &&
    Object.keys(manifest.checksums).length === EXPECTED_RELEASE_ASSET_COUNT
  );
}

export function verifyAssetChecksumsUnchanged(
  projectRoot: string,
  manifest: DatasetReleaseManifest
): string[] {
  const driftedPaths: string[] = [];

  for (const asset of manifest.release_assets) {
    const manifestChecksum = manifest.checksums[asset.path];
    const currentChecksum = computeFileChecksum(projectRoot, asset.path);

    if (!manifestChecksum || !currentChecksum || manifestChecksum !== currentChecksum) {
      driftedPaths.push(asset.path);
    }
  }

  return driftedPaths.sort();
}

export function loadReleaseManifestOrNull(projectRoot: string): DatasetReleaseManifest | null {
  return loadDatasetReleaseManifest(projectRoot);
}

export { DATASET_RELEASE_MANIFEST_JSON_PATH };
