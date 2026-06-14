import fs from 'node:fs';
import path from 'node:path';
import { getCharacterContinuityById } from './characterContinuityDefinitions.js';
import {
  getImageActingCameraById,
  getImageActingCameraGrammarSeedLibrary,
  getImagePromptPackById,
} from './imageActingCameraGrammarDefinitions.js';
import {
  buildImageAppInputExport,
  findDuplicatePayloadIds,
  getAllActingCameraIds,
  getAllCharacterContinuityIds,
  getAllImagePromptPackIds,
  getAllLocationContinuityIds,
  IMAGE_APP_INPUT_EXPORT_ID,
  IMAGE_APP_INPUT_EXPORT_JSON_PATH,
  IMAGE_APP_INPUT_EXPORT_SCENE_COUNT,
  IMAGE_APP_INPUT_EXPORT_SONG_MASTER_ID,
  IMAGE_APP_INPUT_EXPORT_VERSION,
  REQUIRED_IMAGE_APP_INPUT_EXPORT_FIELDS,
  REQUIRED_IMAGE_APP_PAYLOAD_FIELDS,
  type ImageAppInputExport,
  type ImageAppScenePayload,
  type RequiredImageAppInputExportField,
  type RequiredImageAppPayloadField,
} from './imageAppInputExport.js';
import { getLocationContinuityById } from './locationContinuityDefinitions.js';
import { getStoryboardSceneSeedLibrary } from './storyboardLayerDefinitions.js';
import { getWorldContinuityById, WORLD_CONTINUITY_WORLD_ID } from './worldContinuityDefinitions.js';

export type ImageAppInputExportAuditResult =
  | 'PASS'
  | 'FAIL_EXPORT_COMPLETENESS'
  | 'FAIL_PROMPT_REFERENCE'
  | 'FAIL_ACTING_CAMERA_REFERENCE'
  | 'FAIL_CHARACTER_CONTINUITY'
  | 'FAIL_LOCATION_CONTINUITY'
  | 'FAIL_WORLD_CONTINUITY'
  | 'FAIL_PAYLOAD_COMPLETENESS'
  | 'FAIL_SCENE_COUNT'
  | 'FAIL_DUPLICATE_PAYLOAD';

export interface ImageAppInputExportViolation {
  code: ImageAppInputExportAuditResult;
  message: string;
  field?: string;
}

export interface ImageAppInputExportReport {
  auditTimestamp: string;
  auditResult: ImageAppInputExportAuditResult;
  layer_version: typeof IMAGE_APP_INPUT_EXPORT_VERSION;
  violations: ImageAppInputExportViolation[];
}

const EXPORT_FILE = 'image-app-input-export.json';
const REPORT_FILE = 'image-app-input-export-report.json';

const FORBIDDEN_EXPORT_TOKENS = [
  'invoke:ai-studio',
  'call:ai-studio',
  'ai-studio-generate',
  'generate:image',
  'trigger:generation',
  'run:gpu',
] as const;

const STORYBOARD_SCENE_IDS = new Set(
  getStoryboardSceneSeedLibrary().map((scene) => scene.storyboard_id)
);

const IMAGE_PROMPT_PACK_IDS = new Set(getAllImagePromptPackIds());
const ACTING_CAMERA_IDS = new Set(getAllActingCameraIds());
const CHARACTER_CONTINUITY_IDS = new Set(getAllCharacterContinuityIds());
const LOCATION_CONTINUITY_IDS = new Set(getAllLocationContinuityIds());

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

function auditExportCompleteness(
  exportDoc: ImageAppInputExport
): ImageAppInputExportViolation[] {
  const violations: ImageAppInputExportViolation[] = [];

  for (const field of REQUIRED_IMAGE_APP_INPUT_EXPORT_FIELDS) {
    const value = exportDoc[field as RequiredImageAppInputExportField];

    if (value === undefined || value === null) {
      violations.push({
        code: 'FAIL_EXPORT_COMPLETENESS',
        message: `Missing required export field ${field}`,
        field,
      });
      continue;
    }

    if (
      field === 'image_prompt_pack_ids' ||
      field === 'acting_camera_ids' ||
      field === 'character_continuity_ids' ||
      field === 'location_continuity_ids' ||
      field === 'image_app_payloads'
    ) {
      if (!Array.isArray(value) || value.length === 0) {
        violations.push({
          code: 'FAIL_EXPORT_COMPLETENESS',
          message: `Field ${field} must be a non-empty array`,
          field,
        });
      }
      continue;
    }

    if (field === 'scene_count') {
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
        violations.push({
          code: 'FAIL_EXPORT_COMPLETENESS',
          message: 'Field scene_count must be a positive integer',
          field: 'scene_count',
        });
      }
      continue;
    }

    if (field === 'image_app_ready') {
      if (typeof value !== 'boolean') {
        violations.push({
          code: 'FAIL_EXPORT_COMPLETENESS',
          message: 'Field image_app_ready must be boolean',
          field: 'image_app_ready',
        });
      }
      continue;
    }

    if (!isNonEmptyString(value)) {
      violations.push({
        code: 'FAIL_EXPORT_COMPLETENESS',
        message: `Field ${field} must be a non-empty string`,
        field,
      });
    }
  }

  if (exportDoc.export_id !== IMAGE_APP_INPUT_EXPORT_ID) {
    violations.push({
      code: 'FAIL_EXPORT_COMPLETENESS',
      message: `export_id must be ${IMAGE_APP_INPUT_EXPORT_ID}`,
      field: 'export_id',
    });
  }

  if (exportDoc.song_master_id !== IMAGE_APP_INPUT_EXPORT_SONG_MASTER_ID) {
    violations.push({
      code: 'FAIL_EXPORT_COMPLETENESS',
      message: `song_master_id must be ${IMAGE_APP_INPUT_EXPORT_SONG_MASTER_ID}`,
      field: 'song_master_id',
    });
  }

  if (exportDoc.world_id !== WORLD_CONTINUITY_WORLD_ID) {
    violations.push({
      code: 'FAIL_EXPORT_COMPLETENESS',
      message: `world_id must be ${WORLD_CONTINUITY_WORLD_ID}`,
      field: 'world_id',
    });
  }

  const serialized = JSON.stringify(exportDoc).toLowerCase();
  for (const token of FORBIDDEN_EXPORT_TOKENS) {
    if (serialized.includes(token)) {
      violations.push({
        code: 'FAIL_EXPORT_COMPLETENESS',
        message: `Forbidden generation token "${token}" found in export`,
        field: 'export',
      });
    }
  }

  return violations;
}

function auditSceneCount(exportDoc: ImageAppInputExport): ImageAppInputExportViolation[] {
  const violations: ImageAppInputExportViolation[] = [];

  if (exportDoc.scene_count !== IMAGE_APP_INPUT_EXPORT_SCENE_COUNT) {
    violations.push({
      code: 'FAIL_SCENE_COUNT',
      message: `Export must declare exactly ${IMAGE_APP_INPUT_EXPORT_SCENE_COUNT} scenes`,
      field: 'scene_count',
    });
  }

  if (exportDoc.image_app_payloads.length !== IMAGE_APP_INPUT_EXPORT_SCENE_COUNT) {
    violations.push({
      code: 'FAIL_SCENE_COUNT',
      message: `image_app_payloads must contain exactly ${IMAGE_APP_INPUT_EXPORT_SCENE_COUNT} entries`,
      field: 'image_app_payloads.length',
    });
  }

  if (exportDoc.image_prompt_pack_ids.length !== IMAGE_APP_INPUT_EXPORT_SCENE_COUNT) {
    violations.push({
      code: 'FAIL_SCENE_COUNT',
      message: 'image_prompt_pack_ids must cover all scenes',
      field: 'image_prompt_pack_ids.length',
    });
  }

  if (exportDoc.acting_camera_ids.length !== IMAGE_APP_INPUT_EXPORT_SCENE_COUNT) {
    violations.push({
      code: 'FAIL_SCENE_COUNT',
      message: 'acting_camera_ids must cover all scenes',
      field: 'acting_camera_ids.length',
    });
  }

  if (!exportDoc.image_app_ready) {
    violations.push({
      code: 'FAIL_SCENE_COUNT',
      message: 'image_app_ready must be true when all scenes are exported',
      field: 'image_app_ready',
    });
  }

  return violations;
}

function auditPromptReference(exportDoc: ImageAppInputExport): ImageAppInputExportViolation[] {
  const violations: ImageAppInputExportViolation[] = [];

  for (const packId of exportDoc.image_prompt_pack_ids) {
    if (!IMAGE_PROMPT_PACK_IDS.has(packId)) {
      violations.push({
        code: 'FAIL_PROMPT_REFERENCE',
        message: `Unknown image_prompt_pack_id "${packId}"`,
        field: 'image_prompt_pack_ids',
      });
    }
  }

  for (const payload of exportDoc.image_app_payloads) {
    if (!IMAGE_PROMPT_PACK_IDS.has(payload.image_prompt_pack_id)) {
      violations.push({
        code: 'FAIL_PROMPT_REFERENCE',
        message: `Unknown image_prompt_pack_id on payload ${payload.payload_id}`,
        field: `${payload.payload_id}.image_prompt_pack_id`,
      });
      continue;
    }

    const pack = getImagePromptPackById(payload.image_prompt_pack_id);
    if (!pack) continue;

    if (pack.image_prompt !== payload.image_prompt) {
      violations.push({
        code: 'FAIL_PROMPT_REFERENCE',
        message: `image_prompt must match image prompt pack on ${payload.payload_id}`,
        field: `${payload.payload_id}.image_prompt`,
      });
    }

    if (pack.negative_prompt !== payload.negative_prompt) {
      violations.push({
        code: 'FAIL_PROMPT_REFERENCE',
        message: `negative_prompt must match image prompt pack on ${payload.payload_id}`,
        field: `${payload.payload_id}.negative_prompt`,
      });
    }

    if (pack.storyboard_id !== payload.storyboard_id) {
      violations.push({
        code: 'FAIL_PROMPT_REFERENCE',
        message: `storyboard_id mismatch on payload ${payload.payload_id}`,
        field: `${payload.payload_id}.storyboard_id`,
      });
    }

    if (pack.scene_order !== payload.scene_order) {
      violations.push({
        code: 'FAIL_PROMPT_REFERENCE',
        message: `scene_order mismatch on payload ${payload.payload_id}`,
        field: `${payload.payload_id}.scene_order`,
      });
    }
  }

  return violations;
}

function auditActingCameraReference(
  exportDoc: ImageAppInputExport
): ImageAppInputExportViolation[] {
  const violations: ImageAppInputExportViolation[] = [];

  for (const actingId of exportDoc.acting_camera_ids) {
    if (!ACTING_CAMERA_IDS.has(actingId)) {
      violations.push({
        code: 'FAIL_ACTING_CAMERA_REFERENCE',
        message: `Unknown acting_camera_id "${actingId}"`,
        field: 'acting_camera_ids',
      });
    }
  }

  const actingEntries = getImageActingCameraGrammarSeedLibrary();
  if (actingEntries.length !== IMAGE_APP_INPUT_EXPORT_SCENE_COUNT) {
    violations.push({
      code: 'FAIL_ACTING_CAMERA_REFERENCE',
      message: 'Acting camera grammar layer must contain 16 entries',
      field: 'acting_camera_ids',
    });
  }

  for (const payload of exportDoc.image_app_payloads) {
    if (!ACTING_CAMERA_IDS.has(payload.acting_camera_id)) {
      violations.push({
        code: 'FAIL_ACTING_CAMERA_REFERENCE',
        message: `Unknown acting_camera_id on payload ${payload.payload_id}`,
        field: `${payload.payload_id}.acting_camera_id`,
      });
      continue;
    }

    const acting = getImageActingCameraById(payload.acting_camera_id);
    if (!acting) continue;

    if (acting.image_prompt_pack_id !== payload.image_prompt_pack_id) {
      violations.push({
        code: 'FAIL_ACTING_CAMERA_REFERENCE',
        message: `acting_camera must pair with image prompt pack on ${payload.payload_id}`,
        field: `${payload.payload_id}.acting_camera_id`,
      });
    }

    const actingFields = [
      'acting_intent',
      'body_action',
      'gaze_direction',
      'hand_action',
      'posture_variation',
      'camera_angle',
      'camera_distance',
      'subject_blocking',
      'environment_interaction',
      'location_variation',
    ] as const;

    for (const field of actingFields) {
      if (acting[field] !== payload[field]) {
        violations.push({
          code: 'FAIL_ACTING_CAMERA_REFERENCE',
          message: `Payload ${field} must match acting camera grammar on ${payload.payload_id}`,
          field: `${payload.payload_id}.${field}`,
        });
      }
    }
  }

  return violations;
}

function auditCharacterContinuity(
  exportDoc: ImageAppInputExport
): ImageAppInputExportViolation[] {
  const violations: ImageAppInputExportViolation[] = [];
  const world = getWorldContinuityById(WORLD_CONTINUITY_WORLD_ID);

  for (const continuityId of exportDoc.character_continuity_ids) {
    if (!CHARACTER_CONTINUITY_IDS.has(continuityId)) {
      violations.push({
        code: 'FAIL_CHARACTER_CONTINUITY',
        message: `Unknown character_continuity_id "${continuityId}"`,
        field: 'character_continuity_ids',
      });
      continue;
    }

    if (!getCharacterContinuityById(continuityId)) {
      violations.push({
        code: 'FAIL_CHARACTER_CONTINUITY',
        message: `Missing character continuity entry for ${continuityId}`,
        field: 'character_continuity_ids',
      });
    }
  }

  if (world) {
    for (const continuityId of world.character_continuity_ids) {
      if (!exportDoc.character_continuity_ids.includes(continuityId)) {
        violations.push({
          code: 'FAIL_CHARACTER_CONTINUITY',
          message: `Export must include world character continuity ${continuityId}`,
          field: 'character_continuity_ids',
        });
      }
    }
  }

  for (const payload of exportDoc.image_app_payloads) {
    if (!isStringArray(payload.character_continuity_anchors)) {
      violations.push({
        code: 'FAIL_CHARACTER_CONTINUITY',
        message: `character_continuity_anchors required on ${payload.payload_id}`,
        field: `${payload.payload_id}.character_continuity_anchors`,
      });
      continue;
    }

    const pairId = `PAIR-${payload.storyboard_id}`;
    for (const continuityId of exportDoc.character_continuity_ids) {
      const entry = getCharacterContinuityById(continuityId);
      if (!entry) continue;
      if (!entry.scene_references.includes(pairId)) continue;

      if (!payload.character_continuity_anchors.includes(`continuity:${continuityId}`)) {
        violations.push({
          code: 'FAIL_CHARACTER_CONTINUITY',
          message: `Payload must include continuity anchor for ${continuityId}`,
          field: `${payload.payload_id}.character_continuity_anchors`,
        });
      }

      if (!payload.character_continuity_anchors.some((token) => token.startsWith('identity:'))) {
        violations.push({
          code: 'FAIL_CHARACTER_CONTINUITY',
          message: `Payload must include identity anchors on ${payload.payload_id}`,
          field: `${payload.payload_id}.character_continuity_anchors`,
        });
      }
    }
  }

  return violations;
}

function auditLocationContinuity(
  exportDoc: ImageAppInputExport
): ImageAppInputExportViolation[] {
  const violations: ImageAppInputExportViolation[] = [];
  const world = getWorldContinuityById(WORLD_CONTINUITY_WORLD_ID);

  for (const locationId of exportDoc.location_continuity_ids) {
    if (!LOCATION_CONTINUITY_IDS.has(locationId)) {
      violations.push({
        code: 'FAIL_LOCATION_CONTINUITY',
        message: `Unknown location_continuity_id "${locationId}"`,
        field: 'location_continuity_ids',
      });
      continue;
    }

    if (!getLocationContinuityById(locationId)) {
      violations.push({
        code: 'FAIL_LOCATION_CONTINUITY',
        message: `Missing location continuity entry for ${locationId}`,
        field: 'location_continuity_ids',
      });
    }
  }

  if (world) {
    for (const locationId of world.location_continuity_ids) {
      if (!exportDoc.location_continuity_ids.includes(locationId)) {
        violations.push({
          code: 'FAIL_LOCATION_CONTINUITY',
          message: `Export must include world location continuity ${locationId}`,
          field: 'location_continuity_ids',
        });
      }
    }
  }

  for (const payload of exportDoc.image_app_payloads) {
    if (!isStringArray(payload.location_continuity_anchors)) {
      violations.push({
        code: 'FAIL_LOCATION_CONTINUITY',
        message: `location_continuity_anchors required on ${payload.payload_id}`,
        field: `${payload.payload_id}.location_continuity_anchors`,
      });
      continue;
    }

    const locationToken = payload.location_variation.split(':')[0];
    if (locationToken && !payload.location_continuity_anchors.includes(`location:${locationToken}`)) {
      violations.push({
        code: 'FAIL_LOCATION_CONTINUITY',
        message: `Payload must include location anchor for ${locationToken}`,
        field: `${payload.payload_id}.location_continuity_anchors`,
      });
    }

    if (!payload.location_continuity_anchors.some((token) => token.startsWith('environment:'))) {
      violations.push({
        code: 'FAIL_LOCATION_CONTINUITY',
        message: `Payload must include environment anchors on ${payload.payload_id}`,
        field: `${payload.payload_id}.location_continuity_anchors`,
      });
    }
  }

  return violations;
}

function auditWorldContinuity(exportDoc: ImageAppInputExport): ImageAppInputExportViolation[] {
  const violations: ImageAppInputExportViolation[] = [];
  const world = getWorldContinuityById(WORLD_CONTINUITY_WORLD_ID);

  if (!world) {
    violations.push({
      code: 'FAIL_WORLD_CONTINUITY',
      message: `Missing world continuity ${WORLD_CONTINUITY_WORLD_ID}`,
      field: 'world_id',
    });
    return violations;
  }

  if (world.song_master_id !== exportDoc.song_master_id) {
    violations.push({
      code: 'FAIL_WORLD_CONTINUITY',
      message: 'World continuity song_master_id must match export',
      field: 'song_master_id',
    });
  }

  for (const payload of exportDoc.image_app_payloads) {
    if (!isStringArray(payload.world_continuity_anchors)) {
      violations.push({
        code: 'FAIL_WORLD_CONTINUITY',
        message: `world_continuity_anchors required on ${payload.payload_id}`,
        field: `${payload.payload_id}.world_continuity_anchors`,
      });
      continue;
    }

    if (!payload.world_continuity_anchors.includes(`world:${WORLD_CONTINUITY_WORLD_ID}`)) {
      violations.push({
        code: 'FAIL_WORLD_CONTINUITY',
        message: `Payload must include world anchor on ${payload.payload_id}`,
        field: `${payload.payload_id}.world_continuity_anchors`,
      });
    }

    if (!payload.world_continuity_anchors.some((token) => token.startsWith('tone:'))) {
      violations.push({
        code: 'FAIL_WORLD_CONTINUITY',
        message: `Payload must include world tone anchors on ${payload.payload_id}`,
        field: `${payload.payload_id}.world_continuity_anchors`,
      });
    }

    if (!payload.world_continuity_anchors.some((token) => token.startsWith('motif:'))) {
      violations.push({
        code: 'FAIL_WORLD_CONTINUITY',
        message: `Payload must include world motif anchors on ${payload.payload_id}`,
        field: `${payload.payload_id}.world_continuity_anchors`,
      });
    }
  }

  return violations;
}

function auditPayloadCompleteness(
  payloads: ImageAppScenePayload[]
): ImageAppInputExportViolation[] {
  const violations: ImageAppInputExportViolation[] = [];

  for (const payload of payloads) {
    for (const field of REQUIRED_IMAGE_APP_PAYLOAD_FIELDS) {
      const value = payload[field as RequiredImageAppPayloadField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_PAYLOAD_COMPLETENESS',
          message: `Missing required payload field ${field} on ${payload.payload_id}`,
          field: `${payload.payload_id}.${field}`,
        });
        continue;
      }

      if (
        field === 'character_continuity_anchors' ||
        field === 'location_continuity_anchors' ||
        field === 'world_continuity_anchors'
      ) {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_PAYLOAD_COMPLETENESS',
            message: `Field ${field} must be a non-empty string array on ${payload.payload_id}`,
            field: `${payload.payload_id}.${field}`,
          });
        }
        continue;
      }

      if (field === 'scene_order') {
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
          violations.push({
            code: 'FAIL_PAYLOAD_COMPLETENESS',
            message: `Field scene_order must be a positive integer on ${payload.payload_id}`,
            field: `${payload.payload_id}.scene_order`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_PAYLOAD_COMPLETENESS',
          message: `Field ${field} must be a non-empty string on ${payload.payload_id}`,
          field: `${payload.payload_id}.${field}`,
        });
      }
    }

    if (payload.payload_id !== `PAYLOAD-${payload.storyboard_id}`) {
      violations.push({
        code: 'FAIL_PAYLOAD_COMPLETENESS',
        message: `payload_id must follow PAYLOAD-{storyboard_id} on ${payload.payload_id}`,
        field: `${payload.payload_id}.payload_id`,
      });
    }

    if (!STORYBOARD_SCENE_IDS.has(payload.storyboard_id)) {
      violations.push({
        code: 'FAIL_PAYLOAD_COMPLETENESS',
        message: `Unknown storyboard_id on ${payload.payload_id}`,
        field: `${payload.payload_id}.storyboard_id`,
      });
    }

    if (payload.image_prompt_pack_id !== `IPP-${payload.storyboard_id}`) {
      violations.push({
        code: 'FAIL_PAYLOAD_COMPLETENESS',
        message: `image_prompt_pack_id must follow IPP-{storyboard_id} on ${payload.payload_id}`,
        field: `${payload.payload_id}.image_prompt_pack_id`,
      });
    }

    if (payload.acting_camera_id !== `IAC-${payload.storyboard_id}`) {
      violations.push({
        code: 'FAIL_PAYLOAD_COMPLETENESS',
        message: `acting_camera_id must follow IAC-{storyboard_id} on ${payload.payload_id}`,
        field: `${payload.payload_id}.acting_camera_id`,
      });
    }
  }

  const sceneOrders = payloads.map((payload) => payload.scene_order);
  const expectedOrders = Array.from({ length: IMAGE_APP_INPUT_EXPORT_SCENE_COUNT }, (_, index) => index + 1);
  for (const order of expectedOrders) {
    if (!sceneOrders.includes(order)) {
      violations.push({
        code: 'FAIL_PAYLOAD_COMPLETENESS',
        message: `Missing payload for scene_order ${order}`,
        field: 'image_app_payloads',
      });
    }
  }

  return violations;
}

function auditDuplicatePayload(
  payloads: ImageAppScenePayload[]
): ImageAppInputExportViolation[] {
  const violations: ImageAppInputExportViolation[] = [];

  for (const payloadId of findDuplicatePayloadIds(payloads.map((payload) => payload.payload_id))) {
    violations.push({
      code: 'FAIL_DUPLICATE_PAYLOAD',
      message: `Duplicate payload_id detected: ${payloadId}`,
      field: 'payload_id',
    });
  }

  const storyboardIds = payloads.map((payload) => payload.storyboard_id);
  const duplicateStoryboards = storyboardIds.filter(
    (storyboardId, index) => storyboardIds.indexOf(storyboardId) !== index
  );
  for (const storyboardId of [...new Set(duplicateStoryboards)]) {
    violations.push({
      code: 'FAIL_DUPLICATE_PAYLOAD',
      message: `Duplicate storyboard_id in payloads: ${storyboardId}`,
      field: 'storyboard_id',
    });
  }

  const packIds = payloads.map((payload) => payload.image_prompt_pack_id);
  const duplicatePacks = packIds.filter((packId, index) => packIds.indexOf(packId) !== index);
  for (const packId of [...new Set(duplicatePacks)]) {
    violations.push({
      code: 'FAIL_DUPLICATE_PAYLOAD',
      message: `Duplicate image_prompt_pack_id in payloads: ${packId}`,
      field: 'image_prompt_pack_id',
    });
  }

  return violations;
}

function primaryFailure(
  violations: ImageAppInputExportViolation[]
): ImageAppInputExportAuditResult {
  const priority: ImageAppInputExportAuditResult[] = [
    'FAIL_EXPORT_COMPLETENESS',
    'FAIL_SCENE_COUNT',
    'FAIL_DUPLICATE_PAYLOAD',
    'FAIL_PROMPT_REFERENCE',
    'FAIL_ACTING_CAMERA_REFERENCE',
    'FAIL_CHARACTER_CONTINUITY',
    'FAIL_LOCATION_CONTINUITY',
    'FAIL_WORLD_CONTINUITY',
    'FAIL_PAYLOAD_COMPLETENESS',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditImageAppInputExport(
  projectRoot: string,
  exportDoc: ImageAppInputExport
): ImageAppInputExportViolation[] {
  void projectRoot;
  const violations: ImageAppInputExportViolation[] = [];

  violations.push(...auditExportCompleteness(exportDoc));
  violations.push(...auditSceneCount(exportDoc));
  violations.push(...auditDuplicatePayload(exportDoc.image_app_payloads));
  violations.push(...auditPromptReference(exportDoc));
  violations.push(...auditActingCameraReference(exportDoc));
  violations.push(...auditCharacterContinuity(exportDoc));
  violations.push(...auditLocationContinuity(exportDoc));
  violations.push(...auditWorldContinuity(exportDoc));
  violations.push(...auditPayloadCompleteness(exportDoc.image_app_payloads));

  return violations;
}

export function writeImageAppInputExport(
  projectRoot: string,
  exportDoc: ImageAppInputExport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const exportPath = path.join(exportsDir, EXPORT_FILE);
  fs.writeFileSync(exportPath, `${JSON.stringify(exportDoc, null, 2)}\n`, 'utf8');
  return exportPath;
}

export function writeImageAppInputExportReport(
  projectRoot: string,
  report: ImageAppInputExportReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runImageAppInputExportAudit(projectRoot: string): ImageAppInputExportReport {
  const auditTimestamp = new Date().toISOString();
  const exportDoc = buildImageAppInputExport();
  const violations = auditImageAppInputExport(projectRoot, exportDoc);

  writeImageAppInputExport(projectRoot, exportDoc);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: ImageAppInputExportReport = {
    auditTimestamp,
    auditResult,
    layer_version: IMAGE_APP_INPUT_EXPORT_VERSION,
    violations,
  };

  writeImageAppInputExportReport(projectRoot, report);
  return report;
}

export { IMAGE_APP_INPUT_EXPORT_JSON_PATH };
