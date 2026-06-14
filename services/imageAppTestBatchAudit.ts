import fs from 'node:fs';
import path from 'node:path';
import { IMAGE_APP_INPUT_EXPORT_ID, IMAGE_APP_INPUT_EXPORT_JSON_PATH } from './imageAppInputExport.js';
import {
  loadImageAppInputExport,
  type ImageAppInputQualityGateReport,
} from './imageAppInputQualityGate.js';
import {
  buildImageAppTestBatchPackageFromProject,
  findDuplicateBatchPayloadIds,
  getTestBatchSelectionCategories,
  getTestBatchSelectionStoryboardIds,
  IMAGE_APP_TEST_BATCH_ID,
  IMAGE_APP_TEST_BATCH_SCENE_COUNT,
  IMAGE_APP_TEST_BATCH_VERSION,
  REQUIRED_ACTING_CAMERA_BATCH_FIELDS,
  REQUIRED_CONTINUITY_ANCHOR_FIELDS,
  REQUIRED_TEST_BATCH_FIELDS,
  TEST_BATCH_SELECTION_RULES,
  type ImageAppTestBatchPackage,
  type RequiredTestBatchField,
  type TestBatchSelectedPayload,
} from './imageAppTestBatchPackage.js';

export type ImageAppTestBatchAuditResult =
  | 'PASS'
  | 'FAIL_BATCH_COMPLETENESS'
  | 'FAIL_SOURCE_EXPORT'
  | 'FAIL_SCENE_COUNT'
  | 'FAIL_PAYLOAD_REFERENCE'
  | 'FAIL_PROMPT_FIELD'
  | 'FAIL_ACTING_CAMERA_FIELD'
  | 'FAIL_CONTINUITY_ANCHOR'
  | 'FAIL_DUPLICATE_PAYLOAD'
  | 'FAIL_AI_STUDIO_TRIGGERED';

export interface ImageAppTestBatchViolation {
  code: ImageAppTestBatchAuditResult;
  message: string;
  field?: string;
}

export interface ImageAppTestBatchReport {
  auditTimestamp: string;
  auditResult: ImageAppTestBatchAuditResult;
  layer_version: typeof IMAGE_APP_TEST_BATCH_VERSION;
  violations: ImageAppTestBatchViolation[];
}

const PACKAGE_FILE = 'image-app-test-batch-package.json';
const REPORT_FILE = 'image-app-test-batch-report.json';
const QUALITY_GATE_REPORT_FILE = 'image-app-input-quality-gate-report.json';
const EXPORT_REPORT_FILE = 'image-app-input-export-report.json';

const FORBIDDEN_AI_STUDIO_TOKENS = [
  'invoke:ai-studio',
  'call:ai-studio',
  'ai-studio-generate',
  'generate:image',
  'trigger:generation',
  'run:gpu',
  'post:ai-studio',
  'fetch:ai-studio',
] as const;

const ALLOWED_AI_STUDIO_GUARDS = [
  'no-ai-studio-generation',
  'no-ai-studio-no-gpu',
] as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => isNonEmptyString(item))
  );
}

function stripAllowedAiStudioGuards(serialized: string): string {
  let sanitized = serialized;
  for (const guard of ALLOWED_AI_STUDIO_GUARDS) {
    sanitized = sanitized.split(guard).join('');
  }
  return sanitized;
}

function loadQualityGateReport(projectRoot: string): ImageAppInputQualityGateReport | null {
  const reportPath = path.join(projectRoot, 'exports', QUALITY_GATE_REPORT_FILE);
  if (!fs.existsSync(reportPath)) return null;
  return JSON.parse(fs.readFileSync(reportPath, 'utf8')) as ImageAppInputQualityGateReport;
}

function loadExportAuditReport(
  projectRoot: string
): { auditResult: string } | null {
  const reportPath = path.join(projectRoot, 'exports', EXPORT_REPORT_FILE);
  if (!fs.existsSync(reportPath)) return null;
  return JSON.parse(fs.readFileSync(reportPath, 'utf8')) as { auditResult: string };
}

function auditBatchCompleteness(
  batch: ImageAppTestBatchPackage
): ImageAppTestBatchViolation[] {
  const violations: ImageAppTestBatchViolation[] = [];

  for (const field of REQUIRED_TEST_BATCH_FIELDS) {
    const value = batch[field as RequiredTestBatchField];

    if (value === undefined || value === null) {
      violations.push({
        code: 'FAIL_BATCH_COMPLETENESS',
        message: `Missing required batch field ${field}`,
        field,
      });
      continue;
    }

    if (field === 'selected_payloads') {
      if (!Array.isArray(value) || value.length === 0) {
        violations.push({
          code: 'FAIL_BATCH_COMPLETENESS',
          message: 'selected_payloads must be a non-empty array',
          field: 'selected_payloads',
        });
      }
      continue;
    }

    if (field === 'scene_count') {
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        violations.push({
          code: 'FAIL_BATCH_COMPLETENESS',
          message: 'scene_count must be an integer',
          field: 'scene_count',
        });
      }
      continue;
    }

    if (field === 'ai_studio_ready') {
      if (typeof value !== 'boolean') {
        violations.push({
          code: 'FAIL_BATCH_COMPLETENESS',
          message: 'ai_studio_ready must be boolean',
          field: 'ai_studio_ready',
        });
      }
      continue;
    }

    if (!isNonEmptyString(value)) {
      violations.push({
        code: 'FAIL_BATCH_COMPLETENESS',
        message: `Field ${field} must be a non-empty string`,
        field,
      });
    }
  }

  if (batch.batch_id !== IMAGE_APP_TEST_BATCH_ID) {
    violations.push({
      code: 'FAIL_BATCH_COMPLETENESS',
      message: `batch_id must be ${IMAGE_APP_TEST_BATCH_ID}`,
      field: 'batch_id',
    });
  }

  if (!batch.ai_studio_ready) {
    violations.push({
      code: 'FAIL_BATCH_COMPLETENESS',
      message: 'ai_studio_ready must be true for test batch package',
      field: 'ai_studio_ready',
    });
  }

  return violations;
}

function auditSourceExport(
  projectRoot: string,
  batch: ImageAppTestBatchPackage
): ImageAppTestBatchViolation[] {
  const violations: ImageAppTestBatchViolation[] = [];
  const exportDoc = loadImageAppInputExport(projectRoot);

  if (!exportDoc) {
    violations.push({
      code: 'FAIL_SOURCE_EXPORT',
      message: `${IMAGE_APP_INPUT_EXPORT_JSON_PATH} not found`,
      field: IMAGE_APP_INPUT_EXPORT_JSON_PATH,
    });
    return violations;
  }

  if (batch.source_export_id !== IMAGE_APP_INPUT_EXPORT_ID) {
    violations.push({
      code: 'FAIL_SOURCE_EXPORT',
      message: `source_export_id must be ${IMAGE_APP_INPUT_EXPORT_ID}`,
      field: 'source_export_id',
    });
  }

  if (batch.source_export_id !== exportDoc.export_id) {
    violations.push({
      code: 'FAIL_SOURCE_EXPORT',
      message: 'source_export_id must match loaded image-app-input-export.json',
      field: 'source_export_id',
    });
  }

  if (!exportDoc.image_app_ready) {
    violations.push({
      code: 'FAIL_SOURCE_EXPORT',
      message: 'Source export must declare image_app_ready true',
      field: 'image_app_ready',
    });
  }

  const exportReport = loadExportAuditReport(projectRoot);
  if (!exportReport || exportReport.auditResult !== 'PASS') {
    violations.push({
      code: 'FAIL_SOURCE_EXPORT',
      message: 'image-app-input-export audit must PASS before test batch',
      field: EXPORT_REPORT_FILE,
    });
  }

  const qualityGateReport = loadQualityGateReport(projectRoot);
  if (!qualityGateReport || qualityGateReport.auditResult !== 'PASS') {
    violations.push({
      code: 'FAIL_SOURCE_EXPORT',
      message: 'image-app-input-quality-gate must PASS before test batch',
      field: QUALITY_GATE_REPORT_FILE,
    });
  }

  return violations;
}

function auditSceneCount(batch: ImageAppTestBatchPackage): ImageAppTestBatchViolation[] {
  const violations: ImageAppTestBatchViolation[] = [];

  if (batch.scene_count !== IMAGE_APP_TEST_BATCH_SCENE_COUNT) {
    violations.push({
      code: 'FAIL_SCENE_COUNT',
      message: `Test batch must contain exactly ${IMAGE_APP_TEST_BATCH_SCENE_COUNT} scenes`,
      field: 'scene_count',
    });
  }

  if (batch.selected_payloads.length !== IMAGE_APP_TEST_BATCH_SCENE_COUNT) {
    violations.push({
      code: 'FAIL_SCENE_COUNT',
      message: `selected_payloads must contain exactly ${IMAGE_APP_TEST_BATCH_SCENE_COUNT} entries`,
      field: 'selected_payloads.length',
    });
  }

  const expectedCategories = getTestBatchSelectionCategories();
  const presentCategories = batch.selected_payloads.map((payload) => payload.selection_category);
  for (const category of expectedCategories) {
    if (!presentCategories.includes(category)) {
      violations.push({
        code: 'FAIL_SCENE_COUNT',
        message: `Missing selection category ${category}`,
        field: 'selected_payloads',
      });
    }
  }

  return violations;
}

function auditPayloadReference(
  projectRoot: string,
  batch: ImageAppTestBatchPackage
): ImageAppTestBatchViolation[] {
  const violations: ImageAppTestBatchViolation[] = [];
  const exportDoc = loadImageAppInputExport(projectRoot);
  if (!exportDoc) return violations;

  const expectedStoryboardIds = getTestBatchSelectionStoryboardIds();

  for (const storyboardId of expectedStoryboardIds) {
    const exportPayload = exportDoc.image_app_payloads.find(
      (payload) => payload.storyboard_id === storyboardId
    );
    const batchPayload = batch.selected_payloads.find(
      (payload) => payload.storyboard_id === storyboardId
    );

    if (!exportPayload) {
      violations.push({
        code: 'FAIL_PAYLOAD_REFERENCE',
        message: `Source export missing payload for ${storyboardId}`,
        field: storyboardId,
      });
      continue;
    }

    if (!batchPayload) {
      violations.push({
        code: 'FAIL_PAYLOAD_REFERENCE',
        message: `Test batch missing payload for ${storyboardId}`,
        field: storyboardId,
      });
      continue;
    }

    if (batchPayload.payload_id !== exportPayload.payload_id) {
      violations.push({
        code: 'FAIL_PAYLOAD_REFERENCE',
        message: `payload_id must match source export on ${storyboardId}`,
        field: `${batchPayload.payload_id}.payload_id`,
      });
    }

    const rule = TEST_BATCH_SELECTION_RULES.find((entry) => entry.storyboard_id === storyboardId);
    if (rule && batchPayload.selection_category !== rule.category) {
      violations.push({
        code: 'FAIL_PAYLOAD_REFERENCE',
        message: `selection_category must be ${rule.category} on ${storyboardId}`,
        field: `${batchPayload.payload_id}.selection_category`,
      });
    }

    if (rule && batchPayload.selection_reason !== rule.selection_reason) {
      violations.push({
        code: 'FAIL_PAYLOAD_REFERENCE',
        message: `selection_reason must match declared rule on ${storyboardId}`,
        field: `${batchPayload.payload_id}.selection_reason`,
      });
    }
  }

  for (const payload of batch.selected_payloads) {
    const exportPayload = exportDoc.image_app_payloads.find(
      (entry) => entry.payload_id === payload.payload_id
    );
    if (!exportPayload) {
      violations.push({
        code: 'FAIL_PAYLOAD_REFERENCE',
        message: `Unknown payload reference ${payload.payload_id}`,
        field: `${payload.payload_id}`,
      });
    }
  }

  return violations;
}

function auditPromptFields(payload: TestBatchSelectedPayload): ImageAppTestBatchViolation[] {
  const violations: ImageAppTestBatchViolation[] = [];

  if (!isNonEmptyString(payload.image_prompt)) {
    violations.push({
      code: 'FAIL_PROMPT_FIELD',
      message: `image_prompt required on ${payload.payload_id}`,
      field: `${payload.payload_id}.image_prompt`,
    });
  }

  if (!isNonEmptyString(payload.negative_prompt)) {
    violations.push({
      code: 'FAIL_PROMPT_FIELD',
      message: `negative_prompt required on ${payload.payload_id}`,
      field: `${payload.payload_id}.negative_prompt`,
    });
  }

  return violations;
}

function auditActingCameraFields(
  payload: TestBatchSelectedPayload
): ImageAppTestBatchViolation[] {
  const violations: ImageAppTestBatchViolation[] = [];

  for (const field of REQUIRED_ACTING_CAMERA_BATCH_FIELDS) {
    if (!isNonEmptyString(payload[field])) {
      violations.push({
        code: 'FAIL_ACTING_CAMERA_FIELD',
        message: `Missing ${field} on ${payload.payload_id}`,
        field: `${payload.payload_id}.${field}`,
      });
    }
  }

  return violations;
}

function auditContinuityAnchors(payload: TestBatchSelectedPayload): ImageAppTestBatchViolation[] {
  const violations: ImageAppTestBatchViolation[] = [];

  for (const field of REQUIRED_CONTINUITY_ANCHOR_FIELDS) {
    if (!isStringArray(payload[field])) {
      violations.push({
        code: 'FAIL_CONTINUITY_ANCHOR',
        message: `${field} required on ${payload.payload_id}`,
        field: `${payload.payload_id}.${field}`,
      });
    }
  }

  return violations;
}

function auditDuplicatePayload(
  batch: ImageAppTestBatchPackage
): ImageAppTestBatchViolation[] {
  const violations: ImageAppTestBatchViolation[] = [];
  const payloadIds = batch.selected_payloads.map((payload) => payload.payload_id);

  for (const payloadId of findDuplicateBatchPayloadIds(payloadIds)) {
    violations.push({
      code: 'FAIL_DUPLICATE_PAYLOAD',
      message: `Duplicate payload_id in batch: ${payloadId}`,
      field: 'payload_id',
    });
  }

  const storyboardIds = batch.selected_payloads.map((payload) => payload.storyboard_id);
  const duplicateStoryboards = storyboardIds.filter(
    (storyboardId, index) => storyboardIds.indexOf(storyboardId) !== index
  );
  for (const storyboardId of [...new Set(duplicateStoryboards)]) {
    violations.push({
      code: 'FAIL_DUPLICATE_PAYLOAD',
      message: `Duplicate storyboard_id in batch: ${storyboardId}`,
      field: 'storyboard_id',
    });
  }

  const categories = batch.selected_payloads.map((payload) => payload.selection_category);
  const duplicateCategories = categories.filter(
    (category, index) => categories.indexOf(category) !== index
  );
  for (const category of [...new Set(duplicateCategories)]) {
    violations.push({
      code: 'FAIL_DUPLICATE_PAYLOAD',
      message: `Duplicate selection_category in batch: ${category}`,
      field: 'selection_category',
    });
  }

  return violations;
}

function auditAiStudioTriggered(batch: ImageAppTestBatchPackage): ImageAppTestBatchViolation[] {
  const violations: ImageAppTestBatchViolation[] = [];
  const sanitized = stripAllowedAiStudioGuards(JSON.stringify(batch).toLowerCase());

  for (const token of FORBIDDEN_AI_STUDIO_TOKENS) {
    if (sanitized.includes(token)) {
      violations.push({
        code: 'FAIL_AI_STUDIO_TRIGGERED',
        message: `Forbidden AI Studio trigger token "${token}" found in batch`,
        field: 'batch',
      });
    }
  }

  return violations;
}

function primaryFailure(violations: ImageAppTestBatchViolation[]): ImageAppTestBatchAuditResult {
  const priority: ImageAppTestBatchAuditResult[] = [
    'FAIL_BATCH_COMPLETENESS',
    'FAIL_SOURCE_EXPORT',
    'FAIL_AI_STUDIO_TRIGGERED',
    'FAIL_SCENE_COUNT',
    'FAIL_DUPLICATE_PAYLOAD',
    'FAIL_PAYLOAD_REFERENCE',
    'FAIL_PROMPT_FIELD',
    'FAIL_ACTING_CAMERA_FIELD',
    'FAIL_CONTINUITY_ANCHOR',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditImageAppTestBatch(
  projectRoot: string,
  batch: ImageAppTestBatchPackage
): ImageAppTestBatchViolation[] {
  const violations: ImageAppTestBatchViolation[] = [];

  violations.push(...auditBatchCompleteness(batch));
  violations.push(...auditSourceExport(projectRoot, batch));
  violations.push(...auditAiStudioTriggered(batch));
  violations.push(...auditSceneCount(batch));
  violations.push(...auditDuplicatePayload(batch));
  violations.push(...auditPayloadReference(projectRoot, batch));

  for (const payload of batch.selected_payloads) {
    violations.push(...auditPromptFields(payload));
    violations.push(...auditActingCameraFields(payload));
    violations.push(...auditContinuityAnchors(payload));
  }

  return violations;
}

export function writeImageAppTestBatchPackage(
  projectRoot: string,
  batch: ImageAppTestBatchPackage
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const packagePath = path.join(exportsDir, PACKAGE_FILE);
  fs.writeFileSync(packagePath, `${JSON.stringify(batch, null, 2)}\n`, 'utf8');
  return packagePath;
}

export function writeImageAppTestBatchReport(
  projectRoot: string,
  report: ImageAppTestBatchReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runImageAppTestBatchAudit(projectRoot: string): ImageAppTestBatchReport {
  const auditTimestamp = new Date().toISOString();
  const batch = buildImageAppTestBatchPackageFromProject(projectRoot);
  const violations = auditImageAppTestBatch(projectRoot, batch);

  writeImageAppTestBatchPackage(projectRoot, batch);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: ImageAppTestBatchReport = {
    auditTimestamp,
    auditResult,
    layer_version: IMAGE_APP_TEST_BATCH_VERSION,
    violations,
  };

  writeImageAppTestBatchReport(projectRoot, report);
  return report;
}
