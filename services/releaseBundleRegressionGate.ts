import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { RELEASE_HANDOFF_FINAL_BUNDLE_JSON_PATH } from './releaseHandoffFinalBundle.js';

export const RELEASE_BUNDLE_REGRESSION_FINGERPRINT_SCHEMA_VERSION =
  'RELEASE-BUNDLE-REGRESSION-FINGERPRINT-PHASE-77-v1' as const;

export type ReleaseBundleRegressionGateResult =
  | 'PASS'
  | 'FAIL_DUAL_RELEASE_GATE'
  | 'FAIL_RELEASE_MANIFEST'
  | 'FAIL_RELEASE_LOCK'
  | 'FAIL_CONSUMPTION_READINESS'
  | 'FAIL_INGESTION_DRY_RUN'
  | 'FAIL_HANDOFF_CONTRACT'
  | 'FAIL_CONSUMPTION_SIMULATION'
  | 'FAIL_CERTIFICATION'
  | 'FAIL_FINAL_BUNDLE'
  | 'FAIL_CONSUMER_SMOKE';

export interface ReleaseBundleRegressionGateViolation {
  code: ReleaseBundleRegressionGateResult;
  message: string;
  field?: string;
}

export interface ReleaseBundleRegressionGateReport {
  auditTimestamp: string;
  auditResult: ReleaseBundleRegressionGateResult;
  violations: ReleaseBundleRegressionGateViolation[];
  regression_pass: boolean;
}

export interface ReleaseBundleRegressionFingerprint {
  schemaVersion: typeof RELEASE_BUNDLE_REGRESSION_FINGERPRINT_SCHEMA_VERSION;
  upstreamReportChecksums: Record<string, string>;
  finalBundleChecksum: string;
  smokeFingerprintChecksum: string;
  frozenAt: string;
}

interface UpstreamRegressionSource {
  path: string;
  code: ReleaseBundleRegressionGateResult;
  label: string;
}

interface FileSnapshot {
  path: string;
  checksum: string;
  mtimeMs: number;
}

const GATE_REPORT_FILE = 'release-bundle-regression-gate-report.json';
const GATE_FINGERPRINT_FILE = 'release-bundle-regression-fingerprint.json';
const SMOKE_FINGERPRINT_PATH = 'exports/release-bundle-consumer-smoke-fingerprint.json';

const UPSTREAM_REGRESSION_SOURCES: readonly UpstreamRegressionSource[] = [
  {
    path: 'exports/dual-dataset-release-gate-report.json',
    code: 'FAIL_DUAL_RELEASE_GATE',
    label: 'dual dataset release gate',
  },
  {
    path: 'exports/dataset-release-manifest-report.json',
    code: 'FAIL_RELEASE_MANIFEST',
    label: 'dataset release manifest',
  },
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
    path: 'exports/release-certification-report.json',
    code: 'FAIL_CERTIFICATION',
    label: 'release certification',
  },
  {
    path: 'exports/release-handoff-final-bundle-report.json',
    code: 'FAIL_FINAL_BUNDLE',
    label: 'release handoff final bundle',
  },
  {
    path: 'exports/release-bundle-consumer-smoke-report.json',
    code: 'FAIL_CONSUMER_SMOKE',
    label: 'release bundle consumer smoke',
  },
] as const;

const PROTECTED_REGRESSION_PATHS = [
  ...UPSTREAM_REGRESSION_SOURCES.map((source) => source.path),
  RELEASE_HANDOFF_FINAL_BUNDLE_JSON_PATH,
  SMOKE_FINGERPRINT_PATH,
] as const;

function fileExists(projectRoot: string, relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function loadJsonReport<T extends Record<string, unknown>>(
  projectRoot: string,
  relativePath: string
): T | null {
  const filePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function computeFileChecksum(projectRoot: string, relativePath: string): string | null {
  const filePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function getAuditResult(report: Record<string, unknown>): string | undefined {
  if (typeof report.auditResult === 'string') return report.auditResult;
  if (typeof report.audit_result === 'string') return report.audit_result;
  return undefined;
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

function auditUpstreamReportPass(
  projectRoot: string
): ReleaseBundleRegressionGateViolation[] {
  const violations: ReleaseBundleRegressionGateViolation[] = [];

  for (const source of UPSTREAM_REGRESSION_SOURCES) {
    const report = loadJsonReport<Record<string, unknown>>(projectRoot, source.path);

    if (!report) {
      violations.push({
        code: source.code,
        message: `${source.label} report not found`,
        field: source.path,
      });
      continue;
    }

    const auditResult = getAuditResult(report);
    if (auditResult !== 'PASS') {
      violations.push({
        code: source.code,
        message: `${source.label} audit result is ${auditResult ?? 'MISSING'}`,
        field: `${source.path}.auditResult`,
      });
    }

    if (source.code === 'FAIL_CERTIFICATION' && report.certified !== true) {
      violations.push({
        code: 'FAIL_CERTIFICATION',
        message: 'Release certification certified flag must be true',
        field: 'exports/release-certification-report.json.certified',
      });
    }

    if (source.code === 'FAIL_CONSUMER_SMOKE') {
      if (report.image_app_smoke_pass !== true) {
        violations.push({
          code: 'FAIL_CONSUMER_SMOKE',
          message: 'Consumer smoke image_app_smoke_pass must be true',
          field: 'exports/release-bundle-consumer-smoke-report.json.image_app_smoke_pass',
        });
      }
      if (report.video_app_smoke_pass !== true) {
        violations.push({
          code: 'FAIL_CONSUMER_SMOKE',
          message: 'Consumer smoke video_app_smoke_pass must be true',
          field: 'exports/release-bundle-consumer-smoke-report.json.video_app_smoke_pass',
        });
      }
      if (report.release_bundle_smoke_pass !== true) {
        violations.push({
          code: 'FAIL_CONSUMER_SMOKE',
          message: 'Consumer smoke release_bundle_smoke_pass must be true',
          field: 'exports/release-bundle-consumer-smoke-report.json.release_bundle_smoke_pass',
        });
      }
    }
  }

  return violations;
}

function collectUpstreamReportChecksums(projectRoot: string): Record<string, string> {
  const checksums: Record<string, string> = {};
  for (const source of UPSTREAM_REGRESSION_SOURCES) {
    const checksum = computeFileChecksum(projectRoot, source.path);
    if (checksum) {
      checksums[source.path] = checksum;
    }
  }
  return checksums;
}

function auditReportChecksumIntegrity(
  projectRoot: string,
  frozenFingerprint: ReleaseBundleRegressionFingerprint | null
): ReleaseBundleRegressionGateViolation[] {
  const violations: ReleaseBundleRegressionGateViolation[] = [];
  const currentChecksums = collectUpstreamReportChecksums(projectRoot);

  for (const source of UPSTREAM_REGRESSION_SOURCES) {
    const current = currentChecksums[source.path];
    if (!current) {
      violations.push({
        code: source.code,
        message: `Unable to compute checksum for upstream report: ${source.path}`,
        field: source.path,
      });
      continue;
    }

    if (frozenFingerprint) {
      const frozen = frozenFingerprint.upstreamReportChecksums[source.path];
      if (frozen && frozen !== current) {
        violations.push({
          code: source.code,
          message: `Upstream report checksum drift detected: ${source.path}`,
          field: source.path,
        });
      }
    }
  }

  const finalBundleChecksum = computeFileChecksum(projectRoot, RELEASE_HANDOFF_FINAL_BUNDLE_JSON_PATH);
  if (!finalBundleChecksum) {
    violations.push({
      code: 'FAIL_FINAL_BUNDLE',
      message: 'Unable to compute final bundle checksum',
      field: RELEASE_HANDOFF_FINAL_BUNDLE_JSON_PATH,
    });
  } else if (
    frozenFingerprint &&
    frozenFingerprint.finalBundleChecksum !== finalBundleChecksum
  ) {
    violations.push({
      code: 'FAIL_FINAL_BUNDLE',
      message: 'Final bundle checksum drift detected',
      field: RELEASE_HANDOFF_FINAL_BUNDLE_JSON_PATH,
    });
  }

  const smokeFingerprintChecksum = computeFileChecksum(projectRoot, SMOKE_FINGERPRINT_PATH);
  if (!smokeFingerprintChecksum) {
    violations.push({
      code: 'FAIL_CONSUMER_SMOKE',
      message: 'Unable to compute smoke fingerprint checksum',
      field: SMOKE_FINGERPRINT_PATH,
    });
  } else if (
    frozenFingerprint &&
    frozenFingerprint.smokeFingerprintChecksum !== smokeFingerprintChecksum
  ) {
    violations.push({
      code: 'FAIL_CONSUMER_SMOKE',
      message: 'Smoke fingerprint checksum drift detected',
      field: SMOKE_FINGERPRINT_PATH,
    });
  }

  return violations;
}

function auditNoUpstreamMutation(
  before: FileSnapshot[],
  after: FileSnapshot[]
): ReleaseBundleRegressionGateViolation[] {
  const violations: ReleaseBundleRegressionGateViolation[] = [];
  const afterByPath = new Map(after.map((snapshot) => [snapshot.path, snapshot]));
  const sourceByPath = new Map(UPSTREAM_REGRESSION_SOURCES.map((source) => [source.path, source]));

  for (const snapshot of before) {
    const next = afterByPath.get(snapshot.path);
    const source = sourceByPath.get(snapshot.path);

    if (!next) {
      violations.push({
        code: source?.code ?? 'FAIL_FINAL_BUNDLE',
        message: `Protected regression file removed during gate audit: ${snapshot.path}`,
        field: snapshot.path,
      });
      continue;
    }

    if (next.checksum !== snapshot.checksum || next.mtimeMs !== snapshot.mtimeMs) {
      violations.push({
        code: source?.code ?? 'FAIL_FINAL_BUNDLE',
        message: `Protected regression file modified during gate audit: ${snapshot.path}`,
        field: snapshot.path,
      });
    }
  }

  return violations;
}

function primaryFailure(
  violations: ReleaseBundleRegressionGateViolation[]
): ReleaseBundleRegressionGateResult {
  const priority: ReleaseBundleRegressionGateResult[] = [
    'FAIL_DUAL_RELEASE_GATE',
    'FAIL_RELEASE_MANIFEST',
    'FAIL_RELEASE_LOCK',
    'FAIL_CONSUMPTION_READINESS',
    'FAIL_INGESTION_DRY_RUN',
    'FAIL_HANDOFF_CONTRACT',
    'FAIL_CONSUMPTION_SIMULATION',
    'FAIL_CERTIFICATION',
    'FAIL_FINAL_BUNDLE',
    'FAIL_CONSUMER_SMOKE',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function loadReleaseBundleRegressionFingerprint(
  projectRoot: string
): ReleaseBundleRegressionFingerprint | null {
  const fingerprintPath = path.join(projectRoot, 'exports', GATE_FINGERPRINT_FILE);
  if (!fs.existsSync(fingerprintPath)) return null;
  return JSON.parse(fs.readFileSync(fingerprintPath, 'utf8')) as ReleaseBundleRegressionFingerprint;
}

export function buildReleaseBundleRegressionFingerprint(
  projectRoot: string,
  frozenAt: string
): ReleaseBundleRegressionFingerprint | null {
  const upstreamReportChecksums = collectUpstreamReportChecksums(projectRoot);
  const finalBundleChecksum = computeFileChecksum(projectRoot, RELEASE_HANDOFF_FINAL_BUNDLE_JSON_PATH);
  const smokeFingerprintChecksum = computeFileChecksum(projectRoot, SMOKE_FINGERPRINT_PATH);

  if (
    Object.keys(upstreamReportChecksums).length !== UPSTREAM_REGRESSION_SOURCES.length ||
    !finalBundleChecksum ||
    !smokeFingerprintChecksum
  ) {
    return null;
  }

  return {
    schemaVersion: RELEASE_BUNDLE_REGRESSION_FINGERPRINT_SCHEMA_VERSION,
    upstreamReportChecksums,
    finalBundleChecksum,
    smokeFingerprintChecksum,
    frozenAt,
  };
}

export function auditReleaseBundleRegressionGate(
  projectRoot: string,
  frozenFingerprint: ReleaseBundleRegressionFingerprint | null
): ReleaseBundleRegressionGateViolation[] {
  const beforeSnapshot = snapshotPaths(projectRoot, PROTECTED_REGRESSION_PATHS);
  const violations: ReleaseBundleRegressionGateViolation[] = [];

  violations.push(...auditUpstreamReportPass(projectRoot));
  violations.push(...auditReportChecksumIntegrity(projectRoot, frozenFingerprint));

  const afterSnapshot = snapshotPaths(projectRoot, PROTECTED_REGRESSION_PATHS);
  violations.push(...auditNoUpstreamMutation(beforeSnapshot, afterSnapshot));

  return violations;
}

export function writeReleaseBundleRegressionGateReport(
  projectRoot: string,
  report: ReleaseBundleRegressionGateReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, GATE_REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function writeReleaseBundleRegressionFingerprint(
  projectRoot: string,
  fingerprint: ReleaseBundleRegressionFingerprint
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const fingerprintPath = path.join(exportsDir, GATE_FINGERPRINT_FILE);
  fs.writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  return fingerprintPath;
}

export function runReleaseBundleRegressionGate(
  projectRoot: string
): ReleaseBundleRegressionGateReport {
  const auditTimestamp = new Date().toISOString();
  const frozenFingerprint = loadReleaseBundleRegressionFingerprint(projectRoot);
  const violations = auditReleaseBundleRegressionGate(projectRoot, frozenFingerprint);
  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: ReleaseBundleRegressionGateReport = {
    auditTimestamp,
    auditResult,
    violations,
    regression_pass: auditResult === 'PASS',
  };

  writeReleaseBundleRegressionGateReport(projectRoot, report);

  if (auditResult === 'PASS') {
    const fingerprint = buildReleaseBundleRegressionFingerprint(projectRoot, auditTimestamp);
    if (fingerprint) {
      writeReleaseBundleRegressionFingerprint(projectRoot, fingerprint);
    }
  }

  return report;
}
