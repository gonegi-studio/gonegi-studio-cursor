import fs from 'node:fs';
import path from 'node:path';
import { BEHAVIOR_EMOTION_LINKAGE } from './emotionDnaDefinitions.js';
import { isValidDailyLifeAnchor } from './narrativeBeatDefinitions.js';
import { getShotFingerprintLibrary } from './shotFingerprintContractDefinitions.js';
import {
  getImagePromptPackSeedLibrary,
} from './imagePromptPackDefinitions.js';
import {
  PROMPT_PACK_PAIRING_SEED_COUNT,
  PROMPT_PACK_PAIRING_SONG_MASTER_ID,
  PROMPT_PACK_PAIRING_VERSION,
  REQUIRED_PROMPT_PACK_PAIR_FIELDS,
  buildPromptPackPairingPreview,
  findDuplicatePairIds,
  getImagePromptPackById,
  getPromptPackPairSeedLibrary,
  getStoryboardSceneById,
  getStoryboardSceneIdsForPairing,
  getVideoPromptPackById,
  type PromptPackPairEntry,
  type PromptPackPairingPreview,
  type RequiredPromptPackPairField,
} from './promptPackPairingDefinitions.js';
import {
  getVideoPromptPackSeedLibrary,
} from './videoPromptPackDefinitions.js';

export type PromptPackPairingAuditResult =
  | 'PASS'
  | 'FAIL_PAIR_COMPLETENESS'
  | 'FAIL_IMAGE_PACK_REFERENCE'
  | 'FAIL_VIDEO_PACK_REFERENCE'
  | 'FAIL_STORYBOARD_ALIGNMENT'
  | 'FAIL_DNA_ALIGNMENT'
  | 'FAIL_SCENE_ORDER_ALIGNMENT'
  | 'FAIL_DUPLICATE_PAIR';

export interface PromptPackPairingViolation {
  code: PromptPackPairingAuditResult;
  message: string;
  field?: string;
}

export interface PromptPackPairingReport {
  auditTimestamp: string;
  auditResult: PromptPackPairingAuditResult;
  violations: PromptPackPairingViolation[];
}

const PREVIEW_FILE = 'prompt-pack-pairing-preview.json';
const REPORT_FILE = 'prompt-pack-pairing-report.json';

const VALID_SHOT_IDS = new Set(
  getShotFingerprintLibrary().map((entry) => entry.fingerprint_id)
);

const IMAGE_PACK_IDS = new Set(
  getImagePromptPackSeedLibrary().map((pack) => pack.prompt_pack_id)
);

const VIDEO_PACK_IDS = new Set(
  getVideoPromptPackSeedLibrary().map((pack) => pack.video_prompt_pack_id)
);

const STORYBOARD_SCENE_IDS = new Set(getStoryboardSceneIdsForPairing());

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

function auditPairCompleteness(pairs: PromptPackPairEntry[]): PromptPackPairingViolation[] {
  const violations: PromptPackPairingViolation[] = [];

  if (pairs.length !== PROMPT_PACK_PAIRING_SEED_COUNT) {
    violations.push({
      code: 'FAIL_PAIR_COMPLETENESS',
      message: `Prompt pack pairing layer must contain exactly ${PROMPT_PACK_PAIRING_SEED_COUNT} pairs for ${PROMPT_PACK_PAIRING_SONG_MASTER_ID}`,
      field: 'seed_prompt_pack_pairs.length',
    });
  }

  for (const pair of pairs) {
    for (const field of REQUIRED_PROMPT_PACK_PAIR_FIELDS) {
      const value = pair[field as RequiredPromptPackPairField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_PAIR_COMPLETENESS',
          message: `Missing required field ${field} on pair ${pair.pair_id}`,
          field: `${pair.pair_id}.${field}`,
        });
        continue;
      }

      if (
        field === 'shared_daily_life_anchor' ||
        field === 'shared_shot_affinity' ||
        field === 'image_to_video_alignment' ||
        field === 'continuity_notes' ||
        field === 'keywords'
      ) {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_PAIR_COMPLETENESS',
            message: `Field ${field} must be a non-empty string array on pair ${pair.pair_id}`,
            field: `${pair.pair_id}.${field}`,
          });
        }
        continue;
      }

      if (field === 'scene_order') {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          violations.push({
            code: 'FAIL_PAIR_COMPLETENESS',
            message: `Field scene_order must be an integer on pair ${pair.pair_id}`,
            field: `${pair.pair_id}.scene_order`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_PAIR_COMPLETENESS',
          message: `Field ${field} must be a non-empty string on pair ${pair.pair_id}`,
          field: `${pair.pair_id}.${field}`,
        });
      }
    }

    if (pair.pair_id !== `PAIR-${pair.storyboard_id}`) {
      violations.push({
        code: 'FAIL_PAIR_COMPLETENESS',
        message: `pair_id must follow PAIR-{storyboard_id} on ${pair.pair_id}`,
        field: `${pair.pair_id}.pair_id`,
      });
    }
  }

  for (const storyboardId of STORYBOARD_SCENE_IDS) {
    if (!pairs.some((pair) => pair.storyboard_id === storyboardId)) {
      violations.push({
        code: 'FAIL_PAIR_COMPLETENESS',
        message: `Missing prompt pack pair for storyboard ${storyboardId}`,
        field: storyboardId,
      });
    }
  }

  return violations;
}

function auditImagePackReference(pairs: PromptPackPairEntry[]): PromptPackPairingViolation[] {
  const violations: PromptPackPairingViolation[] = [];

  for (const pair of pairs) {
    if (!IMAGE_PACK_IDS.has(pair.image_prompt_pack_id)) {
      violations.push({
        code: 'FAIL_IMAGE_PACK_REFERENCE',
        message: `Unknown image_prompt_pack_id "${pair.image_prompt_pack_id}" on pair ${pair.pair_id}`,
        field: `${pair.pair_id}.image_prompt_pack_id`,
      });
      continue;
    }

    const imagePack = getImagePromptPackById(pair.image_prompt_pack_id);
    if (!imagePack) continue;

    if (imagePack.storyboard_id !== pair.storyboard_id) {
      violations.push({
        code: 'FAIL_IMAGE_PACK_REFERENCE',
        message: `Image pack storyboard_id must match pair on ${pair.pair_id}`,
        field: `${pair.pair_id}.image_prompt_pack_id`,
      });
    }

    if (imagePack.prompt_pack_id !== `IPP-${pair.storyboard_id}`) {
      violations.push({
        code: 'FAIL_IMAGE_PACK_REFERENCE',
        message: `Image pack id must follow IPP-{storyboard_id} on ${pair.pair_id}`,
        field: `${pair.pair_id}.image_prompt_pack_id`,
      });
    }
  }

  return violations;
}

function auditVideoPackReference(pairs: PromptPackPairEntry[]): PromptPackPairingViolation[] {
  const violations: PromptPackPairingViolation[] = [];

  for (const pair of pairs) {
    if (!VIDEO_PACK_IDS.has(pair.video_prompt_pack_id)) {
      violations.push({
        code: 'FAIL_VIDEO_PACK_REFERENCE',
        message: `Unknown video_prompt_pack_id "${pair.video_prompt_pack_id}" on pair ${pair.pair_id}`,
        field: `${pair.pair_id}.video_prompt_pack_id`,
      });
      continue;
    }

    const videoPack = getVideoPromptPackById(pair.video_prompt_pack_id);
    if (!videoPack) continue;

    if (videoPack.storyboard_id !== pair.storyboard_id) {
      violations.push({
        code: 'FAIL_VIDEO_PACK_REFERENCE',
        message: `Video pack storyboard_id must match pair on ${pair.pair_id}`,
        field: `${pair.pair_id}.video_prompt_pack_id`,
      });
    }

    if (videoPack.video_prompt_pack_id !== `VPP-${pair.storyboard_id}`) {
      violations.push({
        code: 'FAIL_VIDEO_PACK_REFERENCE',
        message: `Video pack id must follow VPP-{storyboard_id} on ${pair.pair_id}`,
        field: `${pair.pair_id}.video_prompt_pack_id`,
      });
    }
  }

  return violations;
}

function auditStoryboardAlignment(pairs: PromptPackPairEntry[]): PromptPackPairingViolation[] {
  const violations: PromptPackPairingViolation[] = [];

  for (const pair of pairs) {
    const scene = getStoryboardSceneById(pair.storyboard_id);
    if (!scene) {
      violations.push({
        code: 'FAIL_STORYBOARD_ALIGNMENT',
        message: `Unknown storyboard_id "${pair.storyboard_id}" on pair ${pair.pair_id}`,
        field: `${pair.pair_id}.storyboard_id`,
      });
      continue;
    }

    const imagePack = getImagePromptPackById(pair.image_prompt_pack_id);
    const videoPack = getVideoPromptPackById(pair.video_prompt_pack_id);
    if (!imagePack || !videoPack) continue;

    if (imagePack.storyboard_id !== videoPack.storyboard_id) {
      violations.push({
        code: 'FAIL_STORYBOARD_ALIGNMENT',
        message: `Image and video packs must share storyboard_id on ${pair.pair_id}`,
        field: `${pair.pair_id}.storyboard_id`,
      });
    }

    if (pair.storyboard_id !== scene.storyboard_id) {
      violations.push({
        code: 'FAIL_STORYBOARD_ALIGNMENT',
        message: `Pair storyboard_id must match storyboard scene on ${pair.pair_id}`,
        field: `${pair.pair_id}.storyboard_id`,
      });
    }

    if (!pair.image_to_video_alignment.includes(`storyboard:${pair.storyboard_id}`)) {
      violations.push({
        code: 'FAIL_STORYBOARD_ALIGNMENT',
        message: `image_to_video_alignment must include storyboard token on ${pair.pair_id}`,
        field: `${pair.pair_id}.image_to_video_alignment`,
      });
    }

    if (!pair.continuity_notes.includes(`storyboard:${pair.storyboard_id}`)) {
      violations.push({
        code: 'FAIL_STORYBOARD_ALIGNMENT',
        message: `continuity_notes must include storyboard token on ${pair.pair_id}`,
        field: `${pair.pair_id}.continuity_notes`,
      });
    }
  }

  return violations;
}

function auditDnaAlignment(pairs: PromptPackPairEntry[]): PromptPackPairingViolation[] {
  const violations: PromptPackPairingViolation[] = [];

  for (const pair of pairs) {
    const imagePack = getImagePromptPackById(pair.image_prompt_pack_id);
    const videoPack = getVideoPromptPackById(pair.video_prompt_pack_id);
    if (!imagePack || !videoPack) continue;

    if (pair.shared_behavior_id !== imagePack.behavior_id) {
      violations.push({
        code: 'FAIL_DNA_ALIGNMENT',
        message: `shared_behavior_id must match image pack on ${pair.pair_id}`,
        field: `${pair.pair_id}.shared_behavior_id`,
      });
    }

    if (pair.shared_behavior_id !== videoPack.behavior_id) {
      violations.push({
        code: 'FAIL_DNA_ALIGNMENT',
        message: `shared_behavior_id must match video pack on ${pair.pair_id}`,
        field: `${pair.pair_id}.shared_behavior_id`,
      });
    }

    if (pair.shared_emotion_id !== imagePack.emotion_id) {
      violations.push({
        code: 'FAIL_DNA_ALIGNMENT',
        message: `shared_emotion_id must match image pack on ${pair.pair_id}`,
        field: `${pair.pair_id}.shared_emotion_id`,
      });
    }

    if (pair.shared_emotion_id !== videoPack.emotion_id) {
      violations.push({
        code: 'FAIL_DNA_ALIGNMENT',
        message: `shared_emotion_id must match video pack on ${pair.pair_id}`,
        field: `${pair.pair_id}.shared_emotion_id`,
      });
    }

    if (pair.shared_relationship_id !== imagePack.relationship_id) {
      violations.push({
        code: 'FAIL_DNA_ALIGNMENT',
        message: `shared_relationship_id must match image pack on ${pair.pair_id}`,
        field: `${pair.pair_id}.shared_relationship_id`,
      });
    }

    if (pair.shared_relationship_id !== videoPack.relationship_id) {
      violations.push({
        code: 'FAIL_DNA_ALIGNMENT',
        message: `shared_relationship_id must match video pack on ${pair.pair_id}`,
        field: `${pair.pair_id}.shared_relationship_id`,
      });
    }

    if (BEHAVIOR_EMOTION_LINKAGE[pair.shared_behavior_id] !== pair.shared_emotion_id) {
      violations.push({
        code: 'FAIL_DNA_ALIGNMENT',
        message: `shared behavior/emotion linkage mismatch on ${pair.pair_id}`,
        field: `${pair.pair_id}.shared_behavior_id`,
      });
    }

    for (const anchor of pair.shared_daily_life_anchor) {
      if (!isValidDailyLifeAnchor(anchor)) {
        violations.push({
          code: 'FAIL_DNA_ALIGNMENT',
          message: `Invalid shared_daily_life_anchor "${anchor}" on ${pair.pair_id}`,
          field: `${pair.pair_id}.shared_daily_life_anchor`,
        });
      }

      if (!imagePack.daily_life_anchor.includes(anchor)) {
        violations.push({
          code: 'FAIL_DNA_ALIGNMENT',
          message: `shared_daily_life_anchor must match image pack on ${pair.pair_id}`,
          field: `${pair.pair_id}.shared_daily_life_anchor`,
        });
      }

      if (!videoPack.daily_life_anchor.includes(anchor)) {
        violations.push({
          code: 'FAIL_DNA_ALIGNMENT',
          message: `shared_daily_life_anchor must match video pack on ${pair.pair_id}`,
          field: `${pair.pair_id}.shared_daily_life_anchor`,
        });
      }
    }

    for (const shotId of pair.shared_shot_affinity) {
      if (!VALID_SHOT_IDS.has(shotId)) {
        violations.push({
          code: 'FAIL_DNA_ALIGNMENT',
          message: `Invalid shared_shot_affinity "${shotId}" on ${pair.pair_id}`,
          field: `${pair.pair_id}.shared_shot_affinity`,
        });
      }

      if (!imagePack.shot_affinity.includes(shotId)) {
        violations.push({
          code: 'FAIL_DNA_ALIGNMENT',
          message: `shared_shot_affinity must match image pack on ${pair.pair_id}`,
          field: `${pair.pair_id}.shared_shot_affinity`,
        });
      }

      if (!videoPack.shot_affinity.includes(shotId)) {
        violations.push({
          code: 'FAIL_DNA_ALIGNMENT',
          message: `shared_shot_affinity must match video pack on ${pair.pair_id}`,
          field: `${pair.pair_id}.shared_shot_affinity`,
        });
      }
    }

    const characterBridge = `character-bridge:${pair.shared_behavior_id}`;
    if (!pair.image_to_video_alignment.includes(characterBridge)) {
      violations.push({
        code: 'FAIL_DNA_ALIGNMENT',
        message: `image_to_video_alignment must include ${characterBridge} on ${pair.pair_id}`,
        field: `${pair.pair_id}.image_to_video_alignment`,
      });
    }
  }

  return violations;
}

function auditSceneOrderAlignment(pairs: PromptPackPairEntry[]): PromptPackPairingViolation[] {
  const violations: PromptPackPairingViolation[] = [];
  const orders = pairs.map((pair) => pair.scene_order).sort((a, b) => a - b);
  const expected = Array.from({ length: PROMPT_PACK_PAIRING_SEED_COUNT }, (_, index) => index + 1);

  if (
    orders.length !== expected.length ||
    !orders.every((value, index) => value === expected[index])
  ) {
    violations.push({
      code: 'FAIL_SCENE_ORDER_ALIGNMENT',
      message: `scene_order must be contiguous 1..${PROMPT_PACK_PAIRING_SEED_COUNT}`,
      field: 'scene_order',
    });
  }

  for (const pair of pairs) {
    const imagePack = getImagePromptPackById(pair.image_prompt_pack_id);
    const videoPack = getVideoPromptPackById(pair.video_prompt_pack_id);
    const scene = getStoryboardSceneById(pair.storyboard_id);

    if (imagePack && pair.scene_order !== imagePack.scene_order) {
      violations.push({
        code: 'FAIL_SCENE_ORDER_ALIGNMENT',
        message: `scene_order must match image pack on ${pair.pair_id}`,
        field: `${pair.pair_id}.scene_order`,
      });
    }

    if (videoPack && pair.scene_order !== videoPack.scene_order) {
      violations.push({
        code: 'FAIL_SCENE_ORDER_ALIGNMENT',
        message: `scene_order must match video pack on ${pair.pair_id}`,
        field: `${pair.pair_id}.scene_order`,
      });
    }

    if (scene && pair.scene_order !== scene.scene_order) {
      violations.push({
        code: 'FAIL_SCENE_ORDER_ALIGNMENT',
        message: `scene_order must match storyboard scene on ${pair.pair_id}`,
        field: `${pair.pair_id}.scene_order`,
      });
    }

    const sceneOrderToken = `scene-order:${pair.scene_order}`;
    if (!pair.image_to_video_alignment.includes(sceneOrderToken)) {
      violations.push({
        code: 'FAIL_SCENE_ORDER_ALIGNMENT',
        message: `image_to_video_alignment must include ${sceneOrderToken} on ${pair.pair_id}`,
        field: `${pair.pair_id}.image_to_video_alignment`,
      });
    }
  }

  return violations;
}

function auditDuplicatePair(pairs: PromptPackPairEntry[]): PromptPackPairingViolation[] {
  const violations: PromptPackPairingViolation[] = [];

  for (const pairId of findDuplicatePairIds(pairs.map((pair) => pair.pair_id))) {
    violations.push({
      code: 'FAIL_DUPLICATE_PAIR',
      message: `Duplicate pair_id detected: ${pairId}`,
      field: 'pair_id',
    });
  }

  const storyboardIds = pairs.map((pair) => pair.storyboard_id);
  const duplicateStoryboards = storyboardIds.filter(
    (storyboardId, index) => storyboardIds.indexOf(storyboardId) !== index
  );
  for (const storyboardId of [...new Set(duplicateStoryboards)]) {
    violations.push({
      code: 'FAIL_DUPLICATE_PAIR',
      message: `Duplicate storyboard_id in pairing layer: ${storyboardId}`,
      field: 'storyboard_id',
    });
  }

  const imagePackIds = pairs.map((pair) => pair.image_prompt_pack_id);
  const duplicateImagePacks = imagePackIds.filter(
    (packId, index) => imagePackIds.indexOf(packId) !== index
  );
  for (const packId of [...new Set(duplicateImagePacks)]) {
    violations.push({
      code: 'FAIL_DUPLICATE_PAIR',
      message: `Duplicate image_prompt_pack_id in pairing layer: ${packId}`,
      field: 'image_prompt_pack_id',
    });
  }

  const videoPackIds = pairs.map((pair) => pair.video_prompt_pack_id);
  const duplicateVideoPacks = videoPackIds.filter(
    (packId, index) => videoPackIds.indexOf(packId) !== index
  );
  for (const packId of [...new Set(duplicateVideoPacks)]) {
    violations.push({
      code: 'FAIL_DUPLICATE_PAIR',
      message: `Duplicate video_prompt_pack_id in pairing layer: ${packId}`,
      field: 'video_prompt_pack_id',
    });
  }

  return violations;
}

function primaryFailure(
  violations: PromptPackPairingViolation[]
): PromptPackPairingAuditResult {
  const priority: PromptPackPairingAuditResult[] = [
    'FAIL_PAIR_COMPLETENESS',
    'FAIL_DUPLICATE_PAIR',
    'FAIL_IMAGE_PACK_REFERENCE',
    'FAIL_VIDEO_PACK_REFERENCE',
    'FAIL_STORYBOARD_ALIGNMENT',
    'FAIL_DNA_ALIGNMENT',
    'FAIL_SCENE_ORDER_ALIGNMENT',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditPromptPackPairing(projectRoot: string): PromptPackPairingViolation[] {
  void projectRoot;
  const pairs = getPromptPackPairSeedLibrary();
  const violations: PromptPackPairingViolation[] = [];

  violations.push(...auditPairCompleteness(pairs));
  violations.push(...auditDuplicatePair(pairs));
  violations.push(...auditImagePackReference(pairs));
  violations.push(...auditVideoPackReference(pairs));
  violations.push(...auditStoryboardAlignment(pairs));
  violations.push(...auditDnaAlignment(pairs));
  violations.push(...auditSceneOrderAlignment(pairs));

  return violations;
}

export function writePromptPackPairingPreview(
  projectRoot: string,
  preview: PromptPackPairingPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writePromptPackPairingReport(
  projectRoot: string,
  report: PromptPackPairingReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runPromptPackPairingAudit(projectRoot: string): PromptPackPairingReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditPromptPackPairing(projectRoot);

  const preview = buildPromptPackPairingPreview();
  if (preview.layer_version !== PROMPT_PACK_PAIRING_VERSION) {
    violations.push({
      code: 'FAIL_PAIR_COMPLETENESS',
      message: 'Preview layer_version mismatch',
      field: 'layer_version',
    });
  }

  writePromptPackPairingPreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: PromptPackPairingReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writePromptPackPairingReport(projectRoot, report);
  return report;
}
