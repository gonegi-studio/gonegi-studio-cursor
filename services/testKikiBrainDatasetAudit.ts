import fs from 'node:fs';
import path from 'node:path';
import {
  TEST_KIKI_BRAIN_DATASET_PACKAGE_PATH,
  TEST_KIKI_BRAIN_DATASET_REPORT_PATH,
  TEST_KIKI_BRAIN_DATASET_TYPE,
  TEST_KIKI_BRAIN_DATASET_VERSION,
  TEST_KIKI_BRAIN_APP_INGESTION_TARGETS,
  writeTestKikiBrainDatasetPackage,
  type TestKikiBrainDatasetPackage,
} from './testKikiBrainDatasetBuilder.js';
import {
  TEST_KIKI_EXTRACTION_JSON_PATH,
  TEST_KIKI_VIDEO_ID,
} from './testKikiExtractionSchema.js';

export type TestKikiBrainDatasetAuditResult = 'PASS' | 'FAIL';

export type TestKikiBrainDatasetViolation = {
  code: string;
  message: string;
  field?: string;
};

export type TestKikiBrainDatasetReport = {
  auditTimestamp: string;
  auditResult: TestKikiBrainDatasetAuditResult;
  dataset_type: typeof TEST_KIKI_BRAIN_DATASET_TYPE;
  dataset_version: typeof TEST_KIKI_BRAIN_DATASET_VERSION;
  source: typeof TEST_KIKI_VIDEO_ID;
  package_byte_size: number;
  extraction_byte_size: number;
  compression_ratio: number;
  grammar_pattern_counts: TestKikiBrainDatasetPackage['grammar_pattern_counts'];
  violations: TestKikiBrainDatasetViolation[];
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
  'character_continuity',
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

const RENDER_RULE_TOKENS = [
  'render_rule',
  'render_law',
  'renderer_input',
  'render_handoff',
] as const;

const PROMPT_TOKENS = [
  'image_prompt',
  'negative_prompt',
  'prompt_intent',
  'compiled_image_prompt',
  'prompt_compiler',
  'director_grammar',
  'acting_camera_export',
  'generative_layer',
  'midjourney',
  'stable_diffusion',
  'runway',
  'kling',
] as const;

const IMAGE_GENERATION_PAYLOAD_TOKENS = [
  'image_generation_payload',
  'generation_payload',
  'payload_id',
  'acting_camera_id',
  'image_prompt_pack_id',
  'generation_executed',
] as const;

const WORLD_DNA_CONTAMINATION_TOKENS = [
  'subway',
  'airport',
  'bus_terminal',
  'skyscraper',
  'cyberpunk',
  'neon_city',
  'world_dna',
  'world_constraints',
] as const;

const APP_DATA_DUPLICATE_TOKENS = [
  'storyboard_id',
  'image_app_input_json',
  'compiled_image_prompt',
  'anti_repetition_guard',
  'world_continuity_anchors',
  'location_continuity_anchors',
  'character_continuity_anchors',
] as const;

const ALLOWED_PACKAGE_KEYS = new Set([
  'dataset_type',
  'dataset_version',
  'source',
  'source_schema_version',
  'source_fingerprint',
  'quality_audit_result',
  'app_ingestion_targets',
  'camera_grammar_library',
  'acting_grammar_library',
  'daily_life_grammar_library',
  'location_grammar_library',
  'global_patterns',
  'grammar_pattern_counts',
]);

const REQUIRED_CAMERA_FIELDS = [
  'camera_distance',
  'camera_height',
  'camera_angle',
  'framing_type',
  'subject_position',
  'lens_feeling',
] as const;

const REQUIRED_ACTING_FIELDS = [
  'gaze_direction',
  'head_direction',
  'hand_activity',
  'posture',
  'body_weight_distribution',
] as const;

const REQUIRED_DAILY_LIFE_FIELDS = [
  'activity',
  'object_interaction',
  'environmental_touchpoint',
] as const;

const REQUIRED_LOCATION_FIELDS = [
  'space_type',
  'architectural_feature',
  'depth_cue',
  'navigation_pattern',
] as const;

const REQUIRED_GLOBAL_KEYS = [
  'dominant_camera_language',
  'dominant_acting_language',
  'dominant_daily_life_language',
  'dominant_space_language',
] as const;

function containsAny(haystack: string, tokens: readonly string[]): string | null {
  for (const token of tokens) {
    if (haystack.includes(token)) {
      return token;
    }
  }
  return null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function auditLibraryFields(
  violations: TestKikiBrainDatasetViolation[],
  libraryName: string,
  entries: readonly Record<string, unknown>[],
  requiredFields: readonly string[]
): void {
  if (entries.length === 0) {
    violations.push({
      code: 'FAIL_LIBRARY_EMPTY',
      message: `${libraryName} must contain at least one pattern`,
      field: libraryName,
    });
    return;
  }

  for (const [index, entry] of entries.entries()) {
    for (const field of requiredFields) {
      if (!isNonEmptyString(entry[field])) {
        violations.push({
          code: 'FAIL_LIBRARY_FIELD',
          message: `Missing ${field} in ${libraryName}[${index}]`,
          field: `${libraryName}[${index}].${field}`,
        });
      }
    }
    if (!isNonEmptyString(entry.pattern_id)) {
      violations.push({
        code: 'FAIL_LIBRARY_FIELD',
        message: `Missing pattern_id in ${libraryName}[${index}]`,
        field: `${libraryName}[${index}].pattern_id`,
      });
    }
  }
}

export function auditTestKikiBrainDatasetPackage(
  projectRoot: string,
  packageDoc: TestKikiBrainDatasetPackage
): TestKikiBrainDatasetReport {
  const violations: TestKikiBrainDatasetViolation[] = [];
  const serialized = JSON.stringify(packageDoc).toLowerCase();

  const extractionPath = path.join(projectRoot, TEST_KIKI_EXTRACTION_JSON_PATH);
  const packagePath = path.join(projectRoot, TEST_KIKI_BRAIN_DATASET_PACKAGE_PATH);
  const extractionByteSize = fs.existsSync(extractionPath) ? fs.statSync(extractionPath).size : 0;
  const packageByteSize = fs.existsSync(packagePath) ? fs.statSync(packagePath).size : 0;
  const compressionRatio =
    extractionByteSize > 0 ? Number((packageByteSize / extractionByteSize).toFixed(4)) : 1;

  if (packageDoc.dataset_type !== TEST_KIKI_BRAIN_DATASET_TYPE) {
    violations.push({
      code: 'FAIL_DATASET_TYPE',
      message: `Expected dataset_type ${TEST_KIKI_BRAIN_DATASET_TYPE}`,
      field: 'dataset_type',
    });
  }

  if (packageDoc.dataset_version !== TEST_KIKI_BRAIN_DATASET_VERSION) {
    violations.push({
      code: 'FAIL_DATASET_VERSION',
      message: `Expected dataset_version ${TEST_KIKI_BRAIN_DATASET_VERSION}`,
      field: 'dataset_version',
    });
  }

  if (packageDoc.source !== TEST_KIKI_VIDEO_ID) {
    violations.push({
      code: 'FAIL_SOURCE',
      message: `Expected source ${TEST_KIKI_VIDEO_ID}`,
      field: 'source',
    });
  }

  if (packageDoc.quality_audit_result !== 'PASS') {
    violations.push({
      code: 'FAIL_QUALITY_GATE',
      message: `Quality audit result is ${packageDoc.quality_audit_result}`,
      field: 'quality_audit_result',
    });
  }

  const extraKeys = Object.keys(packageDoc).filter((key) => !ALLOWED_PACKAGE_KEYS.has(key));
  if (extraKeys.length > 0) {
    violations.push({
      code: 'FAIL_PACKAGE_SHAPE',
      message: `Unexpected package keys: ${extraKeys.join(', ')}`,
    });
  }

  if (
    packageDoc.app_ingestion_targets.length !== TEST_KIKI_BRAIN_APP_INGESTION_TARGETS.length
  ) {
    violations.push({
      code: 'FAIL_APP_INGESTION_TARGETS',
      message: 'App ingestion targets must include Story Engine, Scene Generator, Image Planning Layer',
      field: 'app_ingestion_targets',
    });
  }

  auditLibraryFields(
    violations,
    'camera_grammar_library',
    packageDoc.camera_grammar_library as readonly Record<string, unknown>[],
    REQUIRED_CAMERA_FIELDS
  );
  auditLibraryFields(
    violations,
    'acting_grammar_library',
    packageDoc.acting_grammar_library as readonly Record<string, unknown>[],
    REQUIRED_ACTING_FIELDS
  );
  auditLibraryFields(
    violations,
    'daily_life_grammar_library',
    packageDoc.daily_life_grammar_library as readonly Record<string, unknown>[],
    REQUIRED_DAILY_LIFE_FIELDS
  );
  auditLibraryFields(
    violations,
    'location_grammar_library',
    packageDoc.location_grammar_library as readonly Record<string, unknown>[],
    REQUIRED_LOCATION_FIELDS
  );

  for (const key of REQUIRED_GLOBAL_KEYS) {
    if (!isNonEmptyString(packageDoc.global_patterns[key as keyof typeof packageDoc.global_patterns])) {
      violations.push({
        code: 'FAIL_GLOBAL_PATTERNS',
        message: `Missing global pattern ${key}`,
        field: `global_patterns.${key}`,
      });
    }
  }

  const forbiddenChecks: Array<[readonly string[], string]> = [
    [CHARACTER_DNA_TOKENS, 'FAIL_CHARACTER_DNA'],
    [STYLE_CORE_TOKENS, 'FAIL_STYLE_CORE'],
    [ENV_DNA_TOKENS, 'FAIL_ENV_DNA'],
    [RENDER_RULE_TOKENS, 'FAIL_RENDER_RULE'],
    [PROMPT_TOKENS, 'FAIL_PROMPT_FIELD'],
    [IMAGE_GENERATION_PAYLOAD_TOKENS, 'FAIL_IMAGE_GENERATION_PAYLOAD'],
    [WORLD_DNA_CONTAMINATION_TOKENS, 'FAIL_WORLD_DNA_CONTAMINATION'],
    [APP_DATA_DUPLICATE_TOKENS, 'FAIL_DUPLICATE_APP_DATA'],
  ];

  for (const [tokens, code] of forbiddenChecks) {
    const hit = containsAny(serialized, tokens);
    if (hit !== null) {
      violations.push({
        code,
        message: `Forbidden token detected: ${hit}`,
      });
    }
  }

  if (serialized.includes('negative_prompt')) {
    violations.push({
      code: 'FAIL_NEGATIVE_PROMPT_FIELD',
      message: 'Negative prompt field detected',
    });
  }

  if (packageByteSize >= extractionByteSize) {
    violations.push({
      code: 'FAIL_PACKAGE_SIZE',
      message: `Brain dataset package (${packageByteSize} bytes) must be smaller than extraction source (${extractionByteSize} bytes)`,
      field: TEST_KIKI_BRAIN_DATASET_PACKAGE_PATH,
    });
  }

  const grammarOnlyViolations = violations.filter((violation) =>
    [
      'FAIL_CHARACTER_DNA',
      'FAIL_STYLE_CORE',
      'FAIL_ENV_DNA',
      'FAIL_RENDER_RULE',
      'FAIL_PROMPT_FIELD',
      'FAIL_NEGATIVE_PROMPT_FIELD',
      'FAIL_IMAGE_GENERATION_PAYLOAD',
      'FAIL_WORLD_DNA_CONTAMINATION',
      'FAIL_DUPLICATE_APP_DATA',
    ].includes(violation.code)
  );

  const grammarOnlyReady = grammarOnlyViolations.length === 0;
  const appIngestionReady = grammarOnlyReady && violations.length === 0;
  const auditCodes = [...new Set(violations.map((violation) => violation.code))];
  const auditResult: TestKikiBrainDatasetAuditResult = violations.length === 0 ? 'PASS' : 'FAIL';

  return Object.freeze({
    auditTimestamp: new Date().toISOString(),
    auditResult,
    dataset_type: TEST_KIKI_BRAIN_DATASET_TYPE,
    dataset_version: TEST_KIKI_BRAIN_DATASET_VERSION,
    source: TEST_KIKI_VIDEO_ID,
    package_byte_size: packageByteSize,
    extraction_byte_size: extractionByteSize,
    compression_ratio: compressionRatio,
    grammar_pattern_counts: packageDoc.grammar_pattern_counts,
    violations,
    audit_codes: Object.freeze(auditCodes),
    grammar_only_ready: grammarOnlyReady,
    app_ingestion_ready: appIngestionReady,
  });
}

export function runTestKikiBrainDatasetAudit(projectRoot: string): TestKikiBrainDatasetReport {
  const packageDoc = writeTestKikiBrainDatasetPackage(projectRoot);
  const report = auditTestKikiBrainDatasetPackage(projectRoot, packageDoc);
  fs.writeFileSync(
    path.join(projectRoot, TEST_KIKI_BRAIN_DATASET_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
