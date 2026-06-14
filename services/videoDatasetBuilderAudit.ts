import fs from 'node:fs';
import path from 'node:path';
import { getVideoDatasetSceneAssemblies } from './runtimeAssemblyDefinitions.js';
import {
  REQUIRED_SHOT_BINDING_FIELDS,
  REQUIRED_TRANSITION_BINDING_FIELDS,
  buildVideoDatasetBuilderPreview,
  type VideoDatasetBuilderPreview,
  type VideoDatasetRecord,
} from './videoDatasetBuilder.js';

export type VideoDatasetBuilderAuditResult =
  | 'PASS'
  | 'FAIL_ASSEMBLY_COVERAGE'
  | 'FAIL_MISSING_SCENE'
  | 'FAIL_DUPLICATE_SCENE'
  | 'FAIL_CONTINUITY_COMPLETENESS'
  | 'FAIL_TRANSITION_COMPLETENESS';

export interface VideoDatasetBuilderViolation {
  code: VideoDatasetBuilderAuditResult;
  message: string;
  field?: string;
}

export interface VideoDatasetBuilderReport {
  auditTimestamp: string;
  auditResult: VideoDatasetBuilderAuditResult;
  violations: VideoDatasetBuilderViolation[];
  recordCount: number;
  assemblyCount: number;
}

const PREVIEW_FILE = 'video-dataset-builder-preview.json';
const REPORT_FILE = 'video-dataset-builder-report.json';

function hasRequiredFields(
  record: object,
  requiredFields: readonly string[]
): boolean {
  const values = record as Record<string, unknown>;
  return requiredFields.every((field) => {
    const value = values[field];
    return typeof value === 'string' && value.length > 0;
  });
}

function findDuplicateSceneViolations(
  records: readonly VideoDatasetRecord[]
): VideoDatasetBuilderViolation[] {
  const seenSceneIds = new Set<string>();
  const seenRuntimeSources = new Set<string>();
  const violations: VideoDatasetBuilderViolation[] = [];

  for (const record of records) {
    if (seenSceneIds.has(record.scene_id)) {
      violations.push({
        code: 'FAIL_DUPLICATE_SCENE',
        message: `Duplicate scene record detected: ${record.scene_id}`,
        field: 'scene_id',
      });
    }
    seenSceneIds.add(record.scene_id);

    if (seenRuntimeSources.has(record.runtime_source)) {
      violations.push({
        code: 'FAIL_DUPLICATE_SCENE',
        message: `Duplicate runtime source in scene record: ${record.runtime_source}`,
        field: 'runtime_source',
      });
    }
    seenRuntimeSources.add(record.runtime_source);
  }

  return violations;
}

function findContinuityViolations(
  records: readonly VideoDatasetRecord[]
): VideoDatasetBuilderViolation[] {
  const violations: VideoDatasetBuilderViolation[] = [];

  for (const record of records) {
    if (!record.continuity_glue.glue || record.continuity_glue.glue.trim().length === 0) {
      violations.push({
        code: 'FAIL_CONTINUITY_COMPLETENESS',
        message: `Continuity glue missing for ${record.scene_id}`,
        field: 'continuity_glue.glue',
      });
    }

    if (record.continuity_glue.transition_id !== record.transition_binding.transition_id) {
      violations.push({
        code: 'FAIL_CONTINUITY_COMPLETENESS',
        message: `Continuity glue transition linkage broken for ${record.scene_id}`,
        field: 'continuity_glue.transition_id',
      });
    }

    if (record.continuity_glue.glue !== record.transition_binding.continuity_glue) {
      violations.push({
        code: 'FAIL_CONTINUITY_COMPLETENESS',
        message: `Continuity glue does not match transition binding for ${record.scene_id}`,
        field: 'continuity_glue.glue',
      });
    }
  }

  return violations;
}

function findTransitionViolations(
  records: readonly VideoDatasetRecord[]
): VideoDatasetBuilderViolation[] {
  const violations: VideoDatasetBuilderViolation[] = [];

  for (const record of records) {
    if (!hasRequiredFields(record.transition_binding, REQUIRED_TRANSITION_BINDING_FIELDS)) {
      violations.push({
        code: 'FAIL_TRANSITION_COMPLETENESS',
        message: `Transition binding incomplete for ${record.scene_id}`,
        field: 'transition_binding',
      });
    }

    if (!hasRequiredFields(record.shot_binding, REQUIRED_SHOT_BINDING_FIELDS)) {
      violations.push({
        code: 'FAIL_MISSING_SCENE',
        message: `Shot binding incomplete for ${record.scene_id}`,
        field: 'shot_binding',
      });
    }
  }

  return violations;
}

export function auditVideoDatasetRecords(
  records: readonly VideoDatasetRecord[]
): VideoDatasetBuilderViolation[] {
  const violations: VideoDatasetBuilderViolation[] = [];
  const assemblies = getVideoDatasetSceneAssemblies();
  const assemblyIds = new Set(assemblies.map((assembly) => assembly.scene_assembly_id));
  const coveredAssemblies = new Set<string>();

  violations.push(...findDuplicateSceneViolations(records));
  violations.push(...findContinuityViolations(records));
  violations.push(...findTransitionViolations(records));

  for (const record of records) {
    if (!assemblyIds.has(record.runtime_source)) {
      violations.push({
        code: 'FAIL_MISSING_SCENE',
        message: `Scene record references unknown assembly: ${record.runtime_source}`,
        field: 'runtime_source',
      });
    } else {
      coveredAssemblies.add(record.runtime_source);
    }
  }

  for (const assemblyId of assemblyIds) {
    if (!coveredAssemblies.has(assemblyId)) {
      violations.push({
        code: 'FAIL_MISSING_SCENE',
        message: `Assembly has no video dataset scene record: ${assemblyId}`,
        field: 'runtime_source',
      });
    }
  }

  if (records.length !== assemblies.length) {
    violations.push({
      code: 'FAIL_ASSEMBLY_COVERAGE',
      message: `Assembly coverage mismatch: ${records.length} records for ${assemblies.length} assemblies`,
      field: 'record_count',
    });
  }

  if (coveredAssemblies.size !== assemblyIds.size) {
    violations.push({
      code: 'FAIL_ASSEMBLY_COVERAGE',
      message: 'Assembly coverage incomplete',
      field: 'runtime_source',
    });
  }

  return violations;
}

function primaryFailure(
  violations: VideoDatasetBuilderViolation[]
): VideoDatasetBuilderAuditResult {
  const priority: VideoDatasetBuilderAuditResult[] = [
    'FAIL_DUPLICATE_SCENE',
    'FAIL_MISSING_SCENE',
    'FAIL_ASSEMBLY_COVERAGE',
    'FAIL_CONTINUITY_COMPLETENESS',
    'FAIL_TRANSITION_COMPLETENESS',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function writeVideoDatasetBuilderPreview(
  projectRoot: string,
  preview: VideoDatasetBuilderPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeVideoDatasetBuilderReport(
  projectRoot: string,
  report: VideoDatasetBuilderReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runVideoDatasetBuilderAudit(projectRoot: string): VideoDatasetBuilderReport {
  const auditTimestamp = new Date().toISOString();
  const preview = buildVideoDatasetBuilderPreview(auditTimestamp);
  const records = preview.records;
  const assemblies = getVideoDatasetSceneAssemblies();
  const violations = auditVideoDatasetRecords(records);

  writeVideoDatasetBuilderPreview(projectRoot, preview);

  const report: VideoDatasetBuilderReport = {
    auditTimestamp,
    auditResult: violations.length === 0 ? 'PASS' : primaryFailure(violations),
    violations,
    recordCount: records.length,
    assemblyCount: assemblies.length,
  };

  writeVideoDatasetBuilderReport(projectRoot, report);
  return report;
}
