import fs from 'node:fs';
import path from 'node:path';
import { getRuntimeLibraryCrossLinks } from './runtimeLibraryCrossLinkDefinitions.js';
import {
  getRuntimeSelectionRules,
  selectionRuleLinkKey,
} from './runtimeSelectionRuleDefinitions.js';
import {
  buildRuntimeResolverContractFingerprint,
  getRuntimeResolverMappings,
  type RuntimeResolverContractFingerprint,
  type RuntimeResolverMapping,
} from './runtimeResolverContractDefinitions.js';

export type RuntimeResolverContractAuditResult =
  | 'PASS'
  | 'FAIL_INPUT_SCHEMA_DRIFT'
  | 'FAIL_OUTPUT_SCHEMA_DRIFT'
  | 'FAIL_RULE_LINKAGE_DRIFT'
  | 'FAIL_CROSSLINK_COMPATIBILITY'
  | 'FAIL_DEPENDENCY_DRIFT'
  | 'FAIL_DUPLICATE_MAPPING';

export interface RuntimeResolverContractViolation {
  code: RuntimeResolverContractAuditResult;
  message: string;
  field?: string;
}

export interface RuntimeResolverContractReport {
  auditTimestamp: string;
  auditResult: RuntimeResolverContractAuditResult;
  violations: RuntimeResolverContractViolation[];
}

const FINGERPRINT_FILE = 'runtime-resolver-contract-fingerprint.json';
const REPORT_FILE = 'runtime-resolver-contract-report.json';

function sortedArrayEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return leftSorted.every((value, index) => value === rightSorted[index]);
}

function dependencyGraphEqual(
  left: Record<string, string[]>,
  right: Record<string, string[]>
): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (!sortedArrayEqual(leftKeys, rightKeys)) return false;
  return leftKeys.every((key) => sortedArrayEqual(left[key] ?? [], right[key] ?? []));
}

function resolverOutputsEqual(
  left: RuntimeResolverContractFingerprint['resolverOutputs'],
  right: RuntimeResolverContractFingerprint['resolverOutputs']
): boolean {
  return (
    sortedArrayEqual(left.topLevel, right.topLevel) &&
    sortedArrayEqual(left.compiled_shot_binding, right.compiled_shot_binding) &&
    sortedArrayEqual(left.compiled_transition_binding, right.compiled_transition_binding)
  );
}

function findDuplicateMappingViolations(
  mappings: readonly RuntimeResolverMapping[]
): RuntimeResolverContractViolation[] {
  const seenMappingIds = new Set<string>();
  const seenResolverKeys = new Set<string>();
  const violations: RuntimeResolverContractViolation[] = [];

  for (const mapping of mappings) {
    if (seenMappingIds.has(mapping.mapping_id)) {
      violations.push({
        code: 'FAIL_DUPLICATE_MAPPING',
        message: `Duplicate resolver mapping id detected: ${mapping.mapping_id}`,
        field: 'mappingIds',
      });
    }
    seenMappingIds.add(mapping.mapping_id);

    const resolverKey = `${mapping.rule_id}::${mapping.cross_link_key}`;
    if (seenResolverKeys.has(resolverKey)) {
      violations.push({
        code: 'FAIL_DUPLICATE_MAPPING',
        message: `Duplicate resolver mapping key detected: ${resolverKey}`,
        field: 'mappingIds',
      });
    }
    seenResolverKeys.add(resolverKey);
  }

  return violations;
}

function findStructuralViolations(
  fingerprint: RuntimeResolverContractFingerprint,
  mappings: readonly RuntimeResolverMapping[]
): RuntimeResolverContractViolation[] {
  const violations: RuntimeResolverContractViolation[] = [];
  const ruleIds = new Set(getRuntimeSelectionRules().map((rule) => rule.rule_id));
  const ruleById = new Map(getRuntimeSelectionRules().map((rule) => [rule.rule_id, rule]));
  const crossLinkKeys = new Set(
    getRuntimeLibraryCrossLinks().map((link) => `${link.shot_id}::${link.transition_id}`)
  );

  violations.push(...findDuplicateMappingViolations(mappings));

  for (const mapping of mappings) {
    if (!ruleIds.has(mapping.rule_id)) {
      violations.push({
        code: 'FAIL_RULE_LINKAGE_DRIFT',
        message: `Resolver mapping references unknown rule: ${mapping.rule_id}`,
        field: 'selectionRuleReferences',
      });
    }

    if (!crossLinkKeys.has(mapping.cross_link_key)) {
      violations.push({
        code: 'FAIL_CROSSLINK_COMPATIBILITY',
        message: `Resolver mapping references invalid cross link: ${mapping.cross_link_key}`,
        field: 'crossLinkReferences',
      });
    }

    const rule = ruleById.get(mapping.rule_id);
    if (rule && selectionRuleLinkKey(rule) !== mapping.cross_link_key) {
      violations.push({
        code: 'FAIL_RULE_LINKAGE_DRIFT',
        message: `Rule linkage mismatch for ${mapping.mapping_id}: ${mapping.rule_id}`,
        field: 'selectionRuleReferences',
      });
    }
  }

  const expectedRuleRefs = getRuntimeSelectionRules().map((rule) => rule.rule_id).sort();
  if (!sortedArrayEqual(fingerprint.selectionRuleReferences, expectedRuleRefs)) {
    violations.push({
      code: 'FAIL_RULE_LINKAGE_DRIFT',
      message: 'Selection rule reference set is incomplete or stale',
      field: 'selectionRuleReferences',
    });
  }

  const expectedCrossLinks = getRuntimeSelectionRules()
    .map((rule) => selectionRuleLinkKey(rule))
    .sort();
  if (!sortedArrayEqual(fingerprint.crossLinkReferences, expectedCrossLinks)) {
    violations.push({
      code: 'FAIL_CROSSLINK_COMPATIBILITY',
      message: 'Cross-link reference set is incomplete or stale',
      field: 'crossLinkReferences',
    });
  }

  return violations;
}

export function compareRuntimeResolverContractFingerprints(
  current: RuntimeResolverContractFingerprint,
  frozen: RuntimeResolverContractFingerprint
): RuntimeResolverContractViolation[] {
  const mappings = getRuntimeResolverMappings();
  const violations = findStructuralViolations(current, mappings);

  if (current.schemaVersion !== frozen.schemaVersion) {
    violations.push({
      code: 'FAIL_INPUT_SCHEMA_DRIFT',
      message: 'Resolver contract schema version drift detected',
      field: 'schemaVersion',
    });
  }

  if (!sortedArrayEqual(current.resolverInputs, frozen.resolverInputs)) {
    violations.push({
      code: 'FAIL_INPUT_SCHEMA_DRIFT',
      message: 'Resolver input schema drift detected',
      field: 'resolverInputs',
    });
  }

  if (!resolverOutputsEqual(current.resolverOutputs, frozen.resolverOutputs)) {
    violations.push({
      code: 'FAIL_OUTPUT_SCHEMA_DRIFT',
      message: 'Resolver output schema drift detected',
      field: 'resolverOutputs',
    });
  }

  if (!sortedArrayEqual(current.selectionRuleReferences, frozen.selectionRuleReferences)) {
    violations.push({
      code: 'FAIL_RULE_LINKAGE_DRIFT',
      message: 'Selection rule reference drift detected',
      field: 'selectionRuleReferences',
    });
  }

  if (!sortedArrayEqual(current.crossLinkReferences, frozen.crossLinkReferences)) {
    violations.push({
      code: 'FAIL_CROSSLINK_COMPATIBILITY',
      message: 'Cross-link reference drift detected',
      field: 'crossLinkReferences',
    });
  }

  if (!dependencyGraphEqual(current.dependencyGraph, frozen.dependencyGraph)) {
    violations.push({
      code: 'FAIL_DEPENDENCY_DRIFT',
      message: 'Resolver dependency graph drift detected',
      field: 'dependencyGraph',
    });
  }

  if (!sortedArrayEqual(current.mappingIds, frozen.mappingIds)) {
    violations.push({
      code: 'FAIL_DUPLICATE_MAPPING',
      message: 'Resolver mapping id set drift detected',
      field: 'mappingIds',
    });
  }

  if (
    current.selectionRuleSchemaVersion !== frozen.selectionRuleSchemaVersion ||
    current.crossLinkSchemaVersion !== frozen.crossLinkSchemaVersion
  ) {
    violations.push({
      code: 'FAIL_DEPENDENCY_DRIFT',
      message: 'Upstream schema dependency drift detected',
      field: 'dependencyGraph',
    });
  }

  return violations;
}

function primaryFailure(
  violations: RuntimeResolverContractViolation[]
): RuntimeResolverContractAuditResult {
  const priority: RuntimeResolverContractAuditResult[] = [
    'FAIL_DUPLICATE_MAPPING',
    'FAIL_INPUT_SCHEMA_DRIFT',
    'FAIL_OUTPUT_SCHEMA_DRIFT',
    'FAIL_RULE_LINKAGE_DRIFT',
    'FAIL_CROSSLINK_COMPATIBILITY',
    'FAIL_DEPENDENCY_DRIFT',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function loadRuntimeResolverContractFingerprint(
  projectRoot: string
): RuntimeResolverContractFingerprint | null {
  const fingerprintPath = path.join(projectRoot, 'exports', FINGERPRINT_FILE);
  if (!fs.existsSync(fingerprintPath)) return null;
  return JSON.parse(
    fs.readFileSync(fingerprintPath, 'utf8')
  ) as RuntimeResolverContractFingerprint;
}

export function writeRuntimeResolverContractFingerprint(
  projectRoot: string,
  fingerprint: RuntimeResolverContractFingerprint
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const fingerprintPath = path.join(exportsDir, FINGERPRINT_FILE);
  fs.writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  return fingerprintPath;
}

export function writeRuntimeResolverContractReport(
  projectRoot: string,
  report: RuntimeResolverContractReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runRuntimeResolverContractAudit(
  projectRoot: string
): RuntimeResolverContractReport {
  const auditTimestamp = new Date().toISOString();
  const current = buildRuntimeResolverContractFingerprint(auditTimestamp);
  const frozen = loadRuntimeResolverContractFingerprint(projectRoot);

  if (!frozen) {
    const violations = findStructuralViolations(current, getRuntimeResolverMappings());
    if (violations.length === 0) {
      writeRuntimeResolverContractFingerprint(projectRoot, current);
    }
    return {
      auditTimestamp,
      auditResult: violations.length === 0 ? 'PASS' : primaryFailure(violations),
      violations,
    };
  }

  const violations = compareRuntimeResolverContractFingerprints(current, frozen);
  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  return {
    auditTimestamp,
    auditResult,
    violations,
  };
}
