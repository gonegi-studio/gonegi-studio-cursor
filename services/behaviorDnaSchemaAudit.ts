import fs from 'node:fs';
import path from 'node:path';
import {
  BEHAVIOR_DNA_INTENSITY_MAX,
  BEHAVIOR_DNA_INTENSITY_MIN,
  BEHAVIOR_DNA_SCHEMA_PATH,
  BEHAVIOR_DNA_SCHEMA_VERSION,
  BEHAVIOR_DNA_SEED_COUNT,
  BEHAVIOR_DNA_STRING_ARRAY_FIELDS,
  REQUIRED_BEHAVIOR_DNA_FIELDS,
  SEED_BEHAVIOR_DNA_IDS,
  buildBehaviorDnaSchemaPreview,
  findDuplicateBehaviorIds,
  getBehaviorDnaSeedLibrary,
  isValidBehaviorDnaEmotionRoot,
  isValidBehaviorId,
  isValidBehaviorKeyword,
  type BehaviorDnaEntry,
  type BehaviorDnaSchemaPreview,
  type RequiredBehaviorDnaField,
} from './behaviorDnaDefinitions.js';

export type BehaviorDnaSchemaAuditResult =
  | 'PASS'
  | 'FAIL_SCHEMA_COMPLETENESS'
  | 'FAIL_REQUIRED_FIELD'
  | 'FAIL_DUPLICATE_ID'
  | 'FAIL_EMOTION_LINKAGE'
  | 'FAIL_INTENSITY_RANGE'
  | 'FAIL_KEYWORD_INTEGRITY';

export interface BehaviorDnaSchemaViolation {
  code: BehaviorDnaSchemaAuditResult;
  message: string;
  field?: string;
}

export interface BehaviorDnaSchemaReport {
  auditTimestamp: string;
  auditResult: BehaviorDnaSchemaAuditResult;
  violations: BehaviorDnaSchemaViolation[];
}

interface JsonSchemaProperty {
  type?: string;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  items?: { type?: string; minLength?: number; pattern?: string };
  pattern?: string;
  minLength?: number;
}

interface BehaviorDnaJsonSchema {
  required?: string[];
  properties?: Record<string, JsonSchemaProperty>;
}

const PREVIEW_FILE = 'behavior-dna-schema-preview.json';
const REPORT_FILE = 'behavior-dna-schema-report.json';

function loadBehaviorDnaJsonSchema(projectRoot: string): BehaviorDnaJsonSchema | null {
  const schemaPath = path.join(projectRoot, BEHAVIOR_DNA_SCHEMA_PATH);
  if (!fs.existsSync(schemaPath)) return null;
  return JSON.parse(fs.readFileSync(schemaPath, 'utf8')) as BehaviorDnaJsonSchema;
}

function auditSchemaCompleteness(
  projectRoot: string,
  schema: BehaviorDnaJsonSchema | null
): BehaviorDnaSchemaViolation[] {
  const violations: BehaviorDnaSchemaViolation[] = [];

  if (!schema) {
    violations.push({
      code: 'FAIL_SCHEMA_COMPLETENESS',
      message: 'Behavior DNA schema file not found',
      field: BEHAVIOR_DNA_SCHEMA_PATH,
    });
    return violations;
  }

  if (!schema.required || !schema.properties) {
    violations.push({
      code: 'FAIL_SCHEMA_COMPLETENESS',
      message: 'Behavior DNA schema missing required or properties sections',
      field: BEHAVIOR_DNA_SCHEMA_PATH,
    });
    return violations;
  }

  for (const field of REQUIRED_BEHAVIOR_DNA_FIELDS) {
    if (!schema.required.includes(field)) {
      violations.push({
        code: 'FAIL_SCHEMA_COMPLETENESS',
        message: `Schema required array missing field: ${field}`,
        field: `required.${field}`,
      });
    }

    if (!schema.properties[field]) {
      violations.push({
        code: 'FAIL_SCHEMA_COMPLETENESS',
        message: `Schema properties missing field: ${field}`,
        field: `properties.${field}`,
      });
    }
  }

  const intensityProperty = schema.properties.intensity_level;
  if (
    intensityProperty?.type !== 'integer' ||
    intensityProperty.minimum !== BEHAVIOR_DNA_INTENSITY_MIN ||
    intensityProperty.maximum !== BEHAVIOR_DNA_INTENSITY_MAX
  ) {
    violations.push({
      code: 'FAIL_SCHEMA_COMPLETENESS',
      message: 'Schema intensity_level constraints incomplete',
      field: 'properties.intensity_level',
    });
  }

  for (const field of BEHAVIOR_DNA_STRING_ARRAY_FIELDS) {
    const property = schema.properties[field];
    if (property?.type !== 'array' || property.minItems !== 1) {
      violations.push({
        code: 'FAIL_SCHEMA_COMPLETENESS',
        message: `Schema array field incomplete: ${field}`,
        field: `properties.${field}`,
      });
    }
  }

  return violations;
}

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

function auditRequiredFieldIntegrity(
  entries: BehaviorDnaEntry[]
): BehaviorDnaSchemaViolation[] {
  const violations: BehaviorDnaSchemaViolation[] = [];

  if (entries.length !== BEHAVIOR_DNA_SEED_COUNT) {
    violations.push({
      code: 'FAIL_REQUIRED_FIELD',
      message: `Seed library must contain exactly ${BEHAVIOR_DNA_SEED_COUNT} behaviors`,
      field: 'seed_behaviors.length',
    });
  }

  for (const entry of entries) {
    for (const field of REQUIRED_BEHAVIOR_DNA_FIELDS) {
      const value = entry[field as RequiredBehaviorDnaField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_REQUIRED_FIELD',
          message: `Missing required field ${field} on behavior ${entry.behavior_id}`,
          field: `${entry.behavior_id}.${field}`,
        });
        continue;
      }

      if (field === 'intensity_level') {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          violations.push({
            code: 'FAIL_REQUIRED_FIELD',
            message: `Field intensity_level must be integer on behavior ${entry.behavior_id}`,
            field: `${entry.behavior_id}.intensity_level`,
          });
        }
        continue;
      }

      if (field === 'keywords' || BEHAVIOR_DNA_STRING_ARRAY_FIELDS.includes(field as never)) {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_REQUIRED_FIELD',
            message: `Field ${field} must be a non-empty string array on behavior ${entry.behavior_id}`,
            field: `${entry.behavior_id}.${field}`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_REQUIRED_FIELD',
          message: `Field ${field} must be a non-empty string on behavior ${entry.behavior_id}`,
          field: `${entry.behavior_id}.${field}`,
        });
      }
    }

    if (!isValidBehaviorId(entry.behavior_id)) {
      violations.push({
        code: 'FAIL_REQUIRED_FIELD',
        message: `Invalid behavior_id format: ${entry.behavior_id}`,
        field: `${entry.behavior_id}.behavior_id`,
      });
    }
  }

  const seedIdSet = new Set(SEED_BEHAVIOR_DNA_IDS);
  for (const entry of entries) {
    if (!seedIdSet.has(entry.behavior_id)) {
      violations.push({
        code: 'FAIL_REQUIRED_FIELD',
        message: `Unexpected seed behavior_id: ${entry.behavior_id}`,
        field: `${entry.behavior_id}.behavior_id`,
      });
    }
  }

  return violations;
}

function auditDuplicateBehaviorIds(entries: BehaviorDnaEntry[]): BehaviorDnaSchemaViolation[] {
  const duplicates = findDuplicateBehaviorIds(entries.map((entry) => entry.behavior_id));
  return duplicates.map((id) => ({
    code: 'FAIL_DUPLICATE_ID',
    message: `Duplicate behavior_id detected: ${id}`,
    field: 'behavior_id',
  }));
}

function auditEmotionRootLinkage(entries: BehaviorDnaEntry[]): BehaviorDnaSchemaViolation[] {
  const violations: BehaviorDnaSchemaViolation[] = [];

  for (const entry of entries) {
    if (!isValidBehaviorDnaEmotionRoot(entry.emotion_root)) {
      violations.push({
        code: 'FAIL_EMOTION_LINKAGE',
        message: `Unknown emotion_root "${entry.emotion_root}" on behavior ${entry.behavior_id}`,
        field: `${entry.behavior_id}.emotion_root`,
      });
    }
  }

  return violations;
}

function auditIntensityRange(entries: BehaviorDnaEntry[]): BehaviorDnaSchemaViolation[] {
  const violations: BehaviorDnaSchemaViolation[] = [];

  for (const entry of entries) {
    if (
      entry.intensity_level < BEHAVIOR_DNA_INTENSITY_MIN ||
      entry.intensity_level > BEHAVIOR_DNA_INTENSITY_MAX
    ) {
      violations.push({
        code: 'FAIL_INTENSITY_RANGE',
        message: `intensity_level ${entry.intensity_level} out of range on behavior ${entry.behavior_id}`,
        field: `${entry.behavior_id}.intensity_level`,
      });
    }
  }

  return violations;
}

function auditKeywordIntegrity(entries: BehaviorDnaEntry[]): BehaviorDnaSchemaViolation[] {
  const violations: BehaviorDnaSchemaViolation[] = [];

  for (const entry of entries) {
    if (!Array.isArray(entry.keywords) || entry.keywords.length === 0) {
      violations.push({
        code: 'FAIL_KEYWORD_INTEGRITY',
        message: `keywords must be non-empty on behavior ${entry.behavior_id}`,
        field: `${entry.behavior_id}.keywords`,
      });
      continue;
    }

    const seen = new Set<string>();
    for (const keyword of entry.keywords) {
      if (!isValidBehaviorKeyword(keyword)) {
        violations.push({
          code: 'FAIL_KEYWORD_INTEGRITY',
          message: `Invalid keyword "${keyword}" on behavior ${entry.behavior_id}`,
          field: `${entry.behavior_id}.keywords`,
        });
      }

      if (seen.has(keyword)) {
        violations.push({
          code: 'FAIL_KEYWORD_INTEGRITY',
          message: `Duplicate keyword "${keyword}" on behavior ${entry.behavior_id}`,
          field: `${entry.behavior_id}.keywords`,
        });
      }
      seen.add(keyword);
    }
  }

  return violations;
}

function primaryFailure(
  violations: BehaviorDnaSchemaViolation[]
): BehaviorDnaSchemaAuditResult {
  const priority: BehaviorDnaSchemaAuditResult[] = [
    'FAIL_SCHEMA_COMPLETENESS',
    'FAIL_REQUIRED_FIELD',
    'FAIL_DUPLICATE_ID',
    'FAIL_EMOTION_LINKAGE',
    'FAIL_INTENSITY_RANGE',
    'FAIL_KEYWORD_INTEGRITY',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditBehaviorDnaSchema(projectRoot: string): BehaviorDnaSchemaViolation[] {
  const schema = loadBehaviorDnaJsonSchema(projectRoot);
  const entries = getBehaviorDnaSeedLibrary();
  const violations: BehaviorDnaSchemaViolation[] = [];

  violations.push(...auditSchemaCompleteness(projectRoot, schema));
  violations.push(...auditRequiredFieldIntegrity(entries));
  violations.push(...auditDuplicateBehaviorIds(entries));
  violations.push(...auditEmotionRootLinkage(entries));
  violations.push(...auditIntensityRange(entries));
  violations.push(...auditKeywordIntegrity(entries));

  return violations;
}

export function writeBehaviorDnaSchemaPreview(
  projectRoot: string,
  preview: BehaviorDnaSchemaPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeBehaviorDnaSchemaReport(
  projectRoot: string,
  report: BehaviorDnaSchemaReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runBehaviorDnaSchemaAudit(projectRoot: string): BehaviorDnaSchemaReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditBehaviorDnaSchema(projectRoot);

  const preview = buildBehaviorDnaSchemaPreview();
  if (preview.schema_version !== BEHAVIOR_DNA_SCHEMA_VERSION) {
    violations.push({
      code: 'FAIL_SCHEMA_COMPLETENESS',
      message: 'Preview schema_version mismatch',
      field: 'schema_version',
    });
  }

  writeBehaviorDnaSchemaPreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: BehaviorDnaSchemaReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeBehaviorDnaSchemaReport(projectRoot, report);
  return report;
}
