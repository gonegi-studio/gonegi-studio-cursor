import fs from 'node:fs';
import path from 'node:path';
import {
  COMPILED_SHOT_BINDING_FIELDS,
  COMPILED_TRANSITION_BINDING_FIELDS,
  RESOLVER_OUTPUT_FIELDS,
  getRuntimeResolverMappings,
} from './runtimeResolverContractDefinitions.js';
import {
  CONSUMER_HANDOFF_TARGETS,
  VIDEO_RUNTIME_CONSUMER_REQUIRED_FIELDS,
  buildRuntimeOutputContractFingerprint,
  getRuntimeOutputMappings,
  type RuntimeOutputContractFingerprint,
  type RuntimeOutputMapping,
} from './runtimeOutputContractDefinitions.js';

export type RuntimeOutputContractAuditResult =
  | 'PASS'
  | 'FAIL_OUTPUT_SCHEMA_DRIFT'
  | 'FAIL_CONSUMER_COMPATIBILITY'
  | 'FAIL_REQUIRED_FIELD_DRIFT'
  | 'FAIL_OUTPUT_DEPENDENCY_DRIFT'
  | 'FAIL_DUPLICATE_OUTPUT_MAPPING';

export interface RuntimeOutputContractViolation {
  code: RuntimeOutputContractAuditResult;
  message: string;
  field?: string;
}

export interface RuntimeOutputContractReport {
  auditTimestamp: string;
  auditResult: RuntimeOutputContractAuditResult;
  violations: RuntimeOutputContractViolation[];
}

const FINGERPRINT_FILE = 'runtime-output-contract-fingerprint.json';
const REPORT_FILE = 'runtime-output-contract-report.json';

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

function outputSchemaEqual(
  left: RuntimeOutputContractFingerprint['outputSchema'],
  right: RuntimeOutputContractFingerprint['outputSchema']
): boolean {
  return (
    sortedArrayEqual(left.topLevel, right.topLevel) &&
    sortedArrayEqual(left.compiled_shot_binding, right.compiled_shot_binding) &&
    sortedArrayEqual(left.compiled_transition_binding, right.compiled_transition_binding) &&
    sortedArrayEqual(left.consumer_wrapper, right.consumer_wrapper)
  );
}

function consumerCompatibilityEqual(
  left: RuntimeOutputContractFingerprint['consumerCompatibility'],
  right: RuntimeOutputContractFingerprint['consumerCompatibility']
): boolean {
  if (left.consumerLayer !== right.consumerLayer) return false;
  if (!sortedArrayEqual(left.handoffTargets, right.handoffTargets)) return false;

  const leftKeys = Object.keys(left.resolverFieldCoverage).sort();
  const rightKeys = Object.keys(right.resolverFieldCoverage).sort();
  if (!sortedArrayEqual(leftKeys, rightKeys)) return false;

  return leftKeys.every((key) =>
    sortedArrayEqual(left.resolverFieldCoverage[key] ?? [], right.resolverFieldCoverage[key] ?? [])
  );
}

function findDuplicateOutputMappingViolations(
  mappings: readonly RuntimeOutputMapping[]
): RuntimeOutputContractViolation[] {
  const seenOutputIds = new Set<string>();
  const seenResolverRefs = new Set<string>();
  const violations: RuntimeOutputContractViolation[] = [];

  for (const mapping of mappings) {
    if (seenOutputIds.has(mapping.output_mapping_id)) {
      violations.push({
        code: 'FAIL_DUPLICATE_OUTPUT_MAPPING',
        message: `Duplicate output mapping id detected: ${mapping.output_mapping_id}`,
        field: 'outputMappingIds',
      });
    }
    seenOutputIds.add(mapping.output_mapping_id);

    if (seenResolverRefs.has(mapping.resolver_mapping_id)) {
      violations.push({
        code: 'FAIL_DUPLICATE_OUTPUT_MAPPING',
        message: `Duplicate resolver reference in output mapping: ${mapping.resolver_mapping_id}`,
        field: 'resolverMappingReferences',
      });
    }
    seenResolverRefs.add(mapping.resolver_mapping_id);
  }

  return violations;
}

function findConsumerCompatibilityViolations(
  fingerprint: RuntimeOutputContractFingerprint
): RuntimeOutputContractViolation[] {
  const violations: RuntimeOutputContractViolation[] = [];

  if (!sortedArrayEqual(fingerprint.consumerCompatibility.handoffTargets, CONSUMER_HANDOFF_TARGETS)) {
    violations.push({
      code: 'FAIL_CONSUMER_COMPATIBILITY',
      message: 'Consumer handoff target mismatch detected',
      field: 'consumerCompatibility.handoffTargets',
    });
  }

  const shotCoverage =
    fingerprint.consumerCompatibility.resolverFieldCoverage.compiled_shot_binding ?? [];
  const transitionCoverage =
    fingerprint.consumerCompatibility.resolverFieldCoverage.compiled_transition_binding ?? [];

  if (!sortedArrayEqual(shotCoverage, COMPILED_SHOT_BINDING_FIELDS)) {
    violations.push({
      code: 'FAIL_CONSUMER_COMPATIBILITY',
      message: 'Shot binding consumer field coverage mismatch',
      field: 'consumerCompatibility.resolverFieldCoverage',
    });
  }

  if (!sortedArrayEqual(transitionCoverage, COMPILED_TRANSITION_BINDING_FIELDS)) {
    violations.push({
      code: 'FAIL_CONSUMER_COMPATIBILITY',
      message: 'Transition binding consumer field coverage mismatch',
      field: 'consumerCompatibility.resolverFieldCoverage',
    });
  }

  if (!sortedArrayEqual(fingerprint.outputSchema.topLevel, RESOLVER_OUTPUT_FIELDS)) {
    violations.push({
      code: 'FAIL_OUTPUT_SCHEMA_DRIFT',
      message: 'Resolver output top-level schema mismatch',
      field: 'outputSchema.topLevel',
    });
  }

  return violations;
}

function findStructuralViolations(
  fingerprint: RuntimeOutputContractFingerprint,
  mappings: readonly RuntimeOutputMapping[]
): RuntimeOutputContractViolation[] {
  const violations: RuntimeOutputContractViolation[] = [];
  const resolverMappingIds = new Set(getRuntimeResolverMappings().map((m) => m.mapping_id));

  violations.push(...findDuplicateOutputMappingViolations(mappings));
  violations.push(...findConsumerCompatibilityViolations(fingerprint));

  for (const mapping of mappings) {
    if (!resolverMappingIds.has(mapping.resolver_mapping_id)) {
      violations.push({
        code: 'FAIL_OUTPUT_DEPENDENCY_DRIFT',
        message: `Output mapping references unknown resolver mapping: ${mapping.resolver_mapping_id}`,
        field: 'resolverMappingReferences',
      });
    }

    if (!sortedArrayEqual(mapping.handoff_targets, CONSUMER_HANDOFF_TARGETS)) {
      violations.push({
        code: 'FAIL_CONSUMER_COMPATIBILITY',
        message: `Output mapping ${mapping.output_mapping_id} has incompatible handoff targets`,
        field: 'consumerCompatibility.handoffTargets',
      });
    }
  }

  const expectedResolverRefs = getRuntimeResolverMappings().map((m) => m.mapping_id).sort();
  if (!sortedArrayEqual(fingerprint.resolverMappingReferences, expectedResolverRefs)) {
    violations.push({
      code: 'FAIL_OUTPUT_DEPENDENCY_DRIFT',
      message: 'Resolver mapping reference set is incomplete or stale',
      field: 'resolverMappingReferences',
    });
  }

  if (!sortedArrayEqual(fingerprint.requiredFields, VIDEO_RUNTIME_CONSUMER_REQUIRED_FIELDS)) {
    violations.push({
      code: 'FAIL_REQUIRED_FIELD_DRIFT',
      message: 'Required output field set mismatch',
      field: 'requiredFields',
    });
  }

  return violations;
}

export function compareRuntimeOutputContractFingerprints(
  current: RuntimeOutputContractFingerprint,
  frozen: RuntimeOutputContractFingerprint
): RuntimeOutputContractViolation[] {
  const mappings = getRuntimeOutputMappings();
  const violations = findStructuralViolations(current, mappings);

  if (current.schemaVersion !== frozen.schemaVersion) {
    violations.push({
      code: 'FAIL_OUTPUT_SCHEMA_DRIFT',
      message: 'Output contract schema version drift detected',
      field: 'schemaVersion',
    });
  }

  if (!outputSchemaEqual(current.outputSchema, frozen.outputSchema)) {
    violations.push({
      code: 'FAIL_OUTPUT_SCHEMA_DRIFT',
      message: 'Output schema drift detected',
      field: 'outputSchema',
    });
  }

  if (!consumerCompatibilityEqual(current.consumerCompatibility, frozen.consumerCompatibility)) {
    violations.push({
      code: 'FAIL_CONSUMER_COMPATIBILITY',
      message: 'Consumer compatibility drift detected',
      field: 'consumerCompatibility',
    });
  }

  if (!sortedArrayEqual(current.requiredFields, frozen.requiredFields)) {
    violations.push({
      code: 'FAIL_REQUIRED_FIELD_DRIFT',
      message: 'Required field drift detected',
      field: 'requiredFields',
    });
  }

  if (!dependencyGraphEqual(current.outputDependencyGraph, frozen.outputDependencyGraph)) {
    violations.push({
      code: 'FAIL_OUTPUT_DEPENDENCY_DRIFT',
      message: 'Output dependency graph drift detected',
      field: 'outputDependencyGraph',
    });
  }

  if (!sortedArrayEqual(current.outputMappingIds, frozen.outputMappingIds)) {
    violations.push({
      code: 'FAIL_DUPLICATE_OUTPUT_MAPPING',
      message: 'Output mapping id set drift detected',
      field: 'outputMappingIds',
    });
  }

  if (!sortedArrayEqual(current.resolverMappingReferences, frozen.resolverMappingReferences)) {
    violations.push({
      code: 'FAIL_OUTPUT_DEPENDENCY_DRIFT',
      message: 'Resolver mapping reference drift detected',
      field: 'resolverMappingReferences',
    });
  }

  if (current.resolverContractSchemaVersion !== frozen.resolverContractSchemaVersion) {
    violations.push({
      code: 'FAIL_OUTPUT_DEPENDENCY_DRIFT',
      message: 'Upstream resolver contract schema drift detected',
      field: 'resolverContractSchemaVersion',
    });
  }

  return violations;
}

function primaryFailure(
  violations: RuntimeOutputContractViolation[]
): RuntimeOutputContractAuditResult {
  const priority: RuntimeOutputContractAuditResult[] = [
    'FAIL_DUPLICATE_OUTPUT_MAPPING',
    'FAIL_OUTPUT_SCHEMA_DRIFT',
    'FAIL_CONSUMER_COMPATIBILITY',
    'FAIL_REQUIRED_FIELD_DRIFT',
    'FAIL_OUTPUT_DEPENDENCY_DRIFT',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function loadRuntimeOutputContractFingerprint(
  projectRoot: string
): RuntimeOutputContractFingerprint | null {
  const fingerprintPath = path.join(projectRoot, 'exports', FINGERPRINT_FILE);
  if (!fs.existsSync(fingerprintPath)) return null;
  return JSON.parse(
    fs.readFileSync(fingerprintPath, 'utf8')
  ) as RuntimeOutputContractFingerprint;
}

export function writeRuntimeOutputContractFingerprint(
  projectRoot: string,
  fingerprint: RuntimeOutputContractFingerprint
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const fingerprintPath = path.join(exportsDir, FINGERPRINT_FILE);
  fs.writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  return fingerprintPath;
}

export function writeRuntimeOutputContractReport(
  projectRoot: string,
  report: RuntimeOutputContractReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runRuntimeOutputContractAudit(
  projectRoot: string
): RuntimeOutputContractReport {
  const auditTimestamp = new Date().toISOString();
  const current = buildRuntimeOutputContractFingerprint(auditTimestamp);
  const frozen = loadRuntimeOutputContractFingerprint(projectRoot);

  if (!frozen) {
    const violations = findStructuralViolations(current, getRuntimeOutputMappings());
    if (violations.length === 0) {
      writeRuntimeOutputContractFingerprint(projectRoot, current);
    }
    return {
      auditTimestamp,
      auditResult: violations.length === 0 ? 'PASS' : primaryFailure(violations),
      violations,
    };
  }

  const violations = compareRuntimeOutputContractFingerprints(current, frozen);
  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  return {
    auditTimestamp,
    auditResult,
    violations,
  };
}
