import fs from 'node:fs';
import path from 'node:path';
import { type DualDatasetReleaseGateReport } from './dualDatasetReleaseGate.js';
import {
  MANIFEST_RELEASE_ASSETS,
  REQUIRED_MANIFEST_ASSET_IDS,
  buildDatasetReleaseManifest,
  computeManifestChecksums,
  loadDatasetReleaseManifest,
  writeDatasetReleaseManifest,
  type DatasetReleaseManifest,
} from './datasetReleaseManifest.js';

export type DatasetReleaseManifestAuditResult =
  | 'PASS'
  | 'FAIL_RELEASE_GATE'
  | 'FAIL_REQUIRED_ASSET'
  | 'FAIL_MANIFEST_INTEGRITY'
  | 'FAIL_DUPLICATE_ASSET'
  | 'FAIL_MISSING_ASSET'
  | 'FAIL_CHECKSUM_DRIFT';

export interface DatasetReleaseManifestViolation {
  code: DatasetReleaseManifestAuditResult;
  message: string;
  field?: string;
}

export interface DatasetReleaseManifestReport {
  auditTimestamp: string;
  auditResult: DatasetReleaseManifestAuditResult;
  violations: DatasetReleaseManifestViolation[];
}

const REPORT_FILE = 'dataset-release-manifest-report.json';

function fileExists(projectRoot: string, relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function loadDualDatasetReleaseGateReport(
  projectRoot: string
): DualDatasetReleaseGateReport | null {
  const reportPath = path.join(projectRoot, 'exports', 'dual-dataset-release-gate-report.json');
  if (!fs.existsSync(reportPath)) return null;
  return JSON.parse(fs.readFileSync(reportPath, 'utf8')) as DualDatasetReleaseGateReport;
}

function auditReleaseGate(projectRoot: string): DatasetReleaseManifestViolation[] {
  const violations: DatasetReleaseManifestViolation[] = [];
  const gateReport = loadDualDatasetReleaseGateReport(projectRoot);

  if (!gateReport) {
    violations.push({
      code: 'FAIL_RELEASE_GATE',
      message: 'dual-dataset-release-gate-report.json not found',
      field: 'exports/dual-dataset-release-gate-report.json',
    });
    return violations;
  }

  if (gateReport.auditResult !== 'PASS') {
    violations.push({
      code: 'FAIL_RELEASE_GATE',
      message: `Dual dataset release gate result is ${gateReport.auditResult}`,
      field: 'dual-dataset-release-gate-report.auditResult',
    });
  }

  if (!gateReport.dual_release_ready) {
    violations.push({
      code: 'FAIL_RELEASE_GATE',
      message: 'Dual release gate dual_release_ready must be true',
      field: 'dual-dataset-release-gate-report.dual_release_ready',
    });
  }

  return violations;
}

function auditRequiredAssetPresence(projectRoot: string): DatasetReleaseManifestViolation[] {
  const violations: DatasetReleaseManifestViolation[] = [];

  for (const asset of MANIFEST_RELEASE_ASSETS) {
    if (!fileExists(projectRoot, asset.path)) {
      violations.push({
        code: 'FAIL_REQUIRED_ASSET',
        message: `Required release asset missing: ${asset.path}`,
        field: asset.path,
      });
    }
  }

  return violations;
}

function auditManifestAssetIntegrity(
  manifest: DatasetReleaseManifest
): DatasetReleaseManifestViolation[] {
  const violations: DatasetReleaseManifestViolation[] = [];

  if (manifest.release_version !== 'DATASET-RELEASE-MANIFEST-PHASE-68-v1') {
    violations.push({
      code: 'FAIL_MANIFEST_INTEGRITY',
      message: 'Invalid release_version in manifest',
      field: 'release_version',
    });
  }

  if (manifest.release_assets.length !== MANIFEST_RELEASE_ASSETS.length) {
    violations.push({
      code: 'FAIL_MANIFEST_INTEGRITY',
      message: 'release_assets count does not match canonical manifest',
      field: 'release_assets',
    });
  }

  for (const expected of MANIFEST_RELEASE_ASSETS) {
    const actual = manifest.release_assets.find((asset) => asset.asset_id === expected.asset_id);
    if (!actual) {
      violations.push({
        code: 'FAIL_MISSING_ASSET',
        message: `Manifest missing asset_id: ${expected.asset_id}`,
        field: 'release_assets',
      });
      continue;
    }

    if (actual.path !== expected.path) {
      violations.push({
        code: 'FAIL_MANIFEST_INTEGRITY',
        message: `Manifest path mismatch for ${expected.asset_id}`,
        field: `release_assets.${expected.asset_id}`,
      });
    }
  }

  for (const asset of manifest.release_assets) {
    if (!manifest.checksums[asset.path]) {
      violations.push({
        code: 'FAIL_MANIFEST_INTEGRITY',
        message: `Manifest missing checksum for ${asset.path}`,
        field: 'checksums',
      });
    }
  }

  for (const assetId of REQUIRED_MANIFEST_ASSET_IDS) {
    if (!manifest.release_assets.some((asset) => asset.asset_id === assetId)) {
      violations.push({
        code: 'FAIL_MISSING_ASSET',
        message: `Required manifest asset_id missing: ${assetId}`,
        field: 'release_assets',
      });
    }
  }

  return violations;
}

function auditDuplicateAssetIds(
  manifest: DatasetReleaseManifest
): DatasetReleaseManifestViolation[] {
  const violations: DatasetReleaseManifestViolation[] = [];
  const seenAssetIds = new Set<string>();
  const seenPaths = new Set<string>();

  for (const asset of manifest.release_assets) {
    if (seenAssetIds.has(asset.asset_id)) {
      violations.push({
        code: 'FAIL_DUPLICATE_ASSET',
        message: `Duplicate manifest asset_id: ${asset.asset_id}`,
        field: 'release_assets',
      });
    }
    seenAssetIds.add(asset.asset_id);

    if (seenPaths.has(asset.path)) {
      violations.push({
        code: 'FAIL_DUPLICATE_ASSET',
        message: `Duplicate manifest asset path: ${asset.path}`,
        field: 'release_assets',
      });
    }
    seenPaths.add(asset.path);
  }

  return violations;
}

function auditChecksumDrift(
  projectRoot: string,
  frozenManifest: DatasetReleaseManifest | null,
  currentChecksums: Record<string, string>
): DatasetReleaseManifestViolation[] {
  const violations: DatasetReleaseManifestViolation[] = [];

  if (!frozenManifest) return violations;

  for (const asset of MANIFEST_RELEASE_ASSETS) {
    const frozenChecksum = frozenManifest.checksums[asset.path];
    const currentChecksum = currentChecksums[asset.path];

    if (!frozenChecksum || !currentChecksum) continue;

    if (frozenChecksum !== currentChecksum) {
      violations.push({
        code: 'FAIL_CHECKSUM_DRIFT',
        message: `Checksum drift detected for ${asset.path}`,
        field: `checksums.${asset.path}`,
      });
    }
  }

  return violations;
}

function primaryFailure(
  violations: DatasetReleaseManifestViolation[]
): DatasetReleaseManifestAuditResult {
  const priority: DatasetReleaseManifestAuditResult[] = [
    'FAIL_CHECKSUM_DRIFT',
    'FAIL_DUPLICATE_ASSET',
    'FAIL_MISSING_ASSET',
    'FAIL_REQUIRED_ASSET',
    'FAIL_MANIFEST_INTEGRITY',
    'FAIL_RELEASE_GATE',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditDatasetReleaseManifest(
  projectRoot: string,
  manifest: DatasetReleaseManifest,
  frozenManifest: DatasetReleaseManifest | null
): DatasetReleaseManifestViolation[] {
  const violations: DatasetReleaseManifestViolation[] = [];
  const currentChecksums = computeManifestChecksums(projectRoot);

  violations.push(...auditReleaseGate(projectRoot));
  violations.push(...auditRequiredAssetPresence(projectRoot));
  violations.push(...auditManifestAssetIntegrity(manifest));
  violations.push(...auditDuplicateAssetIds(manifest));
  violations.push(...auditChecksumDrift(projectRoot, frozenManifest, currentChecksums));

  if (manifest.release_ready !== true && violations.length === 0) {
    violations.push({
      code: 'FAIL_MANIFEST_INTEGRITY',
      message: 'release_ready must be true when all release checks pass',
      field: 'release_ready',
    });
  }

  return violations;
}

export function writeDatasetReleaseManifestReport(
  projectRoot: string,
  report: DatasetReleaseManifestReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runDatasetReleaseManifestAudit(
  projectRoot: string
): DatasetReleaseManifestReport {
  const auditTimestamp = new Date().toISOString();
  const frozenManifest = loadDatasetReleaseManifest(projectRoot);
  const gateReport = loadDualDatasetReleaseGateReport(projectRoot);
  const gatePassed = gateReport?.auditResult === 'PASS' && gateReport.dual_release_ready === true;

  const manifest = buildDatasetReleaseManifest(projectRoot, gatePassed);
  const violations = auditDatasetReleaseManifest(projectRoot, manifest, frozenManifest);
  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  if (auditResult === 'PASS') {
    const finalManifest = buildDatasetReleaseManifest(projectRoot, true);
    writeDatasetReleaseManifest(projectRoot, finalManifest);
  }

  const report: DatasetReleaseManifestReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeDatasetReleaseManifestReport(projectRoot, report);
  return report;
}
