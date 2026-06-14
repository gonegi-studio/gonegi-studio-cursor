import fs from 'node:fs';
import path from 'node:path';
import {
  BEHAVIOR_DNA_EMOTION_ROOTS,
  BEHAVIOR_DNA_INTENSITY_MAX,
  BEHAVIOR_DNA_INTENSITY_MIN,
  getBehaviorDnaSeedLibrary,
} from './behaviorDnaDefinitions.js';
import {
  BEHAVIOR_EMOTION_LINKAGE,
  EMOTION_DNA_SCHEMA_PATH,
  EMOTION_DNA_SCHEMA_VERSION,
  EMOTION_DNA_SEED_COUNT,
  EMOTION_DNA_STRING_ARRAY_FIELDS,
  REQUIRED_EMOTION_DNA_FIELDS,
  SEED_EMOTION_DNA_IDS,
  buildEmotionDnaSchemaPreview,
  emotionRootsMatchBehaviorLayer,
  findDuplicateEmotionIds,
  getEmotionDnaSeedLibrary,
  getExpectedBehaviorForEmotion,
  isValidBehaviorAffinityId,
  isValidEmotionId,
  isValidEmotionKeyword,
  isValidEmotionTaxonomyToken,
  type EmotionDnaEntry,
  type EmotionDnaSchemaPreview,
  type RequiredEmotionDnaField,
  type SeedEmotionDnaId,
} from './emotionDnaDefinitions.js';
import { getTransitionDnaLibrary } from './transitionDnaContractDefinitions.js';

export type EmotionDnaSchemaAuditResult =
  | 'PASS'
  | 'FAIL_SCHEMA_COMPLETENESS'
  | 'FAIL_REQUIRED_FIELD'
  | 'FAIL_DUPLICATE_ID'
  | 'FAIL_BEHAVIOR_LINKAGE'
  | 'FAIL_INTENSITY_RANGE'
  | 'FAIL_AFFINITY_INTEGRITY'
  | 'FAIL_KEYWORD_INTEGRITY';

export interface EmotionDnaSchemaViolation {
  code: EmotionDnaSchemaAuditResult;
  message: string;
  field?: string;
}

export interface EmotionDnaSchemaReport {
  auditTimestamp: string;
  auditResult: EmotionDnaSchemaAuditResult;
  violations: EmotionDnaSchemaViolation[];
}

interface JsonSchemaProperty {
  type?: string;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  required?: string[];
  properties?: Record<string, JsonSchemaProperty>;
  items?: { type?: string; minLength?: number; pattern?: string };
  pattern?: string;
  minLength?: number;
}

interface EmotionDnaJsonSchema {
  required?: string[];
  properties?: Record<string, JsonSchemaProperty>;
}

const PREVIEW_FILE = 'emotion-dna-schema-preview.json';
const REPORT_FILE = 'emotion-dna-schema-report.json';

const VALID_TRANSITION_IDS = new Set(
  getTransitionDnaLibrary().map((entry) => entry.transition_id)
);

function loadEmotionDnaJsonSchema(projectRoot: string): EmotionDnaJsonSchema | null {
  const schemaPath = path.join(projectRoot, EMOTION_DNA_SCHEMA_PATH);
  if (!fs.existsSync(schemaPath)) return null;
  return JSON.parse(fs.readFileSync(schemaPath, 'utf8')) as EmotionDnaJsonSchema;
}

function auditSchemaCompleteness(
  schema: EmotionDnaJsonSchema | null
): EmotionDnaSchemaViolation[] {
  const violations: EmotionDnaSchemaViolation[] = [];

  if (!schema) {
    violations.push({
      code: 'FAIL_SCHEMA_COMPLETENESS',
      message: 'Emotion DNA schema file not found',
      field: EMOTION_DNA_SCHEMA_PATH,
    });
    return violations;
  }

  if (!schema.required || !schema.properties) {
    violations.push({
      code: 'FAIL_SCHEMA_COMPLETENESS',
      message: 'Emotion DNA schema missing required or properties sections',
      field: EMOTION_DNA_SCHEMA_PATH,
    });
    return violations;
  }

  for (const field of REQUIRED_EMOTION_DNA_FIELDS) {
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

  const intensityRangeProperty = schema.properties.intensity_range;
  const minProperty = intensityRangeProperty?.properties?.min;
  const maxProperty = intensityRangeProperty?.properties?.max;

  if (
    intensityRangeProperty?.type !== 'object' ||
    !intensityRangeProperty.required?.includes('min') ||
    !intensityRangeProperty.required?.includes('max') ||
    minProperty?.minimum !== BEHAVIOR_DNA_INTENSITY_MIN ||
    maxProperty?.maximum !== BEHAVIOR_DNA_INTENSITY_MAX
  ) {
    violations.push({
      code: 'FAIL_SCHEMA_COMPLETENESS',
      message: 'Schema intensity_range constraints incomplete',
      field: 'properties.intensity_range',
    });
  }

  for (const field of EMOTION_DNA_STRING_ARRAY_FIELDS) {
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

function auditRequiredFieldIntegrity(entries: EmotionDnaEntry[]): EmotionDnaSchemaViolation[] {
  const violations: EmotionDnaSchemaViolation[] = [];

  if (entries.length !== EMOTION_DNA_SEED_COUNT) {
    violations.push({
      code: 'FAIL_REQUIRED_FIELD',
      message: `Seed library must contain exactly ${EMOTION_DNA_SEED_COUNT} emotions`,
      field: 'seed_emotions.length',
    });
  }

  for (const entry of entries) {
    for (const field of REQUIRED_EMOTION_DNA_FIELDS) {
      const value = entry[field as RequiredEmotionDnaField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_REQUIRED_FIELD',
          message: `Missing required field ${field} on emotion ${entry.emotion_id}`,
          field: `${entry.emotion_id}.${field}`,
        });
        continue;
      }

      if (field === 'intensity_range') {
        if (
          typeof value !== 'object' ||
          value === null ||
          typeof (value as { min?: unknown }).min !== 'number' ||
          typeof (value as { max?: unknown }).max !== 'number'
        ) {
          violations.push({
            code: 'FAIL_REQUIRED_FIELD',
            message: `Field intensity_range must be an object with min/max on emotion ${entry.emotion_id}`,
            field: `${entry.emotion_id}.intensity_range`,
          });
        }
        continue;
      }

      if (field === 'keywords' || EMOTION_DNA_STRING_ARRAY_FIELDS.includes(field as never)) {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_REQUIRED_FIELD',
            message: `Field ${field} must be a non-empty string array on emotion ${entry.emotion_id}`,
            field: `${entry.emotion_id}.${field}`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_REQUIRED_FIELD',
          message: `Field ${field} must be a non-empty string on emotion ${entry.emotion_id}`,
          field: `${entry.emotion_id}.${field}`,
        });
      }
    }

    if (!isValidEmotionId(entry.emotion_id)) {
      violations.push({
        code: 'FAIL_REQUIRED_FIELD',
        message: `Invalid emotion_id format or seed scope: ${entry.emotion_id}`,
        field: `${entry.emotion_id}.emotion_id`,
      });
    }

    if (!isValidEmotionTaxonomyToken(entry.emotion_family)) {
      violations.push({
        code: 'FAIL_REQUIRED_FIELD',
        message: `Invalid emotion_family token on emotion ${entry.emotion_id}`,
        field: `${entry.emotion_id}.emotion_family`,
      });
    }

    if (!isValidEmotionTaxonomyToken(entry.emotional_temperature)) {
      violations.push({
        code: 'FAIL_REQUIRED_FIELD',
        message: `Invalid emotional_temperature token on emotion ${entry.emotion_id}`,
        field: `${entry.emotion_id}.emotional_temperature`,
      });
    }

    if (!isValidEmotionTaxonomyToken(entry.emotional_direction)) {
      violations.push({
        code: 'FAIL_REQUIRED_FIELD',
        message: `Invalid emotional_direction token on emotion ${entry.emotion_id}`,
        field: `${entry.emotion_id}.emotional_direction`,
      });
    }
  }

  const seedIdSet = new Set(SEED_EMOTION_DNA_IDS);
  for (const entry of entries) {
    if (!seedIdSet.has(entry.emotion_id)) {
      violations.push({
        code: 'FAIL_REQUIRED_FIELD',
        message: `Unexpected seed emotion_id: ${entry.emotion_id}`,
        field: `${entry.emotion_id}.emotion_id`,
      });
    }
  }

  return violations;
}

function auditDuplicateEmotionIds(entries: EmotionDnaEntry[]): EmotionDnaSchemaViolation[] {
  const duplicates = findDuplicateEmotionIds(entries.map((entry) => entry.emotion_id));
  return duplicates.map((id) => ({
    code: 'FAIL_DUPLICATE_ID',
    message: `Duplicate emotion_id detected: ${id}`,
    field: 'emotion_id',
  }));
}

function auditBehaviorEmotionLinkage(entries: EmotionDnaEntry[]): EmotionDnaSchemaViolation[] {
  const violations: EmotionDnaSchemaViolation[] = [];
  const behaviorLibrary = getBehaviorDnaSeedLibrary();
  const emotionIds = new Set(entries.map((entry) => entry.emotion_id));

  for (const emotionRoot of BEHAVIOR_DNA_EMOTION_ROOTS) {
    if (!emotionIds.has(emotionRoot)) {
      violations.push({
        code: 'FAIL_BEHAVIOR_LINKAGE',
        message: `Behavior DNA emotion_root "${emotionRoot}" has no matching Emotion DNA entry`,
        field: `emotion_id.${emotionRoot}`,
      });
    }
  }

  for (const behavior of behaviorLibrary) {
    if (!emotionIds.has(behavior.emotion_root)) {
      violations.push({
        code: 'FAIL_BEHAVIOR_LINKAGE',
        message: `Behavior ${behavior.behavior_id} emotion_root "${behavior.emotion_root}" not found in Emotion DNA`,
        field: `${behavior.behavior_id}.emotion_root`,
      });
      continue;
    }

    const expectedEmotion = BEHAVIOR_EMOTION_LINKAGE[behavior.behavior_id];
    if (behavior.emotion_root !== expectedEmotion) {
      violations.push({
        code: 'FAIL_BEHAVIOR_LINKAGE',
        message: `Behavior ${behavior.behavior_id} emotion_root drift from canonical linkage`,
        field: `${behavior.behavior_id}.emotion_root`,
      });
    }
  }

  for (const entry of entries) {
    if (!emotionRootsMatchBehaviorLayer(entry.emotion_id)) {
      violations.push({
        code: 'FAIL_BEHAVIOR_LINKAGE',
        message: `Emotion ${entry.emotion_id} is outside Behavior DNA emotion_root registry`,
        field: `${entry.emotion_id}.emotion_id`,
      });
    }

    const expectedBehavior = getExpectedBehaviorForEmotion(entry.emotion_id as SeedEmotionDnaId);
    if (!entry.behavior_affinity.includes(expectedBehavior)) {
      violations.push({
        code: 'FAIL_BEHAVIOR_LINKAGE',
        message: `Emotion ${entry.emotion_id} missing canonical behavior_affinity: ${expectedBehavior}`,
        field: `${entry.emotion_id}.behavior_affinity`,
      });
    }

    for (const behaviorId of entry.behavior_affinity) {
      const linkedBehavior = behaviorLibrary.find((item) => item.behavior_id === behaviorId);
      if (!linkedBehavior) {
        violations.push({
          code: 'FAIL_BEHAVIOR_LINKAGE',
          message: `Emotion ${entry.emotion_id} references unknown behavior: ${behaviorId}`,
          field: `${entry.emotion_id}.behavior_affinity`,
        });
        continue;
      }

      if (linkedBehavior.emotion_root !== entry.emotion_id) {
        violations.push({
          code: 'FAIL_BEHAVIOR_LINKAGE',
          message: `Behavior ${behaviorId} emotion_root does not match emotion ${entry.emotion_id}`,
          field: `${entry.emotion_id}.behavior_affinity`,
        });
      }
    }
  }

  return violations;
}

function auditIntensityRange(entries: EmotionDnaEntry[]): EmotionDnaSchemaViolation[] {
  const violations: EmotionDnaSchemaViolation[] = [];

  for (const entry of entries) {
    const { min, max } = entry.intensity_range;

    if (
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min < BEHAVIOR_DNA_INTENSITY_MIN ||
      max > BEHAVIOR_DNA_INTENSITY_MAX
    ) {
      violations.push({
        code: 'FAIL_INTENSITY_RANGE',
        message: `intensity_range bounds invalid on emotion ${entry.emotion_id}`,
        field: `${entry.emotion_id}.intensity_range`,
      });
      continue;
    }

    if (min > max) {
      violations.push({
        code: 'FAIL_INTENSITY_RANGE',
        message: `intensity_range min exceeds max on emotion ${entry.emotion_id}`,
        field: `${entry.emotion_id}.intensity_range`,
      });
    }
  }

  return violations;
}

function auditAffinityIntegrity(entries: EmotionDnaEntry[]): EmotionDnaSchemaViolation[] {
  const violations: EmotionDnaSchemaViolation[] = [];

  for (const entry of entries) {
    for (const behaviorId of entry.behavior_affinity) {
      if (!isValidBehaviorAffinityId(behaviorId)) {
        violations.push({
          code: 'FAIL_AFFINITY_INTEGRITY',
          message: `Invalid behavior_affinity id "${behaviorId}" on emotion ${entry.emotion_id}`,
          field: `${entry.emotion_id}.behavior_affinity`,
        });
      }
    }

    for (const transitionId of entry.transition_affinity) {
      if (!VALID_TRANSITION_IDS.has(transitionId)) {
        violations.push({
          code: 'FAIL_AFFINITY_INTEGRITY',
          message: `Unknown transition_affinity "${transitionId}" on emotion ${entry.emotion_id}`,
          field: `${entry.emotion_id}.transition_affinity`,
        });
      }
    }

    const affinityFields = [
      'relationship_affinity',
      'music_affinity',
      'camera_affinity',
    ] as const;

    for (const field of affinityFields) {
      const values = entry[field];
      const seen = new Set<string>();
      for (const token of values) {
        if (!isNonEmptyString(token)) {
          violations.push({
            code: 'FAIL_AFFINITY_INTEGRITY',
            message: `Empty ${field} token on emotion ${entry.emotion_id}`,
            field: `${entry.emotion_id}.${field}`,
          });
        }
        if (seen.has(token)) {
          violations.push({
            code: 'FAIL_AFFINITY_INTEGRITY',
            message: `Duplicate ${field} token "${token}" on emotion ${entry.emotion_id}`,
            field: `${entry.emotion_id}.${field}`,
          });
        }
        seen.add(token);
      }
    }
  }

  return violations;
}

function auditKeywordIntegrity(entries: EmotionDnaEntry[]): EmotionDnaSchemaViolation[] {
  const violations: EmotionDnaSchemaViolation[] = [];

  for (const entry of entries) {
    if (!Array.isArray(entry.keywords) || entry.keywords.length === 0) {
      violations.push({
        code: 'FAIL_KEYWORD_INTEGRITY',
        message: `keywords must be non-empty on emotion ${entry.emotion_id}`,
        field: `${entry.emotion_id}.keywords`,
      });
      continue;
    }

    const seen = new Set<string>();
    for (const keyword of entry.keywords) {
      if (!isValidEmotionKeyword(keyword)) {
        violations.push({
          code: 'FAIL_KEYWORD_INTEGRITY',
          message: `Invalid keyword "${keyword}" on emotion ${entry.emotion_id}`,
          field: `${entry.emotion_id}.keywords`,
        });
      }

      if (seen.has(keyword)) {
        violations.push({
          code: 'FAIL_KEYWORD_INTEGRITY',
          message: `Duplicate keyword "${keyword}" on emotion ${entry.emotion_id}`,
          field: `${entry.emotion_id}.keywords`,
        });
      }
      seen.add(keyword);
    }
  }

  return violations;
}

function primaryFailure(
  violations: EmotionDnaSchemaViolation[]
): EmotionDnaSchemaAuditResult {
  const priority: EmotionDnaSchemaAuditResult[] = [
    'FAIL_SCHEMA_COMPLETENESS',
    'FAIL_REQUIRED_FIELD',
    'FAIL_DUPLICATE_ID',
    'FAIL_BEHAVIOR_LINKAGE',
    'FAIL_INTENSITY_RANGE',
    'FAIL_AFFINITY_INTEGRITY',
    'FAIL_KEYWORD_INTEGRITY',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditEmotionDnaSchema(projectRoot: string): EmotionDnaSchemaViolation[] {
  const schema = loadEmotionDnaJsonSchema(projectRoot);
  const entries = getEmotionDnaSeedLibrary();
  const violations: EmotionDnaSchemaViolation[] = [];

  violations.push(...auditSchemaCompleteness(schema));
  violations.push(...auditRequiredFieldIntegrity(entries));
  violations.push(...auditDuplicateEmotionIds(entries));
  violations.push(...auditBehaviorEmotionLinkage(entries));
  violations.push(...auditIntensityRange(entries));
  violations.push(...auditAffinityIntegrity(entries));
  violations.push(...auditKeywordIntegrity(entries));

  return violations;
}

export function writeEmotionDnaSchemaPreview(
  projectRoot: string,
  preview: EmotionDnaSchemaPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeEmotionDnaSchemaReport(
  projectRoot: string,
  report: EmotionDnaSchemaReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runEmotionDnaSchemaAudit(projectRoot: string): EmotionDnaSchemaReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditEmotionDnaSchema(projectRoot);

  const preview = buildEmotionDnaSchemaPreview();
  if (preview.schema_version !== EMOTION_DNA_SCHEMA_VERSION) {
    violations.push({
      code: 'FAIL_SCHEMA_COMPLETENESS',
      message: 'Preview schema_version mismatch',
      field: 'schema_version',
    });
  }

  writeEmotionDnaSchemaPreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: EmotionDnaSchemaReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeEmotionDnaSchemaReport(projectRoot, report);
  return report;
}
