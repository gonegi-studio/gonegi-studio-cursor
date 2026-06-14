import fs from 'node:fs';
import path from 'node:path';
import { isValidBehaviorId } from './behaviorDnaDefinitions.js';
import { BEHAVIOR_EMOTION_LINKAGE } from './emotionDnaDefinitions.js';
import { isValidEmotionId } from './emotionDnaDefinitions.js';
import { isValidDailyLifeAnchor } from './narrativeBeatDefinitions.js';
import { isValidRelationshipId } from './relationshipDnaDefinitions.js';
import { getShotFingerprintLibrary } from './shotFingerprintContractDefinitions.js';
import { getStoryboardSceneSeedLibrary } from './storyboardLayerDefinitions.js';
import { getTransitionDnaLibrary } from './transitionDnaContractDefinitions.js';
import { loadVideoDatasetExport } from './videoDatasetExportAudit.js';
import {
  REQUIRED_VIDEO_PROMPT_PACK_FIELDS,
  VIDEO_PROMPT_NEGATIVE_BASE,
  VIDEO_PROMPT_PACK_SEED_COUNT,
  VIDEO_PROMPT_PACK_SONG_MASTER_ID,
  VIDEO_PROMPT_PACK_VERSION,
  buildVideoPromptPackPreview,
  findDuplicateVideoPromptPackIds,
  getAnchorEnvironmentMotionTokens,
  getStoryboardSceneById,
  getTransitionDnaTokens,
  getVideoPromptPackSeedLibrary,
  type RequiredVideoPromptPackField,
  type VideoPromptPackEntry,
  type VideoPromptPackPreview,
} from './videoPromptPackDefinitions.js';

export type VideoPromptPackAuditResult =
  | 'PASS'
  | 'FAIL_VIDEO_PROMPT_PACK_COMPLETENESS'
  | 'FAIL_STORYBOARD_REFERENCE'
  | 'FAIL_DNA_REFERENCE'
  | 'FAIL_MOTION_FIELDS'
  | 'FAIL_TRANSITION_DNA'
  | 'FAIL_CONTINUITY_GLUE'
  | 'FAIL_DATASET_USAGE'
  | 'FAIL_DUPLICATE_VIDEO_PROMPT_PACK';

export interface VideoPromptPackViolation {
  code: VideoPromptPackAuditResult;
  message: string;
  field?: string;
}

export interface VideoPromptPackReport {
  auditTimestamp: string;
  auditResult: VideoPromptPackAuditResult;
  violations: VideoPromptPackViolation[];
}

const PREVIEW_FILE = 'video-prompt-pack-preview.json';
const REPORT_FILE = 'video-prompt-pack-report.json';

const VALID_SHOT_IDS = new Set(
  getShotFingerprintLibrary().map((entry) => entry.fingerprint_id)
);

const VALID_TRANSITION_IDS = new Set(
  getTransitionDnaLibrary().map((entry) => entry.transition_id)
);

const STORYBOARD_SCENE_IDS = new Set(
  getStoryboardSceneSeedLibrary().map((scene) => scene.storyboard_id)
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

function getVideoSceneIds(projectRoot: string): Set<string> {
  const exportData = loadVideoDatasetExport(projectRoot);
  if (!exportData) return new Set();
  return new Set(exportData.scene_records.map((record) => record.scene_id));
}

function auditVideoPromptPackCompleteness(
  packs: VideoPromptPackEntry[]
): VideoPromptPackViolation[] {
  const violations: VideoPromptPackViolation[] = [];

  if (packs.length !== VIDEO_PROMPT_PACK_SEED_COUNT) {
    violations.push({
      code: 'FAIL_VIDEO_PROMPT_PACK_COMPLETENESS',
      message: `Video prompt pack layer must contain exactly ${VIDEO_PROMPT_PACK_SEED_COUNT} packs for ${VIDEO_PROMPT_PACK_SONG_MASTER_ID}`,
      field: 'seed_video_prompt_packs.length',
    });
  }

  for (const pack of packs) {
    for (const field of REQUIRED_VIDEO_PROMPT_PACK_FIELDS) {
      const value = pack[field as RequiredVideoPromptPackField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_VIDEO_PROMPT_PACK_COMPLETENESS',
          message: `Missing required field ${field} on video prompt pack ${pack.video_prompt_pack_id}`,
          field: `${pack.video_prompt_pack_id}.${field}`,
        });
        continue;
      }

      if (
        field === 'camera_motion' ||
        field === 'character_motion' ||
        field === 'environment_motion' ||
        field === 'transition_dna' ||
        field === 'continuity_glue' ||
        field === 'daily_life_anchor' ||
        field === 'shot_affinity' ||
        field === 'video_dataset_usage' ||
        field === 'keywords'
      ) {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_VIDEO_PROMPT_PACK_COMPLETENESS',
            message: `Field ${field} must be a non-empty string array on video prompt pack ${pack.video_prompt_pack_id}`,
            field: `${pack.video_prompt_pack_id}.${field}`,
          });
        }
        continue;
      }

      if (field === 'scene_order') {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          violations.push({
            code: 'FAIL_VIDEO_PROMPT_PACK_COMPLETENESS',
            message: `Field scene_order must be an integer on video prompt pack ${pack.video_prompt_pack_id}`,
            field: `${pack.video_prompt_pack_id}.scene_order`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_VIDEO_PROMPT_PACK_COMPLETENESS',
          message: `Field ${field} must be a non-empty string on video prompt pack ${pack.video_prompt_pack_id}`,
          field: `${pack.video_prompt_pack_id}.${field}`,
        });
      }
    }

    if (pack.video_prompt_pack_id !== `VPP-${pack.storyboard_id}`) {
      violations.push({
        code: 'FAIL_VIDEO_PROMPT_PACK_COMPLETENESS',
        message: `video_prompt_pack_id must follow VPP-{storyboard_id} on ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.video_prompt_pack_id`,
      });
    }
  }

  for (const storyboardId of STORYBOARD_SCENE_IDS) {
    if (!packs.some((pack) => pack.storyboard_id === storyboardId)) {
      violations.push({
        code: 'FAIL_VIDEO_PROMPT_PACK_COMPLETENESS',
        message: `Missing video prompt pack for storyboard ${storyboardId}`,
        field: storyboardId,
      });
    }
  }

  return violations;
}

function auditStoryboardReference(
  packs: VideoPromptPackEntry[]
): VideoPromptPackViolation[] {
  const violations: VideoPromptPackViolation[] = [];

  for (const pack of packs) {
    const scene = getStoryboardSceneById(pack.storyboard_id);
    if (!scene) {
      violations.push({
        code: 'FAIL_STORYBOARD_REFERENCE',
        message: `Unknown storyboard_id "${pack.storyboard_id}" on video prompt pack ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.storyboard_id`,
      });
      continue;
    }

    if (pack.scene_order !== scene.scene_order) {
      violations.push({
        code: 'FAIL_STORYBOARD_REFERENCE',
        message: `scene_order must match storyboard scene on ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.scene_order`,
      });
    }

    if (pack.behavior_id !== scene.behavior_id) {
      violations.push({
        code: 'FAIL_STORYBOARD_REFERENCE',
        message: `behavior_id must match storyboard scene on ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.behavior_id`,
      });
    }

    if (pack.emotion_id !== scene.emotion_id) {
      violations.push({
        code: 'FAIL_STORYBOARD_REFERENCE',
        message: `emotion_id must match storyboard scene on ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.emotion_id`,
      });
    }

    if (pack.relationship_id !== scene.relationship_id) {
      violations.push({
        code: 'FAIL_STORYBOARD_REFERENCE',
        message: `relationship_id must match storyboard scene on ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.relationship_id`,
      });
    }

    for (const anchor of pack.daily_life_anchor) {
      if (!scene.daily_life_anchor.includes(anchor)) {
        violations.push({
          code: 'FAIL_STORYBOARD_REFERENCE',
          message: `daily_life_anchor must stay within storyboard anchors on ${pack.video_prompt_pack_id}`,
          field: `${pack.video_prompt_pack_id}.daily_life_anchor`,
        });
      }
    }

    for (const shotId of pack.shot_affinity) {
      if (!scene.shot_affinity.includes(shotId)) {
        violations.push({
          code: 'FAIL_STORYBOARD_REFERENCE',
          message: `shot_affinity must stay within storyboard shot_affinity on ${pack.video_prompt_pack_id}`,
          field: `${pack.video_prompt_pack_id}.shot_affinity`,
        });
      }
    }

    for (const sceneId of pack.video_dataset_usage) {
      if (!scene.video_dataset_usage.includes(sceneId)) {
        violations.push({
          code: 'FAIL_STORYBOARD_REFERENCE',
          message: `video_dataset_usage must stay within storyboard usage on ${pack.video_prompt_pack_id}`,
          field: `${pack.video_prompt_pack_id}.video_dataset_usage`,
        });
      }
    }

    if (!pack.motion_prompt.includes(scene.visual_summary)) {
      violations.push({
        code: 'FAIL_STORYBOARD_REFERENCE',
        message: `motion_prompt must include storyboard visual_summary on ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.motion_prompt`,
      });
    }

    if (!pack.video_prompt.includes(scene.visual_summary)) {
      violations.push({
        code: 'FAIL_STORYBOARD_REFERENCE',
        message: `video_prompt must include storyboard visual_summary on ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.video_prompt`,
      });
    }
  }

  return violations;
}

function auditDnaReference(packs: VideoPromptPackEntry[]): VideoPromptPackViolation[] {
  const violations: VideoPromptPackViolation[] = [];

  for (const pack of packs) {
    if (!isValidBehaviorId(pack.behavior_id)) {
      violations.push({
        code: 'FAIL_DNA_REFERENCE',
        message: `Invalid behavior_id on video prompt pack ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.behavior_id`,
      });
    }

    if (!isValidEmotionId(pack.emotion_id)) {
      violations.push({
        code: 'FAIL_DNA_REFERENCE',
        message: `Invalid emotion_id on video prompt pack ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.emotion_id`,
      });
    }

    if (!isValidRelationshipId(pack.relationship_id)) {
      violations.push({
        code: 'FAIL_DNA_REFERENCE',
        message: `Invalid relationship_id on video prompt pack ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.relationship_id`,
      });
    }

    if (BEHAVIOR_EMOTION_LINKAGE[pack.behavior_id] !== pack.emotion_id) {
      violations.push({
        code: 'FAIL_DNA_REFERENCE',
        message: `behavior_id and emotion_id linkage mismatch on ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.behavior_id`,
      });
    }

    for (const anchor of pack.daily_life_anchor) {
      if (!isValidDailyLifeAnchor(anchor)) {
        violations.push({
          code: 'FAIL_DNA_REFERENCE',
          message: `Invalid daily_life_anchor "${anchor}" on ${pack.video_prompt_pack_id}`,
          field: `${pack.video_prompt_pack_id}.daily_life_anchor`,
        });
      }
    }

    for (const shotId of pack.shot_affinity) {
      if (!VALID_SHOT_IDS.has(shotId)) {
        violations.push({
          code: 'FAIL_DNA_REFERENCE',
          message: `Invalid shot_affinity "${shotId}" on ${pack.video_prompt_pack_id}`,
          field: `${pack.video_prompt_pack_id}.shot_affinity`,
        });
      }
    }
  }

  return violations;
}

function auditMotionFields(packs: VideoPromptPackEntry[]): VideoPromptPackViolation[] {
  const violations: VideoPromptPackViolation[] = [];

  for (const pack of packs) {
    const behaviorToken = `behavior:${pack.behavior_id}`;
    if (!pack.character_motion.includes(behaviorToken)) {
      violations.push({
        code: 'FAIL_MOTION_FIELDS',
        message: `character_motion must include ${behaviorToken} on ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.character_motion`,
      });
    }

    if (pack.character_motion.length < 5) {
      violations.push({
        code: 'FAIL_MOTION_FIELDS',
        message: `character_motion must contain at least five tokens on ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.character_motion`,
      });
    }

    for (const shotId of pack.shot_affinity) {
      const shotToken = `shot:${shotId}`;
      if (!pack.camera_motion.includes(shotToken)) {
        violations.push({
          code: 'FAIL_MOTION_FIELDS',
          message: `camera_motion must include ${shotToken} on ${pack.video_prompt_pack_id}`,
          field: `${pack.video_prompt_pack_id}.camera_motion`,
        });
      }
    }

    for (const anchor of pack.daily_life_anchor) {
      const anchorToken = `anchor:${anchor}`;
      if (!pack.environment_motion.includes(anchorToken)) {
        violations.push({
          code: 'FAIL_MOTION_FIELDS',
          message: `environment_motion must include ${anchorToken} on ${pack.video_prompt_pack_id}`,
          field: `${pack.video_prompt_pack_id}.environment_motion`,
        });
      }

      const expectedTokens = getAnchorEnvironmentMotionTokens(anchor);
      const hasMappedToken = expectedTokens.some((token) =>
        pack.environment_motion.includes(token)
      );
      if (expectedTokens.length > 0 && !hasMappedToken) {
        violations.push({
          code: 'FAIL_MOTION_FIELDS',
          message: `environment_motion must include mapped anchor motion for ${anchor} on ${pack.video_prompt_pack_id}`,
          field: `${pack.video_prompt_pack_id}.environment_motion`,
        });
      }
    }

    if (!pack.motion_prompt.includes('Camera motion:')) {
      violations.push({
        code: 'FAIL_MOTION_FIELDS',
        message: `motion_prompt must include camera motion section on ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.motion_prompt`,
      });
    }

    if (!pack.motion_prompt.includes('Character motion:')) {
      violations.push({
        code: 'FAIL_MOTION_FIELDS',
        message: `motion_prompt must include character motion section on ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.motion_prompt`,
      });
    }

    if (!pack.motion_prompt.includes('Environment motion:')) {
      violations.push({
        code: 'FAIL_MOTION_FIELDS',
        message: `motion_prompt must include environment motion section on ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.motion_prompt`,
      });
    }

    if (pack.negative_prompt !== VIDEO_PROMPT_NEGATIVE_BASE) {
      violations.push({
        code: 'FAIL_MOTION_FIELDS',
        message: `negative_prompt must use the shared negative prompt base on ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.negative_prompt`,
      });
    }
  }

  return violations;
}

function auditTransitionDna(packs: VideoPromptPackEntry[]): VideoPromptPackViolation[] {
  const violations: VideoPromptPackViolation[] = [];

  for (const pack of packs) {
    const scene = getStoryboardSceneById(pack.storyboard_id);
    if (!scene) continue;

    for (const transitionId of scene.transition_affinity) {
      if (!pack.transition_dna.includes(transitionId)) {
        violations.push({
          code: 'FAIL_TRANSITION_DNA',
          message: `transition_dna must include storyboard transition ${transitionId} on ${pack.video_prompt_pack_id}`,
          field: `${pack.video_prompt_pack_id}.transition_dna`,
        });
      }
    }

    for (const transitionId of pack.transition_dna) {
      if (!VALID_TRANSITION_IDS.has(transitionId)) {
        violations.push({
          code: 'FAIL_TRANSITION_DNA',
          message: `Invalid transition_dna "${transitionId}" on ${pack.video_prompt_pack_id}`,
          field: `${pack.video_prompt_pack_id}.transition_dna`,
        });
      }

      const transitionToken = `transition:${transitionId}`;
      if (!pack.continuity_glue.includes(transitionToken)) {
        violations.push({
          code: 'FAIL_TRANSITION_DNA',
          message: `continuity_glue must include ${transitionToken} on ${pack.video_prompt_pack_id}`,
          field: `${pack.video_prompt_pack_id}.continuity_glue`,
        });
      }
    }

    if (!pack.motion_prompt.includes('Transition DNA:')) {
      violations.push({
        code: 'FAIL_TRANSITION_DNA',
        message: `motion_prompt must include transition DNA section on ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.motion_prompt`,
      });
    }
  }

  return violations;
}

function auditContinuityGlue(packs: VideoPromptPackEntry[]): VideoPromptPackViolation[] {
  const violations: VideoPromptPackViolation[] = [];

  for (const pack of packs) {
    const storyboardToken = `storyboard:${pack.storyboard_id}`;
    const sceneOrderToken = `scene-order:${pack.scene_order}`;

    if (!pack.continuity_glue.includes(storyboardToken)) {
      violations.push({
        code: 'FAIL_CONTINUITY_GLUE',
        message: `continuity_glue must include ${storyboardToken} on ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.continuity_glue`,
      });
    }

    if (!pack.continuity_glue.includes(sceneOrderToken)) {
      violations.push({
        code: 'FAIL_CONTINUITY_GLUE',
        message: `continuity_glue must include ${sceneOrderToken} on ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.continuity_glue`,
      });
    }

    for (const shotId of pack.shot_affinity) {
      const shotToken = `shot-continuity:${shotId}`;
      if (!pack.continuity_glue.includes(shotToken)) {
        violations.push({
          code: 'FAIL_CONTINUITY_GLUE',
          message: `continuity_glue must include ${shotToken} on ${pack.video_prompt_pack_id}`,
          field: `${pack.video_prompt_pack_id}.continuity_glue`,
        });
      }
    }

    for (const transitionId of pack.transition_dna) {
      const expectedTokens = getTransitionDnaTokens(transitionId);
      const hasKeyword = expectedTokens.some((token) => pack.continuity_glue.includes(token));
      if (expectedTokens.length > 0 && !hasKeyword) {
        violations.push({
          code: 'FAIL_CONTINUITY_GLUE',
          message: `continuity_glue must include transition continuity keywords for ${transitionId} on ${pack.video_prompt_pack_id}`,
          field: `${pack.video_prompt_pack_id}.continuity_glue`,
        });
      }
    }

    if (!pack.motion_prompt.includes('Continuity glue:')) {
      violations.push({
        code: 'FAIL_CONTINUITY_GLUE',
        message: `motion_prompt must include continuity glue section on ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.motion_prompt`,
      });
    }

    if (pack.continuity_glue.length < 5) {
      violations.push({
        code: 'FAIL_CONTINUITY_GLUE',
        message: `continuity_glue must contain at least five tokens on ${pack.video_prompt_pack_id}`,
        field: `${pack.video_prompt_pack_id}.continuity_glue`,
      });
    }
  }

  return violations;
}

function auditDatasetUsage(
  projectRoot: string,
  packs: VideoPromptPackEntry[]
): VideoPromptPackViolation[] {
  const violations: VideoPromptPackViolation[] = [];
  const videoSceneIds = getVideoSceneIds(projectRoot);

  if (videoSceneIds.size === 0) {
    violations.push({
      code: 'FAIL_DATASET_USAGE',
      message: 'Video dataset export not readable',
      field: 'exports/video-dataset-export.json',
    });
  }

  for (const pack of packs) {
    for (const sceneId of pack.video_dataset_usage) {
      if (!videoSceneIds.has(sceneId)) {
        violations.push({
          code: 'FAIL_DATASET_USAGE',
          message: `Unknown video_dataset_usage "${sceneId}" on ${pack.video_prompt_pack_id}`,
          field: `${pack.video_prompt_pack_id}.video_dataset_usage`,
        });
      }
    }
  }

  return violations;
}

function auditDuplicateVideoPromptPack(
  packs: VideoPromptPackEntry[]
): VideoPromptPackViolation[] {
  const violations: VideoPromptPackViolation[] = [];

  for (const videoPromptPackId of findDuplicateVideoPromptPackIds(
    packs.map((pack) => pack.video_prompt_pack_id)
  )) {
    violations.push({
      code: 'FAIL_DUPLICATE_VIDEO_PROMPT_PACK',
      message: `Duplicate video_prompt_pack_id detected: ${videoPromptPackId}`,
      field: 'video_prompt_pack_id',
    });
  }

  const storyboardIds = packs.map((pack) => pack.storyboard_id);
  const duplicateStoryboards = storyboardIds.filter(
    (storyboardId, index) => storyboardIds.indexOf(storyboardId) !== index
  );
  for (const storyboardId of [...new Set(duplicateStoryboards)]) {
    violations.push({
      code: 'FAIL_DUPLICATE_VIDEO_PROMPT_PACK',
      message: `Duplicate storyboard_id in video prompt pack layer: ${storyboardId}`,
      field: 'storyboard_id',
    });
  }

  const sceneOrders = packs.map((pack) => pack.scene_order);
  const duplicateOrders = sceneOrders.filter(
    (sceneOrder, index) => sceneOrders.indexOf(sceneOrder) !== index
  );
  for (const sceneOrder of [...new Set(duplicateOrders)]) {
    violations.push({
      code: 'FAIL_DUPLICATE_VIDEO_PROMPT_PACK',
      message: `Duplicate scene_order in video prompt pack layer: ${sceneOrder}`,
      field: 'scene_order',
    });
  }

  return violations;
}

function primaryFailure(
  violations: VideoPromptPackViolation[]
): VideoPromptPackAuditResult {
  const priority: VideoPromptPackAuditResult[] = [
    'FAIL_VIDEO_PROMPT_PACK_COMPLETENESS',
    'FAIL_DUPLICATE_VIDEO_PROMPT_PACK',
    'FAIL_STORYBOARD_REFERENCE',
    'FAIL_DNA_REFERENCE',
    'FAIL_MOTION_FIELDS',
    'FAIL_TRANSITION_DNA',
    'FAIL_CONTINUITY_GLUE',
    'FAIL_DATASET_USAGE',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditVideoPromptPack(projectRoot: string): VideoPromptPackViolation[] {
  const packs = getVideoPromptPackSeedLibrary();
  const violations: VideoPromptPackViolation[] = [];

  violations.push(...auditVideoPromptPackCompleteness(packs));
  violations.push(...auditDuplicateVideoPromptPack(packs));
  violations.push(...auditStoryboardReference(packs));
  violations.push(...auditDnaReference(packs));
  violations.push(...auditMotionFields(packs));
  violations.push(...auditTransitionDna(packs));
  violations.push(...auditContinuityGlue(packs));
  violations.push(...auditDatasetUsage(projectRoot, packs));

  return violations;
}

export function writeVideoPromptPackPreview(
  projectRoot: string,
  preview: VideoPromptPackPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeVideoPromptPackReport(
  projectRoot: string,
  report: VideoPromptPackReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runVideoPromptPackAudit(projectRoot: string): VideoPromptPackReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditVideoPromptPack(projectRoot);

  const preview = buildVideoPromptPackPreview();
  if (preview.layer_version !== VIDEO_PROMPT_PACK_VERSION) {
    violations.push({
      code: 'FAIL_VIDEO_PROMPT_PACK_COMPLETENESS',
      message: 'Preview layer_version mismatch',
      field: 'layer_version',
    });
  }

  writeVideoPromptPackPreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: VideoPromptPackReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeVideoPromptPackReport(projectRoot, report);
  return report;
}
