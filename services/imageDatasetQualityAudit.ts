import fs from 'node:fs';
import path from 'node:path';
import {
  REQUIRED_SHOT_BINDING_FIELDS,
  REQUIRED_TRANSITION_BINDING_FIELDS,
} from './videoDatasetBuilder.js';
import {
  buildImageDatasetRecords,
  IMAGE_DATASET_EXPORT_JSON_PATH,
  type ImageDatasetExport,
} from './imageDatasetExport.js';
import { loadImageDatasetExport } from './imageDatasetExportAudit.js';
import { VIDEO_DATASET_EXPORT_JSON_PATH } from './videoDatasetExport.js';

export type ImageDatasetQualityAuditResult = 'PASS' | 'FAIL_SCENE_COMPLETENESS';

export interface ImageDatasetQualityReport {
  auditTimestamp: string;
  auditResult: ImageDatasetQualityAuditResult;
  violations: Array<{ code: ImageDatasetQualityAuditResult; message: string; field?: string }>;
  total_scene_count: number;
  quality_score: number;
}

const REPORT_FILE = 'image-dataset-quality-report.json';

function hasRequiredStringFields(record: object, fields: readonly string[]): boolean {
  const values = record as Record<string, unknown>;
  return fields.every((field) => {
    const value = values[field];
    return typeof value === 'string' && value.length > 0;
  });
}

export function auditImageDatasetQuality(exportData: ImageDatasetExport): ImageDatasetQualityReport['violations'] {
  const violations: ImageDatasetQualityReport['violations'] = [];
  const expectedRecords = buildImageDatasetRecords();

  if (exportData.export_metadata.export_type !== 'image_dataset') {
    violations.push({
      code: 'FAIL_SCENE_COMPLETENESS',
      message: 'Quality audit accepts image-dataset-export.json only',
      field: 'export_metadata.export_type',
    });
  }

  if (exportData.export_metadata.export_json_path !== IMAGE_DATASET_EXPORT_JSON_PATH) {
    violations.push({
      code: 'FAIL_SCENE_COMPLETENESS',
      message: 'export_json_path must reference image-dataset-export.json',
      field: 'export_metadata.export_json_path',
    });
  }

  if (exportData.export_metadata.video_dataset_export_path !== VIDEO_DATASET_EXPORT_JSON_PATH) {
    violations.push({
      code: 'FAIL_SCENE_COMPLETENESS',
      message: 'video dataset path must remain exports/video-dataset-export.json',
      field: 'export_metadata.video_dataset_export_path',
    });
  }

  if (exportData.scene_records.length !== expectedRecords.length) {
    violations.push({
      code: 'FAIL_SCENE_COMPLETENESS',
      message: `Expected ${expectedRecords.length} image scenes`,
      field: 'scene_records',
    });
  }

  for (const record of exportData.scene_records) {
    if (!record.scene_id.startsWith('IDS-')) {
      violations.push({
        code: 'FAIL_SCENE_COMPLETENESS',
        message: `Invalid image scene_id prefix: ${record.scene_id}`,
        field: 'scene_records',
      });
    }

    if (!record.runtime_source.startsWith('IMS-')) {
      violations.push({
        code: 'FAIL_SCENE_COMPLETENESS',
        message: `Invalid image runtime_source prefix: ${record.runtime_source}`,
        field: 'scene_records',
      });
    }

    if (!hasRequiredStringFields(record.shot_binding, REQUIRED_SHOT_BINDING_FIELDS)) {
      violations.push({
        code: 'FAIL_SCENE_COMPLETENESS',
        message: `Incomplete shot_binding for ${record.scene_id}`,
        field: 'shot_binding',
      });
    }

    if (!hasRequiredStringFields(record.transition_binding, REQUIRED_TRANSITION_BINDING_FIELDS)) {
      violations.push({
        code: 'FAIL_SCENE_COMPLETENESS',
        message: `Incomplete transition_binding for ${record.scene_id}`,
        field: 'transition_binding',
      });
    }
  }

  return violations;
}

export function writeImageDatasetQualityReport(
  projectRoot: string,
  report: ImageDatasetQualityReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function loadImageDatasetQualityReport(
  projectRoot: string
): ImageDatasetQualityReport | null {
  const reportPath = path.join(projectRoot, 'exports', REPORT_FILE);
  if (!fs.existsSync(reportPath)) return null;
  return JSON.parse(fs.readFileSync(reportPath, 'utf8')) as ImageDatasetQualityReport;
}

export function runImageDatasetQualityAudit(projectRoot: string): ImageDatasetQualityReport {
  const auditTimestamp = new Date().toISOString();
  const exportData = loadImageDatasetExport(projectRoot);
  const violations: ImageDatasetQualityReport['violations'] = [];

  if (!exportData) {
    violations.push({
      code: 'FAIL_SCENE_COMPLETENESS',
      message: 'image-dataset-export.json not found',
      field: IMAGE_DATASET_EXPORT_JSON_PATH,
    });
  } else {
    violations.push(...auditImageDatasetQuality(exportData));
  }

  const auditResult = violations.length === 0 ? 'PASS' : 'FAIL_SCENE_COMPLETENESS';
  const report: ImageDatasetQualityReport = {
    auditTimestamp,
    auditResult,
    violations,
    total_scene_count: exportData?.scene_records.length ?? 0,
    quality_score: auditResult === 'PASS' ? 100 : 0,
  };

  writeImageDatasetQualityReport(projectRoot, report);
  return report;
}
