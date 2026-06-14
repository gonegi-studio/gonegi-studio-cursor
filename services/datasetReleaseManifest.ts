import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const DATASET_RELEASE_MANIFEST_VERSION = 'DATASET-RELEASE-MANIFEST-PHASE-68-v1' as const;
export const DATASET_RELEASE_MANIFEST_JSON_PATH = 'exports/dataset-release-manifest.json' as const;

export interface DatasetReleaseManifestAsset {
  asset_id: string;
  path: string;
}

export interface DatasetReleaseManifest {
  release_version: typeof DATASET_RELEASE_MANIFEST_VERSION;
  release_assets: DatasetReleaseManifestAsset[];
  checksums: Record<string, string>;
  release_ready: boolean;
}

export const MANIFEST_RELEASE_ASSETS: readonly DatasetReleaseManifestAsset[] = [
  { asset_id: 'image_dataset_export', path: 'exports/image-dataset-export.json' },
  { asset_id: 'image_app_handoff', path: 'exports/image-app-handoff-package.json' },
  { asset_id: 'video_dataset_export', path: 'exports/video-dataset-export.json' },
  { asset_id: 'video_app_handoff', path: 'exports/video-app-handoff-package.json' },
  { asset_id: 'boundary_report', path: 'exports/dataset-boundary-report.json' },
  { asset_id: 'dependency_report', path: 'exports/image-video-dependency-report.json' },
  { asset_id: 'dual_release_gate_report', path: 'exports/dual-dataset-release-gate-report.json' },
  { asset_id: 'release_fingerprint', path: 'exports/dual-dataset-release-fingerprint.json' },
] as const;

export const REQUIRED_MANIFEST_ASSET_IDS = MANIFEST_RELEASE_ASSETS.map((asset) => asset.asset_id);

const MANIFEST_FILE = 'dataset-release-manifest.json';

export function computeFileChecksum(projectRoot: string, relativePath: string): string | null {
  const filePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function buildDatasetReleaseManifest(
  projectRoot: string,
  releaseReady: boolean
): DatasetReleaseManifest {
  const checksums: Record<string, string> = {};

  for (const asset of MANIFEST_RELEASE_ASSETS) {
    const checksum = computeFileChecksum(projectRoot, asset.path);
    if (checksum) {
      checksums[asset.path] = checksum;
    }
  }

  return {
    release_version: DATASET_RELEASE_MANIFEST_VERSION,
    release_assets: MANIFEST_RELEASE_ASSETS.map((asset) => ({ ...asset })),
    checksums,
    release_ready: releaseReady,
  };
}

export function loadDatasetReleaseManifest(projectRoot: string): DatasetReleaseManifest | null {
  const manifestPath = path.join(projectRoot, 'exports', MANIFEST_FILE);
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as DatasetReleaseManifest;
}

export function writeDatasetReleaseManifest(
  projectRoot: string,
  manifest: DatasetReleaseManifest
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const manifestPath = path.join(exportsDir, MANIFEST_FILE);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifestPath;
}

export function computeManifestChecksums(
  projectRoot: string
): Record<string, string> {
  const checksums: Record<string, string> = {};
  for (const asset of MANIFEST_RELEASE_ASSETS) {
    const checksum = computeFileChecksum(projectRoot, asset.path);
    if (checksum) {
      checksums[asset.path] = checksum;
    }
  }
  return checksums;
}
