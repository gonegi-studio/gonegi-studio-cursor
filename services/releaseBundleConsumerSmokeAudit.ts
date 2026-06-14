import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { computeFileChecksum } from './datasetReleaseManifest.js';
import { loadImageDatasetExport } from './imageDatasetExportAudit.js';
import {
  IMAGE_APP_HANDOFF_CONSUMER_TARGET,
  IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
  IMAGE_DATASET_QUALITY_REPORT_JSON_PATH,
  loadImageAppHandoffPackage,
} from './imageAppHandoffPackage.js';
import { RELEASE_CERTIFICATION_VERSION } from './releaseCertificationReport.js';
import {
  FINAL_BUNDLE_ASSETS,
  RELEASE_HANDOFF_FINAL_BUNDLE_JSON_PATH,
  computeFinalBundleChecksums,
  loadReleaseCertificationReport,
  loadReleaseHandoffFinalBundle,
  type ReleaseHandoffFinalBundle,
} from './releaseHandoffFinalBundle.js';
import { type ReleaseHandoffFinalBundleReport } from './releaseHandoffFinalBundleAudit.js';
import { loadVideoDatasetExport } from './videoDatasetExportAudit.js';
import {
  VIDEO_APP_HANDOFF_CONSUMER_TARGET,
  VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
  VIDEO_DATASET_QUALITY_REPORT_JSON_PATH,
  loadVideoAppHandoffPackage,
} from './videoAppHandoffPackage.js';

export const RELEASE_BUNDLE_CONSUMER_SMOKE_FINGERPRINT_SCHEMA_VERSION =
  'RELEASE-BUNDLE-CONSUMER-SMOKE-FINGERPRINT-PHASE-76-v1' as const;

export type ReleaseBundleConsumerSmokeAuditResult =
  | 'PASS'
  | 'FAIL_FINAL_BUNDLE'
  | 'FAIL_CERTIFICATION'
  | 'FAIL_IMAGE_TARGET'
  | 'FAIL_VIDEO_TARGET'
  | 'FAIL_CHECKSUM'
  | 'FAIL_IMAGE_HANDOFF'
  | 'FAIL_VIDEO_HANDOFF'
  | 'FAIL_GENERATION_TRIGGERED';

export interface ReleaseBundleConsumerSmokeViolation {
  code: ReleaseBundleConsumerSmokeAuditResult;
  message: string;
  field?: string;
}

export interface SmokeAssetMapEntry {
  handoff_package: string;
  dataset_export: string;
  quality_report: string;
}

export interface ReleaseBundleConsumerSmokeFingerprint {
  schemaVersion: typeof RELEASE_BUNDLE_CONSUMER_SMOKE_FINGERPRINT_SCHEMA_VERSION;
  finalBundleChecksum: string;
  imageTarget: typeof IMAGE_APP_HANDOFF_CONSUMER_TARGET;
  videoTarget: typeof VIDEO_APP_HANDOFF_CONSUMER_TARGET;
  smokeAssetMap: Record<
    typeof IMAGE_APP_HANDOFF_CONSUMER_TARGET | typeof VIDEO_APP_HANDOFF_CONSUMER_TARGET,
    SmokeAssetMapEntry
  >;
  frozenAt: string;
}

export interface ReleaseBundleConsumerSmokeReport {
  auditTimestamp: string;
  auditResult: ReleaseBundleConsumerSmokeAuditResult;
  violations: ReleaseBundleConsumerSmokeViolation[];
  image_app_smoke_pass: boolean;
  video_app_smoke_pass: boolean;
  release_bundle_smoke_pass: boolean;
}

interface FileSnapshot {
  path: string;
  checksum: string;
  mtimeMs: number;
}

const REPORT_FILE = 'release-bundle-consumer-smoke-report.json';
const FINGERPRINT_FILE = 'release-bundle-consumer-smoke-fingerprint.json';
const FINAL_BUNDLE_REPORT_PATH = 'exports/release-handoff-final-bundle-report.json';

const PROTECTED_SMOKE_PATHS = [
  RELEASE_HANDOFF_FINAL_BUNDLE_JSON_PATH,
  FINAL_BUNDLE_REPORT_PATH,
  ...FINAL_BUNDLE_ASSETS.map((asset) => asset.path),
] as const;

function fileExists(projectRoot: string, relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function snapshotPaths(projectRoot: string, paths: readonly string[]): FileSnapshot[] {
  return paths.map((relativePath) => {
    const filePath = path.join(projectRoot, relativePath);
    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath);
    return {
      path: relativePath,
      checksum: crypto.createHash('sha256').update(content).digest('hex'),
      mtimeMs: stat.mtimeMs,
    };
  });
}

function computeFinalBundleFileChecksum(projectRoot: string): string | null {
  const bundlePath = path.join(projectRoot, RELEASE_HANDOFF_FINAL_BUNDLE_JSON_PATH);
  if (!fs.existsSync(bundlePath)) return null;
  const content = fs.readFileSync(bundlePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function loadFinalBundleReport(projectRoot: string): ReleaseHandoffFinalBundleReport | null {
  const reportPath = path.join(projectRoot, FINAL_BUNDLE_REPORT_PATH);
  if (!fs.existsSync(reportPath)) return null;
  return JSON.parse(fs.readFileSync(reportPath, 'utf8')) as ReleaseHandoffFinalBundleReport;
}

function buildSmokeAssetMap(): ReleaseBundleConsumerSmokeFingerprint['smokeAssetMap'] {
  return {
    [IMAGE_APP_HANDOFF_CONSUMER_TARGET]: {
      handoff_package: IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
      dataset_export: FINAL_BUNDLE_ASSETS.find((asset) => asset.asset_id === 'image_dataset_export')!
        .path,
      quality_report: IMAGE_DATASET_QUALITY_REPORT_JSON_PATH,
    },
    [VIDEO_APP_HANDOFF_CONSUMER_TARGET]: {
      handoff_package: VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
      dataset_export: FINAL_BUNDLE_ASSETS.find((asset) => asset.asset_id === 'video_dataset_export')!
        .path,
      quality_report: VIDEO_DATASET_QUALITY_REPORT_JSON_PATH,
    },
  };
}

function auditFinalBundlePass(
  projectRoot: string,
  bundle: ReleaseHandoffFinalBundle | null
): ReleaseBundleConsumerSmokeViolation[] {
  const violations: ReleaseBundleConsumerSmokeViolation[] = [];
  const bundleReport = loadFinalBundleReport(projectRoot);

  if (!bundle) {
    violations.push({
      code: 'FAIL_FINAL_BUNDLE',
      message: 'release-handoff-final-bundle.json not found',
      field: RELEASE_HANDOFF_FINAL_BUNDLE_JSON_PATH,
    });
    return violations;
  }

  if (!bundleReport) {
    violations.push({
      code: 'FAIL_FINAL_BUNDLE',
      message: 'release-handoff-final-bundle-report.json not found',
      field: FINAL_BUNDLE_REPORT_PATH,
    });
  } else if (bundleReport.auditResult !== 'PASS') {
    violations.push({
      code: 'FAIL_FINAL_BUNDLE',
      message: `Final bundle audit result is ${bundleReport.auditResult}`,
      field: 'release-handoff-final-bundle-report.auditResult',
    });
  }

  if (bundle.certified !== true) {
    violations.push({
      code: 'FAIL_FINAL_BUNDLE',
      message: 'Final bundle certified flag must be true for consumer smoke',
      field: 'certified',
    });
  }

  if (bundle.image_app_ready !== true || bundle.video_app_ready !== true) {
    violations.push({
      code: 'FAIL_FINAL_BUNDLE',
      message: 'Final bundle app readiness flags must be true for consumer smoke',
      field: 'image_app_ready|video_app_ready',
    });
  }

  return violations;
}

function auditCertificationPass(projectRoot: string): ReleaseBundleConsumerSmokeViolation[] {
  const violations: ReleaseBundleConsumerSmokeViolation[] = [];
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
      message: 'Release certification version mismatch for consumer smoke',
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

  return violations;
}

function auditImageAppTargetPresent(
  projectRoot: string,
  bundle: ReleaseHandoffFinalBundle | null
): ReleaseBundleConsumerSmokeViolation[] {
  const violations: ReleaseBundleConsumerSmokeViolation[] = [];
  const imageHandoff = loadImageAppHandoffPackage(projectRoot);

  const imageHandoffAsset = bundle?.bundle_assets.find(
    (asset) => asset.asset_id === 'image_app_handoff'
  );
  if (!imageHandoffAsset) {
    violations.push({
      code: 'FAIL_IMAGE_TARGET',
      message: 'Final bundle missing image app handoff asset',
      field: 'bundle_assets.image_app_handoff',
    });
  } else if (imageHandoffAsset.path !== IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH) {
    violations.push({
      code: 'FAIL_IMAGE_TARGET',
      message: 'Final bundle image handoff path mismatch',
      field: 'bundle_assets.image_app_handoff.path',
    });
  }

  if (!imageHandoff) {
    violations.push({
      code: 'FAIL_IMAGE_TARGET',
      message: 'Image app handoff package not present for consumer smoke',
      field: IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
    });
    return violations;
  }

  if (imageHandoff.handoff_metadata.consumer_target !== IMAGE_APP_HANDOFF_CONSUMER_TARGET) {
    violations.push({
      code: 'FAIL_IMAGE_TARGET',
      message: 'Image app consumer target not present in handoff package',
      field: 'handoff_metadata.consumer_target',
    });
  }

  return violations;
}

function auditVideoAppTargetPresent(
  projectRoot: string,
  bundle: ReleaseHandoffFinalBundle | null
): ReleaseBundleConsumerSmokeViolation[] {
  const violations: ReleaseBundleConsumerSmokeViolation[] = [];
  const videoHandoff = loadVideoAppHandoffPackage(projectRoot);

  const videoHandoffAsset = bundle?.bundle_assets.find(
    (asset) => asset.asset_id === 'video_app_handoff'
  );
  if (!videoHandoffAsset) {
    violations.push({
      code: 'FAIL_VIDEO_TARGET',
      message: 'Final bundle missing video app handoff asset',
      field: 'bundle_assets.video_app_handoff',
    });
  } else if (videoHandoffAsset.path !== VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH) {
    violations.push({
      code: 'FAIL_VIDEO_TARGET',
      message: 'Final bundle video handoff path mismatch',
      field: 'bundle_assets.video_app_handoff.path',
    });
  }

  if (!videoHandoff) {
    violations.push({
      code: 'FAIL_VIDEO_TARGET',
      message: 'Video app handoff package not present for consumer smoke',
      field: VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
    });
    return violations;
  }

  if (videoHandoff.handoff_metadata.consumer_target !== VIDEO_APP_HANDOFF_CONSUMER_TARGET) {
    violations.push({
      code: 'FAIL_VIDEO_TARGET',
      message: 'Video app consumer target not present in handoff package',
      field: 'handoff_metadata.consumer_target',
    });
  }

  return violations;
}

function auditBundleAssetChecksums(
  projectRoot: string,
  bundle: ReleaseHandoffFinalBundle | null
): ReleaseBundleConsumerSmokeViolation[] {
  const violations: ReleaseBundleConsumerSmokeViolation[] = [];

  if (!bundle) return violations;

  const currentChecksums = computeFinalBundleChecksums(projectRoot);

  for (const asset of FINAL_BUNDLE_ASSETS) {
    const bundled = bundle.checksums[asset.path];
    const current = currentChecksums[asset.path];

    if (!current) {
      violations.push({
        code: 'FAIL_CHECKSUM',
        message: `Unable to compute checksum for bundle asset: ${asset.path}`,
        field: asset.path,
      });
      continue;
    }

    if (!bundled) {
      violations.push({
        code: 'FAIL_CHECKSUM',
        message: `Final bundle missing checksum for asset: ${asset.path}`,
        field: `checksums.${asset.path}`,
      });
      continue;
    }

    if (bundled !== current) {
      violations.push({
        code: 'FAIL_CHECKSUM',
        message: `Bundle asset checksum mismatch: ${asset.path}`,
        field: `checksums.${asset.path}`,
      });
    }

    const onDisk = computeFileChecksum(projectRoot, asset.path);
    if (onDisk !== current) {
      violations.push({
        code: 'FAIL_CHECKSUM',
        message: `On-disk checksum drift for bundle asset: ${asset.path}`,
        field: asset.path,
      });
    }
  }

  return violations;
}

function auditImageHandoffConsumable(projectRoot: string): ReleaseBundleConsumerSmokeViolation[] {
  const violations: ReleaseBundleConsumerSmokeViolation[] = [];
  const handoff = loadImageAppHandoffPackage(projectRoot);

  if (!handoff) {
    violations.push({
      code: 'FAIL_IMAGE_HANDOFF',
      message: 'Image handoff not consumable: package unreadable',
      field: IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
    });
    return violations;
  }

  if (handoff.handoff_metadata.handoff_type !== 'image_app') {
    violations.push({
      code: 'FAIL_IMAGE_HANDOFF',
      message: 'Image handoff type must be image_app for consumption',
      field: 'handoff_metadata.handoff_type',
    });
  }

  if (!fileExists(projectRoot, handoff.export_reference.path)) {
    violations.push({
      code: 'FAIL_IMAGE_HANDOFF',
      message: 'Image handoff export_reference not consumable',
      field: 'export_reference.path',
    });
  }

  if (!fileExists(projectRoot, handoff.quality_reference.path)) {
    violations.push({
      code: 'FAIL_IMAGE_HANDOFF',
      message: 'Image handoff quality_reference not consumable',
      field: 'quality_reference.path',
    });
  }

  if (handoff.quality_reference.auditResult !== 'PASS') {
    violations.push({
      code: 'FAIL_IMAGE_HANDOFF',
      message: 'Image handoff quality gate must PASS for consumption',
      field: 'quality_reference.auditResult',
    });
  }

  for (const asset of handoff.manifest.assets) {
    if (!fileExists(projectRoot, asset.path)) {
      violations.push({
        code: 'FAIL_IMAGE_HANDOFF',
        message: `Image handoff manifest asset not consumable: ${asset.path}`,
        field: 'manifest.assets',
      });
    }
  }

  const exportData = loadImageDatasetExport(projectRoot);
  if (!exportData) {
    violations.push({
      code: 'FAIL_IMAGE_HANDOFF',
      message: 'Image dataset export not readable for handoff consumption',
      field: handoff.export_reference.path,
    });
  } else if (exportData.export_metadata.export_type !== 'image_dataset') {
    violations.push({
      code: 'FAIL_IMAGE_HANDOFF',
      message: 'Image export payload not consumable by image app',
      field: 'export_metadata.export_type',
    });
  }

  return violations;
}

function auditVideoHandoffConsumable(projectRoot: string): ReleaseBundleConsumerSmokeViolation[] {
  const violations: ReleaseBundleConsumerSmokeViolation[] = [];
  const handoff = loadVideoAppHandoffPackage(projectRoot);

  if (!handoff) {
    violations.push({
      code: 'FAIL_VIDEO_HANDOFF',
      message: 'Video handoff not consumable: package unreadable',
      field: VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
    });
    return violations;
  }

  if (handoff.handoff_metadata.handoff_type !== 'video_app') {
    violations.push({
      code: 'FAIL_VIDEO_HANDOFF',
      message: 'Video handoff type must be video_app for consumption',
      field: 'handoff_metadata.handoff_type',
    });
  }

  if (!fileExists(projectRoot, handoff.export_reference.path)) {
    violations.push({
      code: 'FAIL_VIDEO_HANDOFF',
      message: 'Video handoff export_reference not consumable',
      field: 'export_reference.path',
    });
  }

  if (!fileExists(projectRoot, handoff.quality_reference.path)) {
    violations.push({
      code: 'FAIL_VIDEO_HANDOFF',
      message: 'Video handoff quality_reference not consumable',
      field: 'quality_reference.path',
    });
  }

  if (handoff.quality_reference.auditResult !== 'PASS') {
    violations.push({
      code: 'FAIL_VIDEO_HANDOFF',
      message: 'Video handoff quality gate must PASS for consumption',
      field: 'quality_reference.auditResult',
    });
  }

  for (const asset of handoff.manifest.assets) {
    if (!fileExists(projectRoot, asset.path)) {
      violations.push({
        code: 'FAIL_VIDEO_HANDOFF',
        message: `Video handoff manifest asset not consumable: ${asset.path}`,
        field: 'manifest.assets',
      });
    }
  }

  const exportData = loadVideoDatasetExport(projectRoot);
  if (!exportData) {
    violations.push({
      code: 'FAIL_VIDEO_HANDOFF',
      message: 'Video dataset export not readable for handoff consumption',
      field: handoff.export_reference.path,
    });
  } else if (exportData.export_metadata.export_type !== 'video_dataset') {
    violations.push({
      code: 'FAIL_VIDEO_HANDOFF',
      message: 'Video export payload not consumable by video app',
      field: 'export_metadata.export_type',
    });
  }

  return violations;
}

function auditNoGenerationTriggered(
  before: FileSnapshot[],
  after: FileSnapshot[]
): ReleaseBundleConsumerSmokeViolation[] {
  const violations: ReleaseBundleConsumerSmokeViolation[] = [];
  const afterByPath = new Map(after.map((snapshot) => [snapshot.path, snapshot]));

  for (const snapshot of before) {
    const next = afterByPath.get(snapshot.path);
    if (!next) {
      violations.push({
        code: 'FAIL_GENERATION_TRIGGERED',
        message: `Protected file removed during consumer smoke audit: ${snapshot.path}`,
        field: snapshot.path,
      });
      continue;
    }

    if (next.checksum !== snapshot.checksum || next.mtimeMs !== snapshot.mtimeMs) {
      violations.push({
        code: 'FAIL_GENERATION_TRIGGERED',
        message: `Protected file modified during consumer smoke audit: ${snapshot.path}`,
        field: snapshot.path,
      });
    }
  }

  return violations;
}

function computeSmokePassFlags(violations: ReleaseBundleConsumerSmokeViolation[]): Pick<
  ReleaseBundleConsumerSmokeReport,
  'image_app_smoke_pass' | 'video_app_smoke_pass' | 'release_bundle_smoke_pass'
> {
  const imageCodes: ReleaseBundleConsumerSmokeAuditResult[] = [
    'FAIL_IMAGE_TARGET',
    'FAIL_IMAGE_HANDOFF',
  ];
  const videoCodes: ReleaseBundleConsumerSmokeAuditResult[] = [
    'FAIL_VIDEO_TARGET',
    'FAIL_VIDEO_HANDOFF',
  ];
  const bundleCodes: ReleaseBundleConsumerSmokeAuditResult[] = [
    'FAIL_FINAL_BUNDLE',
    'FAIL_CERTIFICATION',
    'FAIL_CHECKSUM',
    'FAIL_GENERATION_TRIGGERED',
  ];

  const hasCode = (codes: ReleaseBundleConsumerSmokeAuditResult[]) =>
    violations.some((violation) => codes.includes(violation.code));

  return {
    image_app_smoke_pass: !hasCode(imageCodes),
    video_app_smoke_pass: !hasCode(videoCodes),
    release_bundle_smoke_pass: !hasCode(bundleCodes),
  };
}

function primaryFailure(
  violations: ReleaseBundleConsumerSmokeViolation[]
): ReleaseBundleConsumerSmokeAuditResult {
  const priority: ReleaseBundleConsumerSmokeAuditResult[] = [
    'FAIL_GENERATION_TRIGGERED',
    'FAIL_CHECKSUM',
    'FAIL_FINAL_BUNDLE',
    'FAIL_CERTIFICATION',
    'FAIL_IMAGE_TARGET',
    'FAIL_VIDEO_TARGET',
    'FAIL_IMAGE_HANDOFF',
    'FAIL_VIDEO_HANDOFF',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function buildReleaseBundleConsumerSmokeFingerprint(
  projectRoot: string,
  frozenAt: string
): ReleaseBundleConsumerSmokeFingerprint | null {
  const finalBundleChecksum = computeFinalBundleFileChecksum(projectRoot);
  if (!finalBundleChecksum) return null;

  return {
    schemaVersion: RELEASE_BUNDLE_CONSUMER_SMOKE_FINGERPRINT_SCHEMA_VERSION,
    finalBundleChecksum,
    imageTarget: IMAGE_APP_HANDOFF_CONSUMER_TARGET,
    videoTarget: VIDEO_APP_HANDOFF_CONSUMER_TARGET,
    smokeAssetMap: buildSmokeAssetMap(),
    frozenAt,
  };
}

export function auditReleaseBundleConsumerSmoke(
  projectRoot: string
): ReleaseBundleConsumerSmokeViolation[] {
  const beforeSnapshot = snapshotPaths(projectRoot, PROTECTED_SMOKE_PATHS);
  const bundle = loadReleaseHandoffFinalBundle(projectRoot);
  const violations: ReleaseBundleConsumerSmokeViolation[] = [];

  violations.push(...auditFinalBundlePass(projectRoot, bundle));
  violations.push(...auditCertificationPass(projectRoot));
  violations.push(...auditImageAppTargetPresent(projectRoot, bundle));
  violations.push(...auditVideoAppTargetPresent(projectRoot, bundle));
  violations.push(...auditBundleAssetChecksums(projectRoot, bundle));
  violations.push(...auditImageHandoffConsumable(projectRoot));
  violations.push(...auditVideoHandoffConsumable(projectRoot));

  const afterSnapshot = snapshotPaths(projectRoot, PROTECTED_SMOKE_PATHS);
  violations.push(...auditNoGenerationTriggered(beforeSnapshot, afterSnapshot));

  return violations;
}

export function writeReleaseBundleConsumerSmokeReport(
  projectRoot: string,
  report: ReleaseBundleConsumerSmokeReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function writeReleaseBundleConsumerSmokeFingerprint(
  projectRoot: string,
  fingerprint: ReleaseBundleConsumerSmokeFingerprint
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const fingerprintPath = path.join(exportsDir, FINGERPRINT_FILE);
  fs.writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  return fingerprintPath;
}

export function runReleaseBundleConsumerSmokeAudit(
  projectRoot: string
): ReleaseBundleConsumerSmokeReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditReleaseBundleConsumerSmoke(projectRoot);
  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);
  const passFlags = computeSmokePassFlags(violations);

  const report: ReleaseBundleConsumerSmokeReport = {
    auditTimestamp,
    auditResult,
    violations,
    image_app_smoke_pass: passFlags.image_app_smoke_pass && auditResult === 'PASS',
    video_app_smoke_pass: passFlags.video_app_smoke_pass && auditResult === 'PASS',
    release_bundle_smoke_pass: passFlags.release_bundle_smoke_pass && auditResult === 'PASS',
  };

  writeReleaseBundleConsumerSmokeReport(projectRoot, report);

  const fingerprint = buildReleaseBundleConsumerSmokeFingerprint(projectRoot, auditTimestamp);
  if (fingerprint) {
    writeReleaseBundleConsumerSmokeFingerprint(projectRoot, fingerprint);
  }

  return report;
}
