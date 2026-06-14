import type { TestKikiExtractionDocument, TestKikiExtractedFrame } from './testKikiExtractionSchema.js';
import { TEST_KIKI_FRAME_COUNT } from './testKikiExtractionSchema.js';

export type TestKikiExtractionAuditResult = 'PASS' | 'FAIL';

export type TestKikiExtractionViolation = {
  code: string;
  message: string;
  field?: string;
};

export type TestKikiExtractionReport = {
  auditTimestamp: string;
  auditResult: TestKikiExtractionAuditResult;
  schema_version: TestKikiExtractionDocument['schema_version'];
  video_id: TestKikiExtractionDocument['video_id'];
  frame_count: number;
  extraction_status: 'extraction-success' | 'extraction-failed' | 'not-run';
  violations: TestKikiExtractionViolation[];
  audit_codes: readonly string[];
};

const WORLD_DNA_DRIFT_TOKENS = [
  'subway',
  'airport',
  'bus_terminal',
  'skyscraper',
  'cyberpunk',
  'neon_city',
] as const;

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

const PROMPT_GENERATION_TOKENS = [
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

const ABSTRACT_TOKENS = [
  'beautiful',
  'nostalgic',
  'warm',
  'emotional',
  'dreamy',
  'magical',
  'heartwarming',
  'poetic',
  'ethereal',
  'moody',
  'atmospheric',
] as const;

const PHYSICAL_ANCHOR_PATHS = [
  'camera.camera_distance',
  'acting.posture',
  'daily_life.activity',
  'location.space_type',
] as const;

function serializedDocument(document: TestKikiExtractionDocument): string {
  return JSON.stringify(document).toLowerCase();
}

function containsAny(haystack: string, tokens: readonly string[]): string | null {
  for (const token of tokens) {
    if (haystack.includes(token)) {
      return token;
    }
  }
  return null;
}

function getNestedValue(frame: TestKikiExtractedFrame, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = frame;
  for (const part of parts) {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function frameHasPhysicalAnchor(frame: TestKikiExtractedFrame): boolean {
  return PHYSICAL_ANCHOR_PATHS.every((path) => {
    const value = getNestedValue(frame, path);
    return typeof value === 'string' && value.trim().length > 0;
  });
}

function countCategoryFields(frame: TestKikiExtractedFrame, category: keyof TestKikiExtractedFrame): number {
  const block = frame[category];
  if (block === null || typeof block !== 'object') {
    return 0;
  }
  return Object.keys(block as object).length;
}

export function auditTestKikiExtractionDocument(
  document: TestKikiExtractionDocument,
  extractionStatus: TestKikiExtractionReport['extraction_status']
): TestKikiExtractionReport {
  const violations: TestKikiExtractionViolation[] = [];
  const serialized = serializedDocument(document);

  if (document.frames.length !== TEST_KIKI_FRAME_COUNT) {
    violations.push({
      code: 'FAIL_FRAME_COUNT',
      message: `Expected ${TEST_KIKI_FRAME_COUNT} frames, received ${document.frames.length}`,
      field: 'frames',
    });
  }

  if (extractionStatus !== 'extraction-success') {
    violations.push({
      code: 'FAIL_FRAME_EXTRACTION',
      message: 'Frame extraction did not complete successfully',
      field: 'frames',
    });
  }

  for (const frame of document.frames) {
    for (const [category, block] of Object.entries({
      camera: frame.camera,
      acting: frame.acting,
      daily_life: frame.daily_life,
      location: frame.location,
      emotion: frame.emotion,
      story: frame.story,
    })) {
      for (const [field, value] of Object.entries(block)) {
        if (typeof value !== 'string' || value.trim().length === 0) {
          violations.push({
            code: 'FAIL_SCHEMA_COMPLETENESS',
            message: `Missing ${category}.${field} on frame ${frame.queue_order}`,
            field: `frames[${frame.queue_order}].${category}.${field}`,
          });
        }
        if (typeof value === 'string' && (value.includes('.') || value.split(/\s+/).length > 8)) {
          violations.push({
            code: 'FAIL_PROSE',
            message: `Non-actionable prose on ${category}.${field}`,
            field: `frames[${frame.queue_order}].${category}.${field}`,
          });
        }
      }
    }

    const storyFields = countCategoryFields(frame, 'story');
    const cameraFields = countCategoryFields(frame, 'camera');
    const emotionFields = countCategoryFields(frame, 'emotion');
    const actingFields = countCategoryFields(frame, 'acting');

    if (storyFields > cameraFields) {
      violations.push({
        code: 'FAIL-01',
        message: 'Story field count exceeds camera field count',
        field: `frames[${frame.queue_order}].story`,
      });
    }

    if (emotionFields > actingFields) {
      violations.push({
        code: 'FAIL-02',
        message: 'Emotion field count exceeds acting field count',
        field: `frames[${frame.queue_order}].emotion`,
      });
    }

    if (!frameHasPhysicalAnchor(frame)) {
      violations.push({
        code: 'FAIL_PHYSICAL_ANCHOR',
        message: 'Frame missing required physical anchor fields',
        field: `frames[${frame.queue_order}]`,
      });
    }
  }

  const worldDrift = containsAny(serialized, WORLD_DNA_DRIFT_TOKENS);
  if (worldDrift !== null) {
    violations.push({
      code: 'FAIL_WORLD_DNA_DRIFT',
      message: `Modern-city drift token detected: ${worldDrift}`,
    });
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

  const promptGeneration = containsAny(serialized, PROMPT_GENERATION_TOKENS);
  if (promptGeneration !== null) {
    violations.push({
      code: 'FAIL_PROMPT_GENERATION',
      message: `Prompt generation token detected: ${promptGeneration}`,
    });
  }

  for (const frame of document.frames) {
    const frameSerialized = JSON.stringify(frame).toLowerCase();
    const abstractHit = containsAny(frameSerialized, ABSTRACT_TOKENS);
    if (abstractHit !== null && !frameHasPhysicalAnchor(frame)) {
      violations.push({
        code: 'FAIL_ABSTRACT_DESCRIPTION',
        message: `Abstract token "${abstractHit}" without physical visual evidence on frame ${frame.queue_order}`,
        field: `frames[${frame.queue_order}]`,
      });
    }
  }

  const auditCodes = [...new Set(violations.map((violation) => violation.code))];
  const auditResult: TestKikiExtractionAuditResult =
    violations.length === 0 ? 'PASS' : 'FAIL';

  return Object.freeze({
    auditTimestamp: new Date().toISOString(),
    auditResult,
    schema_version: document.schema_version,
    video_id: document.video_id,
    frame_count: document.frames.length,
    extraction_status: extractionStatus,
    violations,
    audit_codes: Object.freeze(auditCodes),
  });
}
