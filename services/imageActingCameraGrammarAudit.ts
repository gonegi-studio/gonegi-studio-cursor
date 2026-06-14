import fs from 'node:fs';
import path from 'node:path';
import { isValidDailyLifeAnchor } from './narrativeBeatDefinitions.js';
import { getShotFingerprintLibrary } from './shotFingerprintContractDefinitions.js';
import { getStoryboardSceneSeedLibrary } from './storyboardLayerDefinitions.js';
import {
  ANTI_STATIC_POSE_RULES_BASE,
  IMAGE_ACTING_CAMERA_GRAMMAR_SEED_COUNT,
  IMAGE_ACTING_CAMERA_GRAMMAR_SONG_MASTER_ID,
  IMAGE_ACTING_CAMERA_GRAMMAR_VERSION,
  REQUIRED_IMAGE_ACTING_CAMERA_FIELDS,
  buildImageActingCameraGrammarPreview,
  findDuplicateActingCameraIds,
  getImageActingCameraGrammarSeedLibrary,
  getImagePromptPackById,
  getLocationVariationSuffix,
  getLocationsForActingEntry,
  getPrimaryShotForEntry,
  getStoryboardSceneById,
  isForbiddenFrontalGaze,
  isForbiddenStaticPosture,
  isOffLensGaze,
  type ImageActingCameraGrammarEntry,
  type ImageActingCameraGrammarPreview,
  type RequiredImageActingCameraField,
} from './imageActingCameraGrammarDefinitions.js';
import { getImagePromptPackSeedLibrary } from './imagePromptPackDefinitions.js';

export type ImageActingCameraGrammarAuditResult =
  | 'PASS'
  | 'FAIL_ACTING_CAMERA_COMPLETENESS'
  | 'FAIL_IMAGE_PROMPT_REFERENCE'
  | 'FAIL_STORYBOARD_REFERENCE'
  | 'FAIL_ACTING_INTENT'
  | 'FAIL_BODY_ACTION'
  | 'FAIL_GAZE_DIRECTION'
  | 'FAIL_ENVIRONMENT_INTERACTION'
  | 'FAIL_STATIC_POSE_GUARD'
  | 'FAIL_LOCATION_VARIATION'
  | 'FAIL_DUPLICATE_ACTING_CAMERA';

export interface ImageActingCameraGrammarViolation {
  code: ImageActingCameraGrammarAuditResult;
  message: string;
  field?: string;
}

export interface ImageActingCameraGrammarReport {
  auditTimestamp: string;
  auditResult: ImageActingCameraGrammarAuditResult;
  violations: ImageActingCameraGrammarViolation[];
}

const PREVIEW_FILE = 'image-acting-camera-grammar-preview.json';
const REPORT_FILE = 'image-acting-camera-grammar-report.json';

const VALID_SHOT_IDS = new Set(
  getShotFingerprintLibrary().map((entry) => entry.fingerprint_id)
);

const STORYBOARD_SCENE_IDS = new Set(
  getStoryboardSceneSeedLibrary().map((scene) => scene.storyboard_id)
);

const IMAGE_PROMPT_PACK_IDS = new Set(
  getImagePromptPackSeedLibrary().map((pack) => pack.prompt_pack_id)
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

function auditActingCameraCompleteness(
  entries: ImageActingCameraGrammarEntry[]
): ImageActingCameraGrammarViolation[] {
  const violations: ImageActingCameraGrammarViolation[] = [];

  if (entries.length !== IMAGE_ACTING_CAMERA_GRAMMAR_SEED_COUNT) {
    violations.push({
      code: 'FAIL_ACTING_CAMERA_COMPLETENESS',
      message: `Image acting camera grammar layer must contain exactly ${IMAGE_ACTING_CAMERA_GRAMMAR_SEED_COUNT} entries for ${IMAGE_ACTING_CAMERA_GRAMMAR_SONG_MASTER_ID}`,
      field: 'seed_image_acting_camera_grammar.length',
    });
  }

  for (const entry of entries) {
    for (const field of REQUIRED_IMAGE_ACTING_CAMERA_FIELDS) {
      const value = entry[field as RequiredImageActingCameraField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_ACTING_CAMERA_COMPLETENESS',
          message: `Missing required field ${field} on acting camera ${entry.acting_camera_id}`,
          field: `${entry.acting_camera_id}.${field}`,
        });
        continue;
      }

      if (
        field === 'foreground_midground_background' ||
        field === 'anti_static_pose_rules' ||
        field === 'next_video_potential' ||
        field === 'keywords'
      ) {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_ACTING_CAMERA_COMPLETENESS',
            message: `Field ${field} must be a non-empty string array on acting camera ${entry.acting_camera_id}`,
            field: `${entry.acting_camera_id}.${field}`,
          });
        }
        continue;
      }

      if (field === 'scene_order') {
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
          violations.push({
            code: 'FAIL_ACTING_CAMERA_COMPLETENESS',
            message: `Field scene_order must be a positive integer on acting camera ${entry.acting_camera_id}`,
            field: `${entry.acting_camera_id}.scene_order`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_ACTING_CAMERA_COMPLETENESS',
          message: `Field ${field} must be a non-empty string on acting camera ${entry.acting_camera_id}`,
          field: `${entry.acting_camera_id}.${field}`,
        });
      }
    }

    if (entry.acting_camera_id !== `IAC-${entry.storyboard_id}`) {
      violations.push({
        code: 'FAIL_ACTING_CAMERA_COMPLETENESS',
        message: `acting_camera_id must follow IAC-{storyboard_id} on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.acting_camera_id`,
      });
    }

    if (entry.image_prompt_pack_id !== `IPP-${entry.storyboard_id}`) {
      violations.push({
        code: 'FAIL_ACTING_CAMERA_COMPLETENESS',
        message: `image_prompt_pack_id must follow IPP-{storyboard_id} on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.image_prompt_pack_id`,
      });
    }

    if (entry.foreground_midground_background.length !== 3) {
      violations.push({
        code: 'FAIL_ACTING_CAMERA_COMPLETENESS',
        message: `foreground_midground_background must contain exactly three depth layers on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.foreground_midground_background`,
      });
    }
  }

  return violations;
}

function auditImagePromptReference(
  entries: ImageActingCameraGrammarEntry[]
): ImageActingCameraGrammarViolation[] {
  const violations: ImageActingCameraGrammarViolation[] = [];

  for (const entry of entries) {
    if (!IMAGE_PROMPT_PACK_IDS.has(entry.image_prompt_pack_id)) {
      violations.push({
        code: 'FAIL_IMAGE_PROMPT_REFERENCE',
        message: `Unknown image_prompt_pack_id "${entry.image_prompt_pack_id}" on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.image_prompt_pack_id`,
      });
      continue;
    }

    const pack = getImagePromptPackById(entry.image_prompt_pack_id);
    if (!pack) continue;

    if (pack.storyboard_id !== entry.storyboard_id) {
      violations.push({
        code: 'FAIL_IMAGE_PROMPT_REFERENCE',
        message: `Image prompt pack storyboard mismatch on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.image_prompt_pack_id`,
      });
    }

    if (pack.scene_order !== entry.scene_order) {
      violations.push({
        code: 'FAIL_IMAGE_PROMPT_REFERENCE',
        message: `Image prompt pack scene_order mismatch on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.scene_order`,
      });
    }

    const primaryShot = pack.shot_affinity[0];
    if (!primaryShot) {
      violations.push({
        code: 'FAIL_IMAGE_PROMPT_REFERENCE',
        message: `Image prompt pack must declare shot_affinity on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.image_prompt_pack_id`,
      });
      continue;
    }

    const entryShot = getPrimaryShotForEntry(entry);
    if (entryShot !== primaryShot) {
      violations.push({
        code: 'FAIL_IMAGE_PROMPT_REFERENCE',
        message: `Acting camera must use primary shot_affinity "${primaryShot}" on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.keywords`,
      });
    }

    if (!VALID_SHOT_IDS.has(primaryShot)) {
      violations.push({
        code: 'FAIL_IMAGE_PROMPT_REFERENCE',
        message: `Invalid shot_affinity "${primaryShot}" on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.image_prompt_pack_id`,
      });
    }

    if (!entry.keywords.includes(`behavior:${pack.behavior_id}`)) {
      violations.push({
        code: 'FAIL_IMAGE_PROMPT_REFERENCE',
        message: `keywords must include behavior token from image prompt pack on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.keywords`,
      });
    }
  }

  return violations;
}

function auditStoryboardReference(
  entries: ImageActingCameraGrammarEntry[]
): ImageActingCameraGrammarViolation[] {
  const violations: ImageActingCameraGrammarViolation[] = [];

  for (const entry of entries) {
    if (!STORYBOARD_SCENE_IDS.has(entry.storyboard_id)) {
      violations.push({
        code: 'FAIL_STORYBOARD_REFERENCE',
        message: `Unknown storyboard_id "${entry.storyboard_id}" on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.storyboard_id`,
      });
      continue;
    }

    const scene = getStoryboardSceneById(entry.storyboard_id);
    if (!scene) continue;

    if (scene.scene_order !== entry.scene_order) {
      violations.push({
        code: 'FAIL_STORYBOARD_REFERENCE',
        message: `Storyboard scene_order mismatch on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.scene_order`,
      });
    }

    const pack = getImagePromptPackById(entry.image_prompt_pack_id);
    if (!pack) continue;

    for (const anchor of scene.daily_life_anchor) {
      if (!pack.daily_life_anchor.includes(anchor)) {
        violations.push({
          code: 'FAIL_STORYBOARD_REFERENCE',
          message: `Image prompt pack must include daily_life_anchor "${anchor}" on ${entry.acting_camera_id}`,
          field: `${entry.acting_camera_id}.image_prompt_pack_id`,
        });
      }

      if (!entry.location_variation.includes(anchor)) {
        violations.push({
          code: 'FAIL_STORYBOARD_REFERENCE',
          message: `location_variation must reference daily_life_anchor "${anchor}" on ${entry.acting_camera_id}`,
          field: `${entry.acting_camera_id}.location_variation`,
        });
      }

      if (!isValidDailyLifeAnchor(anchor)) {
        violations.push({
          code: 'FAIL_STORYBOARD_REFERENCE',
          message: `Invalid daily_life_anchor "${anchor}" on ${entry.acting_camera_id}`,
          field: `${entry.acting_camera_id}.storyboard_id`,
        });
      }
    }
  }

  return violations;
}

function auditActingIntent(
  entries: ImageActingCameraGrammarEntry[]
): ImageActingCameraGrammarViolation[] {
  const violations: ImageActingCameraGrammarViolation[] = [];

  for (const entry of entries) {
    if (!isNonEmptyString(entry.acting_intent)) {
      violations.push({
        code: 'FAIL_ACTING_INTENT',
        message: `acting_intent is required on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.acting_intent`,
      });
      continue;
    }

    if (entry.acting_intent.length < 12) {
      violations.push({
        code: 'FAIL_ACTING_INTENT',
        message: `acting_intent must describe in-scene performance intent on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.acting_intent`,
      });
    }
  }

  return violations;
}

function auditBodyAction(
  entries: ImageActingCameraGrammarEntry[]
): ImageActingCameraGrammarViolation[] {
  const violations: ImageActingCameraGrammarViolation[] = [];

  for (const entry of entries) {
    if (!isNonEmptyString(entry.body_action)) {
      violations.push({
        code: 'FAIL_BODY_ACTION',
        message: `body_action is required on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.body_action`,
      });
      continue;
    }

    if (!isNonEmptyString(entry.hand_action)) {
      violations.push({
        code: 'FAIL_BODY_ACTION',
        message: `hand_action is required on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.hand_action`,
      });
    }

    if (!isNonEmptyString(entry.posture_variation)) {
      violations.push({
        code: 'FAIL_BODY_ACTION',
        message: `posture_variation is required on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.posture_variation`,
      });
    }
  }

  return violations;
}

function auditGazeDirection(
  entries: ImageActingCameraGrammarEntry[]
): ImageActingCameraGrammarViolation[] {
  const violations: ImageActingCameraGrammarViolation[] = [];

  for (const entry of entries) {
    if (!isNonEmptyString(entry.gaze_direction)) {
      violations.push({
        code: 'FAIL_GAZE_DIRECTION',
        message: `gaze_direction is required on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.gaze_direction`,
      });
      continue;
    }

    if (isForbiddenFrontalGaze(entry.gaze_direction)) {
      violations.push({
        code: 'FAIL_GAZE_DIRECTION',
        message: `gaze_direction must not target camera lens on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.gaze_direction`,
      });
    }
  }

  const offLensCount = entries.filter((entry) => isOffLensGaze(entry.gaze_direction)).length;

  if (offLensCount < entries.length) {
    violations.push({
      code: 'FAIL_GAZE_DIRECTION',
      message: 'Every scene must declare off-lens gaze direction',
      field: 'gaze_direction',
    });
  }

  const gazeTokens = entries.map((entry) => entry.gaze_direction.toLowerCase());
  const duplicateGaze = gazeTokens.filter(
    (token, index) => gazeTokens.indexOf(token) !== index
  );
  for (const token of [...new Set(duplicateGaze)]) {
    violations.push({
      code: 'FAIL_GAZE_DIRECTION',
      message: `Duplicate gaze_direction pattern detected: "${token}"`,
      field: 'gaze_direction',
    });
  }

  return violations;
}

function auditEnvironmentInteraction(
  entries: ImageActingCameraGrammarEntry[]
): ImageActingCameraGrammarViolation[] {
  const violations: ImageActingCameraGrammarViolation[] = [];

  for (const entry of entries) {
    if (!isNonEmptyString(entry.environment_interaction)) {
      violations.push({
        code: 'FAIL_ENVIRONMENT_INTERACTION',
        message: `environment_interaction is required on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.environment_interaction`,
      });
      continue;
    }

    const decorativeOnly =
      entry.environment_interaction.toLowerCase().includes('background only') ||
      entry.environment_interaction.toLowerCase().includes('decorative backdrop');

    if (decorativeOnly) {
      violations.push({
        code: 'FAIL_ENVIRONMENT_INTERACTION',
        message: `environment_interaction must be active not decorative on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.environment_interaction`,
      });
    }

    const scene = getStoryboardSceneById(entry.storyboard_id);
    if (!scene) continue;

    const hasAnchorTouch = scene.daily_life_anchor.some((anchor) =>
      entry.environment_interaction.toLowerCase().includes(anchor.replace(/_/g, ' ')) ||
      entry.environment_interaction.toLowerCase().includes(anchor.replace(/_/g, '-')) ||
      entry.location_variation.includes(anchor)
    );

    if (!hasAnchorTouch && entry.environment_interaction.length < 10) {
      violations.push({
        code: 'FAIL_ENVIRONMENT_INTERACTION',
        message: `environment_interaction must tie to daily_life_anchor props on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.environment_interaction`,
      });
    }
  }

  return violations;
}

function auditStaticPoseGuard(
  entries: ImageActingCameraGrammarEntry[]
): ImageActingCameraGrammarViolation[] {
  const violations: ImageActingCameraGrammarViolation[] = [];

  for (const entry of entries) {
    for (const rule of ANTI_STATIC_POSE_RULES_BASE) {
      if (!entry.anti_static_pose_rules.includes(rule)) {
        violations.push({
          code: 'FAIL_STATIC_POSE_GUARD',
          message: `anti_static_pose_rules must include "${rule}" on ${entry.acting_camera_id}`,
          field: `${entry.acting_camera_id}.anti_static_pose_rules`,
        });
      }
    }

    if (isForbiddenStaticPosture(entry.posture_variation)) {
      violations.push({
        code: 'FAIL_STATIC_POSE_GUARD',
        message: `posture_variation must avoid parade-rest posture on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.posture_variation`,
      });
    }

    const hasActiveGesture =
      entry.hand_action.length > 8 &&
      entry.body_action.length > 8 &&
      !entry.body_action.toLowerCase().includes('standing still');

    if (!hasActiveGesture) {
      violations.push({
        code: 'FAIL_STATIC_POSE_GUARD',
        message: `Scene must declare in-progress body and hand action on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.body_action`,
      });
    }

    for (const layer of entry.foreground_midground_background) {
      if (!layer.startsWith('foreground:') &&
          !layer.startsWith('midground:') &&
          !layer.startsWith('background:')) {
        violations.push({
          code: 'FAIL_STATIC_POSE_GUARD',
          message: `Depth layer tokens must be labeled on ${entry.acting_camera_id}`,
          field: `${entry.acting_camera_id}.foreground_midground_background`,
        });
      }
    }

    if (entry.keywords.some((keyword) => keyword.includes('ai-studio'))) {
      violations.push({
        code: 'FAIL_STATIC_POSE_GUARD',
        message: `No AI Studio generation tokens allowed on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.keywords`,
      });
    }
  }

  return violations;
}

function auditLocationVariation(
  entries: ImageActingCameraGrammarEntry[]
): ImageActingCameraGrammarViolation[] {
  const violations: ImageActingCameraGrammarViolation[] = [];
  const suffixes = entries.map((entry) => getLocationVariationSuffix(entry.location_variation));

  for (const entry of entries) {
    if (!isNonEmptyString(entry.location_variation)) {
      violations.push({
        code: 'FAIL_LOCATION_VARIATION',
        message: `location_variation is required on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.location_variation`,
      });
      continue;
    }

    const parts = entry.location_variation.split(':');
    if (parts.length < 3) {
      violations.push({
        code: 'FAIL_LOCATION_VARIATION',
        message: `location_variation must follow {location}:{anchors}:{suffix} on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.location_variation`,
      });
    }

    const locations = getLocationsForActingEntry(entry);
    const locationToken = parts[0];
    if (locations.length > 0 && !locations.includes(locationToken as (typeof locations)[number])) {
      violations.push({
        code: 'FAIL_LOCATION_VARIATION',
        message: `location_variation must reference mapped location continuity on ${entry.acting_camera_id}`,
        field: `${entry.acting_camera_id}.location_variation`,
      });
    }
  }

  const duplicateSuffixes = suffixes.filter(
    (suffix, index) => suffixes.indexOf(suffix) !== index
  );
  for (const suffix of [...new Set(duplicateSuffixes)]) {
    violations.push({
      code: 'FAIL_LOCATION_VARIATION',
      message: `Duplicate location_variation suffix detected: "${suffix}"`,
      field: 'location_variation',
    });
  }

  return violations;
}

function auditDuplicateActingCamera(
  entries: ImageActingCameraGrammarEntry[]
): ImageActingCameraGrammarViolation[] {
  const violations: ImageActingCameraGrammarViolation[] = [];

  for (const actingCameraId of findDuplicateActingCameraIds(
    entries.map((entry) => entry.acting_camera_id)
  )) {
    violations.push({
      code: 'FAIL_DUPLICATE_ACTING_CAMERA',
      message: `Duplicate acting_camera_id detected: ${actingCameraId}`,
      field: 'acting_camera_id',
    });
  }

  const imagePackIds = entries.map((entry) => entry.image_prompt_pack_id);
  const duplicateImagePacks = imagePackIds.filter(
    (packId, index) => imagePackIds.indexOf(packId) !== index
  );
  for (const packId of [...new Set(duplicateImagePacks)]) {
    violations.push({
      code: 'FAIL_DUPLICATE_ACTING_CAMERA',
      message: `Duplicate image_prompt_pack_id mapping detected: ${packId}`,
      field: 'image_prompt_pack_id',
    });
  }

  return violations;
}

function primaryFailure(
  violations: ImageActingCameraGrammarViolation[]
): ImageActingCameraGrammarAuditResult {
  const priority: ImageActingCameraGrammarAuditResult[] = [
    'FAIL_ACTING_CAMERA_COMPLETENESS',
    'FAIL_DUPLICATE_ACTING_CAMERA',
    'FAIL_IMAGE_PROMPT_REFERENCE',
    'FAIL_STORYBOARD_REFERENCE',
    'FAIL_ACTING_INTENT',
    'FAIL_BODY_ACTION',
    'FAIL_GAZE_DIRECTION',
    'FAIL_ENVIRONMENT_INTERACTION',
    'FAIL_STATIC_POSE_GUARD',
    'FAIL_LOCATION_VARIATION',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditImageActingCameraGrammar(
  projectRoot: string
): ImageActingCameraGrammarViolation[] {
  void projectRoot;
  const entries = getImageActingCameraGrammarSeedLibrary();
  const violations: ImageActingCameraGrammarViolation[] = [];

  violations.push(...auditActingCameraCompleteness(entries));
  violations.push(...auditDuplicateActingCamera(entries));
  violations.push(...auditImagePromptReference(entries));
  violations.push(...auditStoryboardReference(entries));
  violations.push(...auditActingIntent(entries));
  violations.push(...auditBodyAction(entries));
  violations.push(...auditGazeDirection(entries));
  violations.push(...auditEnvironmentInteraction(entries));
  violations.push(...auditStaticPoseGuard(entries));
  violations.push(...auditLocationVariation(entries));

  return violations;
}

export function writeImageActingCameraGrammarPreview(
  projectRoot: string,
  preview: ImageActingCameraGrammarPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeImageActingCameraGrammarReport(
  projectRoot: string,
  report: ImageActingCameraGrammarReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runImageActingCameraGrammarAudit(
  projectRoot: string
): ImageActingCameraGrammarReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditImageActingCameraGrammar(projectRoot);

  const preview = buildImageActingCameraGrammarPreview();
  if (preview.layer_version !== IMAGE_ACTING_CAMERA_GRAMMAR_VERSION) {
    violations.push({
      code: 'FAIL_ACTING_CAMERA_COMPLETENESS',
      message: 'Preview layer_version mismatch',
      field: 'layer_version',
    });
  }

  writeImageActingCameraGrammarPreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: ImageActingCameraGrammarReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeImageActingCameraGrammarReport(projectRoot, report);
  return report;
}
