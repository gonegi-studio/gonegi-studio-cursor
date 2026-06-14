import fs from 'node:fs';
import path from 'node:path';
import { BEHAVIOR_EMOTION_LINKAGE } from './emotionDnaDefinitions.js';
import { getTransitionDnaLibrary } from './transitionDnaContractDefinitions.js';
import { loadImageDatasetExport } from './imageDatasetExportAudit.js';
import {
  getNarrativeBeatSeedLibrary,
  isValidDailyLifeAnchor,
} from './narrativeBeatDefinitions.js';
import { getShotFingerprintLibrary } from './shotFingerprintContractDefinitions.js';
import {
  REQUIRED_STORYBOARD_SCENE_FIELDS,
  STORYBOARD_LAYER_VERSION,
  STORYBOARD_SEED_COUNT,
  STORYBOARD_SONG_MASTER_ID,
  buildStoryboardLayerPreview,
  findDuplicateStoryboardIds,
  getNarrativeBeatById,
  getSongMasterById,
  getStoryboardSceneSeedLibrary,
  type RequiredStoryboardSceneField,
  type StoryboardLayerPreview,
  type StoryboardSceneEntry,
} from './storyboardLayerDefinitions.js';
import { isValidSongMasterId } from './songMasterLibraryDefinitions.js';
import { loadVideoDatasetExport } from './videoDatasetExportAudit.js';

export type StoryboardLayerAuditResult =
  | 'PASS'
  | 'FAIL_STORYBOARD_COMPLETENESS'
  | 'FAIL_SONG_REFERENCE'
  | 'FAIL_BEAT_REFERENCE'
  | 'FAIL_DNA_REFERENCE'
  | 'FAIL_DATASET_USAGE'
  | 'FAIL_DUPLICATE_STORYBOARD'
  | 'FAIL_SCENE_ORDER';

export interface StoryboardLayerViolation {
  code: StoryboardLayerAuditResult;
  message: string;
  field?: string;
}

export interface StoryboardLayerReport {
  auditTimestamp: string;
  auditResult: StoryboardLayerAuditResult;
  violations: StoryboardLayerViolation[];
}

const PREVIEW_FILE = 'storyboard-layer-preview.json';
const REPORT_FILE = 'storyboard-layer-report.json';

const VALID_SHOT_IDS = new Set(
  getShotFingerprintLibrary().map((entry) => entry.fingerprint_id)
);

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

function getImageSceneIds(projectRoot: string): Set<string> {
  const exportData = loadImageDatasetExport(projectRoot);
  if (!exportData) return new Set();
  return new Set(exportData.scene_records.map((record) => record.scene_id));
}

function getVideoSceneIds(projectRoot: string): Set<string> {
  const exportData = loadVideoDatasetExport(projectRoot);
  if (!exportData) return new Set();
  return new Set(exportData.scene_records.map((record) => record.scene_id));
}

function auditStoryboardCompleteness(
  scenes: StoryboardSceneEntry[]
): StoryboardLayerViolation[] {
  const violations: StoryboardLayerViolation[] = [];

  if (scenes.length !== STORYBOARD_SEED_COUNT) {
    violations.push({
      code: 'FAIL_STORYBOARD_COMPLETENESS',
      message: `Storyboard layer must contain exactly ${STORYBOARD_SEED_COUNT} scenes for ${STORYBOARD_SONG_MASTER_ID}`,
      field: 'seed_storyboard_scenes.length',
    });
  }

  for (const scene of scenes) {
    for (const field of REQUIRED_STORYBOARD_SCENE_FIELDS) {
      const value = scene[field as RequiredStoryboardSceneField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_STORYBOARD_COMPLETENESS',
          message: `Missing required field ${field} on storyboard ${scene.storyboard_id}`,
          field: `${scene.storyboard_id}.${field}`,
        });
        continue;
      }

      if (
        field === 'daily_life_anchor' ||
        field === 'shot_affinity' ||
        field === 'transition_affinity' ||
        field === 'image_dataset_usage' ||
        field === 'video_dataset_usage' ||
        field === 'keywords'
      ) {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_STORYBOARD_COMPLETENESS',
            message: `Field ${field} must be a non-empty string array on storyboard ${scene.storyboard_id}`,
            field: `${scene.storyboard_id}.${field}`,
          });
        }
        continue;
      }

      if (field === 'scene_order' || field === 'scene_duration_seconds') {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          violations.push({
            code: 'FAIL_STORYBOARD_COMPLETENESS',
            message: `Field ${field} must be an integer on storyboard ${scene.storyboard_id}`,
            field: `${scene.storyboard_id}.${field}`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_STORYBOARD_COMPLETENESS',
          message: `Field ${field} must be a non-empty string on storyboard ${scene.storyboard_id}`,
          field: `${scene.storyboard_id}.${field}`,
        });
      }
    }
  }

  const expectedBeatIds = new Set(getNarrativeBeatSeedLibrary().map((beat) => beat.beat_id));
  for (const beatId of expectedBeatIds) {
    if (!scenes.some((scene) => scene.beat_id === beatId)) {
      violations.push({
        code: 'FAIL_STORYBOARD_COMPLETENESS',
        message: `Missing storyboard scene for narrative beat ${beatId}`,
        field: beatId,
      });
    }
  }

  return violations;
}

function auditSongReference(scenes: StoryboardSceneEntry[]): StoryboardLayerViolation[] {
  const violations: StoryboardLayerViolation[] = [];
  const songMaster = getSongMasterById(STORYBOARD_SONG_MASTER_ID);

  if (!songMaster) {
    violations.push({
      code: 'FAIL_SONG_REFERENCE',
      message: `Song master ${STORYBOARD_SONG_MASTER_ID} not found in library`,
      field: STORYBOARD_SONG_MASTER_ID,
    });
    return violations;
  }

  for (const scene of scenes) {
    if (!isValidSongMasterId(scene.song_master_id)) {
      violations.push({
        code: 'FAIL_SONG_REFERENCE',
        message: `Invalid song_master_id on storyboard ${scene.storyboard_id}`,
        field: `${scene.storyboard_id}.song_master_id`,
      });
    }

    if (scene.song_master_id !== STORYBOARD_SONG_MASTER_ID) {
      violations.push({
        code: 'FAIL_SONG_REFERENCE',
        message: `Only ${STORYBOARD_SONG_MASTER_ID} storyboards are seeded in PHASE-83`,
        field: `${scene.storyboard_id}.song_master_id`,
      });
    }
  }

  return violations;
}

function auditBeatReference(scenes: StoryboardSceneEntry[]): StoryboardLayerViolation[] {
  const violations: StoryboardLayerViolation[] = [];

  for (const scene of scenes) {
    const beat = getNarrativeBeatById(scene.beat_id);
    if (!beat) {
      violations.push({
        code: 'FAIL_BEAT_REFERENCE',
        message: `Unknown beat_id "${scene.beat_id}" on storyboard ${scene.storyboard_id}`,
        field: `${scene.storyboard_id}.beat_id`,
      });
      continue;
    }

    if (
      beat.emotion_id !== scene.emotion_id ||
      beat.relationship_id !== scene.relationship_id
    ) {
      violations.push({
        code: 'FAIL_BEAT_REFERENCE',
        message: `Storyboard DNA fields must match narrative beat on ${scene.storyboard_id}`,
        field: `${scene.storyboard_id}.beat_id`,
      });
    }

    for (const anchor of scene.daily_life_anchor) {
      if (!beat.daily_life_anchor.includes(anchor as (typeof beat.daily_life_anchor)[number])) {
        violations.push({
          code: 'FAIL_BEAT_REFERENCE',
          message: `daily_life_anchor must stay within narrative beat anchors on ${scene.storyboard_id}`,
          field: `${scene.storyboard_id}.daily_life_anchor`,
        });
      }
    }
  }

  return violations;
}

function auditDnaReference(scenes: StoryboardSceneEntry[]): StoryboardLayerViolation[] {
  const violations: StoryboardLayerViolation[] = [];

  for (const scene of scenes) {
    const beat = getNarrativeBeatById(scene.beat_id);
    if (!beat) continue;

    if (BEHAVIOR_EMOTION_LINKAGE[scene.behavior_id] !== scene.emotion_id) {
      violations.push({
        code: 'FAIL_DNA_REFERENCE',
        message: `behavior_id and emotion_id linkage mismatch on ${scene.storyboard_id}`,
        field: `${scene.storyboard_id}.behavior_id`,
      });
    }

    if (beat.emotion_id !== scene.emotion_id) {
      violations.push({
        code: 'FAIL_DNA_REFERENCE',
        message: `emotion_id must match narrative beat on ${scene.storyboard_id}`,
        field: `${scene.storyboard_id}.emotion_id`,
      });
    }

    if (beat.relationship_id !== scene.relationship_id) {
      violations.push({
        code: 'FAIL_DNA_REFERENCE',
        message: `relationship_id must match narrative beat on ${scene.storyboard_id}`,
        field: `${scene.storyboard_id}.relationship_id`,
      });
    }

    for (const anchor of scene.daily_life_anchor) {
      if (!isValidDailyLifeAnchor(anchor)) {
        violations.push({
          code: 'FAIL_DNA_REFERENCE',
          message: `Invalid daily_life_anchor "${anchor}" on ${scene.storyboard_id}`,
          field: `${scene.storyboard_id}.daily_life_anchor`,
        });
      }
    }

    for (const shotId of scene.shot_affinity) {
      if (!VALID_SHOT_IDS.has(shotId)) {
        violations.push({
          code: 'FAIL_DNA_REFERENCE',
          message: `Invalid shot_affinity "${shotId}" on ${scene.storyboard_id}`,
          field: `${scene.storyboard_id}.shot_affinity`,
        });
      }
    }

    for (const transitionId of scene.transition_affinity) {
      if (!VALID_TRANSITION_IDS.has(transitionId)) {
        violations.push({
          code: 'FAIL_DNA_REFERENCE',
          message: `Invalid transition_affinity "${transitionId}" on ${scene.storyboard_id}`,
          field: `${scene.storyboard_id}.transition_affinity`,
        });
      }
    }
  }

  return violations;
}

function auditDatasetUsage(
  projectRoot: string,
  scenes: StoryboardSceneEntry[]
): StoryboardLayerViolation[] {
  const violations: StoryboardLayerViolation[] = [];
  const imageSceneIds = getImageSceneIds(projectRoot);
  const videoSceneIds = getVideoSceneIds(projectRoot);

  if (imageSceneIds.size === 0) {
    violations.push({
      code: 'FAIL_DATASET_USAGE',
      message: 'Image dataset export not readable',
      field: 'exports/image-dataset-export.json',
    });
  }

  if (videoSceneIds.size === 0) {
    violations.push({
      code: 'FAIL_DATASET_USAGE',
      message: 'Video dataset export not readable',
      field: 'exports/video-dataset-export.json',
    });
  }

  for (const scene of scenes) {
    for (const sceneId of scene.image_dataset_usage) {
      if (!imageSceneIds.has(sceneId)) {
        violations.push({
          code: 'FAIL_DATASET_USAGE',
          message: `Unknown image_dataset_usage "${sceneId}" on ${scene.storyboard_id}`,
          field: `${scene.storyboard_id}.image_dataset_usage`,
        });
      }
    }

    for (const sceneId of scene.video_dataset_usage) {
      if (!videoSceneIds.has(sceneId)) {
        violations.push({
          code: 'FAIL_DATASET_USAGE',
          message: `Unknown video_dataset_usage "${sceneId}" on ${scene.storyboard_id}`,
          field: `${scene.storyboard_id}.video_dataset_usage`,
        });
      }
    }
  }

  return violations;
}

function auditDuplicateStoryboard(scenes: StoryboardSceneEntry[]): StoryboardLayerViolation[] {
  const violations: StoryboardLayerViolation[] = [];

  for (const storyboardId of findDuplicateStoryboardIds(
    scenes.map((scene) => scene.storyboard_id)
  )) {
    violations.push({
      code: 'FAIL_DUPLICATE_STORYBOARD',
      message: `Duplicate storyboard_id detected: ${storyboardId}`,
      field: 'storyboard_id',
    });
  }

  const beatIds = scenes.map((scene) => scene.beat_id);
  const duplicateBeats = beatIds.filter((beatId, index) => beatIds.indexOf(beatId) !== index);
  for (const beatId of [...new Set(duplicateBeats)]) {
    violations.push({
      code: 'FAIL_DUPLICATE_STORYBOARD',
      message: `Duplicate beat_id in storyboard layer: ${beatId}`,
      field: 'beat_id',
    });
  }

  return violations;
}

function auditSceneOrder(scenes: StoryboardSceneEntry[]): StoryboardLayerViolation[] {
  const violations: StoryboardLayerViolation[] = [];
  const orders = scenes.map((scene) => scene.scene_order).sort((a, b) => a - b);
  const expected = Array.from({ length: STORYBOARD_SEED_COUNT }, (_, index) => index + 1);

  if (orders.length !== expected.length || !orders.every((value, index) => value === expected[index])) {
    violations.push({
      code: 'FAIL_SCENE_ORDER',
      message: `scene_order must be contiguous 1..${STORYBOARD_SEED_COUNT}`,
      field: 'scene_order',
    });
  }

  const songMaster = getSongMasterById(STORYBOARD_SONG_MASTER_ID);
  if (songMaster) {
    const totalDuration = scenes.reduce((sum, scene) => sum + scene.scene_duration_seconds, 0);
    if (totalDuration !== songMaster.target_duration_seconds) {
      violations.push({
        code: 'FAIL_SCENE_ORDER',
        message: `Storyboard scene durations must sum to song master target_duration_seconds (${songMaster.target_duration_seconds})`,
        field: 'scene_duration_seconds',
      });
    }
  }

  for (const scene of scenes) {
    if (scene.scene_duration_seconds <= 0) {
      violations.push({
        code: 'FAIL_SCENE_ORDER',
        message: `scene_duration_seconds must be positive on ${scene.storyboard_id}`,
        field: `${scene.storyboard_id}.scene_duration_seconds`,
      });
    }
  }

  return violations;
}

function primaryFailure(
  violations: StoryboardLayerViolation[]
): StoryboardLayerAuditResult {
  const priority: StoryboardLayerAuditResult[] = [
    'FAIL_STORYBOARD_COMPLETENESS',
    'FAIL_DUPLICATE_STORYBOARD',
    'FAIL_SONG_REFERENCE',
    'FAIL_BEAT_REFERENCE',
    'FAIL_DNA_REFERENCE',
    'FAIL_DATASET_USAGE',
    'FAIL_SCENE_ORDER',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditStoryboardLayer(projectRoot: string): StoryboardLayerViolation[] {
  const scenes = getStoryboardSceneSeedLibrary();
  const violations: StoryboardLayerViolation[] = [];

  violations.push(...auditStoryboardCompleteness(scenes));
  violations.push(...auditDuplicateStoryboard(scenes));
  violations.push(...auditSongReference(scenes));
  violations.push(...auditBeatReference(scenes));
  violations.push(...auditDnaReference(scenes));
  violations.push(...auditDatasetUsage(projectRoot, scenes));
  violations.push(...auditSceneOrder(scenes));

  return violations;
}

export function writeStoryboardLayerPreview(
  projectRoot: string,
  preview: StoryboardLayerPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeStoryboardLayerReport(
  projectRoot: string,
  report: StoryboardLayerReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runStoryboardLayerAudit(projectRoot: string): StoryboardLayerReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditStoryboardLayer(projectRoot);

  const preview = buildStoryboardLayerPreview();
  if (preview.layer_version !== STORYBOARD_LAYER_VERSION) {
    violations.push({
      code: 'FAIL_STORYBOARD_COMPLETENESS',
      message: 'Preview layer_version mismatch',
      field: 'layer_version',
    });
  }

  writeStoryboardLayerPreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: StoryboardLayerReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeStoryboardLayerReport(projectRoot, report);
  return report;
}
