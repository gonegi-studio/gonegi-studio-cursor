import fs from 'node:fs';
import path from 'node:path';
import {
  GONAGI_GRAMMAR_SEED_COUNT,
  GONAGI_GRAMMAR_VERSION,
  REQUIRED_GRAMMAR_UNIT_FIELDS,
  SEED_GRAMMAR_IDS,
  behaviorEmotionLinkageMatches,
  buildGonagiGrammarPreview,
  findDuplicateGrammarIds,
  getGonagiGrammarSeedLibrary,
  isValidBehaviorReference,
  isValidEmotionReference,
  isValidGrammarId,
  isValidGrammarKeyword,
  isValidRelationshipReference,
  type GonagiGrammarPreview,
  type GonagiGrammarUnit,
  type RequiredGrammarUnitField,
} from './gonagiGrammarDefinitions.js';
import { getTransitionDnaLibrary } from './transitionDnaContractDefinitions.js';

export type GonagiGrammarAuditResult =
  | 'PASS'
  | 'FAIL_GRAMMAR_COMPLETENESS'
  | 'FAIL_BEHAVIOR_REFERENCE'
  | 'FAIL_EMOTION_REFERENCE'
  | 'FAIL_RELATIONSHIP_REFERENCE'
  | 'FAIL_DUPLICATE_GRAMMAR'
  | 'FAIL_AFFINITY_INTEGRITY'
  | 'FAIL_KEYWORD_INTEGRITY';

export interface GonagiGrammarViolation {
  code: GonagiGrammarAuditResult;
  message: string;
  field?: string;
}

export interface GonagiGrammarReport {
  auditTimestamp: string;
  auditResult: GonagiGrammarAuditResult;
  violations: GonagiGrammarViolation[];
}

const PREVIEW_FILE = 'gonagi-grammar-preview.json';
const REPORT_FILE = 'gonagi-grammar-report.json';

const VALID_TRANSITION_IDS = new Set(
  getTransitionDnaLibrary().map((entry) => entry.transition_id)
);

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

function auditGrammarCompleteness(units: GonagiGrammarUnit[]): GonagiGrammarViolation[] {
  const violations: GonagiGrammarViolation[] = [];

  if (units.length !== GONAGI_GRAMMAR_SEED_COUNT) {
    violations.push({
      code: 'FAIL_GRAMMAR_COMPLETENESS',
      message: `Grammar library must contain exactly ${GONAGI_GRAMMAR_SEED_COUNT} units`,
      field: 'seed_grammar_units.length',
    });
  }

  const seedIdSet = new Set(SEED_GRAMMAR_IDS);

  for (const unit of units) {
    for (const field of REQUIRED_GRAMMAR_UNIT_FIELDS) {
      const value = unit[field as RequiredGrammarUnitField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_GRAMMAR_COMPLETENESS',
          message: `Missing required field ${field} on grammar ${unit.grammar_id}`,
          field: `${unit.grammar_id}.${field}`,
        });
        continue;
      }

      if (
        field === 'camera_affinity' ||
        field === 'music_affinity' ||
        field === 'transition_affinity' ||
        field === 'keywords'
      ) {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_GRAMMAR_COMPLETENESS',
            message: `Field ${field} must be a non-empty string array on grammar ${unit.grammar_id}`,
            field: `${unit.grammar_id}.${field}`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_GRAMMAR_COMPLETENESS',
          message: `Field ${field} must be a non-empty string on grammar ${unit.grammar_id}`,
          field: `${unit.grammar_id}.${field}`,
        });
      }
    }

    if (!isValidGrammarId(unit.grammar_id)) {
      violations.push({
        code: 'FAIL_GRAMMAR_COMPLETENESS',
        message: `Unexpected seed grammar_id: ${unit.grammar_id}`,
        field: `${unit.grammar_id}.grammar_id`,
      });
    }

    if (!seedIdSet.has(unit.grammar_id)) {
      violations.push({
        code: 'FAIL_GRAMMAR_COMPLETENESS',
        message: `Grammar unit not in seed catalog: ${unit.grammar_id}`,
        field: `${unit.grammar_id}.grammar_id`,
      });
    }
  }

  for (const grammarId of SEED_GRAMMAR_IDS) {
    if (!units.some((unit) => unit.grammar_id === grammarId)) {
      violations.push({
        code: 'FAIL_GRAMMAR_COMPLETENESS',
        message: `Missing seed grammar unit: ${grammarId}`,
        field: grammarId,
      });
    }
  }

  return violations;
}

function auditBehaviorReferences(units: GonagiGrammarUnit[]): GonagiGrammarViolation[] {
  const violations: GonagiGrammarViolation[] = [];

  for (const unit of units) {
    if (!isValidBehaviorReference(unit.behavior_id)) {
      violations.push({
        code: 'FAIL_BEHAVIOR_REFERENCE',
        message: `Invalid Behavior DNA reference "${unit.behavior_id}" on grammar ${unit.grammar_id}`,
        field: `${unit.grammar_id}.behavior_id`,
      });
    }
  }

  return violations;
}

function auditEmotionReferences(units: GonagiGrammarUnit[]): GonagiGrammarViolation[] {
  const violations: GonagiGrammarViolation[] = [];

  for (const unit of units) {
    if (!isValidEmotionReference(unit.emotion_id)) {
      violations.push({
        code: 'FAIL_EMOTION_REFERENCE',
        message: `Invalid Emotion DNA reference "${unit.emotion_id}" on grammar ${unit.grammar_id}`,
        field: `${unit.grammar_id}.emotion_id`,
      });
      continue;
    }

    if (
      isValidBehaviorReference(unit.behavior_id) &&
      !behaviorEmotionLinkageMatches(unit.behavior_id, unit.emotion_id)
    ) {
      violations.push({
        code: 'FAIL_EMOTION_REFERENCE',
        message: `emotion_id "${unit.emotion_id}" does not match Behavior DNA linkage for behavior ${unit.behavior_id} on grammar ${unit.grammar_id}`,
        field: `${unit.grammar_id}.emotion_id`,
      });
    }
  }

  return violations;
}

function auditRelationshipReferences(units: GonagiGrammarUnit[]): GonagiGrammarViolation[] {
  const violations: GonagiGrammarViolation[] = [];

  for (const unit of units) {
    if (!isValidRelationshipReference(unit.relationship_id)) {
      violations.push({
        code: 'FAIL_RELATIONSHIP_REFERENCE',
        message: `Invalid Relationship DNA reference "${unit.relationship_id}" on grammar ${unit.grammar_id}`,
        field: `${unit.grammar_id}.relationship_id`,
      });
    }
  }

  return violations;
}

function auditDuplicateGrammar(units: GonagiGrammarUnit[]): GonagiGrammarViolation[] {
  const duplicates = findDuplicateGrammarIds(units.map((unit) => unit.grammar_id));
  return duplicates.map((id) => ({
    code: 'FAIL_DUPLICATE_GRAMMAR',
    message: `Duplicate grammar_id detected: ${id}`,
    field: 'grammar_id',
  }));
}

function auditAffinityIntegrity(units: GonagiGrammarUnit[]): GonagiGrammarViolation[] {
  const violations: GonagiGrammarViolation[] = [];

  for (const unit of units) {
    for (const field of ['camera_affinity', 'music_affinity'] as const) {
      const values = unit[field];
      const seen = new Set<string>();

      for (const token of values) {
        if (!isNonEmptyString(token)) {
          violations.push({
            code: 'FAIL_AFFINITY_INTEGRITY',
            message: `Empty ${field} token on grammar ${unit.grammar_id}`,
            field: `${unit.grammar_id}.${field}`,
          });
        }

        if (seen.has(token)) {
          violations.push({
            code: 'FAIL_AFFINITY_INTEGRITY',
            message: `Duplicate ${field} token "${token}" on grammar ${unit.grammar_id}`,
            field: `${unit.grammar_id}.${field}`,
          });
        }
        seen.add(token);
      }
    }

    const transitionSeen = new Set<string>();
    for (const transitionId of unit.transition_affinity) {
      if (!VALID_TRANSITION_IDS.has(transitionId)) {
        violations.push({
          code: 'FAIL_AFFINITY_INTEGRITY',
          message: `Unknown transition_affinity "${transitionId}" on grammar ${unit.grammar_id}`,
          field: `${unit.grammar_id}.transition_affinity`,
        });
      }

      if (transitionSeen.has(transitionId)) {
        violations.push({
          code: 'FAIL_AFFINITY_INTEGRITY',
          message: `Duplicate transition_affinity "${transitionId}" on grammar ${unit.grammar_id}`,
          field: `${unit.grammar_id}.transition_affinity`,
        });
      }
      transitionSeen.add(transitionId);
    }
  }

  return violations;
}

function auditKeywordIntegrity(units: GonagiGrammarUnit[]): GonagiGrammarViolation[] {
  const violations: GonagiGrammarViolation[] = [];

  for (const unit of units) {
    const seen = new Set<string>();

    for (const keyword of unit.keywords) {
      if (!isValidGrammarKeyword(keyword)) {
        violations.push({
          code: 'FAIL_KEYWORD_INTEGRITY',
          message: `Invalid keyword "${keyword}" on grammar ${unit.grammar_id}`,
          field: `${unit.grammar_id}.keywords`,
        });
      }

      if (seen.has(keyword)) {
        violations.push({
          code: 'FAIL_KEYWORD_INTEGRITY',
          message: `Duplicate keyword "${keyword}" on grammar ${unit.grammar_id}`,
          field: `${unit.grammar_id}.keywords`,
        });
      }
      seen.add(keyword);
    }
  }

  return violations;
}

function primaryFailure(violations: GonagiGrammarViolation[]): GonagiGrammarAuditResult {
  const priority: GonagiGrammarAuditResult[] = [
    'FAIL_GRAMMAR_COMPLETENESS',
    'FAIL_DUPLICATE_GRAMMAR',
    'FAIL_BEHAVIOR_REFERENCE',
    'FAIL_EMOTION_REFERENCE',
    'FAIL_RELATIONSHIP_REFERENCE',
    'FAIL_AFFINITY_INTEGRITY',
    'FAIL_KEYWORD_INTEGRITY',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditGonagiGrammar(): GonagiGrammarViolation[] {
  const units = getGonagiGrammarSeedLibrary();
  const violations: GonagiGrammarViolation[] = [];

  violations.push(...auditGrammarCompleteness(units));
  violations.push(...auditDuplicateGrammar(units));
  violations.push(...auditBehaviorReferences(units));
  violations.push(...auditEmotionReferences(units));
  violations.push(...auditRelationshipReferences(units));
  violations.push(...auditAffinityIntegrity(units));
  violations.push(...auditKeywordIntegrity(units));

  return violations;
}

export function writeGonagiGrammarPreview(
  projectRoot: string,
  preview: GonagiGrammarPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeGonagiGrammarReport(
  projectRoot: string,
  report: GonagiGrammarReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runGonagiGrammarAudit(projectRoot: string): GonagiGrammarReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditGonagiGrammar();

  const preview = buildGonagiGrammarPreview();
  if (preview.grammar_version !== GONAGI_GRAMMAR_VERSION) {
    violations.push({
      code: 'FAIL_GRAMMAR_COMPLETENESS',
      message: 'Preview grammar_version mismatch',
      field: 'grammar_version',
    });
  }

  writeGonagiGrammarPreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: GonagiGrammarReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeGonagiGrammarReport(projectRoot, report);
  return report;
}
