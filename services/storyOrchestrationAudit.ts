import fs from 'node:fs';
import path from 'node:path';
import { getCharacterContinuityById } from './characterContinuityDefinitions.js';
import { NARRATIVE_BEAT_SEED_COUNT, getNarrativeBeatSeedLibrary } from './narrativeBeatDefinitions.js';
import {
  getLocationsForStoryboardScene,
  getLocationContinuitySeedLibrary,
  type SeedLocationId,
} from './locationContinuityDefinitions.js';
import { STORYBOARD_SEED_COUNT, getStoryboardSceneSeedLibrary } from './storyboardLayerDefinitions.js';
import {
  ANTI_REPETITION_RULES_BASE,
  REQUIRED_STORY_ORCHESTRATION_FIELDS,
  STORY_ORCHESTRATION_ID,
  STORY_ORCHESTRATION_SEED_COUNT,
  STORY_ORCHESTRATION_SONG_MASTER_ID,
  STORY_ORCHESTRATION_VERSION,
  buildStoryOrchestrationPreview,
  findDuplicateOrchestrationIds,
  getCharacterContinuityIdsForOrchestration,
  getLocationContinuityIdsForOrchestration,
  getNarrativeBeatById,
  getSongMasterById,
  getStoryOrchestrationSeedLibrary,
  getStoryboardSceneById,
  parseDailyLifeContrastPair,
  parseOutputStoryBeatToken,
  type RequiredStoryOrchestrationField,
  type StoryOrchestrationEntry,
  type StoryOrchestrationPreview,
} from './storyOrchestrationDefinitions.js';
import { getWorldContinuityById, WORLD_CONTINUITY_WORLD_ID } from './worldContinuityDefinitions.js';

export type StoryOrchestrationAuditResult =
  | 'PASS'
  | 'FAIL_ORCHESTRATION_COMPLETENESS'
  | 'FAIL_SONG_REFERENCE'
  | 'FAIL_WORLD_REFERENCE'
  | 'FAIL_NARRATIVE_TURNS'
  | 'FAIL_CHARACTER_DECISION'
  | 'FAIL_DAILY_LIFE_CONTRAST'
  | 'FAIL_ANTI_REPETITION'
  | 'FAIL_OUTPUT_BEATS'
  | 'FAIL_DUPLICATE_ORCHESTRATION';

export interface StoryOrchestrationViolation {
  code: StoryOrchestrationAuditResult;
  message: string;
  field?: string;
}

export interface StoryOrchestrationReport {
  auditTimestamp: string;
  auditResult: StoryOrchestrationAuditResult;
  violations: StoryOrchestrationViolation[];
}

const PREVIEW_FILE = 'story-orchestration-preview.json';
const REPORT_FILE = 'story-orchestration-report.json';

const FORBIDDEN_GENERATION_TOKENS = [
  'invoke:ai-studio',
  'call:ai-studio',
  'ai-studio-generate',
  'generate:image',
  'trigger:generation',
  'run:gpu',
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

function auditOrchestrationCompleteness(
  entries: StoryOrchestrationEntry[]
): StoryOrchestrationViolation[] {
  const violations: StoryOrchestrationViolation[] = [];

  if (entries.length !== STORY_ORCHESTRATION_SEED_COUNT) {
    violations.push({
      code: 'FAIL_ORCHESTRATION_COMPLETENESS',
      message: `Story orchestration layer must contain exactly ${STORY_ORCHESTRATION_SEED_COUNT} entry for ${STORY_ORCHESTRATION_SONG_MASTER_ID}`,
      field: 'seed_story_orchestration.length',
    });
  }

  for (const entry of entries) {
    for (const field of REQUIRED_STORY_ORCHESTRATION_FIELDS) {
      const value = entry[field as RequiredStoryOrchestrationField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_ORCHESTRATION_COMPLETENESS',
          message: `Missing required field ${field} on ${entry.orchestration_id}`,
          field: `${entry.orchestration_id}.${field}`,
        });
        continue;
      }

      if (
        field === 'emotional_arc' ||
        field === 'narrative_turns' ||
        field === 'character_decisions' ||
        field === 'daily_life_contrast' ||
        field === 'scene_variation_rules' ||
        field === 'anti_repetition_rules' ||
        field === 'cinematic_influence_tags' ||
        field === 'output_story_beats' ||
        field === 'keywords'
      ) {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_ORCHESTRATION_COMPLETENESS',
            message: `Field ${field} must be a non-empty string array on ${entry.orchestration_id}`,
            field: `${entry.orchestration_id}.${field}`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_ORCHESTRATION_COMPLETENESS',
          message: `Field ${field} must be a non-empty string on ${entry.orchestration_id}`,
          field: `${entry.orchestration_id}.${field}`,
        });
      }
    }

    if (entry.orchestration_id !== STORY_ORCHESTRATION_ID) {
      violations.push({
        code: 'FAIL_ORCHESTRATION_COMPLETENESS',
        message: `orchestration_id must be ${STORY_ORCHESTRATION_ID}`,
        field: `${entry.orchestration_id}.orchestration_id`,
      });
    }
  }

  const serialized = JSON.stringify(entries).toLowerCase();
  for (const token of FORBIDDEN_GENERATION_TOKENS) {
    if (serialized.includes(token)) {
      violations.push({
        code: 'FAIL_ORCHESTRATION_COMPLETENESS',
        message: `Forbidden generation token "${token}" found in orchestration layer`,
        field: 'orchestration',
      });
    }
  }

  return violations;
}

function auditSongReference(entry: StoryOrchestrationEntry): StoryOrchestrationViolation[] {
  const violations: StoryOrchestrationViolation[] = [];

  if (entry.song_master_id !== STORY_ORCHESTRATION_SONG_MASTER_ID) {
    violations.push({
      code: 'FAIL_SONG_REFERENCE',
      message: `song_master_id must be ${STORY_ORCHESTRATION_SONG_MASTER_ID}`,
      field: `${entry.orchestration_id}.song_master_id`,
    });
  }

  const songMaster = getSongMasterById(entry.song_master_id);
  if (!songMaster) {
    violations.push({
      code: 'FAIL_SONG_REFERENCE',
      message: `Missing song master ${entry.song_master_id}`,
      field: `${entry.orchestration_id}.song_master_id`,
    });
    return violations;
  }

  if (!entry.story_theme.toLowerCase().includes(songMaster.primary_emotion)) {
    violations.push({
      code: 'FAIL_SONG_REFERENCE',
      message: 'story_theme must reference song master primary emotion',
      field: `${entry.orchestration_id}.story_theme`,
    });
  }

  if (!entry.keywords.includes(entry.song_master_id)) {
    violations.push({
      code: 'FAIL_SONG_REFERENCE',
      message: 'keywords must include song_master_id',
      field: `${entry.orchestration_id}.keywords`,
    });
  }

  const hasTimelineArc = entry.emotional_arc.some((token) => token.startsWith('timeline:'));
  if (!hasTimelineArc) {
    violations.push({
      code: 'FAIL_SONG_REFERENCE',
      message: 'emotional_arc must include song master emotion timeline segments',
      field: `${entry.orchestration_id}.emotional_arc`,
    });
  }

  return violations;
}

function auditWorldReference(entry: StoryOrchestrationEntry): StoryOrchestrationViolation[] {
  const violations: StoryOrchestrationViolation[] = [];

  if (entry.world_id !== WORLD_CONTINUITY_WORLD_ID) {
    violations.push({
      code: 'FAIL_WORLD_REFERENCE',
      message: `world_id must be ${WORLD_CONTINUITY_WORLD_ID}`,
      field: `${entry.orchestration_id}.world_id`,
    });
  }

  const world = getWorldContinuityById(entry.world_id);
  if (!world) {
    violations.push({
      code: 'FAIL_WORLD_REFERENCE',
      message: `Missing world continuity ${entry.world_id}`,
      field: `${entry.orchestration_id}.world_id`,
    });
    return violations;
  }

  if (world.song_master_id !== entry.song_master_id) {
    violations.push({
      code: 'FAIL_WORLD_REFERENCE',
      message: 'World continuity song_master_id must match orchestration',
      field: `${entry.orchestration_id}.world_id`,
    });
  }

  for (const continuityId of getCharacterContinuityIdsForOrchestration()) {
    if (!world.character_continuity_ids.includes(continuityId)) {
      violations.push({
        code: 'FAIL_WORLD_REFERENCE',
        message: `World continuity must reference character continuity ${continuityId}`,
        field: `${entry.orchestration_id}.world_id`,
      });
    }
  }

  for (const locationId of getLocationContinuityIdsForOrchestration()) {
    if (!world.location_continuity_ids.includes(locationId)) {
      violations.push({
        code: 'FAIL_WORLD_REFERENCE',
        message: `World continuity must reference location continuity ${locationId}`,
        field: `${entry.orchestration_id}.world_id`,
      });
    }
  }

  const hasWorldArc = entry.emotional_arc.some((token) => token.startsWith('world-arc:'));
  if (!hasWorldArc) {
    violations.push({
      code: 'FAIL_WORLD_REFERENCE',
      message: 'emotional_arc must include world continuity arc tokens',
      field: `${entry.orchestration_id}.emotional_arc`,
    });
  }

  if (!entry.keywords.includes(`world:${WORLD_CONTINUITY_WORLD_ID}`)) {
    violations.push({
      code: 'FAIL_WORLD_REFERENCE',
      message: 'keywords must reference world continuity id',
      field: `${entry.orchestration_id}.keywords`,
    });
  }

  return violations;
}

function auditNarrativeTurns(entry: StoryOrchestrationEntry): StoryOrchestrationViolation[] {
  const violations: StoryOrchestrationViolation[] = [];

  if (entry.narrative_turns.length !== STORYBOARD_SEED_COUNT) {
    violations.push({
      code: 'FAIL_NARRATIVE_TURNS',
      message: `narrative_turns must contain ${STORYBOARD_SEED_COUNT} scene turns`,
      field: `${entry.orchestration_id}.narrative_turns`,
    });
  }

  const beats = getNarrativeBeatSeedLibrary();
  if (beats.length !== NARRATIVE_BEAT_SEED_COUNT) {
    violations.push({
      code: 'FAIL_NARRATIVE_TURNS',
      message: 'Narrative beat library must contain 16 beats',
      field: 'narrative_beat',
    });
  }

  for (const turn of entry.narrative_turns) {
    if (!turn.startsWith('turn:')) {
      violations.push({
        code: 'FAIL_NARRATIVE_TURNS',
        message: `Invalid narrative turn token "${turn}"`,
        field: `${entry.orchestration_id}.narrative_turns`,
      });
      continue;
    }

    const parts = turn.split(':');
    const beatId = parts[2];
    if (!beatId || !getNarrativeBeatById(beatId)) {
      violations.push({
        code: 'FAIL_NARRATIVE_TURNS',
        message: `narrative_turn must reference valid beat_id in "${turn}"`,
        field: `${entry.orchestration_id}.narrative_turns`,
      });
    }
  }

  const turnBeatIds = entry.narrative_turns.map((turn) => turn.split(':')[2]).filter(Boolean);
  const duplicateBeatIds = turnBeatIds.filter(
    (beatId, index) => turnBeatIds.indexOf(beatId) !== index
  );
  for (const beatId of [...new Set(duplicateBeatIds)]) {
    violations.push({
      code: 'FAIL_NARRATIVE_TURNS',
      message: `Duplicate beat reference in narrative_turns: ${beatId}`,
      field: `${entry.orchestration_id}.narrative_turns`,
    });
  }

  return violations;
}

function auditCharacterDecision(entry: StoryOrchestrationEntry): StoryOrchestrationViolation[] {
  const violations: StoryOrchestrationViolation[] = [];

  if (entry.character_decisions.length < STORYBOARD_SEED_COUNT * 2) {
    violations.push({
      code: 'FAIL_CHARACTER_DECISION',
      message: 'character_decisions must cover both main characters across scenes',
      field: `${entry.orchestration_id}.character_decisions`,
    });
  }

  for (const continuityId of getCharacterContinuityIdsForOrchestration()) {
    if (!entry.character_decisions.some((token) => token.includes(continuityId))) {
      violations.push({
        code: 'FAIL_CHARACTER_DECISION',
        message: `character_decisions must reference ${continuityId}`,
        field: `${entry.orchestration_id}.character_decisions`,
      });
    }

    if (!getCharacterContinuityById(continuityId)) {
      violations.push({
        code: 'FAIL_CHARACTER_DECISION',
        message: `Missing character continuity entry ${continuityId}`,
        field: `${entry.orchestration_id}.character_decisions`,
      });
    }
  }

  const scenes = getStoryboardSceneSeedLibrary();
  for (const scene of scenes) {
    const gonagiDecision = entry.character_decisions.find(
      (token) => token.includes(scene.storyboard_id) && token.includes('CHAR-gonagi')
    );
    const danaDecision = entry.character_decisions.find(
      (token) => token.includes(scene.storyboard_id) && token.includes('CHAR-dana')
    );

    if (!gonagiDecision || !danaDecision) {
      violations.push({
        code: 'FAIL_CHARACTER_DECISION',
        message: `Missing character decisions for ${scene.storyboard_id}`,
        field: `${entry.orchestration_id}.character_decisions`,
      });
    }
  }

  return violations;
}

function auditDailyLifeContrast(entry: StoryOrchestrationEntry): StoryOrchestrationViolation[] {
  const violations: StoryOrchestrationViolation[] = [];

  if (entry.daily_life_contrast.length < STORYBOARD_SEED_COUNT) {
    violations.push({
      code: 'FAIL_DAILY_LIFE_CONTRAST',
      message: 'daily_life_contrast must include per-scene and transition contrasts',
      field: `${entry.orchestration_id}.daily_life_contrast`,
    });
  }

  const transitionContrasts = entry.daily_life_contrast.filter((token) =>
    token.startsWith('contrast:scene-')
  );
  if (transitionContrasts.length !== STORYBOARD_SEED_COUNT - 1) {
    violations.push({
      code: 'FAIL_DAILY_LIFE_CONTRAST',
      message: `daily_life_contrast must include ${STORYBOARD_SEED_COUNT - 1} transition contrasts`,
      field: `${entry.orchestration_id}.daily_life_contrast`,
    });
  }

  for (const contrast of transitionContrasts) {
    const pair = parseDailyLifeContrastPair(contrast);
    if (!pair) {
      violations.push({
        code: 'FAIL_DAILY_LIFE_CONTRAST',
        message: `Invalid daily life contrast token "${contrast}"`,
        field: `${entry.orchestration_id}.daily_life_contrast`,
      });
      continue;
    }

    if (pair.fromAnchor === pair.toAnchor) {
      violations.push({
        code: 'FAIL_DAILY_LIFE_CONTRAST',
        message: `Consecutive scenes must contrast daily life anchors in "${contrast}"`,
        field: `${entry.orchestration_id}.daily_life_contrast`,
      });
    }
  }

  return violations;
}

function auditAntiRepetition(entry: StoryOrchestrationEntry): StoryOrchestrationViolation[] {
  const violations: StoryOrchestrationViolation[] = [];

  for (const rule of ANTI_REPETITION_RULES_BASE) {
    if (!entry.anti_repetition_rules.includes(rule)) {
      violations.push({
        code: 'FAIL_ANTI_REPETITION',
        message: `anti_repetition_rules must include "${rule}"`,
        field: `${entry.orchestration_id}.anti_repetition_rules`,
      });
    }
  }

  const scenes = getStoryboardSceneSeedLibrary();
  for (let index = 1; index < scenes.length; index += 1) {
    const previous = scenes[index - 1];
    const current = scenes[index];

    if (previous.emotion_id === current.emotion_id) {
      const hasEmotionGuard = entry.anti_repetition_rules.some((rule) =>
        rule.includes('no-consecutive-same-emotion-beat')
      );
      if (!hasEmotionGuard) {
        violations.push({
          code: 'FAIL_ANTI_REPETITION',
          message: 'anti_repetition_rules must guard consecutive same emotion',
          field: `${entry.orchestration_id}.anti_repetition_rules`,
        });
      }
    }

    const previousLocation = getLocationsForStoryboardScene(previous.storyboard_id)[0];
    const currentLocation = getLocationsForStoryboardScene(current.storyboard_id)[0];
    if (previousLocation === currentLocation) {
      const contrast = entry.daily_life_contrast.find((token) =>
        token.includes(
          `scene-${String(previous.scene_order).padStart(2, '0')}-to-${String(current.scene_order).padStart(2, '0')}`
        )
      );
      if (!contrast) {
        violations.push({
          code: 'FAIL_ANTI_REPETITION',
          message: `Same-location consecutive scenes require contrast entry for ${previous.storyboard_id} to ${current.storyboard_id}`,
          field: `${entry.orchestration_id}.daily_life_contrast`,
        });
      }
    }

    const previousPrimaryAnchor = previous.daily_life_anchor[0];
    const currentPrimaryAnchor = current.daily_life_anchor[0];
    if (previousPrimaryAnchor === currentPrimaryAnchor) {
      violations.push({
        code: 'FAIL_ANTI_REPETITION',
        message: `Consecutive scenes repeat primary daily life anchor ${previousPrimaryAnchor}`,
        field: `${entry.orchestration_id}.daily_life_contrast`,
      });
    }
  }

  if (!entry.keywords.includes('anti-elementary-repetition')) {
    violations.push({
      code: 'FAIL_ANTI_REPETITION',
      message: 'keywords must declare anti-elementary-repetition intent',
      field: `${entry.orchestration_id}.keywords`,
    });
  }

  return violations;
}

function auditOutputBeats(entry: StoryOrchestrationEntry): StoryOrchestrationViolation[] {
  const violations: StoryOrchestrationViolation[] = [];

  if (entry.output_story_beats.length !== STORYBOARD_SEED_COUNT) {
    violations.push({
      code: 'FAIL_OUTPUT_BEATS',
      message: `output_story_beats must contain ${STORYBOARD_SEED_COUNT} beats`,
      field: `${entry.orchestration_id}.output_story_beats`,
    });
  }

  for (const beatToken of entry.output_story_beats) {
    const parsed = parseOutputStoryBeatToken(beatToken);
    if (!parsed) {
      violations.push({
        code: 'FAIL_OUTPUT_BEATS',
        message: `Invalid output_story_beats token "${beatToken}"`,
        field: `${entry.orchestration_id}.output_story_beats`,
      });
      continue;
    }

    if (!getNarrativeBeatById(parsed.beatId)) {
      violations.push({
        code: 'FAIL_OUTPUT_BEATS',
        message: `output_story_beats references unknown beat ${parsed.beatId}`,
        field: `${entry.orchestration_id}.output_story_beats`,
      });
    }

    const scene = getStoryboardSceneById(parsed.storyboardId);
    if (!scene) {
      violations.push({
        code: 'FAIL_OUTPUT_BEATS',
        message: `output_story_beats references unknown storyboard ${parsed.storyboardId}`,
        field: `${entry.orchestration_id}.output_story_beats`,
      });
      continue;
    }

    if (scene.beat_id !== parsed.beatId) {
      violations.push({
        code: 'FAIL_OUTPUT_BEATS',
        message: `output_story_beats beat mismatch on ${parsed.storyboardId}`,
        field: `${entry.orchestration_id}.output_story_beats`,
      });
    }
  }

  const storyboardIds = entry.output_story_beats
    .map((token) => parseOutputStoryBeatToken(token)?.storyboardId)
    .filter(Boolean);
  const duplicateStoryboards = storyboardIds.filter(
    (storyboardId, index) => storyboardIds.indexOf(storyboardId) !== index
  );
  for (const storyboardId of [...new Set(duplicateStoryboards)]) {
    violations.push({
      code: 'FAIL_OUTPUT_BEATS',
      message: `Duplicate storyboard in output_story_beats: ${storyboardId}`,
      field: `${entry.orchestration_id}.output_story_beats`,
    });
  }

  return violations;
}

function auditDuplicateOrchestration(
  entries: StoryOrchestrationEntry[]
): StoryOrchestrationViolation[] {
  const violations: StoryOrchestrationViolation[] = [];

  for (const orchestrationId of findDuplicateOrchestrationIds(
    entries.map((entry) => entry.orchestration_id)
  )) {
    violations.push({
      code: 'FAIL_DUPLICATE_ORCHESTRATION',
      message: `Duplicate orchestration_id detected: ${orchestrationId}`,
      field: 'orchestration_id',
    });
  }

  const songMasterIds = entries.map((entry) => entry.song_master_id);
  const duplicateSongMasters = songMasterIds.filter(
    (songMasterId, index) => songMasterIds.indexOf(songMasterId) !== index
  );
  for (const songMasterId of [...new Set(duplicateSongMasters)]) {
    violations.push({
      code: 'FAIL_DUPLICATE_ORCHESTRATION',
      message: `Duplicate song_master_id in orchestration layer: ${songMasterId}`,
      field: 'song_master_id',
    });
  }

  return violations;
}

function primaryFailure(
  violations: StoryOrchestrationViolation[]
): StoryOrchestrationAuditResult {
  const priority: StoryOrchestrationAuditResult[] = [
    'FAIL_ORCHESTRATION_COMPLETENESS',
    'FAIL_DUPLICATE_ORCHESTRATION',
    'FAIL_SONG_REFERENCE',
    'FAIL_WORLD_REFERENCE',
    'FAIL_NARRATIVE_TURNS',
    'FAIL_CHARACTER_DECISION',
    'FAIL_DAILY_LIFE_CONTRAST',
    'FAIL_ANTI_REPETITION',
    'FAIL_OUTPUT_BEATS',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditStoryOrchestration(projectRoot: string): StoryOrchestrationViolation[] {
  void projectRoot;
  const entries = getStoryOrchestrationSeedLibrary();
  const violations: StoryOrchestrationViolation[] = [];

  violations.push(...auditOrchestrationCompleteness(entries));
  violations.push(...auditDuplicateOrchestration(entries));

  for (const entry of entries) {
    violations.push(...auditSongReference(entry));
    violations.push(...auditWorldReference(entry));
    violations.push(...auditNarrativeTurns(entry));
    violations.push(...auditCharacterDecision(entry));
    violations.push(...auditDailyLifeContrast(entry));
    violations.push(...auditAntiRepetition(entry));
    violations.push(...auditOutputBeats(entry));
  }

  return violations;
}

export function writeStoryOrchestrationPreview(
  projectRoot: string,
  preview: StoryOrchestrationPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeStoryOrchestrationReport(
  projectRoot: string,
  report: StoryOrchestrationReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runStoryOrchestrationAudit(projectRoot: string): StoryOrchestrationReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditStoryOrchestration(projectRoot);

  const preview = buildStoryOrchestrationPreview();
  if (preview.layer_version !== STORY_ORCHESTRATION_VERSION) {
    violations.push({
      code: 'FAIL_ORCHESTRATION_COMPLETENESS',
      message: 'Preview layer_version mismatch',
      field: 'layer_version',
    });
  }

  writeStoryOrchestrationPreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: StoryOrchestrationReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeStoryOrchestrationReport(projectRoot, report);
  return report;
}
