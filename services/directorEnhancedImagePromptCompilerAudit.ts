import fs from 'node:fs';
import path from 'node:path';
import {
  DIRECTOR_GRAMMAR_VERSION,
  getDirectorGrammarSeedLibrary,
  type DirectorGrammarEntry,
} from './directorGrammarDefinitions.js';
import {
  buildImageAppPayloads,
  type ImageAppScenePayload,
} from './imageAppInputExport.js';
import {
  buildDirectorEnhancedImagePromptCompilerExport,
  DIRECTOR_ENHANCED_IMAGE_PROMPT_COMPILER_ID,
  DIRECTOR_ENHANCED_IMAGE_PROMPT_COMPILER_JSON_PATH,
  DIRECTOR_ENHANCED_IMAGE_PROMPT_COMPILER_VERSION,
  DIRECTOR_GRAMMAR_REPORT_PATH,
  findDuplicateCompiledPayloadIds,
  REQUIRED_COMPILER_EXPORT_FIELDS,
  REQUIRED_COMPILED_PAYLOAD_FIELDS,
  type CompiledImagePromptPayload,
  type DirectorEnhancedImagePromptCompilerExport,
  type RequiredCompiledPayloadField,
  type RequiredCompilerExportField,
} from './directorEnhancedImagePromptCompiler.js';
import {
  buildStoryDrivenImageAppExport,
  STORY_DRIVEN_IMAGE_APP_EXPORT_ID,
  STORY_DRIVEN_IMAGE_APP_EXPORT_JSON_PATH,
  STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT,
  type StoryDrivenImageAppExport,
} from './storyDrivenImageAppExport.js';

export type DirectorEnhancedImagePromptCompilerAuditResult =
  | 'PASS'
  | 'FAIL_COMPILER_COMPLETENESS'
  | 'FAIL_STORY_EXPORT_REFERENCE'
  | 'FAIL_DIRECTOR_GRAMMAR_REFERENCE'
  | 'FAIL_PAYLOAD_COUNT'
  | 'FAIL_COMPILED_IMAGE_PROMPT'
  | 'FAIL_COMPILED_NEGATIVE_PROMPT'
  | 'FAIL_CONTINUITY_ANCHORS'
  | 'FAIL_CONFLICT_PRIORITY'
  | 'FAIL_NESTED_FIELD_LEAK'
  | 'FAIL_DUPLICATE_PAYLOAD'
  | 'FAIL_AI_STUDIO_TRIGGERED';

export interface DirectorEnhancedImagePromptCompilerViolation {
  code: DirectorEnhancedImagePromptCompilerAuditResult;
  message: string;
  field?: string;
}

export interface DirectorEnhancedImagePromptCompilerReport {
  auditTimestamp: string;
  auditResult: DirectorEnhancedImagePromptCompilerAuditResult;
  layer_version: typeof DIRECTOR_ENHANCED_IMAGE_PROMPT_COMPILER_VERSION;
  violations: DirectorEnhancedImagePromptCompilerViolation[];
}

const EXPORT_FILE = 'director-enhanced-image-prompt-compiler.json';
const REPORT_FILE = 'director-enhanced-image-prompt-compiler-report.json';

const NESTED_LEAK_KEYS = [
  'acting_camera',
  'director_grammar',
  'anti_static_pose_rules',
  'anti_flat_scene_rules',
  'image_prompt_pack_id',
  'acting_camera_id',
] as const;

const FORBIDDEN_AI_STUDIO_TOKENS = [
  'invoke:ai-studio',
  'call:ai-studio',
  'ai-studio-generate',
  'generate:image',
  'trigger:generation',
  'run:gpu',
] as const;

const MIN_COMPILED_PROMPT_LENGTH = 120;

interface DirectorGrammarReportShape {
  auditResult: string;
  layer_version: string;
}

interface CompilerAuditContext {
  storyExport: StoryDrivenImageAppExport;
  directorByStoryboard: Map<string, DirectorGrammarEntry>;
  imagePayloadByStoryboard: Map<string, ImageAppScenePayload>;
}

function buildCompilerAuditContext(): CompilerAuditContext {
  const storyExport = buildStoryDrivenImageAppExport();
  return {
    storyExport,
    directorByStoryboard: new Map(
      getDirectorGrammarSeedLibrary().map((entry) => [entry.storyboard_id, entry] as const)
    ),
    imagePayloadByStoryboard: new Map(
      buildImageAppPayloads().map((payload) => [payload.storyboard_id, payload] as const)
    ),
  };
}

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

function loadDirectorGrammarReport(projectRoot: string): DirectorGrammarReportShape | null {
  const reportPath = path.join(projectRoot, DIRECTOR_GRAMMAR_REPORT_PATH);
  if (!fs.existsSync(reportPath)) return null;
  return JSON.parse(fs.readFileSync(reportPath, 'utf8')) as DirectorGrammarReportShape;
}

function auditCompilerCompleteness(
  exportDoc: DirectorEnhancedImagePromptCompilerExport
): DirectorEnhancedImagePromptCompilerViolation[] {
  const violations: DirectorEnhancedImagePromptCompilerViolation[] = [];

  for (const field of REQUIRED_COMPILER_EXPORT_FIELDS) {
    const value = exportDoc[field as RequiredCompilerExportField];
    if (value === undefined || value === null) {
      violations.push({
        code: 'FAIL_COMPILER_COMPLETENESS',
        message: `Missing required export field ${field}`,
        field,
      });
    }
  }

  if (exportDoc.export_id !== DIRECTOR_ENHANCED_IMAGE_PROMPT_COMPILER_ID) {
    violations.push({
      code: 'FAIL_COMPILER_COMPLETENESS',
      message: `export_id must be ${DIRECTOR_ENHANCED_IMAGE_PROMPT_COMPILER_ID}`,
      field: 'export_id',
    });
  }

  if (exportDoc.image_app_ready !== true) {
    violations.push({
      code: 'FAIL_COMPILER_COMPLETENESS',
      message: 'image_app_ready must be true',
      field: 'image_app_ready',
    });
  }

  for (const payload of exportDoc.compiled_payloads) {
    for (const field of REQUIRED_COMPILED_PAYLOAD_FIELDS) {
      const value = payload[field as RequiredCompiledPayloadField];
      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_COMPILER_COMPLETENESS',
          message: `Missing required field ${field} on ${payload.payload_id}`,
          field: `${payload.payload_id}.${field}`,
        });
      }
    }

    if (payload.is_ready_for_generation !== true) {
      violations.push({
        code: 'FAIL_COMPILER_COMPLETENESS',
        message: `is_ready_for_generation must be true on ${payload.payload_id}`,
        field: `${payload.payload_id}.is_ready_for_generation`,
      });
    }
  }

  return violations;
}

function auditStoryExportReference(
  exportDoc: DirectorEnhancedImagePromptCompilerExport,
  ctx: CompilerAuditContext
): DirectorEnhancedImagePromptCompilerViolation[] {
  const violations: DirectorEnhancedImagePromptCompilerViolation[] = [];
  const storyExport = ctx.storyExport;

  if (exportDoc.source_export_id !== STORY_DRIVEN_IMAGE_APP_EXPORT_ID) {
    violations.push({
      code: 'FAIL_STORY_EXPORT_REFERENCE',
      message: `source_export_id must be ${STORY_DRIVEN_IMAGE_APP_EXPORT_ID}`,
      field: 'source_export_id',
    });
  }

  if (!storyExport.story_engine_ready) {
    violations.push({
      code: 'FAIL_STORY_EXPORT_REFERENCE',
      message: 'Story driven export must be story_engine_ready',
      field: 'story_driven_export',
    });
  }

  for (const payload of exportDoc.compiled_payloads) {
    const source = storyExport.image_generation_payloads.find(
      (entry) => entry.storyboard_id === payload.storyboard_id
    );
    if (!source) {
      violations.push({
        code: 'FAIL_STORY_EXPORT_REFERENCE',
        message: `Missing story driven payload for ${payload.storyboard_id}`,
        field: `${payload.payload_id}.storyboard_id`,
      });
      continue;
    }

    if (payload.bundle_id !== source.bundle_id) {
      violations.push({
        code: 'FAIL_STORY_EXPORT_REFERENCE',
        message: `bundle_id mismatch for ${payload.payload_id}`,
        field: `${payload.payload_id}.bundle_id`,
      });
    }

    if (!payload.compiled_image_prompt.includes(source.image_prompt)) {
      violations.push({
        code: 'FAIL_STORY_EXPORT_REFERENCE',
        message: `compiled_image_prompt must include base image_prompt on ${payload.payload_id}`,
        field: `${payload.payload_id}.compiled_image_prompt`,
      });
    }
  }

  void STORY_DRIVEN_IMAGE_APP_EXPORT_JSON_PATH;
  return violations;
}

function auditDirectorGrammarReference(
  projectRoot: string,
  exportDoc: DirectorEnhancedImagePromptCompilerExport,
  ctx: CompilerAuditContext
): DirectorEnhancedImagePromptCompilerViolation[] {
  const violations: DirectorEnhancedImagePromptCompilerViolation[] = [];
  const grammarReport = loadDirectorGrammarReport(projectRoot);

  if (!grammarReport) {
    violations.push({
      code: 'FAIL_DIRECTOR_GRAMMAR_REFERENCE',
      message: `Missing director grammar report at ${DIRECTOR_GRAMMAR_REPORT_PATH}`,
      field: 'director_grammar_report',
    });
    return violations;
  }

  if (grammarReport.auditResult !== 'PASS') {
    violations.push({
      code: 'FAIL_DIRECTOR_GRAMMAR_REFERENCE',
      message: 'Director grammar audit must pass before compilation',
      field: 'director_grammar_report.auditResult',
    });
  }

  if (exportDoc.director_grammar_source !== DIRECTOR_GRAMMAR_VERSION) {
    violations.push({
      code: 'FAIL_DIRECTOR_GRAMMAR_REFERENCE',
      message: `director_grammar_source must be ${DIRECTOR_GRAMMAR_VERSION}`,
      field: 'director_grammar_source',
    });
  }

  for (const payload of exportDoc.compiled_payloads) {
    const director = ctx.directorByStoryboard.get(payload.storyboard_id);
    if (!director) {
      violations.push({
        code: 'FAIL_DIRECTOR_GRAMMAR_REFERENCE',
        message: `Missing director grammar for ${payload.storyboard_id}`,
        field: `${payload.payload_id}.storyboard_id`,
      });
      continue;
    }

    if (director.bundle_id !== payload.bundle_id) {
      violations.push({
        code: 'FAIL_DIRECTOR_GRAMMAR_REFERENCE',
        message: `Director grammar bundle mismatch on ${payload.payload_id}`,
        field: `${payload.payload_id}.bundle_id`,
      });
    }

    if (!payload.compiled_image_prompt.includes(director.directorial_intent)) {
      violations.push({
        code: 'FAIL_DIRECTOR_GRAMMAR_REFERENCE',
        message: `compiled_image_prompt must include directorial_intent on ${payload.payload_id}`,
        field: `${payload.payload_id}.compiled_image_prompt`,
      });
    }
  }

  return violations;
}

function auditPayloadCount(
  exportDoc: DirectorEnhancedImagePromptCompilerExport
): DirectorEnhancedImagePromptCompilerViolation[] {
  const violations: DirectorEnhancedImagePromptCompilerViolation[] = [];

  if (exportDoc.scene_count !== STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT) {
    violations.push({
      code: 'FAIL_PAYLOAD_COUNT',
      message: `scene_count must be ${STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT}`,
      field: 'scene_count',
    });
  }

  if (exportDoc.compiled_payloads.length !== STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT) {
    violations.push({
      code: 'FAIL_PAYLOAD_COUNT',
      message: `compiled_payloads must contain exactly ${STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT} entries`,
      field: 'compiled_payloads.length',
    });
  }

  return violations;
}

function auditCompiledImagePrompt(
  payloads: CompiledImagePromptPayload[],
  ctx: CompilerAuditContext
): DirectorEnhancedImagePromptCompilerViolation[] {
  const violations: DirectorEnhancedImagePromptCompilerViolation[] = [];

  for (const payload of payloads) {
    if (payload.compiled_image_prompt.trim().length < MIN_COMPILED_PROMPT_LENGTH) {
      violations.push({
        code: 'FAIL_COMPILED_IMAGE_PROMPT',
        message: `compiled_image_prompt too short on ${payload.payload_id}`,
        field: `${payload.payload_id}.compiled_image_prompt`,
      });
    }

    const imagePayload = ctx.imagePayloadByStoryboard.get(payload.storyboard_id);
    const director = ctx.directorByStoryboard.get(payload.storyboard_id);
    if (!imagePayload || !director) continue;

    const requiredFragments = [
      'Acting intent:',
      imagePayload.acting_intent,
      'Body:',
      'Gaze:',
      'Director camera (priority):',
      director.camera_reason,
      'Director blocking (priority):',
      director.blocking_reason,
      'Emotional subtext:',
      director.emotional_subtext,
      'Cut purpose:',
      director.cut_purpose,
      'Visual motifs:',
    ];

    for (const fragment of requiredFragments) {
      if (!payload.compiled_image_prompt.includes(fragment)) {
        violations.push({
          code: 'FAIL_COMPILED_IMAGE_PROMPT',
          message: `compiled_image_prompt missing "${fragment}" on ${payload.payload_id}`,
          field: `${payload.payload_id}.compiled_image_prompt`,
        });
      }
    }
  }

  return violations;
}

function auditCompiledNegativePrompt(
  payloads: CompiledImagePromptPayload[],
  ctx: CompilerAuditContext
): DirectorEnhancedImagePromptCompilerViolation[] {
  const violations: DirectorEnhancedImagePromptCompilerViolation[] = [];

  for (const payload of payloads) {
    const source = ctx.storyExport.image_generation_payloads.find(
      (entry) => entry.storyboard_id === payload.storyboard_id
    );
    const director = ctx.directorByStoryboard.get(payload.storyboard_id);
    if (!source || !director) continue;

    if (!payload.compiled_negative_prompt.includes(source.negative_prompt)) {
      violations.push({
        code: 'FAIL_COMPILED_NEGATIVE_PROMPT',
        message: `compiled_negative_prompt must include base negative_prompt on ${payload.payload_id}`,
        field: `${payload.payload_id}.compiled_negative_prompt`,
      });
    }

    for (const rule of director.anti_flat_scene_rules) {
      if (!payload.compiled_negative_prompt.includes(`avoid: ${rule}`)) {
        violations.push({
          code: 'FAIL_COMPILED_NEGATIVE_PROMPT',
          message: `compiled_negative_prompt missing anti_flat rule ${rule} on ${payload.payload_id}`,
          field: `${payload.payload_id}.compiled_negative_prompt`,
        });
      }
    }

    const guards = [
      'avoid: no front-facing idle pose',
      'avoid: no camera-staring portrait',
      'avoid: no generic modern setting',
      'avoid: no world DNA violation',
    ];
    for (const guard of guards) {
      if (!payload.compiled_negative_prompt.includes(guard)) {
        violations.push({
          code: 'FAIL_COMPILED_NEGATIVE_PROMPT',
          message: `compiled_negative_prompt missing guard "${guard}" on ${payload.payload_id}`,
          field: `${payload.payload_id}.compiled_negative_prompt`,
        });
      }
    }
  }

  return violations;
}

function auditContinuityAnchors(
  payloads: CompiledImagePromptPayload[],
  ctx: CompilerAuditContext
): DirectorEnhancedImagePromptCompilerViolation[] {
  const violations: DirectorEnhancedImagePromptCompilerViolation[] = [];

  for (const payload of payloads) {
    const source = ctx.storyExport.image_generation_payloads.find(
      (entry) => entry.storyboard_id === payload.storyboard_id
    );
    if (!source) continue;

    if (!isStringArray(payload.continuity_anchors.character)) {
      violations.push({
        code: 'FAIL_CONTINUITY_ANCHORS',
        message: `character continuity anchors invalid on ${payload.payload_id}`,
        field: `${payload.payload_id}.continuity_anchors.character`,
      });
    } else if (
      JSON.stringify(payload.continuity_anchors.character) !==
      JSON.stringify(source.character_continuity_anchors)
    ) {
      violations.push({
        code: 'FAIL_CONTINUITY_ANCHORS',
        message: `character continuity anchors must match story export on ${payload.payload_id}`,
        field: `${payload.payload_id}.continuity_anchors.character`,
      });
    }

    if (!isStringArray(payload.continuity_anchors.location)) {
      violations.push({
        code: 'FAIL_CONTINUITY_ANCHORS',
        message: `location continuity anchors invalid on ${payload.payload_id}`,
        field: `${payload.payload_id}.continuity_anchors.location`,
      });
    } else if (
      JSON.stringify(payload.continuity_anchors.location) !==
      JSON.stringify(source.location_continuity_anchors)
    ) {
      violations.push({
        code: 'FAIL_CONTINUITY_ANCHORS',
        message: `location continuity anchors must match story export on ${payload.payload_id}`,
        field: `${payload.payload_id}.continuity_anchors.location`,
      });
    }

    if (!isStringArray(payload.continuity_anchors.world)) {
      violations.push({
        code: 'FAIL_CONTINUITY_ANCHORS',
        message: `world continuity anchors invalid on ${payload.payload_id}`,
        field: `${payload.payload_id}.continuity_anchors.world`,
      });
    } else if (
      JSON.stringify(payload.continuity_anchors.world) !==
      JSON.stringify(source.world_continuity_anchors)
    ) {
      violations.push({
        code: 'FAIL_CONTINUITY_ANCHORS',
        message: `world continuity anchors must match story export on ${payload.payload_id}`,
        field: `${payload.payload_id}.continuity_anchors.world`,
      });
    }
  }

  return violations;
}

function auditConflictPriority(
  payloads: CompiledImagePromptPayload[],
  ctx: CompilerAuditContext
): DirectorEnhancedImagePromptCompilerViolation[] {
  const violations: DirectorEnhancedImagePromptCompilerViolation[] = [];

  for (const payload of payloads) {
    const imagePayload = ctx.imagePayloadByStoryboard.get(payload.storyboard_id);
    const director = ctx.directorByStoryboard.get(payload.storyboard_id);
    if (!imagePayload || !director) continue;

    const directorCameraIndex = payload.compiled_image_prompt.indexOf('Director camera (priority):');
    const actingIntentIndex = payload.compiled_image_prompt.indexOf('Acting intent:');
    if (directorCameraIndex <= actingIntentIndex) {
      violations.push({
        code: 'FAIL_CONFLICT_PRIORITY',
        message: `Director camera must follow base acting on ${payload.payload_id}`,
        field: `${payload.payload_id}.compiled_image_prompt`,
      });
    }

    if (!payload.compiled_image_prompt.includes(director.camera_reason)) {
      violations.push({
        code: 'FAIL_CONFLICT_PRIORITY',
        message: `Director camera_reason must override acting camera on ${payload.payload_id}`,
        field: `${payload.payload_id}.compiled_image_prompt`,
      });
    }

    if (payload.compiled_image_prompt.includes(`Camera angle: ${imagePayload.camera_angle}`)) {
      violations.push({
        code: 'FAIL_CONFLICT_PRIORITY',
        message: `Raw acting camera_angle must not duplicate director override on ${payload.payload_id}`,
        field: `${payload.payload_id}.compiled_image_prompt`,
      });
    }
  }

  return violations;
}

function auditNestedFieldLeak(
  exportDoc: DirectorEnhancedImagePromptCompilerExport
): DirectorEnhancedImagePromptCompilerViolation[] {
  const violations: DirectorEnhancedImagePromptCompilerViolation[] = [];
  const serialized = JSON.stringify(exportDoc).toLowerCase();

  for (const key of NESTED_LEAK_KEYS) {
    if (serialized.includes(`"${key}"`)) {
      violations.push({
        code: 'FAIL_NESTED_FIELD_LEAK',
        message: `Export must not contain nested field ${key}`,
        field: key,
      });
    }
  }

  return violations;
}

function auditDuplicatePayload(
  payloads: CompiledImagePromptPayload[]
): DirectorEnhancedImagePromptCompilerViolation[] {
  const violations: DirectorEnhancedImagePromptCompilerViolation[] = [];
  const payloadIds = payloads.map((payload) => payload.payload_id);
  const storyboardIds = payloads.map((payload) => payload.storyboard_id);

  for (const duplicate of findDuplicateCompiledPayloadIds(payloadIds)) {
    violations.push({
      code: 'FAIL_DUPLICATE_PAYLOAD',
      message: `Duplicate payload_id ${duplicate}`,
      field: 'payload_id',
    });
  }

  for (const storyboardId of [...new Set(storyboardIds.filter(
    (id, index) => storyboardIds.indexOf(id) !== index
  ))]) {
    violations.push({
      code: 'FAIL_DUPLICATE_PAYLOAD',
      message: `Duplicate storyboard_id ${storyboardId}`,
      field: 'storyboard_id',
    });
  }

  return violations;
}

function auditAiStudioTriggered(
  exportDoc: DirectorEnhancedImagePromptCompilerExport
): DirectorEnhancedImagePromptCompilerViolation[] {
  const violations: DirectorEnhancedImagePromptCompilerViolation[] = [];
  const sanitized = JSON.stringify(exportDoc)
    .toLowerCase()
    .replace(/no-ai-studio-generation/g, '')
    .replace(/no-ai-studio-no-gpu/g, '');

  for (const token of FORBIDDEN_AI_STUDIO_TOKENS) {
    if (sanitized.includes(token)) {
      violations.push({
        code: 'FAIL_AI_STUDIO_TRIGGERED',
        message: `Forbidden generation trigger token ${token}`,
        field: 'compiled_export',
      });
    }
  }

  return violations;
}

function primaryFailure(
  violations: DirectorEnhancedImagePromptCompilerViolation[]
): DirectorEnhancedImagePromptCompilerAuditResult {
  const priority: DirectorEnhancedImagePromptCompilerAuditResult[] = [
    'FAIL_COMPILER_COMPLETENESS',
    'FAIL_PAYLOAD_COUNT',
    'FAIL_DUPLICATE_PAYLOAD',
    'FAIL_STORY_EXPORT_REFERENCE',
    'FAIL_DIRECTOR_GRAMMAR_REFERENCE',
    'FAIL_NESTED_FIELD_LEAK',
    'FAIL_AI_STUDIO_TRIGGERED',
    'FAIL_COMPILED_IMAGE_PROMPT',
    'FAIL_COMPILED_NEGATIVE_PROMPT',
    'FAIL_CONTINUITY_ANCHORS',
    'FAIL_CONFLICT_PRIORITY',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditDirectorEnhancedImagePromptCompiler(
  projectRoot: string,
  exportDoc: DirectorEnhancedImagePromptCompilerExport
): DirectorEnhancedImagePromptCompilerViolation[] {
  const ctx = buildCompilerAuditContext();
  const violations: DirectorEnhancedImagePromptCompilerViolation[] = [];

  violations.push(...auditCompilerCompleteness(exportDoc));
  violations.push(...auditPayloadCount(exportDoc));
  violations.push(...auditDuplicatePayload(exportDoc.compiled_payloads));
  violations.push(...auditStoryExportReference(exportDoc, ctx));
  violations.push(...auditDirectorGrammarReference(projectRoot, exportDoc, ctx));
  violations.push(...auditNestedFieldLeak(exportDoc));
  violations.push(...auditAiStudioTriggered(exportDoc));
  violations.push(...auditCompiledImagePrompt(exportDoc.compiled_payloads, ctx));
  violations.push(...auditCompiledNegativePrompt(exportDoc.compiled_payloads, ctx));
  violations.push(...auditContinuityAnchors(exportDoc.compiled_payloads, ctx));
  violations.push(...auditConflictPriority(exportDoc.compiled_payloads, ctx));

  return violations;
}

export function writeDirectorEnhancedImagePromptCompilerExport(
  projectRoot: string,
  exportDoc: DirectorEnhancedImagePromptCompilerExport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const exportPath = path.join(exportsDir, EXPORT_FILE);
  fs.writeFileSync(exportPath, `${JSON.stringify(exportDoc, null, 2)}\n`, 'utf8');
  return exportPath;
}

export function writeDirectorEnhancedImagePromptCompilerReport(
  projectRoot: string,
  report: DirectorEnhancedImagePromptCompilerReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runDirectorEnhancedImagePromptCompilerAudit(
  projectRoot: string
): DirectorEnhancedImagePromptCompilerReport {
  const auditTimestamp = new Date().toISOString();
  const exportDoc = buildDirectorEnhancedImagePromptCompilerExport();
  const violations = auditDirectorEnhancedImagePromptCompiler(projectRoot, exportDoc);

  writeDirectorEnhancedImagePromptCompilerExport(projectRoot, exportDoc);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);
  const report: DirectorEnhancedImagePromptCompilerReport = {
    auditTimestamp,
    auditResult,
    layer_version: DIRECTOR_ENHANCED_IMAGE_PROMPT_COMPILER_VERSION,
    violations,
  };

  writeDirectorEnhancedImagePromptCompilerReport(projectRoot, report);
  return report;
}

export { DIRECTOR_ENHANCED_IMAGE_PROMPT_COMPILER_JSON_PATH };
