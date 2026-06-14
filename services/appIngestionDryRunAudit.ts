import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  IMAGE_DATASET_EXPORT_SCHEMA_VERSION,
  IMAGE_DATASET_EXPORT_JSON_PATH,
  type ImageDatasetExport,
} from './imageDatasetExport.js';
import { loadImageDatasetExport } from './imageDatasetExportAudit.js';
import {
  IMAGE_APP_HANDOFF_PACKAGE_SCHEMA_VERSION,
  IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
  IMAGE_DATASET_QUALITY_REPORT_JSON_PATH,
  loadImageAppHandoffPackage,
  type ImageAppHandoffPackage,
} from './imageAppHandoffPackage.js';
import { loadImageDatasetQualityReport } from './imageDatasetQualityAudit.js';
import {
  VIDEO_DATASET_EXPORT_SCHEMA_VERSION,
  VIDEO_DATASET_EXPORT_JSON_PATH,
  type VideoDatasetExport,
} from './videoDatasetExport.js';
import { loadVideoDatasetExport } from './videoDatasetExportAudit.js';
import {
  VIDEO_APP_HANDOFF_PACKAGE_SCHEMA_VERSION,
  VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
  VIDEO_DATASET_QUALITY_REPORT_JSON_PATH,
  loadVideoAppHandoffPackage,
  type VideoAppHandoffPackage,
} from './videoAppHandoffPackage.js';
import { loadVideoDatasetQualityReport } from './videoDatasetQualityAudit.js';

export type AppIngestionDryRunAuditResult =
  | 'PASS'
  | 'FAIL_IMAGE_INGESTION'
  | 'FAIL_VIDEO_INGESTION'
  | 'FAIL_HANDOFF_SCHEMA'
  | 'FAIL_EXPORT_SCHEMA'
  | 'FAIL_QUALITY_REPORT'
  | 'FAIL_RUNTIME_TRIGGERED';

export interface AppIngestionDryRunViolation {
  code: AppIngestionDryRunAuditResult;
  message: string;
  field?: string;
}

export interface AppIngestionDryRunReport {
  auditTimestamp: string;
  auditResult: AppIngestionDryRunAuditResult;
  violations: AppIngestionDryRunViolation[];
  image_ingestion_ready: boolean;
  video_ingestion_ready: boolean;
}

interface FileSnapshot {
  path: string;
  checksum: string;
  mtimeMs: number;
}

const REPORT_FILE = 'app-ingestion-dry-run-report.json';

const PROTECTED_RELEASE_PATHS = [
  IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
  VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
  IMAGE_DATASET_EXPORT_JSON_PATH,
  VIDEO_DATASET_EXPORT_JSON_PATH,
  IMAGE_DATASET_QUALITY_REPORT_JSON_PATH,
  VIDEO_DATASET_QUALITY_REPORT_JSON_PATH,
  'exports/dataset-release-manifest.json',
  'exports/dataset-release-lock.json',
] as const;

const IMAGE_INGESTION_PATHS = [
  IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
  IMAGE_DATASET_EXPORT_JSON_PATH,
  IMAGE_DATASET_QUALITY_REPORT_JSON_PATH,
] as const;

const VIDEO_INGESTION_PATHS = [
  VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
  VIDEO_DATASET_EXPORT_JSON_PATH,
  VIDEO_DATASET_QUALITY_REPORT_JSON_PATH,
] as const;

function fileExists(projectRoot: string, relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function snapshotProtectedFiles(projectRoot: string): FileSnapshot[] {
  return PROTECTED_RELEASE_PATHS.map((relativePath) => {
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

function auditNoRuntimeGenerationTriggered(
  before: FileSnapshot[],
  after: FileSnapshot[]
): AppIngestionDryRunViolation[] {
  const violations: AppIngestionDryRunViolation[] = [];
  const afterByPath = new Map(after.map((snapshot) => [snapshot.path, snapshot]));

  for (const snapshot of before) {
    const next = afterByPath.get(snapshot.path);
    if (!next) {
      violations.push({
        code: 'FAIL_RUNTIME_TRIGGERED',
        message: `Protected release file removed during dry-run: ${snapshot.path}`,
        field: snapshot.path,
      });
      continue;
    }

    if (next.checksum !== snapshot.checksum || next.mtimeMs !== snapshot.mtimeMs) {
      violations.push({
        code: 'FAIL_RUNTIME_TRIGGERED',
        message: `Protected release file modified during dry-run: ${snapshot.path}`,
        field: snapshot.path,
      });
    }
  }

  return violations;
}

function validateImageHandoffSchema(
  handoff: ImageAppHandoffPackage
): AppIngestionDryRunViolation[] {
  const violations: AppIngestionDryRunViolation[] = [];

  if (handoff.handoff_metadata.schema_version !== IMAGE_APP_HANDOFF_PACKAGE_SCHEMA_VERSION) {
    violations.push({
      code: 'FAIL_HANDOFF_SCHEMA',
      message: 'Image handoff schema_version is not readable for ingestion',
      field: 'handoff_metadata.schema_version',
    });
  }

  if (handoff.manifest.manifest_id !== 'image-app-handoff-manifest-v1') {
    violations.push({
      code: 'FAIL_HANDOFF_SCHEMA',
      message: 'Image handoff manifest_id is invalid',
      field: 'manifest.manifest_id',
    });
  }

  if (!handoff.export_reference?.path || !handoff.quality_reference?.path) {
    violations.push({
      code: 'FAIL_HANDOFF_SCHEMA',
      message: 'Image handoff references are incomplete',
      field: 'export_reference|quality_reference',
    });
  }

  return violations;
}

function validateVideoHandoffSchema(
  handoff: VideoAppHandoffPackage
): AppIngestionDryRunViolation[] {
  const violations: AppIngestionDryRunViolation[] = [];

  if (handoff.handoff_metadata.schema_version !== VIDEO_APP_HANDOFF_PACKAGE_SCHEMA_VERSION) {
    violations.push({
      code: 'FAIL_HANDOFF_SCHEMA',
      message: 'Video handoff schema_version is not readable for ingestion',
      field: 'handoff_metadata.schema_version',
    });
  }

  if (handoff.manifest.manifest_id !== 'video-app-handoff-manifest-v1') {
    violations.push({
      code: 'FAIL_HANDOFF_SCHEMA',
      message: 'Video handoff manifest_id is invalid',
      field: 'manifest.manifest_id',
    });
  }

  if (!handoff.export_reference?.path || !handoff.quality_reference?.path) {
    violations.push({
      code: 'FAIL_HANDOFF_SCHEMA',
      message: 'Video handoff references are incomplete',
      field: 'export_reference|quality_reference',
    });
  }

  return violations;
}

function validateImageExportSchema(exportData: ImageDatasetExport): AppIngestionDryRunViolation[] {
  const violations: AppIngestionDryRunViolation[] = [];

  if (exportData.export_metadata.schema_version !== IMAGE_DATASET_EXPORT_SCHEMA_VERSION) {
    violations.push({
      code: 'FAIL_EXPORT_SCHEMA',
      message: 'Image dataset export schema_version is not readable',
      field: 'export_metadata.schema_version',
    });
  }

  if (!Array.isArray(exportData.scene_records) || !Array.isArray(exportData.dataset_index)) {
    violations.push({
      code: 'FAIL_EXPORT_SCHEMA',
      message: 'Image dataset export records/index are not readable',
      field: 'scene_records|dataset_index',
    });
  }

  return violations;
}

function validateVideoExportSchema(exportData: VideoDatasetExport): AppIngestionDryRunViolation[] {
  const violations: AppIngestionDryRunViolation[] = [];

  if (exportData.export_metadata.schema_version !== VIDEO_DATASET_EXPORT_SCHEMA_VERSION) {
    violations.push({
      code: 'FAIL_EXPORT_SCHEMA',
      message: 'Video dataset export schema_version is not readable',
      field: 'export_metadata.schema_version',
    });
  }

  if (!Array.isArray(exportData.scene_records) || !Array.isArray(exportData.dataset_index)) {
    violations.push({
      code: 'FAIL_EXPORT_SCHEMA',
      message: 'Video dataset export records/index are not readable',
      field: 'scene_records|dataset_index',
    });
  }

  return violations;
}

function validateQualityReportReadable(
  domain: 'image' | 'video',
  projectRoot: string
): AppIngestionDryRunViolation[] {
  const violations: AppIngestionDryRunViolation[] = [];
  const reportPath =
    domain === 'image'
      ? IMAGE_DATASET_QUALITY_REPORT_JSON_PATH
      : VIDEO_DATASET_QUALITY_REPORT_JSON_PATH;
  const report =
    domain === 'image'
      ? loadImageDatasetQualityReport(projectRoot)
      : loadVideoDatasetQualityReport(projectRoot);

  if (!report) {
    violations.push({
      code: 'FAIL_QUALITY_REPORT',
      message: `${domain} quality report not readable`,
      field: reportPath,
    });
    return violations;
  }

  if (typeof report.auditTimestamp !== 'string' || typeof report.auditResult !== 'string') {
    violations.push({
      code: 'FAIL_QUALITY_REPORT',
      message: `${domain} quality report schema is incomplete`,
      field: reportPath,
    });
  }

  if (typeof report.quality_score !== 'number') {
    violations.push({
      code: 'FAIL_QUALITY_REPORT',
      message: `${domain} quality report quality_score missing`,
      field: `${reportPath}.quality_score`,
    });
  }

  return violations;
}

function dryRunImageAppIngestion(projectRoot: string): AppIngestionDryRunViolation[] {
  const violations: AppIngestionDryRunViolation[] = [];

  for (const ingestionPath of IMAGE_INGESTION_PATHS) {
    if (!fileExists(projectRoot, ingestionPath)) {
      violations.push({
        code: 'FAIL_IMAGE_INGESTION',
        message: `Image app ingestion path missing: ${ingestionPath}`,
        field: ingestionPath,
      });
    }
  }

  const handoff = loadImageAppHandoffPackage(projectRoot);
  if (!handoff) {
    violations.push({
      code: 'FAIL_IMAGE_INGESTION',
      message: 'Image app handoff package not readable at ingestion entrypoint',
      field: IMAGE_APP_HANDOFF_PACKAGE_JSON_PATH,
    });
    return violations;
  }

  violations.push(...validateImageHandoffSchema(handoff));

  for (const asset of handoff.manifest.assets) {
    if (!fileExists(projectRoot, asset.path)) {
      violations.push({
        code: 'FAIL_IMAGE_INGESTION',
        message: `Image app ingestion manifest asset missing: ${asset.path}`,
        field: 'manifest.assets',
      });
    }
  }

  const exportData = loadImageDatasetExport(projectRoot);
  if (!exportData) {
    violations.push({
      code: 'FAIL_IMAGE_INGESTION',
      message: 'Image app cannot read referenced dataset export',
      field: handoff.export_reference.path,
    });
  } else {
    violations.push(...validateImageExportSchema(exportData));
  }

  violations.push(...validateQualityReportReadable('image', projectRoot));

  return violations;
}

function dryRunVideoAppIngestion(projectRoot: string): AppIngestionDryRunViolation[] {
  const violations: AppIngestionDryRunViolation[] = [];

  for (const ingestionPath of VIDEO_INGESTION_PATHS) {
    if (!fileExists(projectRoot, ingestionPath)) {
      violations.push({
        code: 'FAIL_VIDEO_INGESTION',
        message: `Video app ingestion path missing: ${ingestionPath}`,
        field: ingestionPath,
      });
    }
  }

  const handoff = loadVideoAppHandoffPackage(projectRoot);
  if (!handoff) {
    violations.push({
      code: 'FAIL_VIDEO_INGESTION',
      message: 'Video app handoff package not readable at ingestion entrypoint',
      field: VIDEO_APP_HANDOFF_PACKAGE_JSON_PATH,
    });
    return violations;
  }

  violations.push(...validateVideoHandoffSchema(handoff));

  for (const asset of handoff.manifest.assets) {
    if (!fileExists(projectRoot, asset.path)) {
      violations.push({
        code: 'FAIL_VIDEO_INGESTION',
        message: `Video app ingestion manifest asset missing: ${asset.path}`,
        field: 'manifest.assets',
      });
    }
  }

  const exportData = loadVideoDatasetExport(projectRoot);
  if (!exportData) {
    violations.push({
      code: 'FAIL_VIDEO_INGESTION',
      message: 'Video app cannot read referenced dataset export',
      field: handoff.export_reference.path,
    });
  } else {
    violations.push(...validateVideoExportSchema(exportData));
  }

  violations.push(...validateQualityReportReadable('video', projectRoot));

  return violations;
}

function computeIngestionReadiness(violations: AppIngestionDryRunViolation[]): Pick<
  AppIngestionDryRunReport,
  'image_ingestion_ready' | 'video_ingestion_ready'
> {
  const imageCodes: AppIngestionDryRunAuditResult[] = [
    'FAIL_IMAGE_INGESTION',
    'FAIL_HANDOFF_SCHEMA',
    'FAIL_EXPORT_SCHEMA',
    'FAIL_QUALITY_REPORT',
    'FAIL_RUNTIME_TRIGGERED',
  ];
  const videoCodes: AppIngestionDryRunAuditResult[] = [
    'FAIL_VIDEO_INGESTION',
    'FAIL_HANDOFF_SCHEMA',
    'FAIL_EXPORT_SCHEMA',
    'FAIL_QUALITY_REPORT',
    'FAIL_RUNTIME_TRIGGERED',
  ];

  const hasCode = (codes: AppIngestionDryRunAuditResult[]) =>
    violations.some((violation) => codes.includes(violation.code));

  return {
    image_ingestion_ready: !hasCode(imageCodes),
    video_ingestion_ready: !hasCode(videoCodes),
  };
}

function primaryFailure(
  violations: AppIngestionDryRunViolation[]
): AppIngestionDryRunAuditResult {
  const priority: AppIngestionDryRunAuditResult[] = [
    'FAIL_RUNTIME_TRIGGERED',
    'FAIL_HANDOFF_SCHEMA',
    'FAIL_EXPORT_SCHEMA',
    'FAIL_QUALITY_REPORT',
    'FAIL_IMAGE_INGESTION',
    'FAIL_VIDEO_INGESTION',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditAppIngestionDryRun(projectRoot: string): AppIngestionDryRunViolation[] {
  const beforeSnapshot = snapshotProtectedFiles(projectRoot);
  const violations: AppIngestionDryRunViolation[] = [];

  violations.push(...dryRunImageAppIngestion(projectRoot));
  violations.push(...dryRunVideoAppIngestion(projectRoot));

  const afterSnapshot = snapshotProtectedFiles(projectRoot);
  violations.push(...auditNoRuntimeGenerationTriggered(beforeSnapshot, afterSnapshot));

  return violations;
}

export function writeAppIngestionDryRunReport(
  projectRoot: string,
  report: AppIngestionDryRunReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runAppIngestionDryRunAudit(projectRoot: string): AppIngestionDryRunReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditAppIngestionDryRun(projectRoot);
  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);
  const readiness = computeIngestionReadiness(violations);

  const report: AppIngestionDryRunReport = {
    auditTimestamp,
    auditResult,
    violations,
    ...readiness,
  };

  writeAppIngestionDryRunReport(projectRoot, report);
  return report;
}
