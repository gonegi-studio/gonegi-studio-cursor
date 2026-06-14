import fs from 'node:fs';
import path from 'node:path';
import {
  ANTI_STATIC_POSE_RULES_BASE,
  getImageActingCameraById,
  getLocationVariationSuffix,
  isForbiddenFrontalGaze,
  isForbiddenStaticPosture,
  isOffLensGaze,
} from './imageActingCameraGrammarDefinitions.js';
import {
  auditImageAppInputExport,
  type ImageAppInputExportReport,
} from './imageAppInputExportAudit.js';
import {
  IMAGE_APP_INPUT_EXPORT_ID,
  IMAGE_APP_INPUT_EXPORT_JSON_PATH,
  IMAGE_APP_INPUT_EXPORT_SCENE_COUNT,
  IMAGE_APP_INPUT_EXPORT_SONG_MASTER_ID,
  type ImageAppInputExport,
  type ImageAppScenePayload,
} from './imageAppInputExport.js';

export const IMAGE_APP_INPUT_QUALITY_GATE_VERSION =
  'IMAGE-APP-INPUT-QUALITY-GATE-PHASE-94-v1' as const;
export const IMAGE_APP_INPUT_QUALITY_GATE_REPORT_PATH =
  'exports/image-app-input-quality-gate-report.json' as const;

export type ImageAppInputQualityGateAuditResult =
  | 'PASS'
  | 'FAIL_INPUT_EXPORT'
  | 'FAIL_SCENE_PAYLOAD'
  | 'FAIL_PROMPT_FIELD'
  | 'FAIL_ACTING_FIELD'
  | 'FAIL_CAMERA_GRAMMAR'
  | 'FAIL_STATIC_POSE_GUARD'
  | 'FAIL_CHARACTER_ANCHOR'
  | 'FAIL_LOCATION_ANCHOR'
  | 'FAIL_WORLD_ANCHOR'
  | 'FAIL_LOCATION_VARIATION'
  | 'FAIL_AI_STUDIO_TRIGGERED';

export interface ImageAppInputQualityGateViolation {
  code: ImageAppInputQualityGateAuditResult;
  message: string;
  field?: string;
}

export interface ImageAppInputQualityGateReport {
  auditTimestamp: string;
  auditResult: ImageAppInputQualityGateAuditResult;
  layer_version: typeof IMAGE_APP_INPUT_QUALITY_GATE_VERSION;
  export_reference: {
    export_id: string;
    export_path: typeof IMAGE_APP_INPUT_EXPORT_JSON_PATH;
    export_audit_result: 'PASS' | 'FAIL';
  };
  scene_count: number;
  payloads_ready: number;
  violations: ImageAppInputQualityGateViolation[];
}

const REPORT_FILE = 'image-app-input-quality-gate-report.json';
const EXPORT_REPORT_FILE = 'image-app-input-export-report.json';

const REQUIRED_PROMPT_FIELDS = ['image_prompt', 'negative_prompt'] as const;
const REQUIRED_ACTING_FIELDS = [
  'acting_intent',
  'body_action',
  'gaze_direction',
  'hand_action',
  'posture_variation',
  'environment_interaction',
] as const;
const REQUIRED_CAMERA_FIELDS = ['camera_angle', 'camera_distance', 'subject_blocking'] as const;

const FORBIDDEN_AI_STUDIO_TOKENS = [
  'invoke:ai-studio',
  'call:ai-studio',
  'ai-studio-generate',
  'generate:image',
  'trigger:generation',
  'run:gpu',
  'post:ai-studio',
  'fetch:ai-studio',
] as const;

const ALLOWED_AI_STUDIO_GUARDS = [
  'no-ai-studio-generation',
  'no-ai-studio-no-gpu',
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

function stripAllowedAiStudioGuards(serialized: string): string {
  let sanitized = serialized;
  for (const guard of ALLOWED_AI_STUDIO_GUARDS) {
    sanitized = sanitized.split(guard).join('');
  }
  return sanitized;
}

export function loadImageAppInputExport(projectRoot: string): ImageAppInputExport | null {
  const exportPath = path.join(projectRoot, IMAGE_APP_INPUT_EXPORT_JSON_PATH);
  if (!fs.existsSync(exportPath)) return null;
  return JSON.parse(fs.readFileSync(exportPath, 'utf8')) as ImageAppInputExport;
}

function loadImageAppInputExportReport(projectRoot: string): ImageAppInputExportReport | null {
  const reportPath = path.join(projectRoot, 'exports', EXPORT_REPORT_FILE);
  if (!fs.existsSync(reportPath)) return null;
  return JSON.parse(fs.readFileSync(reportPath, 'utf8')) as ImageAppInputExportReport;
}

function auditInputExportGate(
  projectRoot: string,
  exportDoc: ImageAppInputExport | null
): ImageAppInputQualityGateViolation[] {
  const violations: ImageAppInputQualityGateViolation[] = [];

  if (!exportDoc) {
    violations.push({
      code: 'FAIL_INPUT_EXPORT',
      message: `${IMAGE_APP_INPUT_EXPORT_JSON_PATH} not found`,
      field: IMAGE_APP_INPUT_EXPORT_JSON_PATH,
    });
    return violations;
  }

  if (exportDoc.export_id !== IMAGE_APP_INPUT_EXPORT_ID) {
    violations.push({
      code: 'FAIL_INPUT_EXPORT',
      message: `export_id must be ${IMAGE_APP_INPUT_EXPORT_ID}`,
      field: 'export_id',
    });
  }

  if (exportDoc.song_master_id !== IMAGE_APP_INPUT_EXPORT_SONG_MASTER_ID) {
    violations.push({
      code: 'FAIL_INPUT_EXPORT',
      message: `song_master_id must be ${IMAGE_APP_INPUT_EXPORT_SONG_MASTER_ID}`,
      field: 'song_master_id',
    });
  }

  if (!exportDoc.image_app_ready) {
    violations.push({
      code: 'FAIL_INPUT_EXPORT',
      message: 'image_app_ready must be true before quality gate',
      field: 'image_app_ready',
    });
  }

  const exportReport = loadImageAppInputExportReport(projectRoot);
  if (!exportReport || exportReport.auditResult !== 'PASS') {
    violations.push({
      code: 'FAIL_INPUT_EXPORT',
      message: 'image-app-input-export audit must PASS before quality gate',
      field: EXPORT_REPORT_FILE,
    });
  }

  const exportViolations = auditImageAppInputExport(projectRoot, exportDoc);
  if (exportViolations.length > 0) {
    violations.push({
      code: 'FAIL_INPUT_EXPORT',
      message: 'image-app-input-export layer audit failed quality gate precondition',
      field: 'image_app_input_export',
    });
  }

  return violations;
}

function auditScenePayloads(
  exportDoc: ImageAppInputExport
): ImageAppInputQualityGateViolation[] {
  const violations: ImageAppInputQualityGateViolation[] = [];

  if (exportDoc.scene_count !== IMAGE_APP_INPUT_EXPORT_SCENE_COUNT) {
    violations.push({
      code: 'FAIL_SCENE_PAYLOAD',
      message: `Export must declare ${IMAGE_APP_INPUT_EXPORT_SCENE_COUNT} scenes`,
      field: 'scene_count',
    });
  }

  if (exportDoc.image_app_payloads.length !== IMAGE_APP_INPUT_EXPORT_SCENE_COUNT) {
    violations.push({
      code: 'FAIL_SCENE_PAYLOAD',
      message: `Expected ${IMAGE_APP_INPUT_EXPORT_SCENE_COUNT} image_app_payloads`,
      field: 'image_app_payloads.length',
    });
  }

  const expectedOrders = Array.from(
    { length: IMAGE_APP_INPUT_EXPORT_SCENE_COUNT },
    (_, index) => index + 1
  );
  const presentOrders = new Set(exportDoc.image_app_payloads.map((payload) => payload.scene_order));

  for (const order of expectedOrders) {
    if (!presentOrders.has(order)) {
      violations.push({
        code: 'FAIL_SCENE_PAYLOAD',
        message: `Missing payload for scene_order ${order}`,
        field: 'image_app_payloads',
      });
    }
  }

  for (const payload of exportDoc.image_app_payloads) {
    if (!isNonEmptyString(payload.payload_id)) {
      violations.push({
        code: 'FAIL_SCENE_PAYLOAD',
        message: 'Each payload must declare payload_id',
        field: `${payload.storyboard_id ?? 'unknown'}.payload_id`,
      });
    }

    if (payload.payload_id !== `PAYLOAD-${payload.storyboard_id}`) {
      violations.push({
        code: 'FAIL_SCENE_PAYLOAD',
        message: `Invalid payload_id on ${payload.payload_id}`,
        field: `${payload.payload_id}.payload_id`,
      });
    }
  }

  return violations;
}

function auditPromptFields(payload: ImageAppScenePayload): ImageAppInputQualityGateViolation[] {
  const violations: ImageAppInputQualityGateViolation[] = [];

  for (const field of REQUIRED_PROMPT_FIELDS) {
    if (!isNonEmptyString(payload[field])) {
      violations.push({
        code: 'FAIL_PROMPT_FIELD',
        message: `Missing ${field} on ${payload.payload_id}`,
        field: `${payload.payload_id}.${field}`,
      });
      continue;
    }

    if (payload[field].length < 20) {
      violations.push({
        code: 'FAIL_PROMPT_FIELD',
        message: `${field} must be substantive on ${payload.payload_id}`,
        field: `${payload.payload_id}.${field}`,
      });
    }
  }

  return violations;
}

function auditActingFields(payload: ImageAppScenePayload): ImageAppInputQualityGateViolation[] {
  const violations: ImageAppInputQualityGateViolation[] = [];

  for (const field of REQUIRED_ACTING_FIELDS) {
    if (!isNonEmptyString(payload[field])) {
      violations.push({
        code: 'FAIL_ACTING_FIELD',
        message: `Missing ${field} on ${payload.payload_id}`,
        field: `${payload.payload_id}.${field}`,
      });
    }
  }

  return violations;
}

function auditCameraGrammar(payload: ImageAppScenePayload): ImageAppInputQualityGateViolation[] {
  const violations: ImageAppInputQualityGateViolation[] = [];

  for (const field of REQUIRED_CAMERA_FIELDS) {
    if (!isNonEmptyString(payload[field])) {
      violations.push({
        code: 'FAIL_CAMERA_GRAMMAR',
        message: `Missing ${field} on ${payload.payload_id}`,
        field: `${payload.payload_id}.${field}`,
      });
    }
  }

  const acting = getImageActingCameraById(payload.acting_camera_id);
  if (!acting) {
    violations.push({
      code: 'FAIL_CAMERA_GRAMMAR',
      message: `Missing acting camera grammar for ${payload.acting_camera_id}`,
      field: `${payload.payload_id}.acting_camera_id`,
    });
    return violations;
  }

  if (!isNonEmptyString(acting.camera_movement_hint)) {
    violations.push({
      code: 'FAIL_CAMERA_GRAMMAR',
      message: `camera_movement_hint required in acting grammar for ${payload.payload_id}`,
      field: `${payload.acting_camera_id}.camera_movement_hint`,
    });
  }

  if (acting.foreground_midground_background.length !== 3) {
    violations.push({
      code: 'FAIL_CAMERA_GRAMMAR',
      message: `foreground_midground_background depth required for ${payload.payload_id}`,
      field: `${payload.acting_camera_id}.foreground_midground_background`,
    });
  }

  return violations;
}

function auditStaticPoseGuard(payload: ImageAppScenePayload): ImageAppInputQualityGateViolation[] {
  const violations: ImageAppInputQualityGateViolation[] = [];
  const acting = getImageActingCameraById(payload.acting_camera_id);

  if (!acting) {
    violations.push({
      code: 'FAIL_STATIC_POSE_GUARD',
      message: `Acting camera grammar missing for static pose guard on ${payload.payload_id}`,
      field: `${payload.payload_id}.acting_camera_id`,
    });
    return violations;
  }

  for (const rule of ANTI_STATIC_POSE_RULES_BASE) {
    if (!acting.anti_static_pose_rules.includes(rule)) {
      violations.push({
        code: 'FAIL_STATIC_POSE_GUARD',
        message: `anti_static_pose_rules must include "${rule}" on ${payload.payload_id}`,
        field: `${payload.acting_camera_id}.anti_static_pose_rules`,
      });
    }
  }

  if (isForbiddenFrontalGaze(payload.gaze_direction)) {
    violations.push({
      code: 'FAIL_STATIC_POSE_GUARD',
      message: `gaze_direction must avoid frontal camera stare on ${payload.payload_id}`,
      field: `${payload.payload_id}.gaze_direction`,
    });
  }

  if (!isOffLensGaze(payload.gaze_direction)) {
    violations.push({
      code: 'FAIL_STATIC_POSE_GUARD',
      message: `gaze_direction must declare off-lens intent on ${payload.payload_id}`,
      field: `${payload.payload_id}.gaze_direction`,
    });
  }

  if (isForbiddenStaticPosture(payload.posture_variation)) {
    violations.push({
      code: 'FAIL_STATIC_POSE_GUARD',
      message: `posture_variation must avoid static parade-rest pose on ${payload.payload_id}`,
      field: `${payload.payload_id}.posture_variation`,
    });
  }

  if (
    payload.body_action.toLowerCase().includes('standing still') ||
    payload.hand_action.toLowerCase().includes('at sides')
  ) {
    violations.push({
      code: 'FAIL_STATIC_POSE_GUARD',
      message: `body and hand action must show in-progress performance on ${payload.payload_id}`,
      field: `${payload.payload_id}.body_action`,
    });
  }

  return violations;
}

function auditCharacterAnchors(payload: ImageAppScenePayload): ImageAppInputQualityGateViolation[] {
  const violations: ImageAppInputQualityGateViolation[] = [];

  if (!isStringArray(payload.character_continuity_anchors)) {
    violations.push({
      code: 'FAIL_CHARACTER_ANCHOR',
      message: `character_continuity_anchors required on ${payload.payload_id}`,
      field: `${payload.payload_id}.character_continuity_anchors`,
    });
    return violations;
  }

  const requiredPrefixes = ['continuity:', 'identity:', 'facial:', 'body:', 'behavior:'];
  for (const prefix of requiredPrefixes) {
    if (!payload.character_continuity_anchors.some((token) => token.startsWith(prefix))) {
      violations.push({
        code: 'FAIL_CHARACTER_ANCHOR',
        message: `character_continuity_anchors must include ${prefix} tokens on ${payload.payload_id}`,
        field: `${payload.payload_id}.character_continuity_anchors`,
      });
    }
  }

  return violations;
}

function auditLocationAnchors(payload: ImageAppScenePayload): ImageAppInputQualityGateViolation[] {
  const violations: ImageAppInputQualityGateViolation[] = [];

  if (!isStringArray(payload.location_continuity_anchors)) {
    violations.push({
      code: 'FAIL_LOCATION_ANCHOR',
      message: `location_continuity_anchors required on ${payload.payload_id}`,
      field: `${payload.payload_id}.location_continuity_anchors`,
    });
    return violations;
  }

  const requiredPrefixes = ['location:', 'environment:', 'lighting:', 'color:'];
  for (const prefix of requiredPrefixes) {
    if (!payload.location_continuity_anchors.some((token) => token.startsWith(prefix))) {
      violations.push({
        code: 'FAIL_LOCATION_ANCHOR',
        message: `location_continuity_anchors must include ${prefix} tokens on ${payload.payload_id}`,
        field: `${payload.payload_id}.location_continuity_anchors`,
      });
    }
  }

  return violations;
}

function auditWorldAnchors(payload: ImageAppScenePayload): ImageAppInputQualityGateViolation[] {
  const violations: ImageAppInputQualityGateViolation[] = [];

  if (!isStringArray(payload.world_continuity_anchors)) {
    violations.push({
      code: 'FAIL_WORLD_ANCHOR',
      message: `world_continuity_anchors required on ${payload.payload_id}`,
      field: `${payload.payload_id}.world_continuity_anchors`,
    });
    return violations;
  }

  if (!payload.world_continuity_anchors.some((token) => token.startsWith('world:'))) {
    violations.push({
      code: 'FAIL_WORLD_ANCHOR',
      message: `world_continuity_anchors must include world token on ${payload.payload_id}`,
      field: `${payload.payload_id}.world_continuity_anchors`,
    });
  }

  if (!payload.world_continuity_anchors.some((token) => token.startsWith('tone:'))) {
    violations.push({
      code: 'FAIL_WORLD_ANCHOR',
      message: `world_continuity_anchors must include tone token on ${payload.payload_id}`,
      field: `${payload.payload_id}.world_continuity_anchors`,
    });
  }

  if (!payload.world_continuity_anchors.some((token) => token.startsWith('motif:'))) {
    violations.push({
      code: 'FAIL_WORLD_ANCHOR',
      message: `world_continuity_anchors must include motif token on ${payload.payload_id}`,
      field: `${payload.payload_id}.world_continuity_anchors`,
    });
  }

  return violations;
}

function auditLocationVariation(
  payloads: ImageAppScenePayload[]
): ImageAppInputQualityGateViolation[] {
  const violations: ImageAppInputQualityGateViolation[] = [];
  const suffixes = payloads.map((payload) => getLocationVariationSuffix(payload.location_variation));

  for (const payload of payloads) {
    if (!isNonEmptyString(payload.location_variation)) {
      violations.push({
        code: 'FAIL_LOCATION_VARIATION',
        message: `location_variation required on ${payload.payload_id}`,
        field: `${payload.payload_id}.location_variation`,
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

  const duplicateFull = payloads
    .map((payload) => payload.location_variation)
    .filter((value, index, array) => array.indexOf(value) !== index);
  for (const value of [...new Set(duplicateFull)]) {
    violations.push({
      code: 'FAIL_LOCATION_VARIATION',
      message: `Duplicate location_variation value detected: "${value}"`,
      field: 'location_variation',
    });
  }

  return violations;
}

function auditAiStudioTriggered(exportDoc: ImageAppInputExport): ImageAppInputQualityGateViolation[] {
  const violations: ImageAppInputQualityGateViolation[] = [];
  const sanitized = stripAllowedAiStudioGuards(JSON.stringify(exportDoc).toLowerCase());

  for (const token of FORBIDDEN_AI_STUDIO_TOKENS) {
    if (sanitized.includes(token)) {
      violations.push({
        code: 'FAIL_AI_STUDIO_TRIGGERED',
        message: `Forbidden AI Studio trigger token "${token}" found in export`,
        field: 'image_app_input_export',
      });
    }
  }

  if (sanitized.includes('"ai_studio_called"') || sanitized.includes('"generation_triggered":true')) {
    violations.push({
      code: 'FAIL_AI_STUDIO_TRIGGERED',
      message: 'Export must not declare generation as triggered',
      field: 'image_app_input_export',
    });
  }

  return violations;
}

function countPayloadsReady(payloads: ImageAppScenePayload[]): number {
  return payloads.filter((payload) => {
    const promptReady = REQUIRED_PROMPT_FIELDS.every((field) => isNonEmptyString(payload[field]));
    const actingReady = REQUIRED_ACTING_FIELDS.every((field) => isNonEmptyString(payload[field]));
    const cameraReady = REQUIRED_CAMERA_FIELDS.every((field) => isNonEmptyString(payload[field]));
    const anchorsReady =
      isStringArray(payload.character_continuity_anchors) &&
      isStringArray(payload.location_continuity_anchors) &&
      isStringArray(payload.world_continuity_anchors);
    return promptReady && actingReady && cameraReady && anchorsReady;
  }).length;
}

function primaryFailure(
  violations: ImageAppInputQualityGateViolation[]
): ImageAppInputQualityGateAuditResult {
  const priority: ImageAppInputQualityGateAuditResult[] = [
    'FAIL_INPUT_EXPORT',
    'FAIL_AI_STUDIO_TRIGGERED',
    'FAIL_SCENE_PAYLOAD',
    'FAIL_PROMPT_FIELD',
    'FAIL_ACTING_FIELD',
    'FAIL_CAMERA_GRAMMAR',
    'FAIL_STATIC_POSE_GUARD',
    'FAIL_CHARACTER_ANCHOR',
    'FAIL_LOCATION_ANCHOR',
    'FAIL_WORLD_ANCHOR',
    'FAIL_LOCATION_VARIATION',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditImageAppInputQualityGate(
  projectRoot: string,
  exportDoc: ImageAppInputExport | null
): ImageAppInputQualityGateViolation[] {
  const violations: ImageAppInputQualityGateViolation[] = [];

  violations.push(...auditInputExportGate(projectRoot, exportDoc));
  if (!exportDoc) return violations;

  violations.push(...auditAiStudioTriggered(exportDoc));
  violations.push(...auditScenePayloads(exportDoc));
  violations.push(...auditLocationVariation(exportDoc.image_app_payloads));

  for (const payload of exportDoc.image_app_payloads) {
    violations.push(...auditPromptFields(payload));
    violations.push(...auditActingFields(payload));
    violations.push(...auditCameraGrammar(payload));
    violations.push(...auditStaticPoseGuard(payload));
    violations.push(...auditCharacterAnchors(payload));
    violations.push(...auditLocationAnchors(payload));
    violations.push(...auditWorldAnchors(payload));
  }

  return violations;
}

export function writeImageAppInputQualityGateReport(
  projectRoot: string,
  report: ImageAppInputQualityGateReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runImageAppInputQualityGate(projectRoot: string): ImageAppInputQualityGateReport {
  const auditTimestamp = new Date().toISOString();
  const exportDoc = loadImageAppInputExport(projectRoot);
  const violations = auditImageAppInputQualityGate(projectRoot, exportDoc);
  const exportReport = loadImageAppInputExportReport(projectRoot);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: ImageAppInputQualityGateReport = {
    auditTimestamp,
    auditResult,
    layer_version: IMAGE_APP_INPUT_QUALITY_GATE_VERSION,
    export_reference: {
      export_id: exportDoc?.export_id ?? IMAGE_APP_INPUT_EXPORT_ID,
      export_path: IMAGE_APP_INPUT_EXPORT_JSON_PATH,
      export_audit_result: exportReport?.auditResult === 'PASS' ? 'PASS' : 'FAIL',
    },
    scene_count: exportDoc?.scene_count ?? 0,
    payloads_ready: exportDoc ? countPayloadsReady(exportDoc.image_app_payloads) : 0,
    violations,
  };

  writeImageAppInputQualityGateReport(projectRoot, report);
  return report;
}
