import fs from 'node:fs';
import path from 'node:path';
import {
  buildRuntimeContractFingerprint,
  type ConsumerContract,
  type RuntimeContractFingerprint,
} from './runtimeContractDefinitions.js';

export type RuntimeContractFreezeAuditResult =
  | 'PASS'
  | 'FAIL_STAGE_ID_DRIFT'
  | 'FAIL_CONTRACT_DRIFT'
  | 'FAIL_INPUT_DRIFT'
  | 'FAIL_OUTPUT_DRIFT'
  | 'FAIL_DEPENDENCY_DRIFT';

export interface RuntimeContractFreezeViolation {
  code: RuntimeContractFreezeAuditResult;
  message: string;
  field?: string;
}

export interface RuntimeContractFreezeReport {
  auditTimestamp: string;
  auditResult: RuntimeContractFreezeAuditResult;
  violations: RuntimeContractFreezeViolation[];
}

const FINGERPRINT_FILE = 'runtime-contract-fingerprint.json';
const REPORT_FILE = 'runtime-contract-freeze-report.json';

function sortedArrayEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return leftSorted.every((value, index) => value === rightSorted[index]);
}

function recordMapEqual(
  left: Record<string, string[]>,
  right: Record<string, string[]>
): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (!sortedArrayEqual(leftKeys, rightKeys)) return false;
  return leftKeys.every((key) => sortedArrayEqual(left[key] ?? [], right[key] ?? []));
}

function dependencyGraphEqual(
  left: Record<string, string | null>,
  right: Record<string, string | null>
): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (!sortedArrayEqual(leftKeys, rightKeys)) return false;
  return leftKeys.every((key) => left[key] === right[key]);
}

function compareConsumerContract(
  current: ConsumerContract,
  frozen: ConsumerContract,
  violations: RuntimeContractFreezeViolation[]
): void {
  if (current.stage_id !== frozen.stage_id) {
    violations.push({
      code: 'FAIL_STAGE_ID_DRIFT',
      message: `Consumer stage_id drift: ${frozen.stage_id} → ${current.stage_id}`,
      field: 'consumerContract.stage_id',
    });
  }

  if (current.contract_id !== frozen.contract_id) {
    violations.push({
      code: 'FAIL_CONTRACT_DRIFT',
      message: `Consumer contract_id drift: ${frozen.contract_id} → ${current.contract_id}`,
      field: 'consumerContract.contract_id',
    });
  }

  if (current.depends_on !== frozen.depends_on) {
    violations.push({
      code: 'FAIL_DEPENDENCY_DRIFT',
      message: `Consumer depends_on drift: ${frozen.depends_on} → ${current.depends_on}`,
      field: 'consumerContract.depends_on',
    });
  }

  if (current.next_stage_hint !== frozen.next_stage_hint) {
    violations.push({
      code: 'FAIL_DEPENDENCY_DRIFT',
      message: `Consumer next_stage_hint drift: ${frozen.next_stage_hint} → ${current.next_stage_hint}`,
      field: 'consumerContract.next_stage_hint',
    });
  }

  if (!sortedArrayEqual(current.planned_inputs, frozen.planned_inputs)) {
    violations.push({
      code: 'FAIL_INPUT_DRIFT',
      message: 'Consumer planned_inputs drift detected',
      field: 'consumerContract.planned_inputs',
    });
  }

  if (!sortedArrayEqual(current.planned_outputs, frozen.planned_outputs)) {
    violations.push({
      code: 'FAIL_OUTPUT_DRIFT',
      message: 'Consumer planned_outputs drift detected',
      field: 'consumerContract.planned_outputs',
    });
  }
}

export function compareRuntimeContractFingerprints(
  current: RuntimeContractFingerprint,
  frozen: RuntimeContractFingerprint
): RuntimeContractFreezeViolation[] {
  const violations: RuntimeContractFreezeViolation[] = [];

  if (!sortedArrayEqual(current.stageIds, frozen.stageIds)) {
    violations.push({
      code: 'FAIL_STAGE_ID_DRIFT',
      message: 'Stage id set drift detected',
      field: 'stageIds',
    });
  }

  if (!sortedArrayEqual(current.contractIds, frozen.contractIds)) {
    violations.push({
      code: 'FAIL_CONTRACT_DRIFT',
      message: 'Contract id set drift detected',
      field: 'contractIds',
    });
  }

  if (!dependencyGraphEqual(current.dependencyGraph, frozen.dependencyGraph)) {
    violations.push({
      code: 'FAIL_DEPENDENCY_DRIFT',
      message: 'Dependency graph drift detected',
      field: 'dependencyGraph',
    });
  }

  if (!recordMapEqual(current.plannedInputs, frozen.plannedInputs)) {
    violations.push({
      code: 'FAIL_INPUT_DRIFT',
      message: 'Planned input drift detected',
      field: 'plannedInputs',
    });
  }

  if (!recordMapEqual(current.plannedOutputs, frozen.plannedOutputs)) {
    violations.push({
      code: 'FAIL_OUTPUT_DRIFT',
      message: 'Planned output drift detected',
      field: 'plannedOutputs',
    });
  }

  compareConsumerContract(current.consumerContract, frozen.consumerContract, violations);

  return violations;
}

function primaryFailure(
  violations: RuntimeContractFreezeViolation[]
): RuntimeContractFreezeAuditResult {
  const priority: RuntimeContractFreezeAuditResult[] = [
    'FAIL_STAGE_ID_DRIFT',
    'FAIL_CONTRACT_DRIFT',
    'FAIL_INPUT_DRIFT',
    'FAIL_OUTPUT_DRIFT',
    'FAIL_DEPENDENCY_DRIFT',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function loadRuntimeContractFingerprint(
  projectRoot: string
): RuntimeContractFingerprint | null {
  const fingerprintPath = path.join(projectRoot, 'exports', FINGERPRINT_FILE);
  if (!fs.existsSync(fingerprintPath)) return null;
  return JSON.parse(fs.readFileSync(fingerprintPath, 'utf8')) as RuntimeContractFingerprint;
}

export function writeRuntimeContractFingerprint(
  projectRoot: string,
  fingerprint: RuntimeContractFingerprint
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const fingerprintPath = path.join(exportsDir, FINGERPRINT_FILE);
  fs.writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  return fingerprintPath;
}

export function writeRuntimeContractFreezeReport(
  projectRoot: string,
  report: RuntimeContractFreezeReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runRuntimeContractFreezeAudit(
  projectRoot: string
): RuntimeContractFreezeReport {
  const auditTimestamp = new Date().toISOString();
  const current = buildRuntimeContractFingerprint(auditTimestamp);
  const frozen = loadRuntimeContractFingerprint(projectRoot);

  if (!frozen) {
    writeRuntimeContractFingerprint(projectRoot, current);
    return {
      auditTimestamp,
      auditResult: 'PASS',
      violations: [],
    };
  }

  const violations = compareRuntimeContractFingerprints(current, frozen);
  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  return {
    auditTimestamp,
    auditResult,
    violations,
  };
}

export function ensureRuntimeContractFingerprint(projectRoot: string): RuntimeContractFingerprint {
  const existing = loadRuntimeContractFingerprint(projectRoot);
  if (existing) return existing;

  const fingerprint = buildRuntimeContractFingerprint(new Date().toISOString());
  writeRuntimeContractFingerprint(projectRoot, fingerprint);
  return fingerprint;
}
