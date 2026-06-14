import fs from 'node:fs';
import path from 'node:path';
import { getCharacterDecisionSeedLibrary } from './characterDecisionDefinitions.js';
import { containsForbiddenWorldToken } from './fiveShotBundleDefinitions.js';
import { getImageActingCameraById } from './imageActingCameraGrammarDefinitions.js';
import {
  buildImageAppInputExport,
  buildImageAppPayloads,
  IMAGE_APP_INPUT_EXPORT_ID,
} from './imageAppInputExport.js';
import {
  buildStoryDrivenImageAppExport,
  findDuplicateStoryDrivenPayloadIds,
  REQUIRED_IMAGE_GENERATION_PAYLOAD_FIELDS,
  REQUIRED_STORY_DRIVEN_EXPORT_FIELDS,
  STORY_DRIVEN_IMAGE_APP_EXPORT_ID,
  STORY_DRIVEN_IMAGE_APP_EXPORT_JSON_PATH,
  STORY_DRIVEN_IMAGE_APP_EXPORT_SONG_MASTER_ID,
  STORY_DRIVEN_IMAGE_APP_EXPORT_VERSION,
  STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT,
  type RequiredImageGenerationPayloadField,
  type RequiredStoryDrivenExportField,
  type StoryDrivenImageAppExport,
  type StoryDrivenImageGenerationPayload,
} from './storyDrivenImageAppExport.js';
import {
  getFiveShotBundleSeedLibrary,
} from './fiveShotBundleDefinitions.js';
import {
  DEFAULT_WORLD_SETTING,
  WORLD_DNA_PRIORITY_LAW,
} from './srtEmotionIngestionDefinitions.js';
import {
  getStoryOrchestrationById,
  parseOutputStoryBeatToken,
  STORY_ORCHESTRATION_ID,
} from './storyOrchestrationDefinitions.js';
import { getWorldContinuityById, WORLD_CONTINUITY_WORLD_ID } from './worldContinuityDefinitions.js';

export type StoryDrivenImageAppExportAuditResult =
  | 'PASS'
  | 'FAIL_EXPORT_COMPLETENESS'
  | 'FAIL_BUNDLE_REFERENCE'
  | 'FAIL_ORCHESTRATION_REFERENCE'
  | 'FAIL_DECISION_REFERENCE'
  | 'FAIL_IMAGE_EXPORT_REFERENCE'
  | 'FAIL_ACTING_CAMERA_REFERENCE'
  | 'FAIL_WORLD_DNA_VIOLATION'
  | 'FAIL_PAYLOAD_COMPLETENESS'
  | 'FAIL_DUPLICATE_PAYLOAD';

export interface StoryDrivenImageAppExportViolation {
  code: StoryDrivenImageAppExportAuditResult;
  message: string;
  field?: string;
}

export interface StoryDrivenImageAppExportReport {
  auditTimestamp: string;
  auditResult: StoryDrivenImageAppExportAuditResult;
  layer_version: typeof STORY_DRIVEN_IMAGE_APP_EXPORT_VERSION;
  violations: StoryDrivenImageAppExportViolation[];
}

const EXPORT_FILE = 'story-driven-image-app-export.json';
const REPORT_FILE = 'story-driven-image-app-export-report.json';

const FORBIDDEN_EXPORT_TOKENS = [
  'invoke:ai-studio',
  'call:ai-studio',
  'ai-studio-generate',
  'generate:image',
  'trigger:generation',
  'run:gpu',
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

function auditExportCompleteness(
  exportDoc: StoryDrivenImageAppExport
): StoryDrivenImageAppExportViolation[] {
  const violations: StoryDrivenImageAppExportViolation[] = [];

  for (const field of REQUIRED_STORY_DRIVEN_EXPORT_FIELDS) {
    const value = exportDoc[field as RequiredStoryDrivenExportField];
    if (value === undefined || value === null) {
      violations.push({
        code: 'FAIL_EXPORT_COMPLETENESS',
        message: `Missing required export field ${field}`,
        field,
      });
    }
  }

  if (exportDoc.export_id !== STORY_DRIVEN_IMAGE_APP_EXPORT_ID) {
    violations.push({
      code: 'FAIL_EXPORT_COMPLETENESS',
      message: `export_id must be ${STORY_DRIVEN_IMAGE_APP_EXPORT_ID}`,
      field: 'export_id',
    });
  }

  if (exportDoc.song_master_id !== STORY_DRIVEN_IMAGE_APP_EXPORT_SONG_MASTER_ID) {
    violations.push({
      code: 'FAIL_EXPORT_COMPLETENESS',
      message: `song_master_id must be ${STORY_DRIVEN_IMAGE_APP_EXPORT_SONG_MASTER_ID}`,
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

  if (exportDoc.orchestration_id !== STORY_ORCHESTRATION_ID) {
    violations.push({
      code: 'FAIL_EXPORT_COMPLETENESS',
      message: `orchestration_id must be ${STORY_ORCHESTRATION_ID}`,
      field: 'orchestration_id',
    });
  }

  if (!Array.isArray(exportDoc.five_shot_bundle_ids) || exportDoc.five_shot_bundle_ids.length !== 3) {
    violations.push({
      code: 'FAIL_EXPORT_COMPLETENESS',
      message: 'five_shot_bundle_ids must contain exactly 3 bundle ids',
      field: 'five_shot_bundle_ids',
    });
  }

  if (
    !Array.isArray(exportDoc.image_generation_payloads) ||
    exportDoc.image_generation_payloads.length !== STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT
  ) {
    violations.push({
      code: 'FAIL_EXPORT_COMPLETENESS',
      message: `image_generation_payloads must contain exactly ${STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT} payloads`,
      field: 'image_generation_payloads',
    });
  }

  if (exportDoc.story_engine_ready !== true) {
    violations.push({
      code: 'FAIL_EXPORT_COMPLETENESS',
      message: 'story_engine_ready must be true',
      field: 'story_engine_ready',
    });
  }

  const serialized = JSON.stringify(exportDoc).toLowerCase();
  for (const token of FORBIDDEN_EXPORT_TOKENS) {
    if (serialized.includes(token)) {
      violations.push({
        code: 'FAIL_EXPORT_COMPLETENESS',
        message: `Export must not contain generation trigger token ${token}`,
        field: 'forbidden_token',
      });
    }
  }

  return violations;
}

function auditBundleReference(
  exportDoc: StoryDrivenImageAppExport,
  bundleById: ReadonlyMap<string, ReturnType<typeof getFiveShotBundleSeedLibrary>[number]>
): StoryDrivenImageAppExportViolation[] {
  const violations: StoryDrivenImageAppExportViolation[] = [];
  const bundles = [...bundleById.values()];
  const bundleIds = new Set(bundleById.keys());
  const bundledStoryboardIds = new Set(bundles.flatMap((bundle) => bundle.scene_ids));
  const expectedBundleIds = bundles.map((bundle) => bundle.bundle_id);

  for (const bundleId of exportDoc.five_shot_bundle_ids) {
    if (!bundleIds.has(bundleId)) {
      violations.push({
        code: 'FAIL_BUNDLE_REFERENCE',
        message: `Unknown five-shot bundle id ${bundleId}`,
        field: 'five_shot_bundle_ids',
      });
    }
  }

  for (const expectedId of expectedBundleIds) {
    if (!exportDoc.five_shot_bundle_ids.includes(expectedId)) {
      violations.push({
        code: 'FAIL_BUNDLE_REFERENCE',
        message: `Missing expected bundle id ${expectedId}`,
        field: 'five_shot_bundle_ids',
      });
    }
  }

  for (const payload of exportDoc.image_generation_payloads) {
    if (!bundleIds.has(payload.bundle_id)) {
      violations.push({
        code: 'FAIL_BUNDLE_REFERENCE',
        message: `Payload ${payload.payload_id} references unknown bundle ${payload.bundle_id}`,
        field: `${payload.payload_id}.bundle_id`,
      });
      continue;
    }

    const bundle = bundleById.get(payload.bundle_id);
    if (!bundle?.scene_ids.includes(payload.storyboard_id)) {
      violations.push({
        code: 'FAIL_BUNDLE_REFERENCE',
        message: `Payload ${payload.payload_id} storyboard ${payload.storyboard_id} is not in bundle ${payload.bundle_id}`,
        field: `${payload.payload_id}.storyboard_id`,
      });
    }
  }

  const coveredStoryboards = new Set(
    exportDoc.image_generation_payloads.map((payload) => payload.storyboard_id)
  );
  for (const storyboardId of bundledStoryboardIds) {
    if (!coveredStoryboards.has(storyboardId)) {
      violations.push({
        code: 'FAIL_BUNDLE_REFERENCE',
        message: `Bundled storyboard ${storyboardId} missing from image_generation_payloads`,
        field: 'image_generation_payloads',
      });
    }
  }

  return violations;
}

function auditOrchestrationReference(
  exportDoc: StoryDrivenImageAppExport
): StoryDrivenImageAppExportViolation[] {
  const violations: StoryDrivenImageAppExportViolation[] = [];
  const orchestration = getStoryOrchestrationById(STORY_ORCHESTRATION_ID);

  if (!orchestration) {
    violations.push({
      code: 'FAIL_ORCHESTRATION_REFERENCE',
      message: `Missing orchestration ${STORY_ORCHESTRATION_ID}`,
      field: 'orchestration_id',
    });
    return violations;
  }

  for (const payload of exportDoc.image_generation_payloads) {
    const parsedBeat = parseOutputStoryBeatToken(payload.story_beat);
    if (!parsedBeat || parsedBeat.storyboardId !== payload.storyboard_id) {
      violations.push({
        code: 'FAIL_ORCHESTRATION_REFERENCE',
        message: `Invalid story_beat for ${payload.payload_id}`,
        field: `${payload.payload_id}.story_beat`,
      });
    }

    if (!orchestration.output_story_beats.includes(payload.story_beat)) {
      violations.push({
        code: 'FAIL_ORCHESTRATION_REFERENCE',
        message: `story_beat not found in orchestration for ${payload.payload_id}`,
        field: `${payload.payload_id}.story_beat`,
      });
    }

    if (!orchestration.narrative_turns.includes(payload.narrative_turn)) {
      violations.push({
        code: 'FAIL_ORCHESTRATION_REFERENCE',
        message: `narrative_turn not found in orchestration for ${payload.payload_id}`,
        field: `${payload.payload_id}.narrative_turn`,
      });
    }

    const hasOrchestrationGuard = payload.anti_repetition_guard.some((token) =>
      orchestration.anti_repetition_rules.includes(token)
    );
    if (!hasOrchestrationGuard) {
      violations.push({
        code: 'FAIL_ORCHESTRATION_REFERENCE',
        message: `anti_repetition_guard must include orchestration rule for ${payload.payload_id}`,
        field: `${payload.payload_id}.anti_repetition_guard`,
      });
    }
  }

  return violations;
}

function auditDecisionReference(
  exportDoc: StoryDrivenImageAppExport,
  bundleById: ReadonlyMap<string, ReturnType<typeof getFiveShotBundleSeedLibrary>[number]>
): StoryDrivenImageAppExportViolation[] {
  const violations: StoryDrivenImageAppExportViolation[] = [];
  const decisionById = new Map(
    getCharacterDecisionSeedLibrary().map((decision) => [decision.decision_id, decision] as const)
  );

  for (const payload of exportDoc.image_generation_payloads) {
    if (!isStringArray(payload.character_decision_refs)) {
      violations.push({
        code: 'FAIL_DECISION_REFERENCE',
        message: `character_decision_refs must be a non-empty string array for ${payload.payload_id}`,
        field: `${payload.payload_id}.character_decision_refs`,
      });
      continue;
    }

    if (payload.character_decision_refs.length !== 2) {
      violations.push({
        code: 'FAIL_DECISION_REFERENCE',
        message: `Expected two character decisions for ${payload.payload_id}`,
        field: `${payload.payload_id}.character_decision_refs`,
      });
    }

    const bundle = bundleById.get(payload.bundle_id);
    for (const decisionId of payload.character_decision_refs) {
      const decision = decisionById.get(decisionId);
      if (!decision) {
        violations.push({
          code: 'FAIL_DECISION_REFERENCE',
          message: `Unknown character decision ${decisionId} on ${payload.payload_id}`,
          field: `${payload.payload_id}.character_decision_refs`,
        });
        continue;
      }

      if (
        !decision.scene_bindings.some((token) => token === `storyboard:${payload.storyboard_id}`)
      ) {
        violations.push({
          code: 'FAIL_DECISION_REFERENCE',
          message: `Decision ${decisionId} is not bound to ${payload.storyboard_id}`,
          field: `${payload.payload_id}.character_decision_refs`,
        });
      }

      if (bundle && !bundle.character_decisions.includes(decisionId)) {
        violations.push({
          code: 'FAIL_DECISION_REFERENCE',
          message: `Decision ${decisionId} is not listed on bundle ${payload.bundle_id}`,
          field: `${payload.payload_id}.character_decision_refs`,
        });
      }
    }
  }

  return violations;
}

function auditImageExportReference(
  exportDoc: StoryDrivenImageAppExport
): StoryDrivenImageAppExportViolation[] {
  const violations: StoryDrivenImageAppExportViolation[] = [];
  const imageExport = buildImageAppInputExport();
  const imagePayloadByStoryboard = new Map(
    buildImageAppPayloads().map((payload) => [payload.storyboard_id, payload] as const)
  );

  if (imageExport.export_id !== IMAGE_APP_INPUT_EXPORT_ID) {
    violations.push({
      code: 'FAIL_IMAGE_EXPORT_REFERENCE',
      message: `Upstream image app export id must be ${IMAGE_APP_INPUT_EXPORT_ID}`,
      field: 'image_app_input_export',
    });
  }

  if (!imageExport.image_app_ready) {
    violations.push({
      code: 'FAIL_IMAGE_EXPORT_REFERENCE',
      message: 'Upstream image app input export is not ready',
      field: 'image_app_input_export',
    });
  }

  for (const payload of exportDoc.image_generation_payloads) {
    const imagePayload = imagePayloadByStoryboard.get(payload.storyboard_id);
    if (!imagePayload) {
      violations.push({
        code: 'FAIL_IMAGE_EXPORT_REFERENCE',
        message: `Missing upstream image app payload for ${payload.storyboard_id}`,
        field: `${payload.payload_id}.storyboard_id`,
      });
      continue;
    }

    if (payload.image_prompt_pack_id !== imagePayload.image_prompt_pack_id) {
      violations.push({
        code: 'FAIL_IMAGE_EXPORT_REFERENCE',
        message: `image_prompt_pack_id mismatch for ${payload.payload_id}`,
        field: `${payload.payload_id}.image_prompt_pack_id`,
      });
    }

    if (payload.acting_camera_id !== imagePayload.acting_camera_id) {
      violations.push({
        code: 'FAIL_IMAGE_EXPORT_REFERENCE',
        message: `acting_camera_id mismatch for ${payload.payload_id}`,
        field: `${payload.payload_id}.acting_camera_id`,
      });
    }

    if (payload.image_prompt !== imagePayload.image_prompt) {
      violations.push({
        code: 'FAIL_IMAGE_EXPORT_REFERENCE',
        message: `image_prompt mismatch for ${payload.payload_id}`,
        field: `${payload.payload_id}.image_prompt`,
      });
    }

    if (payload.negative_prompt !== imagePayload.negative_prompt) {
      violations.push({
        code: 'FAIL_IMAGE_EXPORT_REFERENCE',
        message: `negative_prompt mismatch for ${payload.payload_id}`,
        field: `${payload.payload_id}.negative_prompt`,
      });
    }
  }

  return violations;
}

function auditActingCameraReference(
  exportDoc: StoryDrivenImageAppExport
): StoryDrivenImageAppExportViolation[] {
  const violations: StoryDrivenImageAppExportViolation[] = [];

  for (const payload of exportDoc.image_generation_payloads) {
    const expectedActingId = `IAC-${payload.storyboard_id}`;
    if (payload.acting_camera_id !== expectedActingId) {
      violations.push({
        code: 'FAIL_ACTING_CAMERA_REFERENCE',
        message: `acting_camera_id must be ${expectedActingId} for ${payload.payload_id}`,
        field: `${payload.payload_id}.acting_camera_id`,
      });
    }

    const acting = getImageActingCameraById(payload.acting_camera_id);
    if (!acting) {
      violations.push({
        code: 'FAIL_ACTING_CAMERA_REFERENCE',
        message: `Unknown acting camera grammar ${payload.acting_camera_id}`,
        field: `${payload.payload_id}.acting_camera_id`,
      });
    }
  }

  return violations;
}

function serializeWorldMetadata(exportDoc: StoryDrivenImageAppExport): string {
  return JSON.stringify({
    export_id: exportDoc.export_id,
    song_master_id: exportDoc.song_master_id,
    world_id: exportDoc.world_id,
    orchestration_id: exportDoc.orchestration_id,
    five_shot_bundle_ids: exportDoc.five_shot_bundle_ids,
    payloads: exportDoc.image_generation_payloads.map((payload) => ({
      bundle_id: payload.bundle_id,
      world_constraints: payload.world_constraints,
      world_continuity_anchors: payload.world_continuity_anchors,
      anti_repetition_guard: payload.anti_repetition_guard,
      daily_life_anchor: payload.daily_life_anchor,
    })),
  });
}

function auditWorldDnaViolation(
  exportDoc: StoryDrivenImageAppExport
): StoryDrivenImageAppExportViolation[] {
  const violations: StoryDrivenImageAppExportViolation[] = [];
  const world = getWorldContinuityById(WORLD_CONTINUITY_WORLD_ID);

  if (!world) {
    violations.push({
      code: 'FAIL_WORLD_DNA_VIOLATION',
      message: `Missing world continuity ${WORLD_CONTINUITY_WORLD_ID}`,
      field: 'world_id',
    });
    return violations;
  }

  const serialized = serializeWorldMetadata(exportDoc);
  const forbidden = containsForbiddenWorldToken(serialized);
  if (forbidden) {
    violations.push({
      code: 'FAIL_WORLD_DNA_VIOLATION',
      message: `Export contains forbidden world token ${forbidden}`,
      field: 'world_dna',
    });
  }

  const defaultWorldToken = `default-world:${DEFAULT_WORLD_SETTING.replace(/\s+/g, '-')}`;
  const hasDefaultWorld = exportDoc.image_generation_payloads.every((payload) =>
    payload.world_constraints.includes(defaultWorldToken)
  );
  if (!hasDefaultWorld) {
    violations.push({
      code: 'FAIL_WORLD_DNA_VIOLATION',
      message: `Export must preserve default world setting ${DEFAULT_WORLD_SETTING}`,
      field: 'world_dna',
    });
  }

  if (!serialized.includes(WORLD_DNA_PRIORITY_LAW)) {
    violations.push({
      code: 'FAIL_WORLD_DNA_VIOLATION',
      message: `Export must include world DNA priority law ${WORLD_DNA_PRIORITY_LAW}`,
      field: 'world_dna',
    });
  }

  for (const payload of exportDoc.image_generation_payloads) {
    if (!payload.world_constraints.some((token) => token.startsWith('law:'))) {
      violations.push({
        code: 'FAIL_WORLD_DNA_VIOLATION',
        message: `world_constraints must include law token for ${payload.payload_id}`,
        field: `${payload.payload_id}.world_constraints`,
      });
    }

    if (!payload.world_constraints.some((token) => token.startsWith('forbidden:'))) {
      violations.push({
        code: 'FAIL_WORLD_DNA_VIOLATION',
        message: `world_constraints must include forbidden token for ${payload.payload_id}`,
        field: `${payload.payload_id}.world_constraints`,
      });
    }
  }

  return violations;
}

function auditPayloadCompleteness(
  payloads: StoryDrivenImageGenerationPayload[]
): StoryDrivenImageAppExportViolation[] {
  const violations: StoryDrivenImageAppExportViolation[] = [];

  for (const payload of payloads) {
    for (const field of REQUIRED_IMAGE_GENERATION_PAYLOAD_FIELDS) {
      const value = payload[field as RequiredImageGenerationPayloadField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_PAYLOAD_COMPLETENESS',
          message: `Missing required field ${field} on ${payload.payload_id}`,
          field: `${payload.payload_id}.${field}`,
        });
        continue;
      }

      if (
        field === 'character_decision_refs' ||
        field === 'daily_life_anchor' ||
        field === 'anti_repetition_guard' ||
        field === 'world_constraints' ||
        field === 'character_continuity_anchors' ||
        field === 'location_continuity_anchors' ||
        field === 'world_continuity_anchors'
      ) {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_PAYLOAD_COMPLETENESS',
            message: `${field} must be a non-empty string array on ${payload.payload_id}`,
            field: `${payload.payload_id}.${field}`,
          });
        }
      } else if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_PAYLOAD_COMPLETENESS',
          message: `${field} must be a non-empty string on ${payload.payload_id}`,
          field: `${payload.payload_id}.${field}`,
        });
      }
    }
  }

  return violations;
}

function auditDuplicatePayload(
  payloads: StoryDrivenImageGenerationPayload[]
): StoryDrivenImageAppExportViolation[] {
  const violations: StoryDrivenImageAppExportViolation[] = [];
  const payloadIds = payloads.map((payload) => payload.payload_id);
  const duplicates = findDuplicateStoryDrivenPayloadIds(payloadIds);

  for (const duplicate of duplicates) {
    violations.push({
      code: 'FAIL_DUPLICATE_PAYLOAD',
      message: `Duplicate payload_id ${duplicate}`,
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

  return violations;
}

function primaryFailure(
  violations: StoryDrivenImageAppExportViolation[]
): StoryDrivenImageAppExportAuditResult {
  const priority: StoryDrivenImageAppExportAuditResult[] = [
    'FAIL_EXPORT_COMPLETENESS',
    'FAIL_DUPLICATE_PAYLOAD',
    'FAIL_BUNDLE_REFERENCE',
    'FAIL_ORCHESTRATION_REFERENCE',
    'FAIL_DECISION_REFERENCE',
    'FAIL_IMAGE_EXPORT_REFERENCE',
    'FAIL_ACTING_CAMERA_REFERENCE',
    'FAIL_WORLD_DNA_VIOLATION',
    'FAIL_PAYLOAD_COMPLETENESS',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditStoryDrivenImageAppExport(
  projectRoot: string,
  exportDoc: StoryDrivenImageAppExport
): StoryDrivenImageAppExportViolation[] {
  void projectRoot;
  const violations: StoryDrivenImageAppExportViolation[] = [];
  const bundleById = new Map(
    getFiveShotBundleSeedLibrary().map((bundle) => [bundle.bundle_id, bundle] as const)
  );

  violations.push(...auditExportCompleteness(exportDoc));
  violations.push(...auditDuplicatePayload(exportDoc.image_generation_payloads));
  violations.push(...auditBundleReference(exportDoc, bundleById));
  violations.push(...auditOrchestrationReference(exportDoc));
  violations.push(...auditDecisionReference(exportDoc, bundleById));
  violations.push(...auditImageExportReference(exportDoc));
  violations.push(...auditActingCameraReference(exportDoc));
  violations.push(...auditWorldDnaViolation(exportDoc));
  violations.push(...auditPayloadCompleteness(exportDoc.image_generation_payloads));

  return violations;
}

export function writeStoryDrivenImageAppExport(
  projectRoot: string,
  exportDoc: StoryDrivenImageAppExport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const exportPath = path.join(exportsDir, EXPORT_FILE);
  fs.writeFileSync(exportPath, `${JSON.stringify(exportDoc, null, 2)}\n`, 'utf8');
  return exportPath;
}

export function writeStoryDrivenImageAppExportReport(
  projectRoot: string,
  report: StoryDrivenImageAppExportReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runStoryDrivenImageAppExportAudit(
  projectRoot: string
): StoryDrivenImageAppExportReport {
  const auditTimestamp = new Date().toISOString();
  const exportDoc = buildStoryDrivenImageAppExport();
  const violations = auditStoryDrivenImageAppExport(projectRoot, exportDoc);

  writeStoryDrivenImageAppExport(projectRoot, exportDoc);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: StoryDrivenImageAppExportReport = {
    auditTimestamp,
    auditResult,
    layer_version: STORY_DRIVEN_IMAGE_APP_EXPORT_VERSION,
    violations,
  };

  writeStoryDrivenImageAppExportReport(projectRoot, report);
  return report;
}

export { STORY_DRIVEN_IMAGE_APP_EXPORT_JSON_PATH };
