import fs from 'node:fs';
import path from 'node:path';
import { BEHAVIOR_EMOTION_LINKAGE } from './emotionDnaDefinitions.js';
import { getBehaviorDnaSeedLibrary } from './behaviorDnaDefinitions.js';
import { getRelationshipDnaSeedLibrary } from './relationshipDnaDefinitions.js';
import { getPromptPackPairSeedLibrary } from './promptPackPairingDefinitions.js';
import {
  CHARACTER_CONTINUITY_SEED_COUNT,
  CHARACTER_CONTINUITY_SONG_MASTER_ID,
  CHARACTER_CONTINUITY_VERSION,
  CONTINUITY_SCORE_MAX,
  CONTINUITY_SCORE_MIN,
  REQUIRED_CHARACTER_CONTINUITY_FIELDS,
  SEED_CHARACTER_IDS,
  buildCharacterContinuityPreview,
  findDuplicateContinuityIds,
  getCharacterContinuitySeedLibrary,
  getCharacterDnaProfileById,
  getPromptPackPairById,
  isValidCharacterId,
  validateCharacterDnaLinkage,
  type CharacterContinuityEntry,
  type CharacterContinuityPreview,
  type RequiredCharacterContinuityField,
} from './characterContinuityDefinitions.js';

export type CharacterContinuityAuditResult =
  | 'PASS'
  | 'FAIL_CONTINUITY_COMPLETENESS'
  | 'FAIL_CHARACTER_REFERENCE'
  | 'FAIL_IDENTITY_ANCHOR'
  | 'FAIL_SCENE_REFERENCE'
  | 'FAIL_DUPLICATE_CONTINUITY'
  | 'FAIL_CONTINUITY_SCORE';

export interface CharacterContinuityViolation {
  code: CharacterContinuityAuditResult;
  message: string;
  field?: string;
}

export interface CharacterContinuityReport {
  auditTimestamp: string;
  auditResult: CharacterContinuityAuditResult;
  violations: CharacterContinuityViolation[];
}

const PREVIEW_FILE = 'character-continuity-preview.json';
const REPORT_FILE = 'character-continuity-report.json';

const PAIR_IDS = new Set(getPromptPackPairSeedLibrary().map((pair) => pair.pair_id));

const VALID_BEHAVIOR_IDS = new Set(
  getBehaviorDnaSeedLibrary().map((entry) => entry.behavior_id)
);

const VALID_RELATIONSHIP_IDS = new Set(
  getRelationshipDnaSeedLibrary().map((entry) => entry.relationship_id)
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

function auditContinuityCompleteness(
  entries: CharacterContinuityEntry[]
): CharacterContinuityViolation[] {
  const violations: CharacterContinuityViolation[] = [];

  if (entries.length !== CHARACTER_CONTINUITY_SEED_COUNT) {
    violations.push({
      code: 'FAIL_CONTINUITY_COMPLETENESS',
      message: `Character continuity layer must contain exactly ${CHARACTER_CONTINUITY_SEED_COUNT} entries for ${CHARACTER_CONTINUITY_SONG_MASTER_ID}`,
      field: 'seed_character_continuity.length',
    });
  }

  for (const entry of entries) {
    for (const field of REQUIRED_CHARACTER_CONTINUITY_FIELDS) {
      const value = entry[field as RequiredCharacterContinuityField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_CONTINUITY_COMPLETENESS',
          message: `Missing required field ${field} on continuity ${entry.continuity_id}`,
          field: `${entry.continuity_id}.${field}`,
        });
        continue;
      }

      if (
        field === 'identity_anchor' ||
        field === 'facial_anchor' ||
        field === 'body_anchor' ||
        field === 'hair_anchor' ||
        field === 'clothing_anchor' ||
        field === 'behavior_anchor' ||
        field === 'relationship_anchor' ||
        field === 'scene_references'
      ) {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_CONTINUITY_COMPLETENESS',
            message: `Field ${field} must be a non-empty string array on continuity ${entry.continuity_id}`,
            field: `${entry.continuity_id}.${field}`,
          });
        }
        continue;
      }

      if (field === 'continuity_score') {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          violations.push({
            code: 'FAIL_CONTINUITY_COMPLETENESS',
            message: `Field continuity_score must be an integer on continuity ${entry.continuity_id}`,
            field: `${entry.continuity_id}.continuity_score`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_CONTINUITY_COMPLETENESS',
          message: `Field ${field} must be a non-empty string on continuity ${entry.continuity_id}`,
          field: `${entry.continuity_id}.${field}`,
        });
      }
    }

    if (entry.continuity_id !== `CCN-${entry.character_id}`) {
      violations.push({
        code: 'FAIL_CONTINUITY_COMPLETENESS',
        message: `continuity_id must follow CCN-{character_id} on ${entry.continuity_id}`,
        field: `${entry.continuity_id}.continuity_id`,
      });
    }
  }

  for (const characterId of SEED_CHARACTER_IDS) {
    if (!entries.some((entry) => entry.character_id === characterId)) {
      violations.push({
        code: 'FAIL_CONTINUITY_COMPLETENESS',
        message: `Missing character continuity entry for ${characterId}`,
        field: characterId,
      });
    }
  }

  return violations;
}

function auditCharacterReference(
  entries: CharacterContinuityEntry[]
): CharacterContinuityViolation[] {
  const violations: CharacterContinuityViolation[] = [];

  for (const entry of entries) {
    if (!isValidCharacterId(entry.character_id)) {
      violations.push({
        code: 'FAIL_CHARACTER_REFERENCE',
        message: `Invalid character_id on continuity ${entry.continuity_id}`,
        field: `${entry.continuity_id}.character_id`,
      });
      continue;
    }

    const profile = getCharacterDnaProfileById(entry.character_id);
    if (!profile) {
      violations.push({
        code: 'FAIL_CHARACTER_REFERENCE',
        message: `Missing character DNA profile for ${entry.character_id}`,
        field: `${entry.continuity_id}.character_id`,
      });
      continue;
    }

    if (!validateCharacterDnaLinkage(profile)) {
      violations.push({
        code: 'FAIL_CHARACTER_REFERENCE',
        message: `Character DNA behavior/emotion linkage invalid on ${entry.continuity_id}`,
        field: `${entry.continuity_id}.character_id`,
      });
    }

    const behaviorToken = `behavior-dna:${profile.primary_behavior_id}`;
    if (!entry.behavior_anchor.includes(behaviorToken)) {
      violations.push({
        code: 'FAIL_CHARACTER_REFERENCE',
        message: `behavior_anchor must include ${behaviorToken} on ${entry.continuity_id}`,
        field: `${entry.continuity_id}.behavior_anchor`,
      });
    }

    const emotionToken = `emotion-dna:${profile.primary_emotion_id}`;
    if (!entry.behavior_anchor.includes(emotionToken)) {
      violations.push({
        code: 'FAIL_CHARACTER_REFERENCE',
        message: `behavior_anchor must include ${emotionToken} on ${entry.continuity_id}`,
        field: `${entry.continuity_id}.behavior_anchor`,
      });
    }

    if (BEHAVIOR_EMOTION_LINKAGE[profile.primary_behavior_id] !== profile.primary_emotion_id) {
      violations.push({
        code: 'FAIL_CHARACTER_REFERENCE',
        message: `Character DNA profile linkage mismatch for ${entry.character_id}`,
        field: `${entry.continuity_id}.character_id`,
      });
    }

    for (const relationshipId of profile.relationship_roles) {
      const relationshipToken = `relationship-dna:${relationshipId}`;
      if (!entry.relationship_anchor.includes(relationshipToken)) {
        violations.push({
          code: 'FAIL_CHARACTER_REFERENCE',
          message: `relationship_anchor must include ${relationshipToken} on ${entry.continuity_id}`,
          field: `${entry.continuity_id}.relationship_anchor`,
        });
      }

      if (!VALID_RELATIONSHIP_IDS.has(relationshipId)) {
        violations.push({
          code: 'FAIL_CHARACTER_REFERENCE',
          message: `Invalid relationship role ${relationshipId} on ${entry.continuity_id}`,
          field: `${entry.continuity_id}.relationship_anchor`,
        });
      }
    }

    if (!VALID_BEHAVIOR_IDS.has(profile.primary_behavior_id)) {
      violations.push({
        code: 'FAIL_CHARACTER_REFERENCE',
        message: `Invalid primary behavior in character DNA for ${entry.character_id}`,
        field: `${entry.continuity_id}.character_id`,
      });
    }
  }

  return violations;
}

function auditIdentityAnchor(entries: CharacterContinuityEntry[]): CharacterContinuityViolation[] {
  const violations: CharacterContinuityViolation[] = [];

  for (const entry of entries) {
    if (!entry.identity_anchor.includes(entry.character_id)) {
      violations.push({
        code: 'FAIL_IDENTITY_ANCHOR',
        message: `identity_anchor must include character_id token on ${entry.continuity_id}`,
        field: `${entry.continuity_id}.identity_anchor`,
      });
    }

    const profile = getCharacterDnaProfileById(entry.character_id);
    if (profile && !entry.identity_anchor.includes(profile.display_name_ko)) {
      violations.push({
        code: 'FAIL_IDENTITY_ANCHOR',
        message: `identity_anchor must include Korean display name on ${entry.continuity_id}`,
        field: `${entry.continuity_id}.identity_anchor`,
      });
    }

    if (profile && !entry.identity_anchor.includes(`song_master_01-lead`)) {
      const hasLeadToken = entry.identity_anchor.some((token) =>
        token.includes('song_master_01-lead')
      );
      if (!hasLeadToken) {
        violations.push({
          code: 'FAIL_IDENTITY_ANCHOR',
          message: `identity_anchor must include song_master_01 lead token on ${entry.continuity_id}`,
          field: `${entry.continuity_id}.identity_anchor`,
        });
      }
    }

    if (entry.identity_anchor.length < 4) {
      violations.push({
        code: 'FAIL_IDENTITY_ANCHOR',
        message: `identity_anchor must contain at least four tokens on ${entry.continuity_id}`,
        field: `${entry.continuity_id}.identity_anchor`,
      });
    }

    for (const anchorField of [
      'facial_anchor',
      'body_anchor',
      'hair_anchor',
      'clothing_anchor',
    ] as const) {
      if (entry[anchorField].length < 3) {
        violations.push({
          code: 'FAIL_IDENTITY_ANCHOR',
          message: `${anchorField} must contain at least three tokens on ${entry.continuity_id}`,
          field: `${entry.continuity_id}.${anchorField}`,
        });
      }
    }
  }

  return violations;
}

function auditSceneReference(entries: CharacterContinuityEntry[]): CharacterContinuityViolation[] {
  const violations: CharacterContinuityViolation[] = [];
  const pairs = getPromptPackPairSeedLibrary();

  for (const entry of entries) {
    if (entry.scene_references.length !== pairs.length) {
      violations.push({
        code: 'FAIL_SCENE_REFERENCE',
        message: `scene_references must cover all prompt pairs on ${entry.continuity_id}`,
        field: `${entry.continuity_id}.scene_references`,
      });
    }

    for (const pairId of entry.scene_references) {
      if (!PAIR_IDS.has(pairId)) {
        violations.push({
          code: 'FAIL_SCENE_REFERENCE',
          message: `Unknown prompt pair reference "${pairId}" on ${entry.continuity_id}`,
          field: `${entry.continuity_id}.scene_references`,
        });
        continue;
      }

      const pair = getPromptPackPairById(pairId);
      if (!pair) continue;

      if (!pair.pair_id.startsWith('PAIR-SBD-song_master_01-')) {
        violations.push({
          code: 'FAIL_SCENE_REFERENCE',
          message: `Prompt pair must belong to ${CHARACTER_CONTINUITY_SONG_MASTER_ID} on ${entry.continuity_id}`,
          field: `${entry.continuity_id}.scene_references`,
        });
      }
    }

    const duplicateReferences = entry.scene_references.filter(
      (pairId, index) => entry.scene_references.indexOf(pairId) !== index
    );
    for (const pairId of [...new Set(duplicateReferences)]) {
      violations.push({
        code: 'FAIL_SCENE_REFERENCE',
        message: `Duplicate scene reference ${pairId} on ${entry.continuity_id}`,
        field: `${entry.continuity_id}.scene_references`,
      });
    }
  }

  const gonagi = entries.find((entry) => entry.character_id === 'CHAR-gonagi');
  const dana = entries.find((entry) => entry.character_id === 'CHAR-dana');
  if (gonagi && dana) {
    const gonagiSet = new Set(gonagi.scene_references);
    const danaSet = new Set(dana.scene_references);
    for (const pairId of gonagi.scene_references) {
      if (!danaSet.has(pairId)) {
        violations.push({
          code: 'FAIL_SCENE_REFERENCE',
          message: `Main characters must share prompt pair coverage for ${pairId}`,
          field: 'scene_references',
        });
      }
    }
    for (const pairId of dana.scene_references) {
      if (!gonagiSet.has(pairId)) {
        violations.push({
          code: 'FAIL_SCENE_REFERENCE',
          message: `Main characters must share prompt pair coverage for ${pairId}`,
          field: 'scene_references',
        });
      }
    }
  }

  return violations;
}

function auditDuplicateContinuity(
  entries: CharacterContinuityEntry[]
): CharacterContinuityViolation[] {
  const violations: CharacterContinuityViolation[] = [];

  for (const continuityId of findDuplicateContinuityIds(
    entries.map((entry) => entry.continuity_id)
  )) {
    violations.push({
      code: 'FAIL_DUPLICATE_CONTINUITY',
      message: `Duplicate continuity_id detected: ${continuityId}`,
      field: 'continuity_id',
    });
  }

  const characterIds = entries.map((entry) => entry.character_id);
  const duplicateCharacters = characterIds.filter(
    (characterId, index) => characterIds.indexOf(characterId) !== index
  );
  for (const characterId of [...new Set(duplicateCharacters)]) {
    violations.push({
      code: 'FAIL_DUPLICATE_CONTINUITY',
      message: `Duplicate character_id in continuity layer: ${characterId}`,
      field: 'character_id',
    });
  }

  return violations;
}

function auditContinuityScore(entries: CharacterContinuityEntry[]): CharacterContinuityViolation[] {
  const violations: CharacterContinuityViolation[] = [];
  const pairCount = getPromptPackPairSeedLibrary().length;

  for (const entry of entries) {
    if (entry.continuity_score < CONTINUITY_SCORE_MIN || entry.continuity_score > CONTINUITY_SCORE_MAX) {
      violations.push({
        code: 'FAIL_CONTINUITY_SCORE',
        message: `continuity_score must be between ${CONTINUITY_SCORE_MIN} and ${CONTINUITY_SCORE_MAX} on ${entry.continuity_id}`,
        field: `${entry.continuity_id}.continuity_score`,
      });
    }

    const expectedScore = pairCount
      ? Math.min(
          CONTINUITY_SCORE_MAX,
          Math.max(
            CONTINUITY_SCORE_MIN,
            Math.round((entry.scene_references.length / pairCount) * CONTINUITY_SCORE_MAX)
          )
        )
      : CONTINUITY_SCORE_MIN;

    if (entry.continuity_score !== expectedScore) {
      violations.push({
        code: 'FAIL_CONTINUITY_SCORE',
        message: `continuity_score must match scene coverage ratio on ${entry.continuity_id}`,
        field: `${entry.continuity_id}.continuity_score`,
      });
    }

    if (entry.scene_references.length === pairCount && entry.continuity_score !== CONTINUITY_SCORE_MAX) {
      violations.push({
        code: 'FAIL_CONTINUITY_SCORE',
        message: `Full scene coverage requires continuity_score ${CONTINUITY_SCORE_MAX} on ${entry.continuity_id}`,
        field: `${entry.continuity_id}.continuity_score`,
      });
    }
  }

  return violations;
}

function primaryFailure(
  violations: CharacterContinuityViolation[]
): CharacterContinuityAuditResult {
  const priority: CharacterContinuityAuditResult[] = [
    'FAIL_CONTINUITY_COMPLETENESS',
    'FAIL_DUPLICATE_CONTINUITY',
    'FAIL_CHARACTER_REFERENCE',
    'FAIL_IDENTITY_ANCHOR',
    'FAIL_SCENE_REFERENCE',
    'FAIL_CONTINUITY_SCORE',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditCharacterContinuity(projectRoot: string): CharacterContinuityViolation[] {
  void projectRoot;
  const entries = getCharacterContinuitySeedLibrary();
  const violations: CharacterContinuityViolation[] = [];

  violations.push(...auditContinuityCompleteness(entries));
  violations.push(...auditDuplicateContinuity(entries));
  violations.push(...auditCharacterReference(entries));
  violations.push(...auditIdentityAnchor(entries));
  violations.push(...auditSceneReference(entries));
  violations.push(...auditContinuityScore(entries));

  return violations;
}

export function writeCharacterContinuityPreview(
  projectRoot: string,
  preview: CharacterContinuityPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeCharacterContinuityReport(
  projectRoot: string,
  report: CharacterContinuityReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runCharacterContinuityAudit(projectRoot: string): CharacterContinuityReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditCharacterContinuity(projectRoot);

  const preview = buildCharacterContinuityPreview();
  if (preview.layer_version !== CHARACTER_CONTINUITY_VERSION) {
    violations.push({
      code: 'FAIL_CONTINUITY_COMPLETENESS',
      message: 'Preview layer_version mismatch',
      field: 'layer_version',
    });
  }

  writeCharacterContinuityPreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: CharacterContinuityReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeCharacterContinuityReport(projectRoot, report);
  return report;
}
