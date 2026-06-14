import fs from 'node:fs';
import path from 'node:path';
import {
  getCharacterContinuityById,
  SEED_CHARACTER_IDS,
} from './characterContinuityDefinitions.js';
import { isValidEmotionId } from './emotionDnaDefinitions.js';
import {
  CHARACTER_DECISION_SEED_COUNT,
  CHARACTER_DECISION_SONG_MASTER_ID,
  CHARACTER_DECISION_VERSION,
  buildCharacterDecisionPreview,
  findDuplicateDecisionIds,
  getCharacterContinuityIdForCharacter,
  getCharacterDecisionSeedLibrary,
  getEmotionTimelineReferenceToken,
  isValidDecisionType,
  REQUIRED_CHARACTER_DECISION_FIELDS,
  SEED_DECISION_TYPES,
  validateCharacterContinuityReference,
  type CharacterDecisionEntry,
  type CharacterDecisionPreview,
  type RequiredCharacterDecisionField,
} from './characterDecisionDefinitions.js';
import {
  getSrtEmotionIngestionSeedLibrary,
  SRT_EMOTION_INGESTION_ID,
  WORLD_DNA_PRIORITY_LAW,
} from './srtEmotionIngestionDefinitions.js';
import { STORYBOARD_SEED_COUNT } from './storyboardLayerDefinitions.js';
import {
  getStoryOrchestrationById,
  STORY_ORCHESTRATION_ID,
} from './storyOrchestrationDefinitions.js';
import { getWorldContinuityById, WORLD_CONTINUITY_WORLD_ID } from './worldContinuityDefinitions.js';

export type CharacterDecisionAuditResult =
  | 'PASS'
  | 'FAIL_DECISION_COMPLETENESS'
  | 'FAIL_CHARACTER_REFERENCE'
  | 'FAIL_EMOTION_REFERENCE'
  | 'FAIL_ORCHESTRATION_REFERENCE'
  | 'FAIL_WORLD_REFERENCE'
  | 'FAIL_DECISION_TYPE'
  | 'FAIL_DUPLICATE_DECISION';

export interface CharacterDecisionViolation {
  code: CharacterDecisionAuditResult;
  message: string;
  field?: string;
}

export interface CharacterDecisionReport {
  auditTimestamp: string;
  auditResult: CharacterDecisionAuditResult;
  violations: CharacterDecisionViolation[];
}

const PREVIEW_FILE = 'character-decision-preview.json';
const REPORT_FILE = 'character-decision-report.json';

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

function auditDecisionCompleteness(
  entries: CharacterDecisionEntry[]
): CharacterDecisionViolation[] {
  const violations: CharacterDecisionViolation[] = [];

  if (entries.length !== CHARACTER_DECISION_SEED_COUNT) {
    violations.push({
      code: 'FAIL_DECISION_COMPLETENESS',
      message: `Character decision layer must contain exactly ${CHARACTER_DECISION_SEED_COUNT} entries`,
      field: 'seed_character_decisions.length',
    });
  }

  for (const entry of entries) {
    for (const field of REQUIRED_CHARACTER_DECISION_FIELDS) {
      const value = entry[field as RequiredCharacterDecisionField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_DECISION_COMPLETENESS',
          message: `Missing required field ${field} on ${entry.decision_id}`,
          field: `${entry.decision_id}.${field}`,
        });
        continue;
      }

      if (field === 'world_constraints' || field === 'scene_bindings' || field === 'keywords') {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_DECISION_COMPLETENESS',
            message: `Field ${field} must be a non-empty string array on ${entry.decision_id}`,
            field: `${entry.decision_id}.${field}`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_DECISION_COMPLETENESS',
          message: `Field ${field} must be a non-empty string on ${entry.decision_id}`,
          field: `${entry.decision_id}.${field}`,
        });
      }
    }

    if (!entry.decision_id.startsWith(`DEC-${entry.character_id}-segment-`)) {
      violations.push({
        code: 'FAIL_DECISION_COMPLETENESS',
        message: `decision_id must follow DEC-{character_id}-segment-{order} on ${entry.decision_id}`,
        field: `${entry.decision_id}.decision_id`,
      });
    }

    if (!entry.narrative_intent.startsWith('emotion-intent:')) {
      violations.push({
        code: 'FAIL_DECISION_COMPLETENESS',
        message: `narrative_intent must come from SRT ingestion on ${entry.decision_id}`,
        field: `${entry.decision_id}.narrative_intent`,
      });
    }

    if (!entry.scene_bindings.includes('decision-layer:emotion-to-decision-to-scene')) {
      violations.push({
        code: 'FAIL_DECISION_COMPLETENESS',
        message: `Decision must declare emotion-to-decision-to-scene pipeline on ${entry.decision_id}`,
        field: `${entry.decision_id}.scene_bindings`,
      });
    }
  }

  for (let segment = 1; segment <= STORYBOARD_SEED_COUNT; segment += 1) {
    for (const characterId of SEED_CHARACTER_IDS) {
      const order = String(segment).padStart(2, '0');
      const expectedId = `DEC-${characterId}-segment-${order}`;
      if (!entries.some((entry) => entry.decision_id === expectedId)) {
        violations.push({
          code: 'FAIL_DECISION_COMPLETENESS',
          message: `Missing decision entry ${expectedId}`,
          field: 'seed_character_decisions',
        });
      }
    }
  }

  return violations;
}

function auditCharacterReference(
  entries: CharacterDecisionEntry[]
): CharacterDecisionViolation[] {
  const violations: CharacterDecisionViolation[] = [];

  for (const entry of entries) {
    if (!SEED_CHARACTER_IDS.includes(entry.character_id)) {
      violations.push({
        code: 'FAIL_CHARACTER_REFERENCE',
        message: `Invalid character_id on ${entry.decision_id}`,
        field: `${entry.decision_id}.character_id`,
      });
      continue;
    }

    if (!validateCharacterContinuityReference(entry.character_id)) {
      violations.push({
        code: 'FAIL_CHARACTER_REFERENCE',
        message: `Missing character continuity for ${entry.character_id}`,
        field: `${entry.decision_id}.character_id`,
      });
    }

    const continuityId = getCharacterContinuityIdForCharacter(entry.character_id);
    const continuity = getCharacterContinuityById(continuityId);
    if (!continuity) {
      violations.push({
        code: 'FAIL_CHARACTER_REFERENCE',
        message: `Character continuity entry ${continuityId} not found`,
        field: `${entry.decision_id}.character_id`,
      });
      continue;
    }

    if (!entry.scene_bindings.includes(`continuity:${continuityId}`)) {
      violations.push({
        code: 'FAIL_CHARACTER_REFERENCE',
        message: `scene_bindings must reference ${continuityId} on ${entry.decision_id}`,
        field: `${entry.decision_id}.scene_bindings`,
      });
    }

    if (!entry.keywords.includes(entry.character_id)) {
      violations.push({
        code: 'FAIL_CHARACTER_REFERENCE',
        message: `keywords must include character_id on ${entry.decision_id}`,
        field: `${entry.decision_id}.keywords`,
      });
    }
  }

  return violations;
}

function auditEmotionReference(entries: CharacterDecisionEntry[]): CharacterDecisionViolation[] {
  const violations: CharacterDecisionViolation[] = [];
  const ingestion = getSrtEmotionIngestionSeedLibrary()[0];

  if (!ingestion) {
    violations.push({
      code: 'FAIL_EMOTION_REFERENCE',
      message: 'SRT emotion ingestion entry required for character decisions',
      field: SRT_EMOTION_INGESTION_ID,
    });
    return violations;
  }

  for (const entry of entries) {
    if (!isValidEmotionId(entry.emotion_id)) {
      violations.push({
        code: 'FAIL_EMOTION_REFERENCE',
        message: `Invalid emotion_id on ${entry.decision_id}`,
        field: `${entry.decision_id}.emotion_id`,
      });
      continue;
    }

    const segmentToken = entry.scene_bindings.find((token) =>
      token.startsWith('emotion-timeline:segment-')
    );
    if (!segmentToken) {
      violations.push({
        code: 'FAIL_EMOTION_REFERENCE',
        message: `Missing emotion timeline binding on ${entry.decision_id}`,
        field: `${entry.decision_id}.scene_bindings`,
      });
      continue;
    }

    const segmentMatch = segmentToken.match(/^emotion-timeline:segment-(\d{2}):(.+)$/);
    if (!segmentMatch) {
      violations.push({
        code: 'FAIL_EMOTION_REFERENCE',
        message: `Invalid emotion timeline token on ${entry.decision_id}`,
        field: `${entry.decision_id}.scene_bindings`,
      });
      continue;
    }

    const segmentIndex = Number(segmentMatch[1]);
    const boundEmotion = segmentMatch[2];
    if (boundEmotion !== entry.emotion_id) {
      violations.push({
        code: 'FAIL_EMOTION_REFERENCE',
        message: `emotion_id must match emotion timeline binding on ${entry.decision_id}`,
        field: `${entry.decision_id}.emotion_id`,
      });
    }

    const timelineSegment = ingestion.emotion_timeline.find(
      (segment) => segment.segment_index === segmentIndex
    );
    if (!timelineSegment || timelineSegment.emotion_id !== entry.emotion_id) {
      violations.push({
        code: 'FAIL_EMOTION_REFERENCE',
        message: `emotion_id must match SRT emotion_timeline segment ${segmentIndex}`,
        field: `${entry.decision_id}.emotion_id`,
      });
    }

    const expectedToken = getEmotionTimelineReferenceToken(segmentIndex, entry.emotion_id);
    if (!entry.scene_bindings.includes(expectedToken)) {
      violations.push({
        code: 'FAIL_EMOTION_REFERENCE',
        message: `scene_bindings must include ${expectedToken}`,
        field: `${entry.decision_id}.scene_bindings`,
      });
    }

    if (!entry.scene_bindings.includes(`srt-ingestion:${SRT_EMOTION_INGESTION_ID}`)) {
      violations.push({
        code: 'FAIL_EMOTION_REFERENCE',
        message: `scene_bindings must reference ${SRT_EMOTION_INGESTION_ID}`,
        field: `${entry.decision_id}.scene_bindings`,
      });
    }

    const narrativeIntent = ingestion.narrative_intents.find(
      (intent) => intent.segment_index === segmentIndex
    );
    if (!narrativeIntent || narrativeIntent.intent !== entry.narrative_intent) {
      violations.push({
        code: 'FAIL_EMOTION_REFERENCE',
        message: `narrative_intent must match SRT ingestion segment ${segmentIndex}`,
        field: `${entry.decision_id}.narrative_intent`,
      });
    }
  }

  const sharedEmotionGroups = new Map<string, CharacterDecisionEntry[]>();
  for (const entry of entries) {
    const segment = entry.scene_bindings.find((token) => token.startsWith('segment:')) ?? '';
    const key = `${segment}:${entry.emotion_id}`;
    const group = sharedEmotionGroups.get(key) ?? [];
    group.push(entry);
    sharedEmotionGroups.set(key, group);
  }

  for (const [, group] of sharedEmotionGroups) {
    if (group.length < 2) continue;
    const decisionTypes = new Set(group.map((entry) => entry.decision_type));
    if (decisionTypes.size < 2) {
      violations.push({
        code: 'FAIL_EMOTION_REFERENCE',
        message: `Same emotion on segment must produce different decision types per character (${group[0].emotion_id})`,
        field: 'decision_type',
      });
    }
  }

  return violations;
}

function auditOrchestrationReference(
  entries: CharacterDecisionEntry[]
): CharacterDecisionViolation[] {
  const violations: CharacterDecisionViolation[] = [];
  const orchestration = getStoryOrchestrationById(STORY_ORCHESTRATION_ID);

  if (!orchestration) {
    violations.push({
      code: 'FAIL_ORCHESTRATION_REFERENCE',
      message: `Missing story orchestration ${STORY_ORCHESTRATION_ID}`,
      field: STORY_ORCHESTRATION_ID,
    });
    return violations;
  }

  for (const entry of entries) {
    if (!entry.scene_bindings.includes(`orchestration:${STORY_ORCHESTRATION_ID}`)) {
      violations.push({
        code: 'FAIL_ORCHESTRATION_REFERENCE',
        message: `scene_bindings must reference ${STORY_ORCHESTRATION_ID}`,
        field: `${entry.decision_id}.scene_bindings`,
      });
    }

    if (!entry.keywords.includes(`orchestration:${STORY_ORCHESTRATION_ID}`)) {
      violations.push({
        code: 'FAIL_ORCHESTRATION_REFERENCE',
        message: 'keywords must reference story orchestration',
        field: `${entry.decision_id}.keywords`,
      });
    }

    const hasTurn = entry.scene_bindings.some((token) => token.startsWith('orchestration-turn:'));
    const hasBeat = entry.scene_bindings.some((token) => token.startsWith('orchestration-beat:'));
    if (!hasTurn || !hasBeat) {
      violations.push({
        code: 'FAIL_ORCHESTRATION_REFERENCE',
        message: `Decision must bind orchestration turn and beat on ${entry.decision_id}`,
        field: `${entry.decision_id}.scene_bindings`,
      });
    }

    const storyboardBinding = entry.scene_bindings.find((token) => token.startsWith('storyboard:'));
    if (!storyboardBinding) {
      violations.push({
        code: 'FAIL_ORCHESTRATION_REFERENCE',
        message: `Decision must bind storyboard scene on ${entry.decision_id}`,
        field: `${entry.decision_id}.scene_bindings`,
      });
    }
  }

  return violations;
}

function auditWorldReference(entries: CharacterDecisionEntry[]): CharacterDecisionViolation[] {
  const violations: CharacterDecisionViolation[] = [];
  const world = getWorldContinuityById(WORLD_CONTINUITY_WORLD_ID);
  const ingestion = getSrtEmotionIngestionSeedLibrary()[0];

  if (!world) {
    violations.push({
      code: 'FAIL_WORLD_REFERENCE',
      message: `Missing world continuity ${WORLD_CONTINUITY_WORLD_ID}`,
      field: WORLD_CONTINUITY_WORLD_ID,
    });
  }

  for (const entry of entries) {
    if (!entry.world_constraints.includes(`law:${WORLD_DNA_PRIORITY_LAW}`)) {
      violations.push({
        code: 'FAIL_WORLD_REFERENCE',
        message: `world_constraints must include WORLD_DNA_PRIORITY_LAW on ${entry.decision_id}`,
        field: `${entry.decision_id}.world_constraints`,
      });
    }

    if (!entry.world_constraints.includes(`world:${WORLD_CONTINUITY_WORLD_ID}`)) {
      violations.push({
        code: 'FAIL_WORLD_REFERENCE',
        message: `world_constraints must reference ${WORLD_CONTINUITY_WORLD_ID}`,
        field: `${entry.decision_id}.world_constraints`,
      });
    }

    if (!entry.world_constraints.includes('principle:no-lyric-based-world-generation')) {
      violations.push({
        code: 'FAIL_WORLD_REFERENCE',
        message: `world_constraints must forbid lyric-based world generation on ${entry.decision_id}`,
        field: `${entry.decision_id}.world_constraints`,
      });
    }

    if (!entry.keywords.includes(WORLD_DNA_PRIORITY_LAW)) {
      violations.push({
        code: 'FAIL_WORLD_REFERENCE',
        message: `keywords must include ${WORLD_DNA_PRIORITY_LAW}`,
        field: `${entry.decision_id}.keywords`,
      });
    }

    if (ingestion) {
      const hasSharedConstraint = entry.world_constraints.some((token) =>
        ingestion.world_constraints.includes(token)
      );
      if (!hasSharedConstraint) {
        violations.push({
          code: 'FAIL_WORLD_REFERENCE',
          message: `world_constraints must inherit SRT ingestion constraints on ${entry.decision_id}`,
          field: `${entry.decision_id}.world_constraints`,
        });
      }
    }
  }

  return violations;
}

function auditDecisionType(entries: CharacterDecisionEntry[]): CharacterDecisionViolation[] {
  const violations: CharacterDecisionViolation[] = [];

  for (const entry of entries) {
    if (!isValidDecisionType(entry.decision_type)) {
      violations.push({
        code: 'FAIL_DECISION_TYPE',
        message: `Invalid decision_type "${entry.decision_type}" on ${entry.decision_id}`,
        field: `${entry.decision_id}.decision_type`,
      });
    }

    if (!entry.keywords.includes(`decision:${entry.decision_type}`)) {
      violations.push({
        code: 'FAIL_DECISION_TYPE',
        message: `keywords must include decision type token on ${entry.decision_id}`,
        field: `${entry.decision_id}.keywords`,
      });
    }

    if (!isNonEmptyString(entry.action_outcome) || entry.action_outcome.length < 12) {
      violations.push({
        code: 'FAIL_DECISION_TYPE',
        message: `action_outcome must describe decision outcome on ${entry.decision_id}`,
        field: `${entry.decision_id}.action_outcome`,
      });
    }
  }

  for (const decisionType of SEED_DECISION_TYPES) {
    if (!entries.some((entry) => entry.decision_type === decisionType)) {
      violations.push({
        code: 'FAIL_DECISION_TYPE',
        message: `Decision layer must use seed decision type ${decisionType}`,
        field: 'decision_type',
      });
    }
  }

  return violations;
}

function auditDuplicateDecision(
  entries: CharacterDecisionEntry[]
): CharacterDecisionViolation[] {
  const violations: CharacterDecisionViolation[] = [];

  for (const decisionId of findDuplicateDecisionIds(entries.map((entry) => entry.decision_id))) {
    violations.push({
      code: 'FAIL_DUPLICATE_DECISION',
      message: `Duplicate decision_id detected: ${decisionId}`,
      field: 'decision_id',
    });
  }

  const pairKeys = entries.map(
    (entry) => `${entry.character_id}:${entry.scene_bindings.find((t) => t.startsWith('segment:'))}`
  );
  const duplicatePairs = pairKeys.filter((key, index) => pairKeys.indexOf(key) !== index);
  for (const key of [...new Set(duplicatePairs)]) {
    violations.push({
      code: 'FAIL_DUPLICATE_DECISION',
      message: `Duplicate character-segment decision detected: ${key}`,
      field: 'decision_id',
    });
  }

  return violations;
}

function primaryFailure(
  violations: CharacterDecisionViolation[]
): CharacterDecisionAuditResult {
  const priority: CharacterDecisionAuditResult[] = [
    'FAIL_DECISION_COMPLETENESS',
    'FAIL_DUPLICATE_DECISION',
    'FAIL_CHARACTER_REFERENCE',
    'FAIL_EMOTION_REFERENCE',
    'FAIL_ORCHESTRATION_REFERENCE',
    'FAIL_WORLD_REFERENCE',
    'FAIL_DECISION_TYPE',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditCharacterDecision(projectRoot: string): CharacterDecisionViolation[] {
  void projectRoot;
  const entries = getCharacterDecisionSeedLibrary();
  const violations: CharacterDecisionViolation[] = [];

  violations.push(...auditDecisionCompleteness(entries));
  violations.push(...auditDuplicateDecision(entries));
  violations.push(...auditCharacterReference(entries));
  violations.push(...auditEmotionReference(entries));
  violations.push(...auditOrchestrationReference(entries));
  violations.push(...auditWorldReference(entries));
  violations.push(...auditDecisionType(entries));

  return violations;
}

export function writeCharacterDecisionPreview(
  projectRoot: string,
  preview: CharacterDecisionPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeCharacterDecisionReport(
  projectRoot: string,
  report: CharacterDecisionReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runCharacterDecisionAudit(projectRoot: string): CharacterDecisionReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditCharacterDecision(projectRoot);

  const preview = buildCharacterDecisionPreview();
  if (preview.layer_version !== CHARACTER_DECISION_VERSION) {
    violations.push({
      code: 'FAIL_DECISION_COMPLETENESS',
      message: 'Preview layer_version mismatch',
      field: 'layer_version',
    });
  }

  if (preview.song_master_id !== CHARACTER_DECISION_SONG_MASTER_ID) {
    violations.push({
      code: 'FAIL_DECISION_COMPLETENESS',
      message: 'Preview song_master_id mismatch',
      field: 'song_master_id',
    });
  }

  writeCharacterDecisionPreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: CharacterDecisionReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeCharacterDecisionReport(projectRoot, report);
  return report;
}
