import fs from 'node:fs';
import path from 'node:path';
import { isValidBehaviorId } from './behaviorDnaDefinitions.js';
import { BEHAVIOR_EMOTION_LINKAGE } from './emotionDnaDefinitions.js';
import { isValidEmotionId } from './emotionDnaDefinitions.js';
import { isValidDailyLifeAnchor } from './narrativeBeatDefinitions.js';
import { isValidRelationshipId } from './relationshipDnaDefinitions.js';
import { getShotFingerprintLibrary } from './shotFingerprintContractDefinitions.js';
import {
  getStoryboardSceneSeedLibrary,
} from './storyboardLayerDefinitions.js';
import {
  IMAGE_PROMPT_NEGATIVE_BASE,
  IMAGE_PROMPT_PACK_SEED_COUNT,
  IMAGE_PROMPT_PACK_SONG_MASTER_ID,
  IMAGE_PROMPT_PACK_VERSION,
  IMAGE_PROMPT_STYLE_CORE_BASE,
  REQUIRED_IMAGE_PROMPT_PACK_FIELDS,
  buildImagePromptPackPreview,
  findDuplicatePromptPackIds,
  getAnchorEnvironmentTokens,
  getImagePromptPackSeedLibrary,
  getStoryboardSceneById,
  type ImagePromptPackEntry,
  type ImagePromptPackPreview,
  type RequiredImagePromptPackField,
} from './imagePromptPackDefinitions.js';

export type ImagePromptPackAuditResult =
  | 'PASS'
  | 'FAIL_PROMPT_PACK_COMPLETENESS'
  | 'FAIL_STORYBOARD_REFERENCE'
  | 'FAIL_DNA_REFERENCE'
  | 'FAIL_CHARACTER_IDENTITY'
  | 'FAIL_STYLE_CORE'
  | 'FAIL_ENVIRONMENT_DNA'
  | 'FAIL_VISUAL_FIELDS'
  | 'FAIL_DUPLICATE_PROMPT_PACK';

export interface ImagePromptPackViolation {
  code: ImagePromptPackAuditResult;
  message: string;
  field?: string;
}

export interface ImagePromptPackReport {
  auditTimestamp: string;
  auditResult: ImagePromptPackAuditResult;
  violations: ImagePromptPackViolation[];
}

const PREVIEW_FILE = 'image-prompt-pack-preview.json';
const REPORT_FILE = 'image-prompt-pack-report.json';

const VALID_SHOT_IDS = new Set(
  getShotFingerprintLibrary().map((entry) => entry.fingerprint_id)
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

function auditPromptPackCompleteness(
  packs: ImagePromptPackEntry[]
): ImagePromptPackViolation[] {
  const violations: ImagePromptPackViolation[] = [];

  if (packs.length !== IMAGE_PROMPT_PACK_SEED_COUNT) {
    violations.push({
      code: 'FAIL_PROMPT_PACK_COMPLETENESS',
      message: `Image prompt pack layer must contain exactly ${IMAGE_PROMPT_PACK_SEED_COUNT} packs for ${IMAGE_PROMPT_PACK_SONG_MASTER_ID}`,
      field: 'seed_image_prompt_packs.length',
    });
  }

  for (const pack of packs) {
    for (const field of REQUIRED_IMAGE_PROMPT_PACK_FIELDS) {
      const value = pack[field as RequiredImagePromptPackField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_PROMPT_PACK_COMPLETENESS',
          message: `Missing required field ${field} on prompt pack ${pack.prompt_pack_id}`,
          field: `${pack.prompt_pack_id}.${field}`,
        });
        continue;
      }

      if (
        field === 'character_identity' ||
        field === 'style_core' ||
        field === 'environment_dna' ||
        field === 'composition' ||
        field === 'lighting' ||
        field === 'daily_life_anchor' ||
        field === 'shot_affinity' ||
        field === 'keywords'
      ) {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_PROMPT_PACK_COMPLETENESS',
            message: `Field ${field} must be a non-empty string array on prompt pack ${pack.prompt_pack_id}`,
            field: `${pack.prompt_pack_id}.${field}`,
          });
        }
        continue;
      }

      if (field === 'scene_order') {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          violations.push({
            code: 'FAIL_PROMPT_PACK_COMPLETENESS',
            message: `Field scene_order must be an integer on prompt pack ${pack.prompt_pack_id}`,
            field: `${pack.prompt_pack_id}.scene_order`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_PROMPT_PACK_COMPLETENESS',
          message: `Field ${field} must be a non-empty string on prompt pack ${pack.prompt_pack_id}`,
          field: `${pack.prompt_pack_id}.${field}`,
        });
      }
    }

    if (pack.prompt_pack_id !== `IPP-${pack.storyboard_id}`) {
      violations.push({
        code: 'FAIL_PROMPT_PACK_COMPLETENESS',
        message: `prompt_pack_id must follow IPP-{storyboard_id} on ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.prompt_pack_id`,
      });
    }
  }

  for (const storyboardId of STORYBOARD_SCENE_IDS) {
    if (!packs.some((pack) => pack.storyboard_id === storyboardId)) {
      violations.push({
        code: 'FAIL_PROMPT_PACK_COMPLETENESS',
        message: `Missing image prompt pack for storyboard ${storyboardId}`,
        field: storyboardId,
      });
    }
  }

  return violations;
}

function auditStoryboardReference(
  packs: ImagePromptPackEntry[]
): ImagePromptPackViolation[] {
  const violations: ImagePromptPackViolation[] = [];

  for (const pack of packs) {
    const scene = getStoryboardSceneById(pack.storyboard_id);
    if (!scene) {
      violations.push({
        code: 'FAIL_STORYBOARD_REFERENCE',
        message: `Unknown storyboard_id "${pack.storyboard_id}" on prompt pack ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.storyboard_id`,
      });
      continue;
    }

    if (pack.scene_order !== scene.scene_order) {
      violations.push({
        code: 'FAIL_STORYBOARD_REFERENCE',
        message: `scene_order must match storyboard scene on ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.scene_order`,
      });
    }

    if (pack.behavior_id !== scene.behavior_id) {
      violations.push({
        code: 'FAIL_STORYBOARD_REFERENCE',
        message: `behavior_id must match storyboard scene on ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.behavior_id`,
      });
    }

    if (pack.emotion_id !== scene.emotion_id) {
      violations.push({
        code: 'FAIL_STORYBOARD_REFERENCE',
        message: `emotion_id must match storyboard scene on ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.emotion_id`,
      });
    }

    if (pack.relationship_id !== scene.relationship_id) {
      violations.push({
        code: 'FAIL_STORYBOARD_REFERENCE',
        message: `relationship_id must match storyboard scene on ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.relationship_id`,
      });
    }

    for (const anchor of pack.daily_life_anchor) {
      if (!scene.daily_life_anchor.includes(anchor)) {
        violations.push({
          code: 'FAIL_STORYBOARD_REFERENCE',
          message: `daily_life_anchor must stay within storyboard anchors on ${pack.prompt_pack_id}`,
          field: `${pack.prompt_pack_id}.daily_life_anchor`,
        });
      }
    }

    for (const shotId of pack.shot_affinity) {
      if (!scene.shot_affinity.includes(shotId)) {
        violations.push({
          code: 'FAIL_STORYBOARD_REFERENCE',
          message: `shot_affinity must stay within storyboard shot_affinity on ${pack.prompt_pack_id}`,
          field: `${pack.prompt_pack_id}.shot_affinity`,
        });
      }
    }

    if (!pack.image_prompt.includes(scene.visual_summary)) {
      violations.push({
        code: 'FAIL_STORYBOARD_REFERENCE',
        message: `image_prompt must include storyboard visual_summary on ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.image_prompt`,
      });
    }
  }

  return violations;
}

function auditDnaReference(packs: ImagePromptPackEntry[]): ImagePromptPackViolation[] {
  const violations: ImagePromptPackViolation[] = [];

  for (const pack of packs) {
    if (!isValidBehaviorId(pack.behavior_id)) {
      violations.push({
        code: 'FAIL_DNA_REFERENCE',
        message: `Invalid behavior_id on prompt pack ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.behavior_id`,
      });
    }

    if (!isValidEmotionId(pack.emotion_id)) {
      violations.push({
        code: 'FAIL_DNA_REFERENCE',
        message: `Invalid emotion_id on prompt pack ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.emotion_id`,
      });
    }

    if (!isValidRelationshipId(pack.relationship_id)) {
      violations.push({
        code: 'FAIL_DNA_REFERENCE',
        message: `Invalid relationship_id on prompt pack ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.relationship_id`,
      });
    }

    if (BEHAVIOR_EMOTION_LINKAGE[pack.behavior_id] !== pack.emotion_id) {
      violations.push({
        code: 'FAIL_DNA_REFERENCE',
        message: `behavior_id and emotion_id linkage mismatch on ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.behavior_id`,
      });
    }

    for (const anchor of pack.daily_life_anchor) {
      if (!isValidDailyLifeAnchor(anchor)) {
        violations.push({
          code: 'FAIL_DNA_REFERENCE',
          message: `Invalid daily_life_anchor "${anchor}" on ${pack.prompt_pack_id}`,
          field: `${pack.prompt_pack_id}.daily_life_anchor`,
        });
      }
    }

    for (const shotId of pack.shot_affinity) {
      if (!VALID_SHOT_IDS.has(shotId)) {
        violations.push({
          code: 'FAIL_DNA_REFERENCE',
          message: `Invalid shot_affinity "${shotId}" on ${pack.prompt_pack_id}`,
          field: `${pack.prompt_pack_id}.shot_affinity`,
        });
      }
    }
  }

  return violations;
}

function auditCharacterIdentity(packs: ImagePromptPackEntry[]): ImagePromptPackViolation[] {
  const violations: ImagePromptPackViolation[] = [];

  for (const pack of packs) {
    const behaviorToken = `behavior:${pack.behavior_id}`;
    const relationshipToken = `relationship:${pack.relationship_id}`;

    if (!pack.character_identity.includes(behaviorToken)) {
      violations.push({
        code: 'FAIL_CHARACTER_IDENTITY',
        message: `character_identity must include ${behaviorToken} on ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.character_identity`,
      });
    }

    if (!pack.character_identity.includes(relationshipToken)) {
      violations.push({
        code: 'FAIL_CHARACTER_IDENTITY',
        message: `character_identity must include ${relationshipToken} on ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.character_identity`,
      });
    }

    if (pack.character_identity.length < 5) {
      violations.push({
        code: 'FAIL_CHARACTER_IDENTITY',
        message: `character_identity must contain at least five tokens on ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.character_identity`,
      });
    }
  }

  return violations;
}

function auditStyleCore(packs: ImagePromptPackEntry[]): ImagePromptPackViolation[] {
  const violations: ImagePromptPackViolation[] = [];

  for (const pack of packs) {
    for (const token of IMAGE_PROMPT_STYLE_CORE_BASE) {
      if (!pack.style_core.includes(token)) {
        violations.push({
          code: 'FAIL_STYLE_CORE',
          message: `style_core must include base token "${token}" on ${pack.prompt_pack_id}`,
          field: `${pack.prompt_pack_id}.style_core`,
        });
      }
    }

    const behaviorToken = `behavior-mood:${pack.behavior_id}`;
    const emotionToken = `emotion-tone:${pack.emotion_id}`;

    if (!pack.style_core.includes(behaviorToken)) {
      violations.push({
        code: 'FAIL_STYLE_CORE',
        message: `style_core must include ${behaviorToken} on ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.style_core`,
      });
    }

    if (!pack.style_core.includes(emotionToken)) {
      violations.push({
        code: 'FAIL_STYLE_CORE',
        message: `style_core must include ${emotionToken} on ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.style_core`,
      });
    }
  }

  return violations;
}

function auditEnvironmentDna(packs: ImagePromptPackEntry[]): ImagePromptPackViolation[] {
  const violations: ImagePromptPackViolation[] = [];

  for (const pack of packs) {
    for (const anchor of pack.daily_life_anchor) {
      const anchorToken = `anchor:${anchor}`;
      if (!pack.environment_dna.includes(anchorToken)) {
        violations.push({
          code: 'FAIL_ENVIRONMENT_DNA',
          message: `environment_dna must include ${anchorToken} on ${pack.prompt_pack_id}`,
          field: `${pack.prompt_pack_id}.environment_dna`,
        });
      }

      const expectedTokens = getAnchorEnvironmentTokens(anchor);
      const hasMappedToken = expectedTokens.some((token) => pack.environment_dna.includes(token));
      if (expectedTokens.length > 0 && !hasMappedToken) {
        violations.push({
          code: 'FAIL_ENVIRONMENT_DNA',
          message: `environment_dna must include mapped anchor tokens for ${anchor} on ${pack.prompt_pack_id}`,
          field: `${pack.prompt_pack_id}.environment_dna`,
        });
      }
    }
  }

  return violations;
}

function auditVisualFields(packs: ImagePromptPackEntry[]): ImagePromptPackViolation[] {
  const violations: ImagePromptPackViolation[] = [];

  for (const pack of packs) {
    if (pack.negative_prompt !== IMAGE_PROMPT_NEGATIVE_BASE) {
      violations.push({
        code: 'FAIL_VISUAL_FIELDS',
        message: `negative_prompt must use the shared negative prompt base on ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.negative_prompt`,
      });
    }

    for (const shotId of pack.shot_affinity) {
      const shotToken = `shot:${shotId}`;
      if (!pack.composition.some((item) => item === shotToken || item.startsWith(`${shotToken} `))) {
        if (!pack.composition.includes(shotToken)) {
          violations.push({
            code: 'FAIL_VISUAL_FIELDS',
            message: `composition must reference shot token ${shotToken} on ${pack.prompt_pack_id}`,
            field: `${pack.prompt_pack_id}.composition`,
          });
        }
      }
    }

    if (!pack.image_prompt.includes('Character identity:')) {
      violations.push({
        code: 'FAIL_VISUAL_FIELDS',
        message: `image_prompt must include character identity section on ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.image_prompt`,
      });
    }

    if (!pack.image_prompt.includes('Environment:')) {
      violations.push({
        code: 'FAIL_VISUAL_FIELDS',
        message: `image_prompt must include environment section on ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.image_prompt`,
      });
    }

    if (!pack.image_prompt.includes('Composition:')) {
      violations.push({
        code: 'FAIL_VISUAL_FIELDS',
        message: `image_prompt must include composition section on ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.image_prompt`,
      });
    }

    if (!pack.image_prompt.includes('Lighting:')) {
      violations.push({
        code: 'FAIL_VISUAL_FIELDS',
        message: `image_prompt must include lighting section on ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.image_prompt`,
      });
    }

    if (!pack.image_prompt.includes('Style:')) {
      violations.push({
        code: 'FAIL_VISUAL_FIELDS',
        message: `image_prompt must include style section on ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.image_prompt`,
      });
    }

    if (pack.lighting.length < 3) {
      violations.push({
        code: 'FAIL_VISUAL_FIELDS',
        message: `lighting must contain at least three tokens on ${pack.prompt_pack_id}`,
        field: `${pack.prompt_pack_id}.lighting`,
      });
    }
  }

  return violations;
}

function auditDuplicatePromptPack(
  packs: ImagePromptPackEntry[]
): ImagePromptPackViolation[] {
  const violations: ImagePromptPackViolation[] = [];

  for (const promptPackId of findDuplicatePromptPackIds(
    packs.map((pack) => pack.prompt_pack_id)
  )) {
    violations.push({
      code: 'FAIL_DUPLICATE_PROMPT_PACK',
      message: `Duplicate prompt_pack_id detected: ${promptPackId}`,
      field: 'prompt_pack_id',
    });
  }

  const storyboardIds = packs.map((pack) => pack.storyboard_id);
  const duplicateStoryboards = storyboardIds.filter(
    (storyboardId, index) => storyboardIds.indexOf(storyboardId) !== index
  );
  for (const storyboardId of [...new Set(duplicateStoryboards)]) {
    violations.push({
      code: 'FAIL_DUPLICATE_PROMPT_PACK',
      message: `Duplicate storyboard_id in prompt pack layer: ${storyboardId}`,
      field: 'storyboard_id',
    });
  }

  const sceneOrders = packs.map((pack) => pack.scene_order);
  const duplicateOrders = sceneOrders.filter(
    (sceneOrder, index) => sceneOrders.indexOf(sceneOrder) !== index
  );
  for (const sceneOrder of [...new Set(duplicateOrders)]) {
    violations.push({
      code: 'FAIL_DUPLICATE_PROMPT_PACK',
      message: `Duplicate scene_order in prompt pack layer: ${sceneOrder}`,
      field: 'scene_order',
    });
  }

  return violations;
}

function primaryFailure(
  violations: ImagePromptPackViolation[]
): ImagePromptPackAuditResult {
  const priority: ImagePromptPackAuditResult[] = [
    'FAIL_PROMPT_PACK_COMPLETENESS',
    'FAIL_DUPLICATE_PROMPT_PACK',
    'FAIL_STORYBOARD_REFERENCE',
    'FAIL_DNA_REFERENCE',
    'FAIL_CHARACTER_IDENTITY',
    'FAIL_STYLE_CORE',
    'FAIL_ENVIRONMENT_DNA',
    'FAIL_VISUAL_FIELDS',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditImagePromptPack(projectRoot: string): ImagePromptPackViolation[] {
  void projectRoot;
  const packs = getImagePromptPackSeedLibrary();
  const violations: ImagePromptPackViolation[] = [];

  violations.push(...auditPromptPackCompleteness(packs));
  violations.push(...auditDuplicatePromptPack(packs));
  violations.push(...auditStoryboardReference(packs));
  violations.push(...auditDnaReference(packs));
  violations.push(...auditCharacterIdentity(packs));
  violations.push(...auditStyleCore(packs));
  violations.push(...auditEnvironmentDna(packs));
  violations.push(...auditVisualFields(packs));

  return violations;
}

export function writeImagePromptPackPreview(
  projectRoot: string,
  preview: ImagePromptPackPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeImagePromptPackReport(
  projectRoot: string,
  report: ImagePromptPackReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runImagePromptPackAudit(projectRoot: string): ImagePromptPackReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditImagePromptPack(projectRoot);

  const preview = buildImagePromptPackPreview();
  if (preview.layer_version !== IMAGE_PROMPT_PACK_VERSION) {
    violations.push({
      code: 'FAIL_PROMPT_PACK_COMPLETENESS',
      message: 'Preview layer_version mismatch',
      field: 'layer_version',
    });
  }

  writeImagePromptPackPreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: ImagePromptPackReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeImagePromptPackReport(projectRoot, report);
  return report;
}
