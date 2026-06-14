import fs from 'node:fs';
import path from 'node:path';
import {
  REQUIRED_SHOT_BINDING_FIELDS,
  REQUIRED_TRANSITION_BINDING_FIELDS,
  buildVideoDatasetRecords,
  type VideoDatasetRecord,
} from './videoDatasetBuilder.js';
import {
  IMAGE_DATASET_EXPORT_JSON_PATH,
  VIDEO_DATASET_EXPORT_JSON_PATH,
  type VideoDatasetExport,
} from './videoDatasetExport.js';
import { loadVideoDatasetExport, validateDatasetIndexEntry } from './videoDatasetExportAudit.js';

export type VideoDatasetQualityAuditResult =
  | 'PASS'
  | 'FAIL_SCENE_COMPLETENESS'
  | 'FAIL_SHOT_BINDING'
  | 'FAIL_TRANSITION_BINDING'
  | 'FAIL_CONTINUITY_GLUE'
  | 'FAIL_INDEX_CONSISTENCY'
  | 'FAIL_DUPLICATE_SCENE'
  | 'FAIL_ORPHAN_SCENE';

export interface VideoDatasetQualityViolation {
  code: VideoDatasetQualityAuditResult;
  message: string;
  field?: string;
}

export interface VideoDatasetQualityReport {
  auditTimestamp: string;
  auditResult: VideoDatasetQualityAuditResult;
  violations: VideoDatasetQualityViolation[];
  total_scene_count: number;
  quality_score: number;
}

const REPORT_FILE = 'video-dataset-quality-report.json';
const QUALITY_CHECK_CATEGORIES = 7;

function hasRequiredStringFields(record: object, fields: readonly string[]): boolean {
  const values = record as Record<string, unknown>;
  return fields.every((field) => {
    const value = values[field];
    return typeof value === 'string' && value.length > 0;
  });
}

function sortedArrayEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return leftSorted.every((value, index) => value === rightSorted[index]);
}

function assertVideoExportOnly(exportData: VideoDatasetExport): VideoDatasetQualityViolation[] {
  const violations: VideoDatasetQualityViolation[] = [];

  if (exportData.export_metadata.export_type !== 'video_dataset') {
    violations.push({
      code: 'FAIL_SCENE_COMPLETENESS',
      message: 'Quality audit accepts video-dataset-export.json only',
      field: 'export_metadata.export_type',
    });
  }

  if (exportData.export_metadata.active_export !== 'video_dataset') {
    violations.push({
      code: 'FAIL_SCENE_COMPLETENESS',
      message: 'active_export must be video_dataset (not image dataset)',
      field: 'export_metadata.active_export',
    });
  }

  if (exportData.export_metadata.image_dataset_export_separate !== true) {
    violations.push({
      code: 'FAIL_SCENE_COMPLETENESS',
      message: 'video and image dataset exports must remain separated',
      field: 'export_metadata.image_dataset_export_separate',
    });
  }

  if (exportData.export_metadata.export_json_path !== VIDEO_DATASET_EXPORT_JSON_PATH) {
    violations.push({
      code: 'FAIL_SCENE_COMPLETENESS',
      message: 'export_json_path must reference video-dataset-export.json',
      field: 'export_metadata.export_json_path',
    });
  }

  if (exportData.export_metadata.image_dataset_export_path !== IMAGE_DATASET_EXPORT_JSON_PATH) {
    violations.push({
      code: 'FAIL_SCENE_COMPLETENESS',
      message: 'image dataset path must remain exports/image-dataset-export.json',
      field: 'export_metadata.image_dataset_export_path',
    });
  }

  return violations;
}

export function auditVideoDatasetQuality(exportData: VideoDatasetExport): VideoDatasetQualityViolation[] {
  const violations: VideoDatasetQualityViolation[] = [];
  const expectedRecords = buildVideoDatasetRecords();
  const expectedSceneIds = expectedRecords.map((record) => record.scene_id).sort();

  violations.push(...assertVideoExportOnly(exportData));

  if (exportData.export_metadata.scene_count !== exportData.scene_records.length) {
    violations.push({
      code: 'FAIL_SCENE_COMPLETENESS',
      message: 'export_metadata.scene_count does not match scene_records length',
      field: 'export_metadata.scene_count',
    });
  }

  const seenSceneIds = new Set<string>();
  const seenRuntimeSources = new Set<string>();
  const indexedSceneIds = new Set(exportData.dataset_index.map((entry) => entry.scene_id));
  const recordSceneIds = new Set(exportData.scene_records.map((record) => record.scene_id));

  for (const record of exportData.scene_records) {
    if (!record.scene_id || !record.runtime_source) {
      violations.push({
        code: 'FAIL_SCENE_COMPLETENESS',
        message: 'Scene record missing scene_id or runtime_source',
        field: 'scene_records',
      });
    }

    if (!record.scene_id.startsWith('VDS-')) {
      violations.push({
        code: 'FAIL_SCENE_COMPLETENESS',
        message: `Invalid scene_id prefix for ${record.scene_id}`,
        field: 'scene_id',
      });
    }

    if (!record.runtime_source.startsWith('ASM-')) {
      violations.push({
        code: 'FAIL_SCENE_COMPLETENESS',
        message: `Invalid runtime_source prefix for ${record.scene_id}`,
        field: 'runtime_source',
      });
    }

    if (seenSceneIds.has(record.scene_id)) {
      violations.push({
        code: 'FAIL_DUPLICATE_SCENE',
        message: `Duplicate scene_id in export: ${record.scene_id}`,
        field: 'scene_records',
      });
    }
    seenSceneIds.add(record.scene_id);

    if (seenRuntimeSources.has(record.runtime_source)) {
      violations.push({
        code: 'FAIL_DUPLICATE_SCENE',
        message: `Duplicate runtime_source in export: ${record.runtime_source}`,
        field: 'scene_records',
      });
    }
    seenRuntimeSources.add(record.runtime_source);

    if (!hasRequiredStringFields(record.shot_binding, REQUIRED_SHOT_BINDING_FIELDS)) {
      violations.push({
        code: 'FAIL_SHOT_BINDING',
        message: `Incomplete shot_binding for ${record.scene_id}`,
        field: 'shot_binding',
      });
    }

    if (!hasRequiredStringFields(record.transition_binding, REQUIRED_TRANSITION_BINDING_FIELDS)) {
      violations.push({
        code: 'FAIL_TRANSITION_BINDING',
        message: `Incomplete transition_binding for ${record.scene_id}`,
        field: 'transition_binding',
      });
    }

    if (!record.continuity_glue.glue || record.continuity_glue.glue.trim().length === 0) {
      violations.push({
        code: 'FAIL_CONTINUITY_GLUE',
        message: `Missing continuity glue for ${record.scene_id}`,
        field: 'continuity_glue.glue',
      });
    }

    if (!record.continuity_glue.transition_id) {
      violations.push({
        code: 'FAIL_CONTINUITY_GLUE',
        message: `Missing continuity_glue.transition_id for ${record.scene_id}`,
        field: 'continuity_glue.transition_id',
      });
    }

    if (record.continuity_glue.transition_id !== record.transition_binding.transition_id) {
      violations.push({
        code: 'FAIL_CONTINUITY_GLUE',
        message: `Continuity glue transition mismatch for ${record.scene_id}`,
        field: 'continuity_glue.transition_id',
      });
    }

    if (record.continuity_glue.glue !== record.transition_binding.continuity_glue) {
      violations.push({
        code: 'FAIL_CONTINUITY_GLUE',
        message: `Continuity glue text mismatch for ${record.scene_id}`,
        field: 'continuity_glue.glue',
      });
    }

    if (!indexedSceneIds.has(record.scene_id)) {
      violations.push({
        code: 'FAIL_ORPHAN_SCENE',
        message: `Scene record missing from dataset_index: ${record.scene_id}`,
        field: 'dataset_index',
      });
    }
  }

  for (const entry of exportData.dataset_index) {
    const record = exportData.scene_records.find((item) => item.scene_id === entry.scene_id);
    if (!record) {
      violations.push({
        code: 'FAIL_ORPHAN_SCENE',
        message: `Dataset index entry has no scene record: ${entry.scene_id}`,
        field: 'dataset_index',
      });
      continue;
    }

    if (!validateDatasetIndexEntry(entry, record)) {
      violations.push({
        code: 'FAIL_INDEX_CONSISTENCY',
        message: `Dataset index inconsistent with scene record: ${entry.scene_id}`,
        field: 'dataset_index',
      });
    }
  }

  for (const sceneId of indexedSceneIds) {
    if (!recordSceneIds.has(sceneId)) {
      violations.push({
        code: 'FAIL_ORPHAN_SCENE',
        message: `Dataset index orphan scene id: ${sceneId}`,
        field: 'dataset_index',
      });
    }
  }

  const actualSceneIds = exportData.scene_records.map((record) => record.scene_id).sort();
  if (!sortedArrayEqual(actualSceneIds, expectedSceneIds)) {
    violations.push({
      code: 'FAIL_SCENE_COMPLETENESS',
      message: 'Video dataset export scene set is incomplete',
      field: 'scene_records',
    });
  }

  if (exportData.scene_records.length !== expectedRecords.length) {
    violations.push({
      code: 'FAIL_SCENE_COMPLETENESS',
      message: `Expected ${expectedRecords.length} scenes, found ${exportData.scene_records.length}`,
      field: 'scene_records',
    });
  }

  return violations;
}

function primaryFailure(
  violations: VideoDatasetQualityViolation[]
): VideoDatasetQualityAuditResult {
  const priority: VideoDatasetQualityAuditResult[] = [
    'FAIL_DUPLICATE_SCENE',
    'FAIL_ORPHAN_SCENE',
    'FAIL_SCENE_COMPLETENESS',
    'FAIL_SHOT_BINDING',
    'FAIL_TRANSITION_BINDING',
    'FAIL_CONTINUITY_GLUE',
    'FAIL_INDEX_CONSISTENCY',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

function computeQualityScore(violations: VideoDatasetQualityViolation[]): number {
  if (violations.length === 0) return 100;
  const failedCategories = new Set(violations.map((violation) => violation.code)).size;
  return Math.max(0, Math.round(((QUALITY_CHECK_CATEGORIES - failedCategories) / QUALITY_CHECK_CATEGORIES) * 100));
}

export function writeVideoDatasetQualityReport(
  projectRoot: string,
  report: VideoDatasetQualityReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runVideoDatasetQualityAudit(projectRoot: string): VideoDatasetQualityReport {
  const auditTimestamp = new Date().toISOString();
  const exportData = loadVideoDatasetExport(projectRoot);
  const violations: VideoDatasetQualityViolation[] = [];

  if (!exportData) {
    violations.push({
      code: 'FAIL_SCENE_COMPLETENESS',
      message: 'video-dataset-export.json not found',
      field: VIDEO_DATASET_EXPORT_JSON_PATH,
    });
  } else {
    violations.push(...auditVideoDatasetQuality(exportData));
  }

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);
  const total_scene_count = exportData?.scene_records.length ?? 0;

  const report: VideoDatasetQualityReport = {
    auditTimestamp,
    auditResult,
    violations,
    total_scene_count,
    quality_score: auditResult === 'PASS' ? 100 : computeQualityScore(violations),
  };

  writeVideoDatasetQualityReport(projectRoot, report);
  return report;
}

export function loadVideoDatasetQualityReport(
  projectRoot: string
): VideoDatasetQualityReport | null {
  const reportPath = path.join(projectRoot, 'exports', REPORT_FILE);
  if (!fs.existsSync(reportPath)) return null;
  return JSON.parse(fs.readFileSync(reportPath, 'utf8')) as VideoDatasetQualityReport;
}
