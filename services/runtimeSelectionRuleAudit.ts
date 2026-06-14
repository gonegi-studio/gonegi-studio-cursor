import fs from 'node:fs';
import path from 'node:path';
import { getShotFingerprintLibrary } from './shotFingerprintContractDefinitions.js';
import { getTransitionDnaLibrary } from './transitionDnaContractDefinitions.js';
import { getRuntimeLibraryCrossLinks } from './runtimeLibraryCrossLinkDefinitions.js';
import {
  buildRuntimeSelectionRuleFingerprint,
  getRuntimeSelectionRules,
  selectionRuleLinkKey,
  type RuntimeSelectionRule,
  type RuntimeSelectionRuleFingerprint,
} from './runtimeSelectionRuleDefinitions.js';

export type RuntimeSelectionRuleAuditResult =
  | 'PASS'
  | 'FAIL_ORPHAN_RULE'
  | 'FAIL_DUPLICATE_RULE'
  | 'FAIL_UNREACHABLE_RULE'
  | 'FAIL_INVALID_SHOT_REFERENCE'
  | 'FAIL_INVALID_TRANSITION_REFERENCE'
  | 'FAIL_PRIORITY_CONFLICT'
  | 'FAIL_SCHEMA_DRIFT';

export interface RuntimeSelectionRuleViolation {
  code: RuntimeSelectionRuleAuditResult;
  message: string;
  field?: string;
}

export interface RuntimeSelectionRuleReport {
  auditTimestamp: string;
  auditResult: RuntimeSelectionRuleAuditResult;
  violations: RuntimeSelectionRuleViolation[];
}

const FINGERPRINT_FILE = 'runtime-selection-rule-fingerprint.json';
const REPORT_FILE = 'runtime-selection-rule-report.json';

function sortedArrayEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return leftSorted.every((value, index) => value === rightSorted[index]);
}

function recordNumberEqual(left: Record<string, number>, right: Record<string, number>): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (!sortedArrayEqual(leftKeys, rightKeys)) return false;
  return leftKeys.every((key) => left[key] === right[key]);
}

function recordStringEqual(left: Record<string, string>, right: Record<string, string>): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (!sortedArrayEqual(leftKeys, rightKeys)) return false;
  return leftKeys.every((key) => left[key] === right[key]);
}

function findDuplicateRuleViolations(
  rules: readonly RuntimeSelectionRule[]
): RuntimeSelectionRuleViolation[] {
  const seenRuleIds = new Set<string>();
  const violations: RuntimeSelectionRuleViolation[] = [];

  for (const rule of rules) {
    if (seenRuleIds.has(rule.rule_id)) {
      violations.push({
        code: 'FAIL_DUPLICATE_RULE',
        message: `Duplicate rule id detected: ${rule.rule_id}`,
        field: 'ruleIds',
      });
    }
    seenRuleIds.add(rule.rule_id);
  }

  return violations;
}

function findPriorityConflictViolations(
  rules: readonly RuntimeSelectionRule[]
): RuntimeSelectionRuleViolation[] {
  const prioritiesByShot = new Map<string, Map<number, string>>();
  const violations: RuntimeSelectionRuleViolation[] = [];

  for (const rule of rules) {
    const shotPriorities = prioritiesByShot.get(rule.shot_id) ?? new Map<number, string>();
    const existingRuleId = shotPriorities.get(rule.priority);
    if (existingRuleId && existingRuleId !== rule.rule_id) {
      violations.push({
        code: 'FAIL_PRIORITY_CONFLICT',
        message: `Priority conflict on ${rule.shot_id}: ${existingRuleId} and ${rule.rule_id} both use priority ${rule.priority}`,
        field: 'rulePriorities',
      });
    }
    shotPriorities.set(rule.priority, rule.rule_id);
    prioritiesByShot.set(rule.shot_id, shotPriorities);
  }

  return violations;
}

function findStructuralViolations(
  rules: readonly RuntimeSelectionRule[]
): RuntimeSelectionRuleViolation[] {
  const violations: RuntimeSelectionRuleViolation[] = [];
  const shotIds = new Set(getShotFingerprintLibrary().map((entry) => entry.fingerprint_id));
  const transitionIds = new Set(getTransitionDnaLibrary().map((entry) => entry.transition_id));
  const crossLinkKeys = new Set(
    getRuntimeLibraryCrossLinks().map((link) => `${link.shot_id}::${link.transition_id}`)
  );
  const coveredCrossLinks = new Set<string>();

  violations.push(...findDuplicateRuleViolations(rules));
  violations.push(...findPriorityConflictViolations(rules));

  for (const rule of rules) {
    if (!shotIds.has(rule.shot_id)) {
      violations.push({
        code: 'FAIL_INVALID_SHOT_REFERENCE',
        message: `Invalid shot reference in rule ${rule.rule_id}: ${rule.shot_id}`,
        field: 'shotReferences',
      });
    }

    if (!transitionIds.has(rule.transition_id)) {
      violations.push({
        code: 'FAIL_INVALID_TRANSITION_REFERENCE',
        message: `Invalid transition reference in rule ${rule.rule_id}: ${rule.transition_id}`,
        field: 'transitionReferences',
      });
    }

    const linkKey = selectionRuleLinkKey(rule);
    if (!crossLinkKeys.has(linkKey)) {
      violations.push({
        code: 'FAIL_ORPHAN_RULE',
        message: `Orphan rule not linked in cross-link graph: ${rule.rule_id}`,
        field: 'crossLinks',
      });
    } else {
      coveredCrossLinks.add(linkKey);
    }
  }

  for (const linkKey of crossLinkKeys) {
    if (!coveredCrossLinks.has(linkKey)) {
      violations.push({
        code: 'FAIL_UNREACHABLE_RULE',
        message: `Cross link has no selection rule: ${linkKey}`,
        field: 'ruleIds',
      });
    }
  }

  return violations;
}

export function compareRuntimeSelectionRuleFingerprints(
  current: RuntimeSelectionRuleFingerprint,
  frozen: RuntimeSelectionRuleFingerprint
): RuntimeSelectionRuleViolation[] {
  const rules = getRuntimeSelectionRules();
  const violations = findStructuralViolations(rules);

  if (current.schemaVersion !== frozen.schemaVersion) {
    violations.push({
      code: 'FAIL_SCHEMA_DRIFT',
      message: 'Selection rule schema version drift detected',
      field: 'schemaVersion',
    });
  }

  if (current.crossLinkSchemaVersion !== frozen.crossLinkSchemaVersion) {
    violations.push({
      code: 'FAIL_SCHEMA_DRIFT',
      message: 'Cross-link schema compatibility drift detected',
      field: 'crossLinkSchemaVersion',
    });
  }

  if (!sortedArrayEqual(current.ruleIds, frozen.ruleIds)) {
    violations.push({
      code: 'FAIL_DUPLICATE_RULE',
      message: 'Rule id set drift detected',
      field: 'ruleIds',
    });
  }

  if (!recordNumberEqual(current.rulePriorities, frozen.rulePriorities)) {
    violations.push({
      code: 'FAIL_PRIORITY_CONFLICT',
      message: 'Rule priority drift detected',
      field: 'rulePriorities',
    });
  }

  if (!recordStringEqual(current.shotReferences, frozen.shotReferences)) {
    violations.push({
      code: 'FAIL_INVALID_SHOT_REFERENCE',
      message: 'Shot reference drift detected',
      field: 'shotReferences',
    });
  }

  if (!recordStringEqual(current.transitionReferences, frozen.transitionReferences)) {
    violations.push({
      code: 'FAIL_INVALID_TRANSITION_REFERENCE',
      message: 'Transition reference drift detected',
      field: 'transitionReferences',
    });
  }

  return violations;
}

function primaryFailure(
  violations: RuntimeSelectionRuleViolation[]
): RuntimeSelectionRuleAuditResult {
  const priority: RuntimeSelectionRuleAuditResult[] = [
    'FAIL_ORPHAN_RULE',
    'FAIL_DUPLICATE_RULE',
    'FAIL_UNREACHABLE_RULE',
    'FAIL_INVALID_SHOT_REFERENCE',
    'FAIL_INVALID_TRANSITION_REFERENCE',
    'FAIL_PRIORITY_CONFLICT',
    'FAIL_SCHEMA_DRIFT',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function loadRuntimeSelectionRuleFingerprint(
  projectRoot: string
): RuntimeSelectionRuleFingerprint | null {
  const fingerprintPath = path.join(projectRoot, 'exports', FINGERPRINT_FILE);
  if (!fs.existsSync(fingerprintPath)) return null;
  return JSON.parse(
    fs.readFileSync(fingerprintPath, 'utf8')
  ) as RuntimeSelectionRuleFingerprint;
}

export function writeRuntimeSelectionRuleFingerprint(
  projectRoot: string,
  fingerprint: RuntimeSelectionRuleFingerprint
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const fingerprintPath = path.join(exportsDir, FINGERPRINT_FILE);
  fs.writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  return fingerprintPath;
}

export function writeRuntimeSelectionRuleReport(
  projectRoot: string,
  report: RuntimeSelectionRuleReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runRuntimeSelectionRuleAudit(
  projectRoot: string
): RuntimeSelectionRuleReport {
  const auditTimestamp = new Date().toISOString();
  const current = buildRuntimeSelectionRuleFingerprint(auditTimestamp);
  const frozen = loadRuntimeSelectionRuleFingerprint(projectRoot);

  if (!frozen) {
    const violations = findStructuralViolations(getRuntimeSelectionRules());
    if (violations.length === 0) {
      writeRuntimeSelectionRuleFingerprint(projectRoot, current);
    }
    return {
      auditTimestamp,
      auditResult: violations.length === 0 ? 'PASS' : primaryFailure(violations),
      violations,
    };
  }

  const violations = compareRuntimeSelectionRuleFingerprints(current, frozen);
  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  return {
    auditTimestamp,
    auditResult,
    violations,
  };
}
