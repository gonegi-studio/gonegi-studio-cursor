import fs from 'node:fs';
import path from 'node:path';
import { getBehaviorDnaSeedLibrary } from './behaviorDnaDefinitions.js';
import { getEmotionDnaSeedLibrary } from './emotionDnaDefinitions.js';
import {
  BEHAVIOR_EMOTION_LINKAGE,
  RELATIONSHIP_DNA_PATTERN_FIELDS,
  RELATIONSHIP_DNA_SCHEMA_PATH,
  RELATIONSHIP_DNA_SCHEMA_VERSION,
  RELATIONSHIP_DNA_SEED_COUNT,
  RELATIONSHIP_DNA_TENSION_MAX,
  RELATIONSHIP_DNA_TENSION_MIN,
  RELATIONSHIP_DNA_TRUST_MAX,
  RELATIONSHIP_DNA_TRUST_MIN,
  REQUIRED_RELATIONSHIP_DNA_FIELDS,
  SEED_RELATIONSHIP_DNA_IDS,
  buildRelationshipDnaSchemaPreview,
  findDuplicateRelationshipIds,
  getLinkedEmotionForBehavior,
  getRelationshipDnaSeedLibrary,
  isValidPrimaryBehaviorId,
  isValidPrimaryEmotionId,
  isValidRelationshipId,
  isValidRelationshipKeyword,
  isValidRelationshipTaxonomyToken,
  type RelationshipDnaEntry,
  type RelationshipDnaSchemaPreview,
  type RequiredRelationshipDnaField,
} from './relationshipDnaDefinitions.js';
import { getTransitionDnaLibrary } from './transitionDnaContractDefinitions.js';

export type RelationshipDnaSchemaAuditResult =
  | 'PASS'
  | 'FAIL_SCHEMA_COMPLETENESS'
  | 'FAIL_REQUIRED_FIELD'
  | 'FAIL_DUPLICATE_ID'
  | 'FAIL_EMOTION_LINKAGE'
  | 'FAIL_BEHAVIOR_LINKAGE'
  | 'FAIL_RELATIONSHIP_RANGE'
  | 'FAIL_PATTERN_INTEGRITY'
  | 'FAIL_KEYWORD_INTEGRITY';

export interface RelationshipDnaSchemaViolation {
  code: RelationshipDnaSchemaAuditResult;
  message: string;
  field?: string;
}

export interface RelationshipDnaSchemaReport {
  auditTimestamp: string;
  auditResult: RelationshipDnaSchemaAuditResult;
  violations: RelationshipDnaSchemaViolation[];
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

interface RelationshipDnaJsonSchema {
  required?: string[];
  properties?: Record<string, JsonSchemaProperty>;
}

const PREVIEW_FILE = 'relationship-dna-schema-preview.json';
const REPORT_FILE = 'relationship-dna-schema-report.json';

const VALID_TRANSITION_IDS = new Set(
  getTransitionDnaLibrary().map((entry) => entry.transition_id)
);

function loadRelationshipDnaJsonSchema(projectRoot: string): RelationshipDnaJsonSchema | null {
  const schemaPath = path.join(projectRoot, RELATIONSHIP_DNA_SCHEMA_PATH);
  if (!fs.existsSync(schemaPath)) return null;
  return JSON.parse(fs.readFileSync(schemaPath, 'utf8')) as RelationshipDnaJsonSchema;
}

function auditSchemaCompleteness(
  schema: RelationshipDnaJsonSchema | null
): RelationshipDnaSchemaViolation[] {
  const violations: RelationshipDnaSchemaViolation[] = [];

  if (!schema) {
    violations.push({
      code: 'FAIL_SCHEMA_COMPLETENESS',
      message: 'Relationship DNA schema file not found',
      field: RELATIONSHIP_DNA_SCHEMA_PATH,
    });
    return violations;
  }

  if (!schema.required || !schema.properties) {
    violations.push({
      code: 'FAIL_SCHEMA_COMPLETENESS',
      message: 'Relationship DNA schema missing required or properties sections',
      field: RELATIONSHIP_DNA_SCHEMA_PATH,
    });
    return violations;
  }

  for (const field of REQUIRED_RELATIONSHIP_DNA_FIELDS) {
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

  const tensionProperty = schema.properties.tension_level;
  const trustProperty = schema.properties.trust_level;

  if (
    tensionProperty?.type !== 'integer' ||
    tensionProperty.minimum !== RELATIONSHIP_DNA_TENSION_MIN ||
    tensionProperty.maximum !== RELATIONSHIP_DNA_TENSION_MAX
  ) {
    violations.push({
      code: 'FAIL_SCHEMA_COMPLETENESS',
      message: 'Schema tension_level constraints incomplete',
      field: 'properties.tension_level',
    });
  }

  if (
    trustProperty?.type !== 'integer' ||
    trustProperty.minimum !== RELATIONSHIP_DNA_TRUST_MIN ||
    trustProperty.maximum !== RELATIONSHIP_DNA_TRUST_MAX
  ) {
    violations.push({
      code: 'FAIL_SCHEMA_COMPLETENESS',
      message: 'Schema trust_level constraints incomplete',
      field: 'properties.trust_level',
    });
  }

  for (const field of RELATIONSHIP_DNA_PATTERN_FIELDS) {
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
  entries: RelationshipDnaEntry[]
): RelationshipDnaSchemaViolation[] {
  const violations: RelationshipDnaSchemaViolation[] = [];

  if (entries.length !== RELATIONSHIP_DNA_SEED_COUNT) {
    violations.push({
      code: 'FAIL_REQUIRED_FIELD',
      message: `Seed library must contain exactly ${RELATIONSHIP_DNA_SEED_COUNT} relationships`,
      field: 'seed_relationships.length',
    });
  }

  for (const entry of entries) {
    for (const field of REQUIRED_RELATIONSHIP_DNA_FIELDS) {
      const value = entry[field as RequiredRelationshipDnaField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_REQUIRED_FIELD',
          message: `Missing required field ${field} on relationship ${entry.relationship_id}`,
          field: `${entry.relationship_id}.${field}`,
        });
        continue;
      }

      if (field === 'tension_level' || field === 'trust_level') {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          violations.push({
            code: 'FAIL_REQUIRED_FIELD',
            message: `Field ${field} must be integer on relationship ${entry.relationship_id}`,
            field: `${entry.relationship_id}.${field}`,
          });
        }
        continue;
      }

      if (
        field === 'keywords' ||
        field === 'primary_emotions' ||
        field === 'primary_behaviors' ||
        RELATIONSHIP_DNA_PATTERN_FIELDS.includes(field as never)
      ) {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_REQUIRED_FIELD',
            message: `Field ${field} must be a non-empty string array on relationship ${entry.relationship_id}`,
            field: `${entry.relationship_id}.${field}`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_REQUIRED_FIELD',
          message: `Field ${field} must be a non-empty string on relationship ${entry.relationship_id}`,
          field: `${entry.relationship_id}.${field}`,
        });
      }
    }

    if (!isValidRelationshipId(entry.relationship_id)) {
      violations.push({
        code: 'FAIL_REQUIRED_FIELD',
        message: `Invalid relationship_id: ${entry.relationship_id}`,
        field: `${entry.relationship_id}.relationship_id`,
      });
    }

    if (!isValidRelationshipTaxonomyToken(entry.relationship_type)) {
      violations.push({
        code: 'FAIL_REQUIRED_FIELD',
        message: `Invalid relationship_type on relationship ${entry.relationship_id}`,
        field: `${entry.relationship_id}.relationship_type`,
      });
    }
  }

  const seedIdSet = new Set(SEED_RELATIONSHIP_DNA_IDS);
  for (const entry of entries) {
    if (!seedIdSet.has(entry.relationship_id)) {
      violations.push({
        code: 'FAIL_REQUIRED_FIELD',
        message: `Unexpected seed relationship_id: ${entry.relationship_id}`,
        field: `${entry.relationship_id}.relationship_id`,
      });
    }
  }

  return violations;
}

function auditDuplicateRelationshipIds(
  entries: RelationshipDnaEntry[]
): RelationshipDnaSchemaViolation[] {
  const duplicates = findDuplicateRelationshipIds(
    entries.map((entry) => entry.relationship_id)
  );
  return duplicates.map((id) => ({
    code: 'FAIL_DUPLICATE_ID',
    message: `Duplicate relationship_id detected: ${id}`,
    field: 'relationship_id',
  }));
}

function auditEmotionLinkage(entries: RelationshipDnaEntry[]): RelationshipDnaSchemaViolation[] {
  const violations: RelationshipDnaSchemaViolation[] = [];
  const emotionLibrary = getEmotionDnaSeedLibrary();
  const emotionIdSet = new Set(emotionLibrary.map((entry) => entry.emotion_id));

  for (const entry of entries) {
    const seen = new Set<string>();

    for (const emotionId of entry.primary_emotions) {
      if (!isValidPrimaryEmotionId(emotionId)) {
        violations.push({
          code: 'FAIL_EMOTION_LINKAGE',
          message: `Invalid primary_emotion "${emotionId}" on relationship ${entry.relationship_id}`,
          field: `${entry.relationship_id}.primary_emotions`,
        });
        continue;
      }

      if (!emotionIdSet.has(emotionId)) {
        violations.push({
          code: 'FAIL_EMOTION_LINKAGE',
          message: `Unknown Emotion DNA reference "${emotionId}" on relationship ${entry.relationship_id}`,
          field: `${entry.relationship_id}.primary_emotions`,
        });
      }

      if (seen.has(emotionId)) {
        violations.push({
          code: 'FAIL_EMOTION_LINKAGE',
          message: `Duplicate primary_emotion "${emotionId}" on relationship ${entry.relationship_id}`,
          field: `${entry.relationship_id}.primary_emotions`,
        });
      }
      seen.add(emotionId);
    }
  }

  return violations;
}

function auditBehaviorLinkage(entries: RelationshipDnaEntry[]): RelationshipDnaSchemaViolation[] {
  const violations: RelationshipDnaSchemaViolation[] = [];
  const behaviorLibrary = getBehaviorDnaSeedLibrary();
  const behaviorIdSet = new Set(behaviorLibrary.map((entry) => entry.behavior_id));

  for (const entry of entries) {
    const emotionSet = new Set(entry.primary_emotions);
    const seen = new Set<string>();

    for (const behaviorId of entry.primary_behaviors) {
      if (!isValidPrimaryBehaviorId(behaviorId)) {
        violations.push({
          code: 'FAIL_BEHAVIOR_LINKAGE',
          message: `Invalid primary_behavior "${behaviorId}" on relationship ${entry.relationship_id}`,
          field: `${entry.relationship_id}.primary_behaviors`,
        });
        continue;
      }

      if (!behaviorIdSet.has(behaviorId)) {
        violations.push({
          code: 'FAIL_BEHAVIOR_LINKAGE',
          message: `Unknown Behavior DNA reference "${behaviorId}" on relationship ${entry.relationship_id}`,
          field: `${entry.relationship_id}.primary_behaviors`,
        });
      }

      const linkedEmotion = getLinkedEmotionForBehavior(behaviorId);
      if (!emotionSet.has(linkedEmotion)) {
        violations.push({
          code: 'FAIL_BEHAVIOR_LINKAGE',
          message: `Behavior ${behaviorId} requires linked emotion ${linkedEmotion} in primary_emotions on relationship ${entry.relationship_id}`,
          field: `${entry.relationship_id}.primary_behaviors`,
        });
      }

      const behaviorEntry = behaviorLibrary.find((item) => item.behavior_id === behaviorId);
      if (behaviorEntry && behaviorEntry.emotion_root !== BEHAVIOR_EMOTION_LINKAGE[behaviorId]) {
        violations.push({
          code: 'FAIL_BEHAVIOR_LINKAGE',
          message: `Behavior ${behaviorId} emotion_root drift from canonical linkage on relationship ${entry.relationship_id}`,
          field: `${entry.relationship_id}.primary_behaviors`,
        });
      }

      if (seen.has(behaviorId)) {
        violations.push({
          code: 'FAIL_BEHAVIOR_LINKAGE',
          message: `Duplicate primary_behavior "${behaviorId}" on relationship ${entry.relationship_id}`,
          field: `${entry.relationship_id}.primary_behaviors`,
        });
      }
      seen.add(behaviorId);
    }
  }

  return violations;
}

function auditRelationshipRange(entries: RelationshipDnaEntry[]): RelationshipDnaSchemaViolation[] {
  const violations: RelationshipDnaSchemaViolation[] = [];

  for (const entry of entries) {
    if (
      entry.tension_level < RELATIONSHIP_DNA_TENSION_MIN ||
      entry.tension_level > RELATIONSHIP_DNA_TENSION_MAX
    ) {
      violations.push({
        code: 'FAIL_RELATIONSHIP_RANGE',
        message: `tension_level ${entry.tension_level} out of range on relationship ${entry.relationship_id}`,
        field: `${entry.relationship_id}.tension_level`,
      });
    }

    if (
      entry.trust_level < RELATIONSHIP_DNA_TRUST_MIN ||
      entry.trust_level > RELATIONSHIP_DNA_TRUST_MAX
    ) {
      violations.push({
        code: 'FAIL_RELATIONSHIP_RANGE',
        message: `trust_level ${entry.trust_level} out of range on relationship ${entry.relationship_id}`,
        field: `${entry.relationship_id}.trust_level`,
      });
    }
  }

  return violations;
}

function auditPatternIntegrity(entries: RelationshipDnaEntry[]): RelationshipDnaSchemaViolation[] {
  const violations: RelationshipDnaSchemaViolation[] = [];

  for (const entry of entries) {
    for (const field of RELATIONSHIP_DNA_PATTERN_FIELDS) {
      const values = entry[field];
      const seen = new Set<string>();

      for (const token of values) {
        if (!isNonEmptyString(token)) {
          violations.push({
            code: 'FAIL_PATTERN_INTEGRITY',
            message: `Empty ${field} token on relationship ${entry.relationship_id}`,
            field: `${entry.relationship_id}.${field}`,
          });
        }

        if (seen.has(token)) {
          violations.push({
            code: 'FAIL_PATTERN_INTEGRITY',
            message: `Duplicate ${field} token "${token}" on relationship ${entry.relationship_id}`,
            field: `${entry.relationship_id}.${field}`,
          });
        }
        seen.add(token);
      }
    }

    for (const transitionId of entry.transition_affinity) {
      if (!VALID_TRANSITION_IDS.has(transitionId)) {
        violations.push({
          code: 'FAIL_PATTERN_INTEGRITY',
          message: `Unknown transition_affinity "${transitionId}" on relationship ${entry.relationship_id}`,
          field: `${entry.relationship_id}.transition_affinity`,
        });
      }
    }
  }

  return violations;
}

function auditKeywordIntegrity(entries: RelationshipDnaEntry[]): RelationshipDnaSchemaViolation[] {
  const violations: RelationshipDnaSchemaViolation[] = [];

  for (const entry of entries) {
    if (!Array.isArray(entry.keywords) || entry.keywords.length === 0) {
      violations.push({
        code: 'FAIL_KEYWORD_INTEGRITY',
        message: `keywords must be non-empty on relationship ${entry.relationship_id}`,
        field: `${entry.relationship_id}.keywords`,
      });
      continue;
    }

    const seen = new Set<string>();
    for (const keyword of entry.keywords) {
      if (!isValidRelationshipKeyword(keyword)) {
        violations.push({
          code: 'FAIL_KEYWORD_INTEGRITY',
          message: `Invalid keyword "${keyword}" on relationship ${entry.relationship_id}`,
          field: `${entry.relationship_id}.keywords`,
        });
      }

      if (seen.has(keyword)) {
        violations.push({
          code: 'FAIL_KEYWORD_INTEGRITY',
          message: `Duplicate keyword "${keyword}" on relationship ${entry.relationship_id}`,
          field: `${entry.relationship_id}.keywords`,
        });
      }
      seen.add(keyword);
    }
  }

  return violations;
}

function primaryFailure(
  violations: RelationshipDnaSchemaViolation[]
): RelationshipDnaSchemaAuditResult {
  const priority: RelationshipDnaSchemaAuditResult[] = [
    'FAIL_SCHEMA_COMPLETENESS',
    'FAIL_REQUIRED_FIELD',
    'FAIL_DUPLICATE_ID',
    'FAIL_EMOTION_LINKAGE',
    'FAIL_BEHAVIOR_LINKAGE',
    'FAIL_RELATIONSHIP_RANGE',
    'FAIL_PATTERN_INTEGRITY',
    'FAIL_KEYWORD_INTEGRITY',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditRelationshipDnaSchema(
  projectRoot: string
): RelationshipDnaSchemaViolation[] {
  const schema = loadRelationshipDnaJsonSchema(projectRoot);
  const entries = getRelationshipDnaSeedLibrary();
  const violations: RelationshipDnaSchemaViolation[] = [];

  violations.push(...auditSchemaCompleteness(schema));
  violations.push(...auditRequiredFieldIntegrity(entries));
  violations.push(...auditDuplicateRelationshipIds(entries));
  violations.push(...auditEmotionLinkage(entries));
  violations.push(...auditBehaviorLinkage(entries));
  violations.push(...auditRelationshipRange(entries));
  violations.push(...auditPatternIntegrity(entries));
  violations.push(...auditKeywordIntegrity(entries));

  return violations;
}

export function writeRelationshipDnaSchemaPreview(
  projectRoot: string,
  preview: RelationshipDnaSchemaPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeRelationshipDnaSchemaReport(
  projectRoot: string,
  report: RelationshipDnaSchemaReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runRelationshipDnaSchemaAudit(
  projectRoot: string
): RelationshipDnaSchemaReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditRelationshipDnaSchema(projectRoot);

  const preview = buildRelationshipDnaSchemaPreview();
  if (preview.schema_version !== RELATIONSHIP_DNA_SCHEMA_VERSION) {
    violations.push({
      code: 'FAIL_SCHEMA_COMPLETENESS',
      message: 'Preview schema_version mismatch',
      field: 'schema_version',
    });
  }

  writeRelationshipDnaSchemaPreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: RelationshipDnaSchemaReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeRelationshipDnaSchemaReport(projectRoot, report);
  return report;
}
