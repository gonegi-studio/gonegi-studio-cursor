import fs from 'node:fs';
import path from 'node:path';
import {
  auditDatasetBoundary,
  CANONICAL_IMAGE_DATASET_ASSETS,
  CANONICAL_IMAGE_HANDOFF_ASSETS,
  CANONICAL_VIDEO_DATASET_ASSETS,
  CANONICAL_VIDEO_HANDOFF_ASSETS,
  type DatasetBoundaryFingerprint,
  type DatasetBoundaryReport,
} from './datasetBoundaryAudit.js';
import { loadImageDatasetExport } from './imageDatasetExportAudit.js';
import {
  type ImageAppHandoffReport,
} from './imageAppHandoffAudit.js';
import { loadImageAppHandoffPackage } from './imageAppHandoffPackage.js';
import { loadImageDatasetQualityReport } from './imageDatasetQualityAudit.js';
import {
  auditImageVideoDependency,
  type ImageVideoDependencyFingerprint,
  type ImageVideoDependencyReport,
} from './imageVideoDependencyAudit.js';
import { loadVideoDatasetExport } from './videoDatasetExportAudit.js';
import { loadVideoAppHandoffPackage } from './videoAppHandoffPackage.js';
import { loadVideoDatasetQualityReport } from './videoDatasetQualityAudit.js';
import { type VideoAppHandoffReport } from './videoAppHandoffAudit.js';

export const DUAL_DATASET_RELEASE_FINGERPRINT_SCHEMA_VERSION =
  'DUAL-DATASET-RELEASE-FINGERPRINT-PHASE-67-v1' as const;

export type DualDatasetReleaseGateResult =
  | 'PASS'
  | 'FAIL_IMAGE_HANDOFF'
  | 'FAIL_VIDEO_HANDOFF'
  | 'FAIL_DATASET_BOUNDARY'
  | 'FAIL_IMAGE_VIDEO_DEPENDENCY'
  | 'FAIL_IMAGE_QUALITY'
  | 'FAIL_VIDEO_QUALITY'
  | 'FAIL_RELEASE_ASSET'
  | 'FAIL_CONTAMINATION';

export interface DualDatasetReleaseGateViolation {
  code: DualDatasetReleaseGateResult;
  message: string;
  field?: string;
}

export interface DualDatasetReleaseGateReport {
  auditTimestamp: string;
  auditResult: DualDatasetReleaseGateResult;
  violations: DualDatasetReleaseGateViolation[];
  image_release_ready: boolean;
  video_release_ready: boolean;
  dual_release_ready: boolean;
}

export interface DualDatasetReleaseFingerprint {
  schemaVersion: typeof DUAL_DATASET_RELEASE_FINGERPRINT_SCHEMA_VERSION;
  imageDatasetAssets: readonly string[];
  imageHandoffAssets: readonly string[];
  videoDatasetAssets: readonly string[];
  videoHandoffAssets: readonly string[];
  boundaryFingerprint: DatasetBoundaryFingerprint;
  dependencyFingerprint: ImageVideoDependencyFingerprint;
  frozenAt: string;
}

const GATE_REPORT_FILE = 'dual-dataset-release-gate-report.json';
const GATE_FINGERPRINT_FILE = 'dual-dataset-release-fingerprint.json';

const IMAGE_RELEASE_ASSETS = [
  ...CANONICAL_IMAGE_DATASET_ASSETS,
  'exports/image-dataset-quality-report.json',
  ...CANONICAL_IMAGE_HANDOFF_ASSETS,
  'exports/image-app-handoff-fingerprint.json',
] as const;

const VIDEO_RELEASE_ASSETS = [
  ...CANONICAL_VIDEO_DATASET_ASSETS,
  ...CANONICAL_VIDEO_HANDOFF_ASSETS,
] as const;

const DUAL_RELEASE_FINGERPRINT_ASSETS = [
  'exports/dataset-boundary-fingerprint.json',
  'exports/image-video-dependency-fingerprint.json',
] as const;

function fileExists(projectRoot: string, relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function loadJsonFile<T>(projectRoot: string, relativePath: string): T | null {
  const filePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function loadImageAppHandoffReport(projectRoot: string): ImageAppHandoffReport | null {
  return loadJsonFile<ImageAppHandoffReport>(projectRoot, 'exports/image-app-handoff-report.json');
}

function loadVideoAppHandoffReport(projectRoot: string): VideoAppHandoffReport | null {
  return loadJsonFile<VideoAppHandoffReport>(projectRoot, 'exports/video-app-handoff-report.json');
}

function loadDatasetBoundaryReport(projectRoot: string): DatasetBoundaryReport | null {
  return loadJsonFile<DatasetBoundaryReport>(projectRoot, 'exports/dataset-boundary-report.json');
}

function loadImageVideoDependencyReport(projectRoot: string): ImageVideoDependencyReport | null {
  return loadJsonFile<ImageVideoDependencyReport>(
    projectRoot,
    'exports/image-video-dependency-report.json'
  );
}

function loadDatasetBoundaryFingerprint(projectRoot: string): DatasetBoundaryFingerprint | null {
  return loadJsonFile<DatasetBoundaryFingerprint>(
    projectRoot,
    'exports/dataset-boundary-fingerprint.json'
  );
}

function loadImageVideoDependencyFingerprint(
  projectRoot: string
): ImageVideoDependencyFingerprint | null {
  return loadJsonFile<ImageVideoDependencyFingerprint>(
    projectRoot,
    'exports/image-video-dependency-fingerprint.json'
  );
}

function auditUpstreamReports(projectRoot: string): DualDatasetReleaseGateViolation[] {
  const violations: DualDatasetReleaseGateViolation[] = [];

  const imageHandoffReport = loadImageAppHandoffReport(projectRoot);
  if (!imageHandoffReport) {
    violations.push({
      code: 'FAIL_IMAGE_HANDOFF',
      message: 'image-app-handoff-report.json not found',
      field: 'exports/image-app-handoff-report.json',
    });
  } else if (imageHandoffReport.auditResult !== 'PASS') {
    violations.push({
      code: 'FAIL_IMAGE_HANDOFF',
      message: `Image app handoff audit result is ${imageHandoffReport.auditResult}`,
      field: 'image-app-handoff-report.auditResult',
    });
  }

  const videoHandoffReport = loadVideoAppHandoffReport(projectRoot);
  if (!videoHandoffReport) {
    violations.push({
      code: 'FAIL_VIDEO_HANDOFF',
      message: 'video-app-handoff-report.json not found',
      field: 'exports/video-app-handoff-report.json',
    });
  } else if (videoHandoffReport.auditResult !== 'PASS') {
    violations.push({
      code: 'FAIL_VIDEO_HANDOFF',
      message: `Video app handoff audit result is ${videoHandoffReport.auditResult}`,
      field: 'video-app-handoff-report.auditResult',
    });
  }

  const boundaryReport = loadDatasetBoundaryReport(projectRoot);
  if (!boundaryReport) {
    violations.push({
      code: 'FAIL_DATASET_BOUNDARY',
      message: 'dataset-boundary-report.json not found',
      field: 'exports/dataset-boundary-report.json',
    });
  } else if (boundaryReport.auditResult !== 'PASS') {
    violations.push({
      code: 'FAIL_DATASET_BOUNDARY',
      message: `Dataset boundary audit result is ${boundaryReport.auditResult}`,
      field: 'dataset-boundary-report.auditResult',
    });
  }

  const dependencyReport = loadImageVideoDependencyReport(projectRoot);
  if (!dependencyReport) {
    violations.push({
      code: 'FAIL_IMAGE_VIDEO_DEPENDENCY',
      message: 'image-video-dependency-report.json not found',
      field: 'exports/image-video-dependency-report.json',
    });
  } else if (dependencyReport.auditResult !== 'PASS') {
    violations.push({
      code: 'FAIL_IMAGE_VIDEO_DEPENDENCY',
      message: `Image-video dependency audit result is ${dependencyReport.auditResult}`,
      field: 'image-video-dependency-report.auditResult',
    });
  }

  const imageQualityReport = loadImageDatasetQualityReport(projectRoot);
  if (!imageQualityReport) {
    violations.push({
      code: 'FAIL_IMAGE_QUALITY',
      message: 'image-dataset-quality-report.json not found',
      field: 'exports/image-dataset-quality-report.json',
    });
  } else if (imageQualityReport.auditResult !== 'PASS') {
    violations.push({
      code: 'FAIL_IMAGE_QUALITY',
      message: `Image dataset quality audit result is ${imageQualityReport.auditResult}`,
      field: 'image-dataset-quality-report.auditResult',
    });
  }

  const videoQualityReport = loadVideoDatasetQualityReport(projectRoot);
  if (!videoQualityReport) {
    violations.push({
      code: 'FAIL_VIDEO_QUALITY',
      message: 'video-dataset-quality-report.json not found',
      field: 'exports/video-dataset-quality-report.json',
    });
  } else if (videoQualityReport.auditResult !== 'PASS') {
    violations.push({
      code: 'FAIL_VIDEO_QUALITY',
      message: `Video dataset quality audit result is ${videoQualityReport.auditResult}`,
      field: 'video-dataset-quality-report.auditResult',
    });
  }

  return violations;
}

function auditReleaseAssetCompleteness(projectRoot: string): DualDatasetReleaseGateViolation[] {
  const violations: DualDatasetReleaseGateViolation[] = [];

  for (const assetPath of IMAGE_RELEASE_ASSETS) {
    if (!fileExists(projectRoot, assetPath)) {
      violations.push({
        code: 'FAIL_RELEASE_ASSET',
        message: `Missing image release asset: ${assetPath}`,
        field: assetPath,
      });
    }
  }

  for (const assetPath of VIDEO_RELEASE_ASSETS) {
    if (!fileExists(projectRoot, assetPath)) {
      violations.push({
        code: 'FAIL_RELEASE_ASSET',
        message: `Missing video release asset: ${assetPath}`,
        field: assetPath,
      });
    }
  }

  for (const assetPath of DUAL_RELEASE_FINGERPRINT_ASSETS) {
    if (!fileExists(projectRoot, assetPath)) {
      violations.push({
        code: 'FAIL_RELEASE_ASSET',
        message: `Missing dual release fingerprint asset: ${assetPath}`,
        field: assetPath,
      });
    }
  }

  return violations;
}

function auditCrossDomainContamination(
  projectRoot: string,
  boundaryFingerprint: DatasetBoundaryFingerprint | null,
  dependencyFingerprint: ImageVideoDependencyFingerprint | null
): DualDatasetReleaseGateViolation[] {
  const violations: DualDatasetReleaseGateViolation[] = [];
  const imageExport = loadImageDatasetExport(projectRoot);
  const videoExport = loadVideoDatasetExport(projectRoot);
  const imageHandoff = loadImageAppHandoffPackage(projectRoot);
  const videoHandoff = loadVideoAppHandoffPackage(projectRoot);

  if (imageExport?.export_metadata.export_type !== 'image_dataset') {
    violations.push({
      code: 'FAIL_CONTAMINATION',
      message: 'Image export must remain image_dataset type',
      field: 'image-dataset-export.export_metadata.export_type',
    });
  }

  if (videoExport?.export_metadata.export_type !== 'video_dataset') {
    violations.push({
      code: 'FAIL_CONTAMINATION',
      message: 'Video export must remain video_dataset type',
      field: 'video-dataset-export.export_metadata.export_type',
    });
  }

  if (imageHandoff?.handoff_metadata.handoff_type !== 'image_app') {
    violations.push({
      code: 'FAIL_CONTAMINATION',
      message: 'Image handoff package must remain image_app type',
      field: 'handoff_metadata.handoff_type',
    });
  }

  if (videoHandoff?.handoff_metadata.handoff_type !== 'video_app') {
    violations.push({
      code: 'FAIL_CONTAMINATION',
      message: 'Video handoff package must remain video_app type',
      field: 'handoff_metadata.handoff_type',
    });
  }

  if (imageHandoff?.handoff_metadata.video_app_handoff_included !== false) {
    violations.push({
      code: 'FAIL_CONTAMINATION',
      message: 'Image handoff must not include video app handoff',
      field: 'handoff_metadata.video_app_handoff_included',
    });
  }

  if (videoHandoff?.handoff_metadata.image_app_handoff_included !== false) {
    violations.push({
      code: 'FAIL_CONTAMINATION',
      message: 'Video handoff must not include image app handoff',
      field: 'handoff_metadata.image_app_handoff_included',
    });
  }

  for (const asset of imageHandoff?.manifest.assets ?? []) {
    if (CANONICAL_VIDEO_DATASET_ASSETS.includes(asset.path as (typeof CANONICAL_VIDEO_DATASET_ASSETS)[number])) {
      violations.push({
        code: 'FAIL_CONTAMINATION',
        message: `Image handoff contaminated with video dataset asset: ${asset.path}`,
        field: 'manifest.assets',
      });
    }
    if (CANONICAL_VIDEO_HANDOFF_ASSETS.includes(asset.path as (typeof CANONICAL_VIDEO_HANDOFF_ASSETS)[number])) {
      violations.push({
        code: 'FAIL_CONTAMINATION',
        message: `Image handoff contaminated with video handoff asset: ${asset.path}`,
        field: 'manifest.assets',
      });
    }
  }

  for (const asset of videoHandoff?.manifest.assets ?? []) {
    if (CANONICAL_IMAGE_DATASET_ASSETS.includes(asset.path as (typeof CANONICAL_IMAGE_DATASET_ASSETS)[number])) {
      violations.push({
        code: 'FAIL_CONTAMINATION',
        message: `Video handoff contaminated with image dataset asset: ${asset.path}`,
        field: 'manifest.assets',
      });
    }
    if (CANONICAL_IMAGE_HANDOFF_ASSETS.includes(asset.path as (typeof CANONICAL_IMAGE_HANDOFF_ASSETS)[number])) {
      violations.push({
        code: 'FAIL_CONTAMINATION',
        message: `Video handoff contaminated with image handoff asset: ${asset.path}`,
        field: 'manifest.assets',
      });
    }
  }

  if (boundaryFingerprint) {
    for (const violation of auditDatasetBoundary(projectRoot, boundaryFingerprint)) {
      violations.push({
        code: 'FAIL_CONTAMINATION',
        message: violation.message,
        field: violation.field,
      });
    }
  }

  if (dependencyFingerprint) {
    for (const violation of auditImageVideoDependency(projectRoot, dependencyFingerprint)) {
      violations.push({
        code: 'FAIL_CONTAMINATION',
        message: violation.message,
        field: violation.field,
      });
    }
  }

  return violations;
}

function computeReleaseReadiness(
  violations: DualDatasetReleaseGateViolation[]
): Pick<
  DualDatasetReleaseGateReport,
  'image_release_ready' | 'video_release_ready' | 'dual_release_ready'
> {
  const imageCodes: DualDatasetReleaseGateResult[] = [
    'FAIL_IMAGE_HANDOFF',
    'FAIL_IMAGE_QUALITY',
    'FAIL_RELEASE_ASSET',
    'FAIL_CONTAMINATION',
  ];
  const videoCodes: DualDatasetReleaseGateResult[] = [
    'FAIL_VIDEO_HANDOFF',
    'FAIL_VIDEO_QUALITY',
    'FAIL_RELEASE_ASSET',
    'FAIL_CONTAMINATION',
  ];
  const dualCodes: DualDatasetReleaseGateResult[] = [
    'FAIL_DATASET_BOUNDARY',
    'FAIL_IMAGE_VIDEO_DEPENDENCY',
    'FAIL_RELEASE_ASSET',
    'FAIL_CONTAMINATION',
    ...imageCodes,
    ...videoCodes,
  ];

  const hasCode = (codes: DualDatasetReleaseGateResult[]) =>
    violations.some((violation) => codes.includes(violation.code));

  const image_release_ready = !hasCode(imageCodes);
  const video_release_ready = !hasCode(videoCodes);
  const dual_release_ready =
    image_release_ready && video_release_ready && !hasCode(['FAIL_DATASET_BOUNDARY', 'FAIL_IMAGE_VIDEO_DEPENDENCY']);

  return { image_release_ready, video_release_ready, dual_release_ready };
}

function primaryFailure(
  violations: DualDatasetReleaseGateViolation[]
): DualDatasetReleaseGateResult {
  const priority: DualDatasetReleaseGateResult[] = [
    'FAIL_CONTAMINATION',
    'FAIL_RELEASE_ASSET',
    'FAIL_DATASET_BOUNDARY',
    'FAIL_IMAGE_VIDEO_DEPENDENCY',
    'FAIL_IMAGE_HANDOFF',
    'FAIL_VIDEO_HANDOFF',
    'FAIL_IMAGE_QUALITY',
    'FAIL_VIDEO_QUALITY',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function buildDualDatasetReleaseFingerprint(
  projectRoot: string,
  frozenAt: string
): DualDatasetReleaseFingerprint | null {
  const boundaryFingerprint = loadDatasetBoundaryFingerprint(projectRoot);
  const dependencyFingerprint = loadImageVideoDependencyFingerprint(projectRoot);

  if (!boundaryFingerprint || !dependencyFingerprint) return null;

  return {
    schemaVersion: DUAL_DATASET_RELEASE_FINGERPRINT_SCHEMA_VERSION,
    imageDatasetAssets: [...boundaryFingerprint.imageDatasetAssets],
    imageHandoffAssets: [...boundaryFingerprint.imageHandoffAssets],
    videoDatasetAssets: [...boundaryFingerprint.videoDatasetAssets],
    videoHandoffAssets: [...boundaryFingerprint.videoHandoffAssets],
    boundaryFingerprint,
    dependencyFingerprint,
    frozenAt,
  };
}

export function writeDualDatasetReleaseGateReport(
  projectRoot: string,
  report: DualDatasetReleaseGateReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, GATE_REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function writeDualDatasetReleaseFingerprint(
  projectRoot: string,
  fingerprint: DualDatasetReleaseFingerprint
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const fingerprintPath = path.join(exportsDir, GATE_FINGERPRINT_FILE);
  fs.writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  return fingerprintPath;
}

export function runDualDatasetReleaseGate(projectRoot: string): DualDatasetReleaseGateReport {
  const auditTimestamp = new Date().toISOString();
  const violations: DualDatasetReleaseGateViolation[] = [];

  violations.push(...auditUpstreamReports(projectRoot));
  violations.push(...auditReleaseAssetCompleteness(projectRoot));

  const boundaryFingerprint = loadDatasetBoundaryFingerprint(projectRoot);
  const dependencyFingerprint = loadImageVideoDependencyFingerprint(projectRoot);

  if (!boundaryFingerprint) {
    violations.push({
      code: 'FAIL_RELEASE_ASSET',
      message: 'dataset-boundary-fingerprint.json not found',
      field: 'exports/dataset-boundary-fingerprint.json',
    });
  }

  if (!dependencyFingerprint) {
    violations.push({
      code: 'FAIL_RELEASE_ASSET',
      message: 'image-video-dependency-fingerprint.json not found',
      field: 'exports/image-video-dependency-fingerprint.json',
    });
  }

  violations.push(
    ...auditCrossDomainContamination(projectRoot, boundaryFingerprint, dependencyFingerprint)
  );

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);
  const readiness = computeReleaseReadiness(violations);

  const report: DualDatasetReleaseGateReport = {
    auditTimestamp,
    auditResult,
    violations,
    ...readiness,
    dual_release_ready: auditResult === 'PASS' && readiness.dual_release_ready,
  };

  writeDualDatasetReleaseGateReport(projectRoot, report);

  const fingerprint = buildDualDatasetReleaseFingerprint(projectRoot, auditTimestamp);
  if (fingerprint) {
    writeDualDatasetReleaseFingerprint(projectRoot, fingerprint);
  }

  return report;
}
