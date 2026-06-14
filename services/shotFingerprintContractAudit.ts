import fs from 'node:fs';
import path from 'node:path';
import {
  buildShotFingerprintContractFingerprint,
  findDuplicateFingerprintIds,
  type RequiredShotFingerprintField,
  type ShotFingerprintContractFingerprint,
  type ShotFingerprintIndexEntry,
} from './shotFingerprintContractDefinitions.js';

export type ShotFingerprintContractAuditResult =
  | 'PASS'
  | 'FAIL_ID_DRIFT'
  | 'FAIL_CATEGORY_DRIFT'
  | 'FAIL_SCHEMA_DRIFT'
  | 'FAIL_REQUIRED_FIELD_DRIFT'
  | 'FAIL_INDEX_DRIFT'
  | 'FAIL_DUPLICATE_ID';

export interface ShotFingerprintContractViolation {
  code: ShotFingerprintContractAuditResult;
  message: string;
  field?: string;
}

export interface ShotFingerprintContractReport {
  auditTimestamp: string;
  auditResult: ShotFingerprintContractAuditResult;
  violations: ShotFingerprintContractViolation[];
}

const FINGERPRINT_FILE = 'shot-fingerprint-contract-fingerprint.json';
const REPORT_FILE = 'shot-fingerprint-contract-report.json';

function sortedArrayEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return leftSorted.every((value, index) => value === rightSorted[index]);
}

function recordEqual(left: Record<string, string>, right: Record<string, string>): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (!sortedArrayEqual(leftKeys, rightKeys)) return false;
  return leftKeys.every((key) => left[key] === right[key]);
}

function indexStructureEqual(
  left: ShotFingerprintIndexEntry[],
  right: ShotFingerprintIndexEntry[]
): boolean {
  if (left.length !== right.length) return false;
  const leftSorted = [...left].sort((a, b) => a.fingerprint_id.localeCompare(b.fingerprint_id));
  const rightSorted = [...right].sort((a, b) => a.fingerprint_id.localeCompare(b.fingerprint_id));
  return leftSorted.every(
    (entry, index) =>
      entry.fingerprint_id === rightSorted[index]?.fingerprint_id &&
      entry.path === rightSorted[index]?.path
  );
}

function requiredFieldsEqual(
  left: readonly RequiredShotFingerprintField[],
  right: readonly RequiredShotFingerprintField[]
): boolean {
  return sortedArrayEqual(left, right);
}

function findDuplicateIdViolations(
  fingerprintIds: readonly string[]
): ShotFingerprintContractViolation[] {
  const duplicates = findDuplicateFingerprintIds(fingerprintIds);
  return duplicates.map((id) => ({
    code: 'FAIL_DUPLICATE_ID',
    message: `Duplicate fingerprint id detected: ${id}`,
    field: 'fingerprintIds',
  }));
}

export function compareShotFingerprintContractFingerprints(
  current: ShotFingerprintContractFingerprint,
  frozen: ShotFingerprintContractFingerprint
): ShotFingerprintContractViolation[] {
  const violations: ShotFingerprintContractViolation[] = [];

  violations.push(...findDuplicateIdViolations(current.fingerprintIds));

  if (!sortedArrayEqual(current.fingerprintIds, frozen.fingerprintIds)) {
    violations.push({
      code: 'FAIL_ID_DRIFT',
      message: 'Fingerprint id set drift detected',
      field: 'fingerprintIds',
    });
  }

  if (!recordEqual(current.categories, frozen.categories)) {
    violations.push({
      code: 'FAIL_CATEGORY_DRIFT',
      message: 'Category map drift detected',
      field: 'categories',
    });
  }

  if (
    current.schemaVersion !== frozen.schemaVersion ||
    current.librarySchemaVersion !== frozen.librarySchemaVersion
  ) {
    violations.push({
      code: 'FAIL_SCHEMA_DRIFT',
      message: 'Schema version drift detected',
      field: 'schemaVersion',
    });
  }

  if (!requiredFieldsEqual(current.requiredFields, frozen.requiredFields)) {
    violations.push({
      code: 'FAIL_REQUIRED_FIELD_DRIFT',
      message: 'Required field set drift detected',
      field: 'requiredFields',
    });
  }

  if (!indexStructureEqual(current.indexStructure, frozen.indexStructure)) {
    violations.push({
      code: 'FAIL_INDEX_DRIFT',
      message: 'Index linkage drift detected',
      field: 'indexStructure',
    });
  }

  return violations;
}

function primaryFailure(
  violations: ShotFingerprintContractViolation[]
): ShotFingerprintContractAuditResult {
  const priority: ShotFingerprintContractAuditResult[] = [
    'FAIL_DUPLICATE_ID',
    'FAIL_ID_DRIFT',
    'FAIL_CATEGORY_DRIFT',
    'FAIL_SCHEMA_DRIFT',
    'FAIL_REQUIRED_FIELD_DRIFT',
    'FAIL_INDEX_DRIFT',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function loadShotFingerprintContractFingerprint(
  projectRoot: string
): ShotFingerprintContractFingerprint | null {
  const fingerprintPath = path.join(projectRoot, 'exports', FINGERPRINT_FILE);
  if (!fs.existsSync(fingerprintPath)) return null;
  return JSON.parse(
    fs.readFileSync(fingerprintPath, 'utf8')
  ) as ShotFingerprintContractFingerprint;
}

export function writeShotFingerprintContractFingerprint(
  projectRoot: string,
  fingerprint: ShotFingerprintContractFingerprint
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const fingerprintPath = path.join(exportsDir, FINGERPRINT_FILE);
  fs.writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  return fingerprintPath;
}

export function writeShotFingerprintContractReport(
  projectRoot: string,
  report: ShotFingerprintContractReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runShotFingerprintContractAudit(
  projectRoot: string
): ShotFingerprintContractReport {
  const auditTimestamp = new Date().toISOString();
  const current = buildShotFingerprintContractFingerprint(auditTimestamp);
  const frozen = loadShotFingerprintContractFingerprint(projectRoot);

  if (!frozen) {
    writeShotFingerprintContractFingerprint(projectRoot, current);
    return {
      auditTimestamp,
      auditResult: 'PASS',
      violations: [],
    };
  }

  const violations = compareShotFingerprintContractFingerprints(current, frozen);
  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  return {
    auditTimestamp,
    auditResult,
    violations,
  };
}
