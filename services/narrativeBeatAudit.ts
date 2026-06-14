import fs from 'node:fs';
import path from 'node:path';
import {
  DAILY_LIFE_ANCHORS,
  NARRATIVE_BEAT_SEED_COUNT,
  NARRATIVE_BEAT_VERSION,
  REQUIRED_NARRATIVE_BEAT_FIELDS,
  SEED_BEAT_TYPES,
  buildNarrativeBeatPreview,
  findDuplicateBeatIds,
  findDuplicateBeatTypes,
  getGonagiGrammarUnit,
  getNarrativeBeatSeedLibrary,
  isValidBeatType,
  isValidDailyLifeAnchor,
  isValidEmotionReference,
  isValidGrammarReference,
  isValidRelationshipReference,
  type NarrativeBeatEntry,
  type NarrativeBeatPreview,
  type RequiredNarrativeBeatField,
} from './narrativeBeatDefinitions.js';

export type NarrativeBeatAuditResult =
  | 'PASS'
  | 'FAIL_BEAT_COMPLETENESS'
  | 'FAIL_EMOTION_REFERENCE'
  | 'FAIL_GRAMMAR_REFERENCE'
  | 'FAIL_RELATIONSHIP_REFERENCE'
  | 'FAIL_DAILY_LIFE_ANCHOR'
  | 'FAIL_DUPLICATE_BEAT';

export interface NarrativeBeatViolation {
  code: NarrativeBeatAuditResult;
  message: string;
  field?: string;
}

export interface NarrativeBeatReport {
  auditTimestamp: string;
  auditResult: NarrativeBeatAuditResult;
  violations: NarrativeBeatViolation[];
}

const PREVIEW_FILE = 'narrative-beat-preview.json';
const REPORT_FILE = 'narrative-beat-report.json';

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

function auditBeatCompleteness(entries: NarrativeBeatEntry[]): NarrativeBeatViolation[] {
  const violations: NarrativeBeatViolation[] = [];

  if (entries.length !== NARRATIVE_BEAT_SEED_COUNT) {
    violations.push({
      code: 'FAIL_BEAT_COMPLETENESS',
      message: `Narrative beat library must contain exactly ${NARRATIVE_BEAT_SEED_COUNT} beats`,
      field: 'seed_narrative_beats.length',
    });
  }

  for (const entry of entries) {
    for (const field of REQUIRED_NARRATIVE_BEAT_FIELDS) {
      const value = entry[field as RequiredNarrativeBeatField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_BEAT_COMPLETENESS',
          message: `Missing required field ${field} on beat ${entry.beat_id}`,
          field: `${entry.beat_id}.${field}`,
        });
        continue;
      }

      if (
        field === 'daily_life_anchor' ||
        field === 'camera_affinity' ||
        field === 'music_affinity' ||
        field === 'transition_affinity' ||
        field === 'keywords'
      ) {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_BEAT_COMPLETENESS',
            message: `Field ${field} must be a non-empty string array on beat ${entry.beat_id}`,
            field: `${entry.beat_id}.${field}`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_BEAT_COMPLETENESS',
          message: `Field ${field} must be a non-empty string on beat ${entry.beat_id}`,
          field: `${entry.beat_id}.${field}`,
        });
      }
    }

    if (!isValidBeatType(entry.beat_type)) {
      violations.push({
        code: 'FAIL_BEAT_COMPLETENESS',
        message: `Invalid beat_type on beat ${entry.beat_id}`,
        field: `${entry.beat_id}.beat_type`,
      });
    }

    if (entry.beat_id !== `NBT-${entry.beat_type}`) {
      violations.push({
        code: 'FAIL_BEAT_COMPLETENESS',
        message: `beat_id must follow NBT-{beat_type} on beat ${entry.beat_id}`,
        field: `${entry.beat_id}.beat_id`,
      });
    }
  }

  for (const beatType of SEED_BEAT_TYPES) {
    if (!entries.some((entry) => entry.beat_type === beatType)) {
      violations.push({
        code: 'FAIL_BEAT_COMPLETENESS',
        message: `Missing seed beat_type: ${beatType}`,
        field: beatType,
      });
    }
  }

  return violations;
}

function auditEmotionReferences(entries: NarrativeBeatEntry[]): NarrativeBeatViolation[] {
  const violations: NarrativeBeatViolation[] = [];

  for (const entry of entries) {
    if (!isValidEmotionReference(entry.emotion_id)) {
      violations.push({
        code: 'FAIL_EMOTION_REFERENCE',
        message: `Invalid emotion_id "${entry.emotion_id}" on beat ${entry.beat_id}`,
        field: `${entry.beat_id}.emotion_id`,
      });
      continue;
    }

    const grammar = getGonagiGrammarUnit(entry.grammar_id);
    if (grammar && grammar.emotion_id !== entry.emotion_id) {
      violations.push({
        code: 'FAIL_EMOTION_REFERENCE',
        message: `emotion_id must match linked Gonagi grammar on beat ${entry.beat_id}`,
        field: `${entry.beat_id}.emotion_id`,
      });
    }
  }

  return violations;
}

function auditGrammarReferences(entries: NarrativeBeatEntry[]): NarrativeBeatViolation[] {
  const violations: NarrativeBeatViolation[] = [];

  for (const entry of entries) {
    if (!isValidGrammarReference(entry.grammar_id)) {
      violations.push({
        code: 'FAIL_GRAMMAR_REFERENCE',
        message: `Invalid grammar_id "${entry.grammar_id}" on beat ${entry.beat_id}`,
        field: `${entry.beat_id}.grammar_id`,
      });
      continue;
    }

    const grammar = getGonagiGrammarUnit(entry.grammar_id);
    if (!grammar) {
      violations.push({
        code: 'FAIL_GRAMMAR_REFERENCE',
        message: `Gonagi grammar unit not found for "${entry.grammar_id}" on beat ${entry.beat_id}`,
        field: `${entry.beat_id}.grammar_id`,
      });
    }
  }

  return violations;
}

function auditRelationshipReferences(entries: NarrativeBeatEntry[]): NarrativeBeatViolation[] {
  const violations: NarrativeBeatViolation[] = [];

  for (const entry of entries) {
    if (!isValidRelationshipReference(entry.relationship_id)) {
      violations.push({
        code: 'FAIL_RELATIONSHIP_REFERENCE',
        message: `Invalid relationship_id "${entry.relationship_id}" on beat ${entry.beat_id}`,
        field: `${entry.beat_id}.relationship_id`,
      });
      continue;
    }

    const grammar = getGonagiGrammarUnit(entry.grammar_id);
    if (grammar && grammar.relationship_id !== entry.relationship_id) {
      violations.push({
        code: 'FAIL_RELATIONSHIP_REFERENCE',
        message: `relationship_id must match linked Gonagi grammar on beat ${entry.beat_id}`,
        field: `${entry.beat_id}.relationship_id`,
      });
    }
  }

  return violations;
}

function auditDailyLifeAnchors(entries: NarrativeBeatEntry[]): NarrativeBeatViolation[] {
  const violations: NarrativeBeatViolation[] = [];

  for (const entry of entries) {
    if (!Array.isArray(entry.daily_life_anchor) || entry.daily_life_anchor.length === 0) {
      violations.push({
        code: 'FAIL_DAILY_LIFE_ANCHOR',
        message: `daily_life_anchor required on beat ${entry.beat_id}`,
        field: `${entry.beat_id}.daily_life_anchor`,
      });
      continue;
    }

    const seen = new Set<string>();
    for (const anchor of entry.daily_life_anchor) {
      if (!isValidDailyLifeAnchor(anchor)) {
        violations.push({
          code: 'FAIL_DAILY_LIFE_ANCHOR',
          message: `Unknown daily_life_anchor "${anchor}" on beat ${entry.beat_id}`,
          field: `${entry.beat_id}.daily_life_anchor`,
        });
      }

      if (seen.has(anchor)) {
        violations.push({
          code: 'FAIL_DAILY_LIFE_ANCHOR',
          message: `Duplicate daily_life_anchor "${anchor}" on beat ${entry.beat_id}`,
          field: `${entry.beat_id}.daily_life_anchor`,
        });
      }
      seen.add(anchor);
    }
  }

  if (DAILY_LIFE_ANCHORS.length !== 32) {
    violations.push({
      code: 'FAIL_DAILY_LIFE_ANCHOR',
      message: 'Daily life anchor catalog must contain 32 anchors',
      field: 'daily_life_anchors.length',
    });
  }

  return violations;
}

function auditDuplicateBeats(entries: NarrativeBeatEntry[]): NarrativeBeatViolation[] {
  const violations: NarrativeBeatViolation[] = [];

  for (const beatId of findDuplicateBeatIds(entries.map((entry) => entry.beat_id))) {
    violations.push({
      code: 'FAIL_DUPLICATE_BEAT',
      message: `Duplicate beat_id detected: ${beatId}`,
      field: 'beat_id',
    });
  }

  for (const beatType of findDuplicateBeatTypes(entries.map((entry) => entry.beat_type))) {
    violations.push({
      code: 'FAIL_DUPLICATE_BEAT',
      message: `Duplicate beat_type detected: ${beatType}`,
      field: 'beat_type',
    });
  }

  return violations;
}

function primaryFailure(violations: NarrativeBeatViolation[]): NarrativeBeatAuditResult {
  const priority: NarrativeBeatAuditResult[] = [
    'FAIL_BEAT_COMPLETENESS',
    'FAIL_DUPLICATE_BEAT',
    'FAIL_EMOTION_REFERENCE',
    'FAIL_GRAMMAR_REFERENCE',
    'FAIL_RELATIONSHIP_REFERENCE',
    'FAIL_DAILY_LIFE_ANCHOR',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditNarrativeBeat(): NarrativeBeatViolation[] {
  const entries = getNarrativeBeatSeedLibrary();
  const violations: NarrativeBeatViolation[] = [];

  violations.push(...auditBeatCompleteness(entries));
  violations.push(...auditDuplicateBeats(entries));
  violations.push(...auditEmotionReferences(entries));
  violations.push(...auditGrammarReferences(entries));
  violations.push(...auditRelationshipReferences(entries));
  violations.push(...auditDailyLifeAnchors(entries));

  return violations;
}

export function writeNarrativeBeatPreview(
  projectRoot: string,
  preview: NarrativeBeatPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeNarrativeBeatReport(
  projectRoot: string,
  report: NarrativeBeatReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runNarrativeBeatAudit(projectRoot: string): NarrativeBeatReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditNarrativeBeat();

  const preview = buildNarrativeBeatPreview();
  if (preview.beat_version !== NARRATIVE_BEAT_VERSION) {
    violations.push({
      code: 'FAIL_BEAT_COMPLETENESS',
      message: 'Preview beat_version mismatch',
      field: 'beat_version',
    });
  }

  writeNarrativeBeatPreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: NarrativeBeatReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeNarrativeBeatReport(projectRoot, report);
  return report;
}
