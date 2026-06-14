import fs from 'node:fs';
import path from 'node:path';
import {
  buildTransitionDnaContractFingerprint,
  findDuplicateTransitionIds,
  type RequiredTransitionDnaField,
  type TransitionDnaContractFingerprint,
  type TransitionDnaIndexEntry,
} from './transitionDnaContractDefinitions.js';

export type TransitionDnaContractAuditResult =
  | 'PASS'
  | 'FAIL_ID_DRIFT'
  | 'FAIL_CATEGORY_DRIFT'
  | 'FAIL_SCHEMA_DRIFT'
  | 'FAIL_REQUIRED_FIELD_DRIFT'
  | 'FAIL_INDEX_DRIFT'
  | 'FAIL_DUPLICATE_ID';

export interface TransitionDnaContractViolation {
  code: TransitionDnaContractAuditResult;
  message: string;
  field?: string;
}

export interface TransitionDnaContractReport {
  auditTimestamp: string;
  auditResult: TransitionDnaContractAuditResult;
  violations: TransitionDnaContractViolation[];
}

const FINGERPRINT_FILE = 'transition-dna-contract-fingerprint.json';
const REPORT_FILE = 'transition-dna-contract-report.json';

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
  left: TransitionDnaIndexEntry[],
  right: TransitionDnaIndexEntry[]
): boolean {
  if (left.length !== right.length) return false;
  const leftSorted = [...left].sort((a, b) => a.transition_id.localeCompare(b.transition_id));
  const rightSorted = [...right].sort((a, b) => a.transition_id.localeCompare(b.transition_id));
  return leftSorted.every(
    (entry, index) =>
      entry.transition_id === rightSorted[index]?.transition_id &&
      entry.path === rightSorted[index]?.path
  );
}

function requiredFieldsEqual(
  left: readonly RequiredTransitionDnaField[],
  right: readonly RequiredTransitionDnaField[]
): boolean {
  return sortedArrayEqual(left, right);
}

function findDuplicateIdViolations(
  transitionIds: readonly string[]
): TransitionDnaContractViolation[] {
  const duplicates = findDuplicateTransitionIds(transitionIds);
  return duplicates.map((id) => ({
    code: 'FAIL_DUPLICATE_ID',
    message: `Duplicate transition id detected: ${id}`,
    field: 'transitionIds',
  }));
}

export function compareTransitionDnaContractFingerprints(
  current: TransitionDnaContractFingerprint,
  frozen: TransitionDnaContractFingerprint
): TransitionDnaContractViolation[] {
  const violations: TransitionDnaContractViolation[] = [];

  violations.push(...findDuplicateIdViolations(current.transitionIds));

  if (!sortedArrayEqual(current.transitionIds, frozen.transitionIds)) {
    violations.push({
      code: 'FAIL_ID_DRIFT',
      message: 'Transition id set drift detected',
      field: 'transitionIds',
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
  violations: TransitionDnaContractViolation[]
): TransitionDnaContractAuditResult {
  const priority: TransitionDnaContractAuditResult[] = [
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

export function loadTransitionDnaContractFingerprint(
  projectRoot: string
): TransitionDnaContractFingerprint | null {
  const fingerprintPath = path.join(projectRoot, 'exports', FINGERPRINT_FILE);
  if (!fs.existsSync(fingerprintPath)) return null;
  return JSON.parse(
    fs.readFileSync(fingerprintPath, 'utf8')
  ) as TransitionDnaContractFingerprint;
}

export function writeTransitionDnaContractFingerprint(
  projectRoot: string,
  fingerprint: TransitionDnaContractFingerprint
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const fingerprintPath = path.join(exportsDir, FINGERPRINT_FILE);
  fs.writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  return fingerprintPath;
}

export function writeTransitionDnaContractReport(
  projectRoot: string,
  report: TransitionDnaContractReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runTransitionDnaContractAudit(
  projectRoot: string
): TransitionDnaContractReport {
  const auditTimestamp = new Date().toISOString();
  const current = buildTransitionDnaContractFingerprint(auditTimestamp);
  const frozen = loadTransitionDnaContractFingerprint(projectRoot);

  if (!frozen) {
    writeTransitionDnaContractFingerprint(projectRoot, current);
    return {
      auditTimestamp,
      auditResult: 'PASS',
      violations: [],
    };
  }

  const violations = compareTransitionDnaContractFingerprints(current, frozen);
  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  return {
    auditTimestamp,
    auditResult,
    violations,
  };
}
