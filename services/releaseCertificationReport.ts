import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { type AppConsumptionSimulationReport } from './appConsumptionSimulationAudit.js';
import { type AppIngestionDryRunReport } from './appIngestionDryRunAudit.js';
import {
  DATASET_RELEASE_LOCK_JSON_PATH,
  loadDatasetReleaseLock,
} from './datasetReleaseLock.js';
import { MANIFEST_RELEASE_ASSETS } from './datasetReleaseManifest.js';
import { IMAGE_APP_HANDOFF_CONSUMER_TARGET } from './imageAppHandoffPackage.js';
import { type ReleaseConsumptionReadinessReport } from './releaseConsumptionReadinessAudit.js';
import { VIDEO_APP_HANDOFF_CONSUMER_TARGET } from './videoAppHandoffPackage.js';

export const RELEASE_CERTIFICATION_VERSION = 'RELEASE-CERTIFICATION-PHASE-74-v1' as const;
export const RELEASE_CERTIFICATION_FINGERPRINT_SCHEMA_VERSION =
  'RELEASE-CERTIFICATION-FINGERPRINT-PHASE-74-v1' as const;

export type ReleaseCertificationAuditResult =
  | 'PASS'
  | 'FAIL_RELEASE_LOCK'
  | 'FAIL_CONSUMPTION_READINESS'
  | 'FAIL_INGESTION_DRY_RUN'
  | 'FAIL_HANDOFF_CONTRACT'
  | 'FAIL_CONSUMPTION_SIMULATION'
  | 'FAIL_IMAGE_QUALITY'
  | 'FAIL_VIDEO_QUALITY'
  | 'FAIL_BOUNDARY'
  | 'FAIL_DEPENDENCY';

export interface ReleaseCertificationViolation {
  code: ReleaseCertificationAuditResult;
  message: string;
  field?: string;
}

export interface UpstreamAuditReference {
  report_path: string;
  audit_result: string;
  audit_timestamp: string;
}

export interface ReleaseCertificationReport {
  certification_version: typeof RELEASE_CERTIFICATION_VERSION;
  auditTimestamp: string;
  audit_result: ReleaseCertificationAuditResult;
  certified: boolean;
  image_app_ready: boolean;
  video_app_ready: boolean;
  dual_dataset_release_ready: boolean;
  violations: ReleaseCertificationViolation[];
}

export interface ReleaseCertificationFingerprint {
  schemaVersion: typeof RELEASE_CERTIFICATION_FINGERPRINT_SCHEMA_VERSION;
  releaseLockChecksum: string;
  imageAppTarget: typeof IMAGE_APP_HANDOFF_CONSUMER_TARGET;
  videoAppTarget: typeof VIDEO_APP_HANDOFF_CONSUMER_TARGET;
  certifiedAssetList: Array<{ asset_id: string; path: string; checksum?: string }>;
  upstreamAuditReferences: UpstreamAuditReference[];
  frozenAt: string;
}

interface AuditReportBase {
  auditTimestamp: string;
  auditResult: string;
}

const REPORT_FILE = 'release-certification-report.json';
const FINGERPRINT_FILE = 'release-certification-fingerprint.json';

const UPSTREAM_AUDIT_SOURCES: Array<{
  path: string;
  code: ReleaseCertificationAuditResult;
  label: string;
}> = [
  {
    path: 'exports/dataset-release-lock-report.json',
    code: 'FAIL_RELEASE_LOCK',
    label: 'dataset release lock',
  },
  {
    path: 'exports/release-consumption-readiness-report.json',
    code: 'FAIL_CONSUMPTION_READINESS',
    label: 'release consumption readiness',
  },
  {
    path: 'exports/app-ingestion-dry-run-report.json',
    code: 'FAIL_INGESTION_DRY_RUN',
    label: 'app ingestion dry-run',
  },
  {
    path: 'exports/app-handoff-contract-freeze-report.json',
    code: 'FAIL_HANDOFF_CONTRACT',
    label: 'app handoff contract freeze',
  },
  {
    path: 'exports/app-consumption-simulation-report.json',
    code: 'FAIL_CONSUMPTION_SIMULATION',
    label: 'app consumption simulation',
  },
  {
    path: 'exports/image-dataset-quality-report.json',
    code: 'FAIL_IMAGE_QUALITY',
    label: 'image dataset quality',
  },
  {
    path: 'exports/video-dataset-quality-report.json',
    code: 'FAIL_VIDEO_QUALITY',
    label: 'video dataset quality',
  },
  {
    path: 'exports/dataset-boundary-report.json',
    code: 'FAIL_BOUNDARY',
    label: 'dataset boundary',
  },
  {
    path: 'exports/image-video-dependency-report.json',
    code: 'FAIL_DEPENDENCY',
    label: 'image-video dependency',
  },
];

function loadJsonReport<T>(projectRoot: string, relativePath: string): T | null {
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

function collectUpstreamAuditReferences(projectRoot: string): UpstreamAuditReference[] {
  return UPSTREAM_AUDIT_SOURCES.map((source) => {
    const report = loadJsonReport<AuditReportBase>(projectRoot, source.path);
    return {
      report_path: source.path,
      audit_result: report?.auditResult ?? 'MISSING',
      audit_timestamp: report?.auditTimestamp ?? '',
    };
  });
}

function auditUpstreamReports(projectRoot: string): ReleaseCertificationViolation[] {
  const violations: ReleaseCertificationViolation[] = [];

  for (const source of UPSTREAM_AUDIT_SOURCES) {
    const report = loadJsonReport<AuditReportBase>(projectRoot, source.path);
    if (!report) {
      violations.push({
        code: source.code,
        message: `${source.label} report not found`,
        field: source.path,
      });
      continue;
    }

    if (report.auditResult !== 'PASS') {
      violations.push({
        code: source.code,
        message: `${source.label} audit result is ${report.auditResult}`,
        field: `${source.path}.auditResult`,
      });
    }
  }

  const releaseLock = loadDatasetReleaseLock(projectRoot);
  if (releaseLock && releaseLock.release_locked !== true) {
    violations.push({
      code: 'FAIL_RELEASE_LOCK',
      message: 'Release lock release_locked must be true for certification',
      field: 'dataset-release-lock.release_locked',
    });
  }

  return violations;
}

function computeReadinessFlags(
  projectRoot: string,
  violations: ReleaseCertificationViolation[]
): Pick<
  ReleaseCertificationReport,
  'image_app_ready' | 'video_app_ready' | 'dual_dataset_release_ready'
> {
  const imageCodes: ReleaseCertificationAuditResult[] = [
    'FAIL_RELEASE_LOCK',
    'FAIL_CONSUMPTION_READINESS',
    'FAIL_INGESTION_DRY_RUN',
    'FAIL_HANDOFF_CONTRACT',
    'FAIL_CONSUMPTION_SIMULATION',
    'FAIL_IMAGE_QUALITY',
    'FAIL_BOUNDARY',
    'FAIL_DEPENDENCY',
  ];
  const videoCodes: ReleaseCertificationAuditResult[] = [
    'FAIL_RELEASE_LOCK',
    'FAIL_CONSUMPTION_READINESS',
    'FAIL_INGESTION_DRY_RUN',
    'FAIL_HANDOFF_CONTRACT',
    'FAIL_CONSUMPTION_SIMULATION',
    'FAIL_VIDEO_QUALITY',
    'FAIL_BOUNDARY',
    'FAIL_DEPENDENCY',
  ];

  const hasCode = (codes: ReleaseCertificationAuditResult[]) =>
    violations.some((violation) => codes.includes(violation.code));

  const consumptionReadiness = loadJsonReport<ReleaseConsumptionReadinessReport>(
    projectRoot,
    'exports/release-consumption-readiness-report.json'
  );
  const ingestionDryRun = loadJsonReport<AppIngestionDryRunReport>(
    projectRoot,
    'exports/app-ingestion-dry-run-report.json'
  );
  const consumptionSimulation = loadJsonReport<AppConsumptionSimulationReport>(
    projectRoot,
    'exports/app-consumption-simulation-report.json'
  );

  const image_app_ready =
    !hasCode(imageCodes) &&
    consumptionReadiness?.image_app_ready === true &&
    ingestionDryRun?.image_ingestion_ready === true &&
    consumptionSimulation?.image_consumption_simulated === true;

  const video_app_ready =
    !hasCode(videoCodes) &&
    consumptionReadiness?.video_app_ready === true &&
    ingestionDryRun?.video_ingestion_ready === true &&
    consumptionSimulation?.video_consumption_simulated === true;

  const dual_dataset_release_ready =
    image_app_ready &&
    video_app_ready &&
    consumptionReadiness?.release_consumption_ready === true &&
    violations.length === 0;

  return { image_app_ready, video_app_ready, dual_dataset_release_ready };
}

function primaryFailure(
  violations: ReleaseCertificationViolation[]
): ReleaseCertificationAuditResult {
  const priority: ReleaseCertificationAuditResult[] = [
    'FAIL_RELEASE_LOCK',
    'FAIL_BOUNDARY',
    'FAIL_DEPENDENCY',
    'FAIL_IMAGE_QUALITY',
    'FAIL_VIDEO_QUALITY',
    'FAIL_CONSUMPTION_READINESS',
    'FAIL_INGESTION_DRY_RUN',
    'FAIL_HANDOFF_CONTRACT',
    'FAIL_CONSUMPTION_SIMULATION',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function buildReleaseCertificationFingerprint(
  projectRoot: string,
  frozenAt: string
): ReleaseCertificationFingerprint | null {
  const releaseLockChecksum = computeReleaseLockFileChecksum(projectRoot);
  if (!releaseLockChecksum) return null;

  const releaseLock = loadDatasetReleaseLock(projectRoot);
  const certifiedAssetList = releaseLock
    ? releaseLock.locked_assets.map((asset) => ({
        asset_id: asset.asset_id,
        path: asset.path,
        checksum: asset.checksum,
      }))
    : MANIFEST_RELEASE_ASSETS.map((asset) => ({
        asset_id: asset.asset_id,
        path: asset.path,
      }));

  return {
    schemaVersion: RELEASE_CERTIFICATION_FINGERPRINT_SCHEMA_VERSION,
    releaseLockChecksum,
    imageAppTarget: IMAGE_APP_HANDOFF_CONSUMER_TARGET,
    videoAppTarget: VIDEO_APP_HANDOFF_CONSUMER_TARGET,
    certifiedAssetList,
    upstreamAuditReferences: collectUpstreamAuditReferences(projectRoot),
    frozenAt,
  };
}

export function collectReleaseCertification(
  projectRoot: string,
  auditTimestamp: string
): ReleaseCertificationReport {
  const violations = auditUpstreamReports(projectRoot);
  const audit_result = violations.length === 0 ? 'PASS' : primaryFailure(violations);
  const readiness = computeReadinessFlags(projectRoot, violations);

  return {
    certification_version: RELEASE_CERTIFICATION_VERSION,
    auditTimestamp,
    audit_result,
    certified: audit_result === 'PASS' && readiness.dual_dataset_release_ready,
    ...readiness,
    dual_dataset_release_ready:
      audit_result === 'PASS' && readiness.dual_dataset_release_ready,
    violations,
  };
}

export function writeReleaseCertificationReport(
  projectRoot: string,
  report: ReleaseCertificationReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function writeReleaseCertificationFingerprint(
  projectRoot: string,
  fingerprint: ReleaseCertificationFingerprint
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const fingerprintPath = path.join(exportsDir, FINGERPRINT_FILE);
  fs.writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  return fingerprintPath;
}

export function runReleaseCertificationReport(projectRoot: string): ReleaseCertificationReport {
  const auditTimestamp = new Date().toISOString();
  const report = collectReleaseCertification(projectRoot, auditTimestamp);
  writeReleaseCertificationReport(projectRoot, report);

  const fingerprint = buildReleaseCertificationFingerprint(projectRoot, auditTimestamp);
  if (fingerprint) {
    writeReleaseCertificationFingerprint(projectRoot, fingerprint);
  }

  return report;
}
