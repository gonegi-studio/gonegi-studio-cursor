import fs from 'node:fs';
import path from 'node:path';
import {
  getCharacterContinuitySeedLibrary,
} from './characterContinuityDefinitions.js';
import {
  getLocationContinuitySeedLibrary,
  SEED_LOCATION_IDS,
} from './locationContinuityDefinitions.js';
import { getPromptPackPairSeedLibrary } from './promptPackPairingDefinitions.js';
import { getStoryboardSceneSeedLibrary } from './storyboardLayerDefinitions.js';
import {
  CONTINUITY_SCORE_MAX,
  CONTINUITY_SCORE_MIN,
  REQUIRED_WORLD_CONTINUITY_FIELDS,
  WORLD_CONTINUITY_SEED_COUNT,
  WORLD_CONTINUITY_SONG_MASTER_ID,
  WORLD_CONTINUITY_VERSION,
  WORLD_CONTINUITY_WORLD_ID,
  buildWorldContinuityPreview,
  getCharacterContinuityEntryById,
  getExpectedWorldContinuityScore,
  getLocationContinuityEntryById,
  getRequiredEmotionalArcTokens,
  getRequiredRecurringMotifs,
  getWorldContinuitySeedLibrary,
  type RequiredWorldContinuityField,
  type WorldContinuityEntry,
  type WorldContinuityPreview,
} from './worldContinuityDefinitions.js';

export type WorldContinuityAuditResult =
  | 'PASS'
  | 'FAIL_WORLD_COMPLETENESS'
  | 'FAIL_CHARACTER_CONTINUITY_REFERENCE'
  | 'FAIL_LOCATION_CONTINUITY_REFERENCE'
  | 'FAIL_SCENE_REFERENCE'
  | 'FAIL_MOTIF_INTEGRITY'
  | 'FAIL_WORLD_ARC'
  | 'FAIL_CONTINUITY_SCORE';

export interface WorldContinuityViolation {
  code: WorldContinuityAuditResult;
  message: string;
  field?: string;
}

export interface WorldContinuityReport {
  auditTimestamp: string;
  auditResult: WorldContinuityAuditResult;
  violations: WorldContinuityViolation[];
}

const PREVIEW_FILE = 'world-continuity-preview.json';
const REPORT_FILE = 'world-continuity-report.json';

const CHARACTER_CONTINUITY_IDS = new Set(
  getCharacterContinuitySeedLibrary().map((entry) => entry.continuity_id)
);

const LOCATION_CONTINUITY_IDS = new Set(
  getLocationContinuitySeedLibrary().map((entry) => entry.location_id)
);

const STORYBOARD_IDS = new Set(
  getStoryboardSceneSeedLibrary().map((scene) => scene.storyboard_id)
);

const PAIR_IDS = new Set(getPromptPackPairSeedLibrary().map((pair) => pair.pair_id));

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

function auditWorldCompleteness(entries: WorldContinuityEntry[]): WorldContinuityViolation[] {
  const violations: WorldContinuityViolation[] = [];

  if (entries.length !== WORLD_CONTINUITY_SEED_COUNT) {
    violations.push({
      code: 'FAIL_WORLD_COMPLETENESS',
      message: `World continuity layer must contain exactly ${WORLD_CONTINUITY_SEED_COUNT} world for ${WORLD_CONTINUITY_SONG_MASTER_ID}`,
      field: 'seed_world_continuity.length',
    });
  }

  for (const entry of entries) {
    for (const field of REQUIRED_WORLD_CONTINUITY_FIELDS) {
      const value = entry[field as RequiredWorldContinuityField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_WORLD_COMPLETENESS',
          message: `Missing required field ${field} on world ${entry.world_id}`,
          field: `${entry.world_id}.${field}`,
        });
        continue;
      }

      if (
        field === 'character_continuity_ids' ||
        field === 'location_continuity_ids' ||
        field === 'world_tone' ||
        field === 'recurring_motifs' ||
        field === 'time_of_day_pattern' ||
        field === 'weather_pattern' ||
        field === 'emotional_world_arc' ||
        field === 'scene_references'
      ) {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_WORLD_COMPLETENESS',
            message: `Field ${field} must be a non-empty string array on world ${entry.world_id}`,
            field: `${entry.world_id}.${field}`,
          });
        }
        continue;
      }

      if (field === 'continuity_score') {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          violations.push({
            code: 'FAIL_WORLD_COMPLETENESS',
            message: `Field continuity_score must be an integer on world ${entry.world_id}`,
            field: `${entry.world_id}.continuity_score`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_WORLD_COMPLETENESS',
          message: `Field ${field} must be a non-empty string on world ${entry.world_id}`,
          field: `${entry.world_id}.${field}`,
        });
      }
    }

    if (entry.world_id !== WORLD_CONTINUITY_WORLD_ID) {
      violations.push({
        code: 'FAIL_WORLD_COMPLETENESS',
        message: `world_id must be ${WORLD_CONTINUITY_WORLD_ID}`,
        field: `${entry.world_id}.world_id`,
      });
    }

    if (entry.song_master_id !== WORLD_CONTINUITY_SONG_MASTER_ID) {
      violations.push({
        code: 'FAIL_WORLD_COMPLETENESS',
        message: `song_master_id must be ${WORLD_CONTINUITY_SONG_MASTER_ID}`,
        field: `${entry.world_id}.song_master_id`,
      });
    }
  }

  if (!entries.some((entry) => entry.world_id === WORLD_CONTINUITY_WORLD_ID)) {
    violations.push({
      code: 'FAIL_WORLD_COMPLETENESS',
      message: `Missing world continuity entry for ${WORLD_CONTINUITY_WORLD_ID}`,
      field: WORLD_CONTINUITY_WORLD_ID,
    });
  }

  return violations;
}

function auditCharacterContinuityReference(
  entries: WorldContinuityEntry[]
): WorldContinuityViolation[] {
  const violations: WorldContinuityViolation[] = [];

  for (const entry of entries) {
    for (const continuityId of CHARACTER_CONTINUITY_IDS) {
      if (!entry.character_continuity_ids.includes(continuityId)) {
        violations.push({
          code: 'FAIL_CHARACTER_CONTINUITY_REFERENCE',
          message: `character_continuity_ids must include ${continuityId}`,
          field: `${entry.world_id}.character_continuity_ids`,
        });
      }
    }

    for (const continuityId of entry.character_continuity_ids) {
      if (!CHARACTER_CONTINUITY_IDS.has(continuityId)) {
        violations.push({
          code: 'FAIL_CHARACTER_CONTINUITY_REFERENCE',
          message: `Unknown character continuity id "${continuityId}" on ${entry.world_id}`,
          field: `${entry.world_id}.character_continuity_ids`,
        });
        continue;
      }

      const characterEntry = getCharacterContinuityEntryById(continuityId);
      if (!characterEntry) continue;

      if (!characterEntry.continuity_id.startsWith('CCN-')) {
        violations.push({
          code: 'FAIL_CHARACTER_CONTINUITY_REFERENCE',
          message: `Invalid character continuity id format on ${entry.world_id}`,
          field: `${entry.world_id}.character_continuity_ids`,
        });
      }
    }
  }

  return violations;
}

function auditLocationContinuityReference(
  entries: WorldContinuityEntry[]
): WorldContinuityViolation[] {
  const violations: WorldContinuityViolation[] = [];

  for (const entry of entries) {
    for (const locationId of SEED_LOCATION_IDS) {
      if (!entry.location_continuity_ids.includes(locationId)) {
        violations.push({
          code: 'FAIL_LOCATION_CONTINUITY_REFERENCE',
          message: `location_continuity_ids must include ${locationId}`,
          field: `${entry.world_id}.location_continuity_ids`,
        });
      }
    }

    for (const locationId of entry.location_continuity_ids) {
      if (!LOCATION_CONTINUITY_IDS.has(locationId)) {
        violations.push({
          code: 'FAIL_LOCATION_CONTINUITY_REFERENCE',
          message: `Unknown location continuity id "${locationId}" on ${entry.world_id}`,
          field: `${entry.world_id}.location_continuity_ids`,
        });
        continue;
      }

      const locationEntry = getLocationContinuityEntryById(locationId);
      if (!locationEntry) continue;

      if (locationEntry.location_id !== locationId) {
        violations.push({
          code: 'FAIL_LOCATION_CONTINUITY_REFERENCE',
          message: `Location continuity reference mismatch on ${entry.world_id}`,
          field: `${entry.world_id}.location_continuity_ids`,
        });
      }
    }
  }

  return violations;
}

function auditSceneReference(entries: WorldContinuityEntry[]): WorldContinuityViolation[] {
  const violations: WorldContinuityViolation[] = [];

  for (const entry of entries) {
    const storyboardReferences = entry.scene_references.filter((reference) =>
      reference.startsWith('storyboard:')
    );
    const pairReferences = entry.scene_references.filter((reference) =>
      reference.startsWith('pair:')
    );

    if (storyboardReferences.length !== STORYBOARD_IDS.size) {
      violations.push({
        code: 'FAIL_SCENE_REFERENCE',
        message: `scene_references must cover all storyboard scenes on ${entry.world_id}`,
        field: `${entry.world_id}.scene_references`,
      });
    }

    if (pairReferences.length !== PAIR_IDS.size) {
      violations.push({
        code: 'FAIL_SCENE_REFERENCE',
        message: `scene_references must cover all prompt pairs on ${entry.world_id}`,
        field: `${entry.world_id}.scene_references`,
      });
    }

    for (const storyboardId of STORYBOARD_IDS) {
      const storyboardToken = `storyboard:${storyboardId}`;
      if (!entry.scene_references.includes(storyboardToken)) {
        violations.push({
          code: 'FAIL_SCENE_REFERENCE',
          message: `scene_references must include ${storyboardToken}`,
          field: `${entry.world_id}.scene_references`,
        });
      }

      const pairId = `PAIR-${storyboardId}`;
      const pairToken = `pair:${pairId}`;
      if (!entry.scene_references.includes(pairToken)) {
        violations.push({
          code: 'FAIL_SCENE_REFERENCE',
          message: `scene_references must include ${pairToken}`,
          field: `${entry.world_id}.scene_references`,
        });
      }

      if (!PAIR_IDS.has(pairId)) {
        violations.push({
          code: 'FAIL_SCENE_REFERENCE',
          message: `Missing prompt pair for ${storyboardId}`,
          field: `${entry.world_id}.scene_references`,
        });
      }
    }

    for (const reference of entry.scene_references) {
      if (reference.startsWith('storyboard:')) {
        const storyboardId = reference.slice('storyboard:'.length);
        if (!STORYBOARD_IDS.has(storyboardId)) {
          violations.push({
            code: 'FAIL_SCENE_REFERENCE',
            message: `Unknown storyboard reference "${storyboardId}" on ${entry.world_id}`,
            field: `${entry.world_id}.scene_references`,
          });
        }
      }

      if (reference.startsWith('pair:')) {
        const pairId = reference.slice('pair:'.length);
        if (!PAIR_IDS.has(pairId)) {
          violations.push({
            code: 'FAIL_SCENE_REFERENCE',
            message: `Unknown pair reference "${pairId}" on ${entry.world_id}`,
            field: `${entry.world_id}.scene_references`,
          });
        }
      }
    }
  }

  return violations;
}

function auditMotifIntegrity(entries: WorldContinuityEntry[]): WorldContinuityViolation[] {
  const violations: WorldContinuityViolation[] = [];
  const requiredMotifs = getRequiredRecurringMotifs();

  for (const entry of entries) {
    for (const motif of requiredMotifs) {
      if (!entry.recurring_motifs.includes(motif)) {
        violations.push({
          code: 'FAIL_MOTIF_INTEGRITY',
          message: `recurring_motifs must include ${motif} on ${entry.world_id}`,
          field: `${entry.world_id}.recurring_motifs`,
        });
      }
    }

    const motifPrefixCount = entry.recurring_motifs.filter((motif) =>
      motif.startsWith('motif:')
    ).length;
    if (motifPrefixCount < 5) {
      violations.push({
        code: 'FAIL_MOTIF_INTEGRITY',
        message: `recurring_motifs must include at least five motif tokens on ${entry.world_id}`,
        field: `${entry.world_id}.recurring_motifs`,
      });
    }

    if (!entry.world_tone.some((tone) => tone.includes('gonagi'))) {
      violations.push({
        code: 'FAIL_MOTIF_INTEGRITY',
        message: `world_tone must include gonagi continuity token on ${entry.world_id}`,
        field: `${entry.world_id}.world_tone`,
      });
    }
  }

  return violations;
}

function auditWorldArc(entries: WorldContinuityEntry[]): WorldContinuityViolation[] {
  const violations: WorldContinuityViolation[] = [];
  const requiredArcTokens = getRequiredEmotionalArcTokens();

  for (const entry of entries) {
    for (const arcToken of requiredArcTokens) {
      if (!entry.emotional_world_arc.includes(arcToken)) {
        violations.push({
          code: 'FAIL_WORLD_ARC',
          message: `emotional_world_arc must include ${arcToken} on ${entry.world_id}`,
          field: `${entry.world_id}.emotional_world_arc`,
        });
      }
    }

    if (!entry.emotional_world_arc.some((token) => token.startsWith('arc:primary-emotion:'))) {
      violations.push({
        code: 'FAIL_WORLD_ARC',
        message: `emotional_world_arc must include primary emotion token on ${entry.world_id}`,
        field: `${entry.world_id}.emotional_world_arc`,
      });
    }

    if (!entry.emotional_world_arc.some((token) => token.startsWith('arc:primary-relationship:'))) {
      violations.push({
        code: 'FAIL_WORLD_ARC',
        message: `emotional_world_arc must include primary relationship token on ${entry.world_id}`,
        field: `${entry.world_id}.emotional_world_arc`,
      });
    }

    const timelineArcCount = entry.emotional_world_arc.filter((token) =>
      /^arc:\d+-\d+s:/.test(token)
    ).length;
    if (timelineArcCount < 6) {
      violations.push({
        code: 'FAIL_WORLD_ARC',
        message: `emotional_world_arc must include song master timeline segments on ${entry.world_id}`,
        field: `${entry.world_id}.emotional_world_arc`,
      });
    }
  }

  return violations;
}

function auditContinuityScore(entries: WorldContinuityEntry[]): WorldContinuityViolation[] {
  const violations: WorldContinuityViolation[] = [];
  const expectedScore = getExpectedWorldContinuityScore();

  for (const entry of entries) {
    if (entry.continuity_score < CONTINUITY_SCORE_MIN || entry.continuity_score > CONTINUITY_SCORE_MAX) {
      violations.push({
        code: 'FAIL_CONTINUITY_SCORE',
        message: `continuity_score must be between ${CONTINUITY_SCORE_MIN} and ${CONTINUITY_SCORE_MAX} on ${entry.world_id}`,
        field: `${entry.world_id}.continuity_score`,
      });
    }

    if (entry.continuity_score !== expectedScore) {
      violations.push({
        code: 'FAIL_CONTINUITY_SCORE',
        message: `continuity_score must match computed world coverage on ${entry.world_id}`,
        field: `${entry.world_id}.continuity_score`,
      });
    }
  }

  return violations;
}

function primaryFailure(violations: WorldContinuityViolation[]): WorldContinuityAuditResult {
  const priority: WorldContinuityAuditResult[] = [
    'FAIL_WORLD_COMPLETENESS',
    'FAIL_CHARACTER_CONTINUITY_REFERENCE',
    'FAIL_LOCATION_CONTINUITY_REFERENCE',
    'FAIL_SCENE_REFERENCE',
    'FAIL_MOTIF_INTEGRITY',
    'FAIL_WORLD_ARC',
    'FAIL_CONTINUITY_SCORE',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditWorldContinuity(projectRoot: string): WorldContinuityViolation[] {
  void projectRoot;
  const entries = getWorldContinuitySeedLibrary();
  const violations: WorldContinuityViolation[] = [];

  violations.push(...auditWorldCompleteness(entries));
  violations.push(...auditCharacterContinuityReference(entries));
  violations.push(...auditLocationContinuityReference(entries));
  violations.push(...auditSceneReference(entries));
  violations.push(...auditMotifIntegrity(entries));
  violations.push(...auditWorldArc(entries));
  violations.push(...auditContinuityScore(entries));

  return violations;
}

export function writeWorldContinuityPreview(
  projectRoot: string,
  preview: WorldContinuityPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeWorldContinuityReport(
  projectRoot: string,
  report: WorldContinuityReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runWorldContinuityAudit(projectRoot: string): WorldContinuityReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditWorldContinuity(projectRoot);

  const preview = buildWorldContinuityPreview();
  if (preview.layer_version !== WORLD_CONTINUITY_VERSION) {
    violations.push({
      code: 'FAIL_WORLD_COMPLETENESS',
      message: 'Preview layer_version mismatch',
      field: 'layer_version',
    });
  }

  writeWorldContinuityPreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: WorldContinuityReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeWorldContinuityReport(projectRoot, report);
  return report;
}
