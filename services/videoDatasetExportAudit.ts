import fs from 'node:fs';
import path from 'node:path';
import { buildVideoDatasetRecords, type VideoDatasetRecord } from './videoDatasetBuilder.js';
import {
  buildVideoDatasetExport,
  type VideoDatasetExport,
  type VideoDatasetIndexEntry,
} from './videoDatasetExport.js';

export type VideoDatasetExportAuditResult =
  | 'PASS'
  | 'FAIL_EXPORT_COMPLETENESS'
  | 'FAIL_SCENE_COUNT'
  | 'FAIL_INDEX_INTEGRITY'
  | 'FAIL_DUPLICATE_RECORD'
  | 'FAIL_MISSING_RECORD';

export interface VideoDatasetExportViolation {
  code: VideoDatasetExportAuditResult;
  message: string;
  field?: string;
}

export interface VideoDatasetExportReport {
  auditTimestamp: string;
  auditResult: VideoDatasetExportAuditResult;
  violations: VideoDatasetExportViolation[];
  sceneCount: number;
  indexCount: number;
  builderRecordCount: number;
}

const EXPORT_FILE = 'video-dataset-export.json';
const REPORT_FILE = 'video-dataset-export-report.json';

function sortedArrayEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return leftSorted.every((value, index) => value === rightSorted[index]);
}

function recordsEqual(left: VideoDatasetRecord, right: VideoDatasetRecord): boolean {
  return (
    left.scene_id === right.scene_id &&
    left.runtime_source === right.runtime_source &&
    JSON.stringify(left.shot_binding) === JSON.stringify(right.shot_binding) &&
    JSON.stringify(left.transition_binding) === JSON.stringify(right.transition_binding) &&
    JSON.stringify(left.continuity_glue) === JSON.stringify(right.continuity_glue)
  );
}

function findDuplicateRecordViolations(
  exportData: VideoDatasetExport
): VideoDatasetExportViolation[] {
  const violations: VideoDatasetExportViolation[] = [];
  const seenSceneIds = new Set<string>();
  const seenRuntimeSources = new Set<string>();

  for (const record of exportData.scene_records) {
    if (seenSceneIds.has(record.scene_id)) {
      violations.push({
        code: 'FAIL_DUPLICATE_RECORD',
        message: `Duplicate export scene record: ${record.scene_id}`,
        field: 'scene_records',
      });
    }
    seenSceneIds.add(record.scene_id);

    if (seenRuntimeSources.has(record.runtime_source)) {
      violations.push({
        code: 'FAIL_DUPLICATE_RECORD',
        message: `Duplicate export runtime source: ${record.runtime_source}`,
        field: 'scene_records',
      });
    }
    seenRuntimeSources.add(record.runtime_source);
  }

  const seenIndexSceneIds = new Set<string>();
  for (const entry of exportData.dataset_index) {
    if (seenIndexSceneIds.has(entry.scene_id)) {
      violations.push({
        code: 'FAIL_DUPLICATE_RECORD',
        message: `Duplicate dataset index scene id: ${entry.scene_id}`,
        field: 'dataset_index',
      });
    }
    seenIndexSceneIds.add(entry.scene_id);
  }

  return violations;
}

function findIndexIntegrityViolations(
  exportData: VideoDatasetExport
): VideoDatasetExportViolation[] {
  const violations: VideoDatasetExportViolation[] = [];
  const recordBySceneId = new Map(
    exportData.scene_records.map((record) => [record.scene_id, record])
  );

  for (const entry of exportData.dataset_index) {
    const record = recordBySceneId.get(entry.scene_id);
    if (!record) {
      violations.push({
        code: 'FAIL_INDEX_INTEGRITY',
        message: `Dataset index references missing scene record: ${entry.scene_id}`,
        field: 'dataset_index',
      });
      continue;
    }

    if (entry.runtime_source !== record.runtime_source) {
      violations.push({
        code: 'FAIL_INDEX_INTEGRITY',
        message: `Index runtime_source mismatch for ${entry.scene_id}`,
        field: 'dataset_index',
      });
    }

    if (entry.shot_id !== record.shot_binding.shot_id) {
      violations.push({
        code: 'FAIL_INDEX_INTEGRITY',
        message: `Index shot_id mismatch for ${entry.scene_id}`,
        field: 'dataset_index',
      });
    }

    if (entry.transition_id !== record.transition_binding.transition_id) {
      violations.push({
        code: 'FAIL_INDEX_INTEGRITY',
        message: `Index transition_id mismatch for ${entry.scene_id}`,
        field: 'dataset_index',
      });
    }

    if (entry.index < 0 || entry.index >= exportData.scene_records.length) {
      violations.push({
        code: 'FAIL_INDEX_INTEGRITY',
        message: `Dataset index out of range for ${entry.scene_id}`,
        field: 'dataset_index',
      });
    }
  }

  const indices = exportData.dataset_index.map((entry) => entry.index).sort((a, b) => a - b);
  const expectedIndices = exportData.dataset_index.map((_, index) => index);
  if (!sortedArrayEqual(indices.map(String), expectedIndices.map(String))) {
    violations.push({
      code: 'FAIL_INDEX_INTEGRITY',
      message: 'Dataset index sequence is not contiguous',
      field: 'dataset_index',
    });
  }

  return violations;
}

export function auditVideoDatasetExport(exportData: VideoDatasetExport): VideoDatasetExportViolation[] {
  const violations: VideoDatasetExportViolation[] = [];
  const builderRecords = buildVideoDatasetRecords();
  const builderSceneIds = builderRecords.map((record) => record.scene_id).sort();
  const exportSceneIds = exportData.scene_records.map((record) => record.scene_id).sort();
  const coveredBuilderScenes = new Set<string>();

  violations.push(...findDuplicateRecordViolations(exportData));
  violations.push(...findIndexIntegrityViolations(exportData));

  if (exportData.export_metadata.scene_count !== exportData.scene_records.length) {
    violations.push({
      code: 'FAIL_SCENE_COUNT',
      message: 'export_metadata.scene_count does not match scene_records length',
      field: 'export_metadata.scene_count',
    });
  }

  if (exportData.scene_records.length !== exportData.dataset_index.length) {
    violations.push({
      code: 'FAIL_SCENE_COUNT',
      message: 'scene_records length does not match dataset_index length',
      field: 'dataset_index',
    });
  }

  if (exportData.export_metadata.scene_count !== exportData.dataset_index.length) {
    violations.push({
      code: 'FAIL_SCENE_COUNT',
      message: 'export_metadata.scene_count does not match dataset_index length',
      field: 'export_metadata.scene_count',
    });
  }

  if (!sortedArrayEqual(builderSceneIds, exportSceneIds)) {
    violations.push({
      code: 'FAIL_EXPORT_COMPLETENESS',
      message: 'Export scene id set does not match builder record set',
      field: 'scene_records',
    });
  }

  for (const builderRecord of builderRecords) {
    const exportRecord = exportData.scene_records.find(
      (record) => record.scene_id === builderRecord.scene_id
    );
    if (!exportRecord) {
      violations.push({
        code: 'FAIL_MISSING_RECORD',
        message: `Builder record missing from export: ${builderRecord.scene_id}`,
        field: 'scene_records',
      });
      continue;
    }

    if (!recordsEqual(builderRecord, exportRecord)) {
      violations.push({
        code: 'FAIL_EXPORT_COMPLETENESS',
        message: `Export record content mismatch for ${builderRecord.scene_id}`,
        field: 'scene_records',
      });
    }

    coveredBuilderScenes.add(builderRecord.scene_id);
  }

  for (const record of exportData.scene_records) {
    if (!builderRecords.some((builder) => builder.scene_id === record.scene_id)) {
      violations.push({
        code: 'FAIL_MISSING_RECORD',
        message: `Export record has no builder source: ${record.scene_id}`,
        field: 'scene_records',
      });
    }
  }

  if (exportData.export_metadata.image_dataset_export_separate !== true) {
    violations.push({
      code: 'FAIL_EXPORT_COMPLETENESS',
      message: 'video export must remain separate from image-dataset-export',
      field: 'export_metadata.image_dataset_export_separate',
    });
  }

  if (coveredBuilderScenes.size !== builderRecords.length) {
    violations.push({
      code: 'FAIL_EXPORT_COMPLETENESS',
      message: 'Export does not cover all builder records',
      field: 'scene_records',
    });
  }

  return violations;
}

function primaryFailure(
  violations: VideoDatasetExportViolation[]
): VideoDatasetExportAuditResult {
  const priority: VideoDatasetExportAuditResult[] = [
    'FAIL_DUPLICATE_RECORD',
    'FAIL_MISSING_RECORD',
    'FAIL_SCENE_COUNT',
    'FAIL_INDEX_INTEGRITY',
    'FAIL_EXPORT_COMPLETENESS',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function writeVideoDatasetExportFile(
  projectRoot: string,
  exportData: VideoDatasetExport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const exportPath = path.join(exportsDir, EXPORT_FILE);
  fs.writeFileSync(exportPath, `${JSON.stringify(exportData, null, 2)}\n`, 'utf8');
  return exportPath;
}

export function writeVideoDatasetExportReport(
  projectRoot: string,
  report: VideoDatasetExportReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function loadVideoDatasetExport(projectRoot: string): VideoDatasetExport | null {
  const exportPath = path.join(projectRoot, 'exports', EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return null;
  return JSON.parse(fs.readFileSync(exportPath, 'utf8')) as VideoDatasetExport;
}

export function runVideoDatasetExportAudit(projectRoot: string): VideoDatasetExportReport {
  const auditTimestamp = new Date().toISOString();
  const exportData = buildVideoDatasetExport(auditTimestamp);
  const builderRecords = buildVideoDatasetRecords();
  const violations = auditVideoDatasetExport(exportData);

  writeVideoDatasetExportFile(projectRoot, exportData);

  const report: VideoDatasetExportReport = {
    auditTimestamp,
    auditResult: violations.length === 0 ? 'PASS' : primaryFailure(violations),
    violations,
    sceneCount: exportData.scene_records.length,
    indexCount: exportData.dataset_index.length,
    builderRecordCount: builderRecords.length,
  };

  writeVideoDatasetExportReport(projectRoot, report);
  return report;
}

export function validateDatasetIndexEntry(
  entry: VideoDatasetIndexEntry,
  record: VideoDatasetRecord
): boolean {
  return (
    entry.scene_id === record.scene_id &&
    entry.runtime_source === record.runtime_source &&
    entry.shot_id === record.shot_binding.shot_id &&
    entry.transition_id === record.transition_binding.transition_id
  );
}
