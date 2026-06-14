import fs from 'node:fs';
import path from 'node:path';
import { getRuntimeOutputMappings } from './runtimeOutputContractDefinitions.js';
import { getRuntimeResolverMappings } from './runtimeResolverContractDefinitions.js';
import {
  buildRuntimeAssemblyFingerprint,
  getVideoDatasetSceneAssemblies,
  type RuntimeAssemblyFingerprint,
  type VideoDatasetSceneAssembly,
} from './runtimeAssemblyDefinitions.js';

export type RuntimeAssemblyAuditResult =
  | 'PASS'
  | 'FAIL_RESOLVER_MAPPING'
  | 'FAIL_OUTPUT_ASSEMBLY'
  | 'FAIL_CONTINUITY_GLUE'
  | 'FAIL_SHOT_BINDING'
  | 'FAIL_TRANSITION_BINDING'
  | 'FAIL_DUPLICATE_ASSEMBLY'
  | 'FAIL_ORPHAN_ASSEMBLY';

export interface RuntimeAssemblyViolation {
  code: RuntimeAssemblyAuditResult;
  message: string;
  field?: string;
}

export interface RuntimeAssemblyReport {
  auditTimestamp: string;
  auditResult: RuntimeAssemblyAuditResult;
  violations: RuntimeAssemblyViolation[];
}

const FINGERPRINT_FILE = 'runtime-assembly-fingerprint.json';
const REPORT_FILE = 'runtime-assembly-report.json';

function sortedArrayEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return leftSorted.every((value, index) => value === rightSorted[index]);
}

function recordStringEqual(left: Record<string, string>, right: Record<string, string>): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (!sortedArrayEqual(leftKeys, rightKeys)) return false;
  return leftKeys.every((key) => left[key] === right[key]);
}

function findDuplicateAssemblyViolations(
  assemblies: readonly VideoDatasetSceneAssembly[]
): RuntimeAssemblyViolation[] {
  const seenAssemblyIds = new Set<string>();
  const seenResolverRefs = new Set<string>();
  const violations: RuntimeAssemblyViolation[] = [];

  for (const assembly of assemblies) {
    if (seenAssemblyIds.has(assembly.scene_assembly_id)) {
      violations.push({
        code: 'FAIL_DUPLICATE_ASSEMBLY',
        message: `Duplicate scene assembly id detected: ${assembly.scene_assembly_id}`,
        field: 'sceneAssemblyIds',
      });
    }
    seenAssemblyIds.add(assembly.scene_assembly_id);

    if (seenResolverRefs.has(assembly.resolver_mapping_id)) {
      violations.push({
        code: 'FAIL_DUPLICATE_ASSEMBLY',
        message: `Duplicate resolver reference in assembly: ${assembly.resolver_mapping_id}`,
        field: 'resolverReferences',
      });
    }
    seenResolverRefs.add(assembly.resolver_mapping_id);
  }

  return violations;
}

function findStructuralViolations(
  assemblies: readonly VideoDatasetSceneAssembly[],
  fingerprint: RuntimeAssemblyFingerprint
): RuntimeAssemblyViolation[] {
  const violations: RuntimeAssemblyViolation[] = [];
  const resolverMappingIds = new Set(getRuntimeResolverMappings().map((m) => m.mapping_id));
  const outputMappingIds = new Set(getRuntimeOutputMappings().map((m) => m.output_mapping_id));
  const outputByResolver = new Map(
    getRuntimeOutputMappings().map((m) => [m.resolver_mapping_id, m.output_mapping_id])
  );
  const coveredResolverMappings = new Set<string>();
  const coveredOutputMappings = new Set<string>();

  violations.push(...findDuplicateAssemblyViolations(assemblies));

  for (const assembly of assemblies) {
    if (!resolverMappingIds.has(assembly.resolver_mapping_id)) {
      violations.push({
        code: 'FAIL_ORPHAN_ASSEMBLY',
        message: `Orphan assembly references unknown resolver mapping: ${assembly.resolver_mapping_id}`,
        field: 'resolverReferences',
      });
    } else {
      coveredResolverMappings.add(assembly.resolver_mapping_id);
    }

    if (!outputMappingIds.has(assembly.output_mapping_id)) {
      violations.push({
        code: 'FAIL_ORPHAN_ASSEMBLY',
        message: `Orphan assembly references unknown output mapping: ${assembly.output_mapping_id}`,
        field: 'output_mapping_id',
      });
    } else {
      coveredOutputMappings.add(assembly.output_mapping_id);
    }

    const expectedOutput = outputByResolver.get(assembly.resolver_mapping_id);
    if (expectedOutput && expectedOutput !== assembly.output_mapping_id) {
      violations.push({
        code: 'FAIL_OUTPUT_ASSEMBLY',
        message: `Output assembly mismatch for ${assembly.scene_assembly_id}`,
        field: 'output_mapping_id',
      });
    }

    if (assembly.shot_binding.shot_id !== fingerprint.shotBindings[assembly.scene_assembly_id]) {
      violations.push({
        code: 'FAIL_SHOT_BINDING',
        message: `Shot binding linkage mismatch for ${assembly.scene_assembly_id}`,
        field: 'shotBindings',
      });
    }

    if (
      assembly.transition_binding.transition_id !==
      fingerprint.transitionBindings[assembly.scene_assembly_id]
    ) {
      violations.push({
        code: 'FAIL_TRANSITION_BINDING',
        message: `Transition binding linkage mismatch for ${assembly.scene_assembly_id}`,
        field: 'transitionBindings',
      });
    }

    if (assembly.continuity_glue !== assembly.transition_binding.continuity_glue) {
      violations.push({
        code: 'FAIL_CONTINUITY_GLUE',
        message: `Continuity glue linkage broken for ${assembly.scene_assembly_id}`,
        field: 'continuityGlue',
      });
    }

    if (fingerprint.continuityGlue[assembly.scene_assembly_id] !== assembly.continuity_glue) {
      violations.push({
        code: 'FAIL_CONTINUITY_GLUE',
        message: `Continuity glue fingerprint mismatch for ${assembly.scene_assembly_id}`,
        field: 'continuityGlue',
      });
    }
  }

  for (const mappingId of resolverMappingIds) {
    if (!coveredResolverMappings.has(mappingId)) {
      violations.push({
        code: 'FAIL_RESOLVER_MAPPING',
        message: `Resolver mapping has no scene assembly: ${mappingId}`,
        field: 'resolverReferences',
      });
    }
  }

  for (const outputId of outputMappingIds) {
    if (!coveredOutputMappings.has(outputId)) {
      violations.push({
        code: 'FAIL_OUTPUT_ASSEMBLY',
        message: `Output mapping has no scene assembly: ${outputId}`,
        field: 'sceneAssemblyIds',
      });
    }
  }

  return violations;
}

export function compareRuntimeAssemblyFingerprints(
  current: RuntimeAssemblyFingerprint,
  frozen: RuntimeAssemblyFingerprint
): RuntimeAssemblyViolation[] {
  const assemblies = getVideoDatasetSceneAssemblies();
  const violations = findStructuralViolations(assemblies, current);

  if (current.schemaVersion !== frozen.schemaVersion) {
    violations.push({
      code: 'FAIL_OUTPUT_ASSEMBLY',
      message: 'Assembly schema version drift detected',
      field: 'schemaVersion',
    });
  }

  if (!sortedArrayEqual(current.sceneAssemblyIds, frozen.sceneAssemblyIds)) {
    violations.push({
      code: 'FAIL_DUPLICATE_ASSEMBLY',
      message: 'Scene assembly id set drift detected',
      field: 'sceneAssemblyIds',
    });
  }

  if (!recordStringEqual(current.resolverReferences, frozen.resolverReferences)) {
    violations.push({
      code: 'FAIL_RESOLVER_MAPPING',
      message: 'Resolver reference drift detected',
      field: 'resolverReferences',
    });
  }

  if (!recordStringEqual(current.shotBindings, frozen.shotBindings)) {
    violations.push({
      code: 'FAIL_SHOT_BINDING',
      message: 'Shot binding drift detected',
      field: 'shotBindings',
    });
  }

  if (!recordStringEqual(current.transitionBindings, frozen.transitionBindings)) {
    violations.push({
      code: 'FAIL_TRANSITION_BINDING',
      message: 'Transition binding drift detected',
      field: 'transitionBindings',
    });
  }

  if (!recordStringEqual(current.continuityGlue, frozen.continuityGlue)) {
    violations.push({
      code: 'FAIL_CONTINUITY_GLUE',
      message: 'Continuity glue drift detected',
      field: 'continuityGlue',
    });
  }

  if (current.outputContractSchemaVersion !== frozen.outputContractSchemaVersion) {
    violations.push({
      code: 'FAIL_OUTPUT_ASSEMBLY',
      message: 'Upstream output contract schema drift detected',
      field: 'outputContractSchemaVersion',
    });
  }

  return violations;
}

function primaryFailure(violations: RuntimeAssemblyViolation[]): RuntimeAssemblyAuditResult {
  const priority: RuntimeAssemblyAuditResult[] = [
    'FAIL_ORPHAN_ASSEMBLY',
    'FAIL_DUPLICATE_ASSEMBLY',
    'FAIL_RESOLVER_MAPPING',
    'FAIL_OUTPUT_ASSEMBLY',
    'FAIL_CONTINUITY_GLUE',
    'FAIL_SHOT_BINDING',
    'FAIL_TRANSITION_BINDING',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function loadRuntimeAssemblyFingerprint(
  projectRoot: string
): RuntimeAssemblyFingerprint | null {
  const fingerprintPath = path.join(projectRoot, 'exports', FINGERPRINT_FILE);
  if (!fs.existsSync(fingerprintPath)) return null;
  return JSON.parse(fs.readFileSync(fingerprintPath, 'utf8')) as RuntimeAssemblyFingerprint;
}

export function writeRuntimeAssemblyFingerprint(
  projectRoot: string,
  fingerprint: RuntimeAssemblyFingerprint
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const fingerprintPath = path.join(exportsDir, FINGERPRINT_FILE);
  fs.writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  return fingerprintPath;
}

export function writeRuntimeAssemblyReport(
  projectRoot: string,
  report: RuntimeAssemblyReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runRuntimeAssemblyAudit(projectRoot: string): RuntimeAssemblyReport {
  const auditTimestamp = new Date().toISOString();
  const current = buildRuntimeAssemblyFingerprint(auditTimestamp);
  const frozen = loadRuntimeAssemblyFingerprint(projectRoot);

  if (!frozen) {
    const violations = findStructuralViolations(getVideoDatasetSceneAssemblies(), current);
    if (violations.length === 0) {
      writeRuntimeAssemblyFingerprint(projectRoot, current);
    }
    return {
      auditTimestamp,
      auditResult: violations.length === 0 ? 'PASS' : primaryFailure(violations),
      violations,
    };
  }

  const violations = compareRuntimeAssemblyFingerprints(current, frozen);
  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  return {
    auditTimestamp,
    auditResult,
    violations,
  };
}
