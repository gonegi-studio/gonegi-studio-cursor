import fs from 'node:fs';
import path from 'node:path';
import { computeFileChecksum } from './datasetReleaseManifest.js';
import {
  DATASET_RELEASE_LOCK_JSON_PATH,
  loadDatasetReleaseLock,
} from './datasetReleaseLock.js';
import { type DatasetReleaseLockReport } from './datasetReleaseLockAudit.js';
import { DATASET_RELEASE_MANIFEST_JSON_PATH } from './datasetReleaseManifest.js';
import { IMAGE_DATASET_EXPORT_JSON_PATH } from './imageDatasetExport.js';
import {
  IMAGE_APP_HANDOFF_CONSUMER_TARGET,
  IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
  loadImageAppHandoffPackage,
} from './imageAppHandoffPackage.js';
import {
  RELEASE_CERTIFICATION_VERSION,
  type ReleaseCertificationReport,
} from './releaseCertificationReport.js';
import { VIDEO_DATASET_EXPORT_JSON_PATH } from './videoDatasetExport.js';
import {
  VIDEO_APP_HANDOFF_CONSUMER_TARGET,
  VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
  loadVideoAppHandoffPackage,
} from './videoAppHandoffPackage.js';

export const RELEASE_HANDOFF_FINAL_BUNDLE_VERSION =
  'RELEASE-HANDOFF-FINAL-BUNDLE-PHASE-75-v1' as const;
export const RELEASE_HANDOFF_FINAL_BUNDLE_JSON_PATH =
  'exports/release-handoff-final-bundle.json' as const;
export const RELEASE_CERTIFICATION_REPORT_JSON_PATH =
  'exports/release-certification-report.json' as const;

export interface ReleaseHandoffFinalBundleAsset {
  asset_id: string;
  path: string;
  domain: 'shared' | 'image' | 'video';
}

export interface ReleaseHandoffFinalBundle {
  bundle_version: typeof RELEASE_HANDOFF_FINAL_BUNDLE_VERSION;
  certified: boolean;
  image_app_ready: boolean;
  video_app_ready: boolean;
  bundle_assets: ReleaseHandoffFinalBundleAsset[];
  checksums: Record<string, string>;
}

export const FINAL_BUNDLE_ASSETS: readonly ReleaseHandoffFinalBundleAsset[] = [
  {
    asset_id: 'release_certification_report',
    path: RELEASE_CERTIFICATION_REPORT_JSON_PATH,
    domain: 'shared',
  },
  {
    asset_id: 'dataset_release_lock',
    path: DATASET_RELEASE_LOCK_JSON_PATH,
    domain: 'shared',
  },
  {
    asset_id: 'dataset_release_manifest',
    path: DATASET_RELEASE_MANIFEST_JSON_PATH,
    domain: 'shared',
  },
  {
    asset_id: 'image_app_handoff',
    path: IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
    domain: 'image',
  },
  {
    asset_id: 'video_app_handoff',
    path: VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
    domain: 'video',
  },
  {
    asset_id: 'image_dataset_export',
    path: IMAGE_DATASET_EXPORT_JSON_PATH,
    domain: 'image',
  },
  {
    asset_id: 'video_dataset_export',
    path: VIDEO_DATASET_EXPORT_JSON_PATH,
    domain: 'video',
  },
] as const;

const BUNDLE_FILE = 'release-handoff-final-bundle.json';

export function loadReleaseCertificationReport(
  projectRoot: string
): ReleaseCertificationReport | null {
  const reportPath = path.join(projectRoot, 'exports', 'release-certification-report.json');
  if (!fs.existsSync(reportPath)) return null;
  return JSON.parse(fs.readFileSync(reportPath, 'utf8')) as ReleaseCertificationReport;
}

export function buildReleaseHandoffFinalBundle(
  projectRoot: string,
  certification: ReleaseCertificationReport | null
): ReleaseHandoffFinalBundle {
  const checksums: Record<string, string> = {};

  for (const asset of FINAL_BUNDLE_ASSETS) {
    const checksum = computeFileChecksum(projectRoot, asset.path);
    if (checksum) {
      checksums[asset.path] = checksum;
    }
  }

  return {
    bundle_version: RELEASE_HANDOFF_FINAL_BUNDLE_VERSION,
    certified: certification?.certified === true && certification.audit_result === 'PASS',
    image_app_ready: certification?.image_app_ready === true,
    video_app_ready: certification?.video_app_ready === true,
    bundle_assets: FINAL_BUNDLE_ASSETS.map((asset) => ({ ...asset })),
    checksums,
  };
}

export function loadReleaseHandoffFinalBundle(
  projectRoot: string
): ReleaseHandoffFinalBundle | null {
  const bundlePath = path.join(projectRoot, 'exports', BUNDLE_FILE);
  if (!fs.existsSync(bundlePath)) return null;
  return JSON.parse(fs.readFileSync(bundlePath, 'utf8')) as ReleaseHandoffFinalBundle;
}

export function writeReleaseHandoffFinalBundle(
  projectRoot: string,
  bundle: ReleaseHandoffFinalBundle
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const bundlePath = path.join(exportsDir, BUNDLE_FILE);
  fs.writeFileSync(bundlePath, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');
  return bundlePath;
}

export function computeFinalBundleChecksums(projectRoot: string): Record<string, string> {
  const checksums: Record<string, string> = {};
  for (const asset of FINAL_BUNDLE_ASSETS) {
    const checksum = computeFileChecksum(projectRoot, asset.path);
    if (checksum) {
      checksums[asset.path] = checksum;
    }
  }
  return checksums;
}
