import fs from 'node:fs';
import path from 'node:path';
import {
  TEST_KIKI_EXTRACTION_JSON_PATH,
  TEST_KIKI_EXTRACTION_REPORT_PATH,
  TEST_KIKI_EXTRACTION_SCHEMA_VERSION,
  TEST_KIKI_FRAME_COUNT,
  TEST_KIKI_VIDEO_ID,
  type TestKikiExtractionDocument,
  type TestKikiExtractedFrame,
} from './testKikiExtractionSchema.js';

export const TEST_KIKI_EXTRACTION_QUALITY_REPORT_PATH =
  'exports/test-kiki-25s-extraction-quality-report.json' as const;

export type TestKikiExtractionQualityAuditResult = 'PASS' | 'FAIL';

export type TestKikiExtractionQualityViolation = {
  code: string;
  message: string;
  field?: string;
};

export type TestKikiExtractionQualityReport = {
  auditTimestamp: string;
  auditResult: TestKikiExtractionQualityAuditResult;
  schema_version: typeof TEST_KIKI_EXTRACTION_SCHEMA_VERSION;
  video_id: typeof TEST_KIKI_VIDEO_ID;
  source_extraction_audit: 'PASS' | 'FAIL' | 'MISSING';
  frame_count: number;
  metrics: {
    camera_pattern_diversity: number;
    acting_pattern_diversity: number;
    daily_life_anchor_count: number;
    location_grammar_diversity: number;
    front_facing_frame_count: number;
    static_pose_frame_count: number;
    dynamic_pose_frame_count: number;
  };
  violations: TestKikiExtractionQualityViolation[];
  audit_codes: readonly string[];
  grammar_only_ready: boolean;
  app_ingestion_ready: boolean;
};

const CHARACTER_DNA_TOKENS = [
  'character_dna',
  'gonegi',
  'dana',
  'outfit_key',
  'silhouette_key',
  'character_key',
  'expression_key',
] as const;

const STYLE_CORE_TOKENS = [
  'style_core',
  'master_style',
  'master_style_core',
  'brushwork',
  'palette_key',
  'material_key',
  'style_strength',
] as const;

const ENV_DNA_TOKENS = [
  'env_dna',
  'environment_dna',
  'atmosphere_profile',
  'weather_system',
  'dominant_palette',
  'color_temp',
] as const;

const PROMPT_FIELD_TOKENS = [
  'image_prompt',
  'negative_prompt',
  'prompt_intent',
  'compiled_image_prompt',
  'generative_layer',
  'midjourney',
  'runway',
  'kling',
  'renderer_input',
] as const;

const GRAMMAR_CATEGORIES = [
  'camera',
  'acting',
  'daily_life',
  'location',
  'emotion',
  'story',
] as const;

const STATIC_POSTURES = new Set(['upright-neutral', 'seated']);
const DYNAMIC_POSTURES = new Set([
  'walking-stride',
  'running-stride',
  'forward-lean',
  'crouched',
]);

const FRONT_CAMERA_ANGLES = new Set(['front']);
const FRONT_GAZE_TOKENS = ['toward-camera', 'camera-lens', 'frontal-gaze', 'at-camera'] as const;

const ALLOWED_DOCUMENT_KEYS = new Set([
  'schema_version',
  'video_id',
  'source',
  'frames',
  'global_patterns',
  'audit_result',
  'audit_codes',
  'weight_profile',
]);

const MIN_CAMERA_PATTERN_DIVERSITY = 5;
const MIN_ACTING_PATTERN_DIVERSITY = 5;
const MIN_DAILY_LIFE_ANCHORS = 3;
const MIN_LOCATION_GRAMMAR_DIVERSITY = 3;
const MAX_FRONT_FACING_FRAMES = 1;
const MIN_DYNAMIC_POSE_FRAMES = 4;
const MAX_STATIC_POSE_RATIO = 0.5;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function containsAny(haystack: string, tokens: readonly string[]): string | null {
  for (const token of tokens) {
    if (haystack.includes(token)) {
      return token;
    }
  }
  return null;
}

function cameraPatternSignature(frame: TestKikiExtractedFrame): string {
  return [
    frame.camera.camera_distance,
    frame.camera.framing_type,
    frame.camera.camera_angle,
  ].join('|');
}

function actingPatternSignature(frame: TestKikiExtractedFrame): string {
  return [
    frame.acting.gaze_direction,
    frame.acting.posture,
    frame.acting.hand_activity,
  ].join('|');
}

function locationPatternSignature(frame: TestKikiExtractedFrame): string {
  return [frame.location.space_type, frame.location.architectural_feature].join('|');
}

function isFrontFacingFrame(frame: TestKikiExtractedFrame): boolean {
  if (FRONT_CAMERA_ANGLES.has(frame.camera.camera_angle)) {
    return true;
  }
  const gaze = frame.acting.gaze_direction.toLowerCase();
  return FRONT_GAZE_TOKENS.some((token) => gaze.includes(token));
}

function isStaticPoseFrame(frame: TestKikiExtractedFrame): boolean {
  return STATIC_POSTURES.has(frame.acting.posture);
}

function isDynamicPoseFrame(frame: TestKikiExtractedFrame): boolean {
  return DYNAMIC_POSTURES.has(frame.acting.posture);
}

function loadExtractionDocument(projectRoot: string): TestKikiExtractionDocument {
  const extractionPath = path.join(projectRoot, TEST_KIKI_EXTRACTION_JSON_PATH);
  if (!fs.existsSync(extractionPath)) {
    throw new Error(`Missing extraction export at ${TEST_KIKI_EXTRACTION_JSON_PATH}`);
  }
  return JSON.parse(fs.readFileSync(extractionPath, 'utf8')) as TestKikiExtractionDocument;
}

function loadSourceExtractionAuditResult(projectRoot: string): 'PASS' | 'FAIL' | 'MISSING' {
  const reportPath = path.join(projectRoot, TEST_KIKI_EXTRACTION_REPORT_PATH);
  if (!fs.existsSync(reportPath)) {
    return 'MISSING';
  }
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as { auditResult?: string };
  if (report.auditResult === 'PASS') {
    return 'PASS';
  }
  if (report.auditResult === 'FAIL') {
    return 'FAIL';
  }
  return 'MISSING';
}

export function auditTestKikiExtractionQuality(
  projectRoot: string
): TestKikiExtractionQualityReport {
  const document = loadExtractionDocument(projectRoot);
  const sourceExtractionAudit = loadSourceExtractionAuditResult(projectRoot);
  const violations: TestKikiExtractionQualityViolation[] = [];
  const serialized = JSON.stringify(document).toLowerCase();

  if (document.frames.length !== TEST_KIKI_FRAME_COUNT) {
    violations.push({
      code: 'FAIL_FRAME_COUNT',
      message: `Expected ${TEST_KIKI_FRAME_COUNT} frames, received ${document.frames.length}`,
      field: 'frames',
    });
  }

  for (const frame of document.frames) {
    for (const category of GRAMMAR_CATEGORIES) {
      const block = frame[category];
      if (block === null || typeof block !== 'object') {
        violations.push({
          code: 'FAIL_GRAMMAR_CATEGORY_MISSING',
          message: `Missing ${category} block on frame ${frame.queue_order}`,
          field: `frames[${frame.queue_order}].${category}`,
        });
        continue;
      }
      for (const [field, value] of Object.entries(block)) {
        if (!isNonEmptyString(value)) {
          violations.push({
            code: 'FAIL_GRAMMAR_FIELD_MISSING',
            message: `Missing ${category}.${field} on frame ${frame.queue_order}`,
            field: `frames[${frame.queue_order}].${category}.${field}`,
          });
        }
      }
    }
  }

  const characterDna = containsAny(serialized, CHARACTER_DNA_TOKENS);
  if (characterDna !== null) {
    violations.push({
      code: 'FAIL_CHARACTER_DNA',
      message: `Character DNA token detected: ${characterDna}`,
    });
  }

  const styleCore = containsAny(serialized, STYLE_CORE_TOKENS);
  if (styleCore !== null) {
    violations.push({
      code: 'FAIL_STYLE_CORE',
      message: `Style Core token detected: ${styleCore}`,
    });
  }

  const envDna = containsAny(serialized, ENV_DNA_TOKENS);
  if (envDna !== null) {
    violations.push({
      code: 'FAIL_ENV_DNA',
      message: `ENV DNA token detected: ${envDna}`,
    });
  }

  const promptField = containsAny(serialized, PROMPT_FIELD_TOKENS);
  if (promptField !== null) {
    violations.push({
      code: 'FAIL_PROMPT_FIELD',
      message: `Prompt field token detected: ${promptField}`,
    });
  }

  const cameraPatterns = new Set(document.frames.map((frame) => cameraPatternSignature(frame)));
  const actingPatterns = new Set(document.frames.map((frame) => actingPatternSignature(frame)));
  const dailyLifeAnchors = new Set(document.frames.map((frame) => frame.daily_life.activity));
  const locationPatterns = new Set(document.frames.map((frame) => locationPatternSignature(frame)));

  const frontFacingFrameCount = document.frames.filter((frame) => isFrontFacingFrame(frame)).length;
  const staticPoseFrameCount = document.frames.filter((frame) => isStaticPoseFrame(frame)).length;
  const dynamicPoseFrameCount = document.frames.filter((frame) => isDynamicPoseFrame(frame)).length;

  if (cameraPatterns.size < MIN_CAMERA_PATTERN_DIVERSITY) {
    violations.push({
      code: 'FAIL_CAMERA_DIVERSITY',
      message: `Camera pattern diversity ${cameraPatterns.size} is below minimum ${MIN_CAMERA_PATTERN_DIVERSITY}`,
      field: 'frames.camera',
    });
  }

  if (actingPatterns.size < MIN_ACTING_PATTERN_DIVERSITY) {
    violations.push({
      code: 'FAIL_ACTING_DIVERSITY',
      message: `Acting pattern diversity ${actingPatterns.size} is below minimum ${MIN_ACTING_PATTERN_DIVERSITY}`,
      field: 'frames.acting',
    });
  }

  if (dailyLifeAnchors.size < MIN_DAILY_LIFE_ANCHORS) {
    violations.push({
      code: 'FAIL_DAILY_LIFE_ANCHORS',
      message: `Daily-life anchor count ${dailyLifeAnchors.size} is below minimum ${MIN_DAILY_LIFE_ANCHORS}`,
      field: 'frames.daily_life.activity',
    });
  }

  if (locationPatterns.size < MIN_LOCATION_GRAMMAR_DIVERSITY) {
    violations.push({
      code: 'FAIL_LOCATION_DIVERSITY',
      message: `Location grammar diversity ${locationPatterns.size} is below minimum ${MIN_LOCATION_GRAMMAR_DIVERSITY}`,
      field: 'frames.location',
    });
  }

  if (frontFacingFrameCount > MAX_FRONT_FACING_FRAMES) {
    violations.push({
      code: 'FAIL_FRONT_FACING_BIAS',
      message: `Front-facing frame count ${frontFacingFrameCount} exceeds maximum ${MAX_FRONT_FACING_FRAMES}`,
      field: 'frames.camera.camera_angle',
    });
  }

  const staticPoseRatio =
    document.frames.length > 0 ? staticPoseFrameCount / document.frames.length : 1;
  if (staticPoseRatio > MAX_STATIC_POSE_RATIO || dynamicPoseFrameCount < MIN_DYNAMIC_POSE_FRAMES) {
    violations.push({
      code: 'FAIL_STATIC_POSE_BIAS',
      message: `Static pose ratio ${staticPoseRatio.toFixed(2)} or dynamic pose count ${dynamicPoseFrameCount} fails diversity guard`,
      field: 'frames.acting.posture',
    });
  }

  const extraDocumentKeys = Object.keys(document).filter((key) => !ALLOWED_DOCUMENT_KEYS.has(key));
  if (extraDocumentKeys.length > 0) {
    violations.push({
      code: 'FAIL_NON_GRAMMAR_KEYS',
      message: `Non-grammar document keys present: ${extraDocumentKeys.join(', ')}`,
    });
  }

  if (document.audit_result !== 'PASS') {
    violations.push({
      code: 'FAIL_SOURCE_EXTRACTION_AUDIT',
      message: 'Source extraction document audit_result is not PASS',
      field: 'audit_result',
    });
  }

  if (sourceExtractionAudit !== 'PASS') {
    violations.push({
      code: 'FAIL_SOURCE_EXTRACTION_REPORT',
      message: `Source extraction report audit is ${sourceExtractionAudit}`,
      field: TEST_KIKI_EXTRACTION_REPORT_PATH,
    });
  }

  if (document.schema_version !== TEST_KIKI_EXTRACTION_SCHEMA_VERSION) {
    violations.push({
      code: 'FAIL_SCHEMA_VERSION',
      message: `Unexpected schema_version ${document.schema_version}`,
      field: 'schema_version',
    });
  }

  const globalPatternKeys = Object.keys(document.global_patterns ?? {});
  const requiredGlobalKeys = [
    'dominant_camera_language',
    'dominant_acting_language',
    'dominant_daily_life_language',
    'dominant_space_language',
  ];
  for (const key of requiredGlobalKeys) {
    if (!isNonEmptyString((document.global_patterns as Record<string, unknown>)[key])) {
      violations.push({
        code: 'FAIL_GLOBAL_PATTERNS',
        message: `Missing global pattern ${key}`,
        field: `global_patterns.${key}`,
      });
    }
  }

  if (globalPatternKeys.length !== requiredGlobalKeys.length) {
    violations.push({
      code: 'FAIL_GLOBAL_PATTERNS',
      message: 'Global patterns must contain exactly four grammar summaries',
      field: 'global_patterns',
    });
  }

  for (const frame of document.frames) {
    if (!isNonEmptyString(frame.evidence.frame_fingerprint)) {
      violations.push({
        code: 'FAIL_EVIDENCE_FINGERPRINT',
        message: `Missing frame fingerprint on frame ${frame.queue_order}`,
        field: `frames[${frame.queue_order}].evidence.frame_fingerprint`,
      });
    }
  }

  const grammarOnlyReady =
    violations.filter((violation) =>
      [
        'FAIL_CHARACTER_DNA',
        'FAIL_STYLE_CORE',
        'FAIL_ENV_DNA',
        'FAIL_PROMPT_FIELD',
        'FAIL_NON_GRAMMAR_KEYS',
        'FAIL_SOURCE_EXTRACTION_AUDIT',
      ].includes(violation.code)
    ).length === 0 && document.audit_result === 'PASS';

  const appIngestionReady =
    grammarOnlyReady &&
    violations.filter((violation) =>
      [
        'FAIL_FRAME_COUNT',
        'FAIL_GRAMMAR_CATEGORY_MISSING',
        'FAIL_GRAMMAR_FIELD_MISSING',
        'FAIL_CAMERA_DIVERSITY',
        'FAIL_ACTING_DIVERSITY',
        'FAIL_DAILY_LIFE_ANCHORS',
        'FAIL_LOCATION_DIVERSITY',
        'FAIL_FRONT_FACING_BIAS',
        'FAIL_STATIC_POSE_BIAS',
        'FAIL_GLOBAL_PATTERNS',
        'FAIL_EVIDENCE_FINGERPRINT',
        'FAIL_SCHEMA_VERSION',
        'FAIL_SOURCE_EXTRACTION_REPORT',
      ].includes(violation.code)
    ).length === 0;

  const auditCodes = [...new Set(violations.map((violation) => violation.code))];
  const auditResult: TestKikiExtractionQualityAuditResult =
    violations.length === 0 ? 'PASS' : 'FAIL';

  return Object.freeze({
    auditTimestamp: new Date().toISOString(),
    auditResult,
    schema_version: TEST_KIKI_EXTRACTION_SCHEMA_VERSION,
    video_id: TEST_KIKI_VIDEO_ID,
    source_extraction_audit: sourceExtractionAudit,
    frame_count: document.frames.length,
    metrics: Object.freeze({
      camera_pattern_diversity: cameraPatterns.size,
      acting_pattern_diversity: actingPatterns.size,
      daily_life_anchor_count: dailyLifeAnchors.size,
      location_grammar_diversity: locationPatterns.size,
      front_facing_frame_count: frontFacingFrameCount,
      static_pose_frame_count: staticPoseFrameCount,
      dynamic_pose_frame_count: dynamicPoseFrameCount,
    }),
    violations,
    audit_codes: Object.freeze(auditCodes),
    grammar_only_ready: grammarOnlyReady,
    app_ingestion_ready: appIngestionReady,
  });
}

export function runTestKikiExtractionQualityAudit(
  projectRoot: string
): TestKikiExtractionQualityReport {
  const report = auditTestKikiExtractionQuality(projectRoot);
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, TEST_KIKI_EXTRACTION_QUALITY_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
