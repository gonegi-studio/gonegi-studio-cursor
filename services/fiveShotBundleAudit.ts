import fs from 'node:fs';
import path from 'node:path';
import {
  getCharacterDecisionById,
  getCharacterDecisionSeedLibrary,
} from './characterDecisionDefinitions.js';
import { getImageActingCameraById } from './imageActingCameraGrammarDefinitions.js';
import { getLocationContinuityById } from './locationContinuityDefinitions.js';
import {
  BUNDLE_SHOT_ROLES,
  buildFiveShotBundlePreview,
  containsForbiddenWorldToken,
  findDuplicateBundleIds,
  FIVE_SHOT_BUNDLE_FINALE_SCENE_ID,
  FIVE_SHOT_BUNDLE_SEED_COUNT,
  FIVE_SHOT_BUNDLE_SIZE,
  FIVE_SHOT_BUNDLE_SONG_MASTER_ID,
  FIVE_SHOT_BUNDLE_VERSION,
  getAllBundledSceneIds,
  getFiveShotBundleSeedLibrary,
  getPrimaryDailyLifeAnchor,
  parseCameraProgressionToken,
  REQUIRED_FIVE_SHOT_BUNDLE_FIELDS,
  type FiveShotBundleEntry,
  type FiveShotBundlePreview,
  type RequiredFiveShotBundleField,
} from './fiveShotBundleDefinitions.js';
import {
  DEFAULT_WORLD_SETTING,
  WORLD_DNA_PRIORITY_LAW,
} from './srtEmotionIngestionDefinitions.js';
import {
  getStoryboardSceneSeedLibrary,
  STORYBOARD_SEED_COUNT,
} from './storyboardLayerDefinitions.js';
import {
  getStoryOrchestrationById,
  STORY_ORCHESTRATION_ID,
} from './storyOrchestrationDefinitions.js';
import { getWorldContinuityById, WORLD_CONTINUITY_WORLD_ID } from './worldContinuityDefinitions.js';

export type FiveShotBundleAuditResult =
  | 'PASS'
  | 'FAIL_BUNDLE_COMPLETENESS'
  | 'FAIL_SCENE_REFERENCE'
  | 'FAIL_DECISION_REFERENCE'
  | 'FAIL_WORLD_REFERENCE'
  | 'FAIL_LOCATION_REFERENCE'
  | 'FAIL_CAMERA_PROGRESSION'
  | 'FAIL_ACTING_PROGRESSION'
  | 'FAIL_EMOTIONAL_PROGRESSION'
  | 'FAIL_WORLD_DNA_VIOLATION'
  | 'FAIL_DUPLICATE_BUNDLE';

export interface FiveShotBundleViolation {
  code: FiveShotBundleAuditResult;
  message: string;
  field?: string;
}

export interface FiveShotBundleReport {
  auditTimestamp: string;
  auditResult: FiveShotBundleAuditResult;
  violations: FiveShotBundleViolation[];
}

const PREVIEW_FILE = 'five-shot-bundle-preview.json';
const REPORT_FILE = 'five-shot-bundle-report.json';

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

function auditBundleCompleteness(entries: FiveShotBundleEntry[]): FiveShotBundleViolation[] {
  const violations: FiveShotBundleViolation[] = [];

  if (entries.length !== FIVE_SHOT_BUNDLE_SEED_COUNT) {
    violations.push({
      code: 'FAIL_BUNDLE_COMPLETENESS',
      message: `Five-shot bundle layer must contain exactly ${FIVE_SHOT_BUNDLE_SEED_COUNT} bundles`,
      field: 'seed_five_shot_bundles.length',
    });
  }

  for (const entry of entries) {
    for (const field of REQUIRED_FIVE_SHOT_BUNDLE_FIELDS) {
      const value = entry[field as RequiredFiveShotBundleField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_BUNDLE_COMPLETENESS',
          message: `Missing required field ${field} on ${entry.bundle_id}`,
          field: `${entry.bundle_id}.${field}`,
        });
        continue;
      }

      if (
        field === 'scene_ids' ||
        field === 'character_decisions' ||
        field === 'emotional_progression' ||
        field === 'acting_progression' ||
        field === 'camera_progression' ||
        field === 'keywords'
      ) {
        if (!Array.isArray(value) || value.length === 0) {
          violations.push({
            code: 'FAIL_BUNDLE_COMPLETENESS',
            message: `Field ${field} must be a non-empty array on ${entry.bundle_id}`,
            field: `${entry.bundle_id}.${field}`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_BUNDLE_COMPLETENESS',
          message: `Field ${field} must be a non-empty string on ${entry.bundle_id}`,
          field: `${entry.bundle_id}.${field}`,
        });
      }
    }

    if (entry.scene_ids.length !== FIVE_SHOT_BUNDLE_SIZE) {
      violations.push({
        code: 'FAIL_BUNDLE_COMPLETENESS',
        message: `Bundle must contain exactly ${FIVE_SHOT_BUNDLE_SIZE} scenes`,
        field: `${entry.bundle_id}.scene_ids`,
      });
    }

    for (const role of BUNDLE_SHOT_ROLES) {
      if (!entry.keywords.includes(`bundle-role:${role}`)) {
        violations.push({
          code: 'FAIL_BUNDLE_COMPLETENESS',
          message: `keywords must declare bundle role ${role} on ${entry.bundle_id}`,
          field: `${entry.bundle_id}.keywords`,
        });
      }
    }
  }

  return violations;
}

function auditSceneReference(entries: FiveShotBundleEntry[]): FiveShotBundleViolation[] {
  const violations: FiveShotBundleViolation[] = [];
  const bundledSceneIds = getAllBundledSceneIds();

  for (const entry of entries) {
    for (const storyboardId of entry.scene_ids) {
      if (!STORYBOARD_SCENE_IDS.has(storyboardId)) {
        violations.push({
          code: 'FAIL_SCENE_REFERENCE',
          message: `Unknown storyboard scene ${storyboardId} on ${entry.bundle_id}`,
          field: `${entry.bundle_id}.scene_ids`,
        });
      }
    }
  }

  const duplicateScenes = bundledSceneIds.filter(
    (sceneId, index) => bundledSceneIds.indexOf(sceneId) !== index
  );
  for (const sceneId of [...new Set(duplicateScenes)]) {
    violations.push({
      code: 'FAIL_DUPLICATE_BUNDLE',
      message: `Storyboard scene ${sceneId} appears in multiple bundles`,
      field: 'scene_ids',
    });
  }

  const expectedBundledCount = FIVE_SHOT_BUNDLE_SIZE * FIVE_SHOT_BUNDLE_SEED_COUNT;
  if (bundledSceneIds.length !== expectedBundledCount) {
    violations.push({
      code: 'FAIL_SCENE_REFERENCE',
      message: `Expected ${expectedBundledCount} bundled storyboard scenes`,
      field: 'scene_ids',
    });
  }

  const lastBundle = entries.find((entry) => entry.bundle_id === 'FSB-song_master_01-03');
  if (lastBundle && !lastBundle.bundle_transition_out.includes(FIVE_SHOT_BUNDLE_FINALE_SCENE_ID)) {
    violations.push({
      code: 'FAIL_SCENE_REFERENCE',
      message: `Final bundle must transition to finale scene ${FIVE_SHOT_BUNDLE_FINALE_SCENE_ID}`,
      field: `${lastBundle.bundle_id}.bundle_transition_out`,
    });
  }

  if (!bundledSceneIds.includes(FIVE_SHOT_BUNDLE_FINALE_SCENE_ID)) {
    const finaleCovered =
      lastBundle?.bundle_transition_out.includes(FIVE_SHOT_BUNDLE_FINALE_SCENE_ID) ?? false;
    if (!finaleCovered) {
      violations.push({
        code: 'FAIL_SCENE_REFERENCE',
        message: `Finale scene ${FIVE_SHOT_BUNDLE_FINALE_SCENE_ID} must be referenced by bundle transition`,
        field: FIVE_SHOT_BUNDLE_FINALE_SCENE_ID,
      });
    }
  }

  return violations;
}

function auditDecisionReference(entries: FiveShotBundleEntry[]): FiveShotBundleViolation[] {
  const violations: FiveShotBundleViolation[] = [];

  for (const entry of entries) {
    if (entry.character_decisions.length !== FIVE_SHOT_BUNDLE_SIZE * 2) {
      violations.push({
        code: 'FAIL_DECISION_REFERENCE',
        message: `Bundle must reference both character decisions for all five scenes on ${entry.bundle_id}`,
        field: `${entry.bundle_id}.character_decisions`,
      });
    }

    for (const decisionId of entry.character_decisions) {
      const decision = getCharacterDecisionById(decisionId);
      if (!decision) {
        violations.push({
          code: 'FAIL_DECISION_REFERENCE',
          message: `Unknown character decision ${decisionId} on ${entry.bundle_id}`,
          field: `${entry.bundle_id}.character_decisions`,
        });
        continue;
      }

      const storyboardBinding = decision.scene_bindings.find((token) =>
        token.startsWith('storyboard:')
      );
      const storyboardId = storyboardBinding?.slice('storyboard:'.length);
      if (!storyboardId || !entry.scene_ids.includes(storyboardId)) {
        violations.push({
          code: 'FAIL_DECISION_REFERENCE',
          message: `Decision ${decisionId} must belong to a scene in ${entry.bundle_id}`,
          field: `${entry.bundle_id}.character_decisions`,
        });
      }
    }

    for (const storyboardId of entry.scene_ids) {
      const sceneOrder = Number(storyboardId.split('-').pop());
      const expectedDecisions = getCharacterDecisionSeedLibrary().filter((decision) =>
        decision.scene_bindings.some(
          (token) => token === `segment:${String(sceneOrder).padStart(2, '0')}`
        )
      );
      for (const decision of expectedDecisions) {
        if (!entry.character_decisions.includes(decision.decision_id)) {
          violations.push({
            code: 'FAIL_DECISION_REFERENCE',
            message: `Bundle ${entry.bundle_id} missing decision ${decision.decision_id}`,
            field: `${entry.bundle_id}.character_decisions`,
          });
        }
      }
    }
  }

  return violations;
}

function auditWorldReference(entries: FiveShotBundleEntry[]): FiveShotBundleViolation[] {
  const violations: FiveShotBundleViolation[] = [];
  const world = getWorldContinuityById(WORLD_CONTINUITY_WORLD_ID);

  if (!world) {
    violations.push({
      code: 'FAIL_WORLD_REFERENCE',
      message: `Missing world continuity ${WORLD_CONTINUITY_WORLD_ID}`,
      field: WORLD_CONTINUITY_WORLD_ID,
    });
  }

  for (const entry of entries) {
    if (entry.world_id !== WORLD_CONTINUITY_WORLD_ID) {
      violations.push({
        code: 'FAIL_WORLD_REFERENCE',
        message: `world_id must be ${WORLD_CONTINUITY_WORLD_ID}`,
        field: `${entry.bundle_id}.world_id`,
      });
    }

    if (!entry.keywords.includes(`world:${WORLD_CONTINUITY_WORLD_ID}`)) {
      violations.push({
        code: 'FAIL_WORLD_REFERENCE',
        message: 'keywords must reference world continuity',
        field: `${entry.bundle_id}.keywords`,
      });
    }

    if (!entry.keywords.includes(WORLD_DNA_PRIORITY_LAW)) {
      violations.push({
        code: 'FAIL_WORLD_REFERENCE',
        message: 'keywords must include WORLD_DNA_PRIORITY_LAW',
        field: `${entry.bundle_id}.keywords`,
      });
    }

    if (!entry.keywords.includes(`default-world:${DEFAULT_WORLD_SETTING.replace(/\s+/g, '-')}`)) {
      violations.push({
        code: 'FAIL_WORLD_REFERENCE',
        message: 'keywords must preserve default Mediterranean harbor world',
        field: `${entry.bundle_id}.keywords`,
      });
    }

    if (!entry.keywords.includes('world-preservation:no-modern-transport')) {
      violations.push({
        code: 'FAIL_WORLD_REFERENCE',
        message: 'keywords must forbid modern transport',
        field: `${entry.bundle_id}.keywords`,
      });
    }
  }

  return violations;
}

function auditLocationReference(entries: FiveShotBundleEntry[]): FiveShotBundleViolation[] {
  const violations: FiveShotBundleViolation[] = [];
  const world = getWorldContinuityById(WORLD_CONTINUITY_WORLD_ID);

  for (const entry of entries) {
    const location = getLocationContinuityById(entry.location_id);
    if (!location) {
      violations.push({
        code: 'FAIL_LOCATION_REFERENCE',
        message: `Unknown location_id ${entry.location_id} on ${entry.bundle_id}`,
        field: `${entry.bundle_id}.location_id`,
      });
      continue;
    }

    if (!entry.keywords.includes(`location:${entry.location_id}`)) {
      violations.push({
        code: 'FAIL_LOCATION_REFERENCE',
        message: 'keywords must reference bundle location',
        field: `${entry.bundle_id}.keywords`,
      });
    }

    if (world && !world.location_continuity_ids.includes(entry.location_id)) {
      violations.push({
        code: 'FAIL_LOCATION_REFERENCE',
        message: `location_id must exist in world continuity on ${entry.bundle_id}`,
        field: `${entry.bundle_id}.location_id`,
      });
    }
  }

  return violations;
}

function auditOrchestrationInKeywords(entries: FiveShotBundleEntry[]): FiveShotBundleViolation[] {
  const violations: FiveShotBundleViolation[] = [];
  const orchestration = getStoryOrchestrationById(STORY_ORCHESTRATION_ID);
  if (!orchestration) {
    violations.push({
      code: 'FAIL_SCENE_REFERENCE',
      message: `Missing story orchestration ${STORY_ORCHESTRATION_ID}`,
      field: STORY_ORCHESTRATION_ID,
    });
  }

  for (const entry of entries) {
    if (!entry.keywords.includes(`orchestration:${STORY_ORCHESTRATION_ID}`)) {
      violations.push({
        code: 'FAIL_SCENE_REFERENCE',
        message: 'keywords must reference story orchestration',
        field: `${entry.bundle_id}.keywords`,
      });
    }
  }

  return violations;
}

function auditCameraProgression(entries: FiveShotBundleEntry[]): FiveShotBundleViolation[] {
  const violations: FiveShotBundleViolation[] = [];

  for (const entry of entries) {
    if (entry.camera_progression.length !== FIVE_SHOT_BUNDLE_SIZE) {
      violations.push({
        code: 'FAIL_CAMERA_PROGRESSION',
        message: `camera_progression must contain ${FIVE_SHOT_BUNDLE_SIZE} shots`,
        field: `${entry.bundle_id}.camera_progression`,
      });
      continue;
    }

    const cameraSignatures = new Set<string>();
    const gazes = new Set<string>();

    for (const [index, token] of entry.camera_progression.entries()) {
      const parsed = parseCameraProgressionToken(token);
      if (!parsed) {
        violations.push({
          code: 'FAIL_CAMERA_PROGRESSION',
          message: `Invalid camera_progression token on ${entry.bundle_id}`,
          field: `${entry.bundle_id}.camera_progression`,
        });
        continue;
      }

      if (parsed.role !== BUNDLE_SHOT_ROLES[index]) {
        violations.push({
          code: 'FAIL_CAMERA_PROGRESSION',
          message: `camera_progression role mismatch at index ${index} on ${entry.bundle_id}`,
          field: `${entry.bundle_id}.camera_progression`,
        });
      }

      const signature = `${parsed.cameraAngle}|${parsed.bundleCameraDistance}|${parsed.primaryShot}`;
      if (cameraSignatures.has(signature)) {
        violations.push({
          code: 'FAIL_CAMERA_PROGRESSION',
          message: `Duplicate camera angle-distance signature in ${entry.bundle_id}`,
          field: `${entry.bundle_id}.camera_progression`,
        });
      }
      if (gazes.has(parsed.gazeDirection)) {
        violations.push({
          code: 'FAIL_CAMERA_PROGRESSION',
          message: `Duplicate gaze direction in ${entry.bundle_id}`,
          field: `${entry.bundle_id}.camera_progression`,
        });
      }

      cameraSignatures.add(signature);
      gazes.add(parsed.gazeDirection);

      const storyboardId = entry.scene_ids[index];
      const acting = getImageActingCameraById(`IAC-${storyboardId}`);
      if (acting && acting.camera_distance !== parsed.cameraDistance) {
        violations.push({
          code: 'FAIL_CAMERA_PROGRESSION',
          message: `camera_progression must match acting grammar on ${storyboardId}`,
          field: `${entry.bundle_id}.camera_progression`,
        });
      }
    }
  }

  return violations;
}

function auditActingProgression(entries: FiveShotBundleEntry[]): FiveShotBundleViolation[] {
  const violations: FiveShotBundleViolation[] = [];

  for (const entry of entries) {
    if (entry.acting_progression.length !== FIVE_SHOT_BUNDLE_SIZE) {
      violations.push({
        code: 'FAIL_ACTING_PROGRESSION',
        message: `acting_progression must contain ${FIVE_SHOT_BUNDLE_SIZE} beats`,
        field: `${entry.bundle_id}.acting_progression`,
      });
      continue;
    }

    const intents = new Set<string>();
    const poses = new Set<string>();

    for (const [index, token] of entry.acting_progression.entries()) {
      const rolePrefix = `${BUNDLE_SHOT_ROLES[index]}:`;
      if (!token.startsWith(rolePrefix)) {
        violations.push({
          code: 'FAIL_ACTING_PROGRESSION',
          message: `acting_progression must declare role prefix on ${entry.bundle_id}`,
          field: `${entry.bundle_id}.acting_progression`,
        });
      }

      const intent = token.slice(rolePrefix.length);
      if (intents.has(intent)) {
        violations.push({
          code: 'FAIL_ACTING_PROGRESSION',
          message: `Duplicate acting intent in ${entry.bundle_id}`,
          field: `${entry.bundle_id}.acting_progression`,
        });
      }
      intents.add(intent);

      const storyboardId = entry.scene_ids[index];
      const acting = getImageActingCameraById(`IAC-${storyboardId}`);
      if (acting) {
        if (acting.acting_intent !== intent) {
          violations.push({
            code: 'FAIL_ACTING_PROGRESSION',
            message: `acting_progression must match acting grammar on ${storyboardId}`,
            field: `${entry.bundle_id}.acting_progression`,
          });
        }
        if (poses.has(acting.body_action)) {
          violations.push({
            code: 'FAIL_ACTING_PROGRESSION',
            message: `Duplicate body action pose in ${entry.bundle_id}`,
            field: `${entry.bundle_id}.acting_progression`,
          });
        }
        poses.add(acting.body_action);
      }
    }
  }

  return violations;
}

function auditEmotionalProgression(entries: FiveShotBundleEntry[]): FiveShotBundleViolation[] {
  const violations: FiveShotBundleViolation[] = [];

  for (const entry of entries) {
    if (entry.emotional_progression.length !== FIVE_SHOT_BUNDLE_SIZE) {
      violations.push({
        code: 'FAIL_EMOTIONAL_PROGRESSION',
        message: `emotional_progression must contain ${FIVE_SHOT_BUNDLE_SIZE} beats`,
        field: `${entry.bundle_id}.emotional_progression`,
      });
      continue;
    }

    const rolesSeen = new Set<string>();

    for (const [index, token] of entry.emotional_progression.entries()) {
      const role = BUNDLE_SHOT_ROLES[index];
      if (!token.startsWith(`${role}:`)) {
        violations.push({
          code: 'FAIL_EMOTIONAL_PROGRESSION',
          message: `emotional_progression role mismatch at index ${index} on ${entry.bundle_id}`,
          field: `${entry.bundle_id}.emotional_progression`,
        });
      }
      rolesSeen.add(role);
    }

    if (rolesSeen.size !== FIVE_SHOT_BUNDLE_SIZE) {
      violations.push({
        code: 'FAIL_EMOTIONAL_PROGRESSION',
        message: `emotional_progression must cover all bundle roles on ${entry.bundle_id}`,
        field: `${entry.bundle_id}.emotional_progression`,
      });
    }

    if (!entry.emotional_progression.some((token) => token.startsWith('emotional_change:'))) {
      violations.push({
        code: 'FAIL_EMOTIONAL_PROGRESSION',
        message: `Bundle must include emotional_change progression on ${entry.bundle_id}`,
        field: `${entry.bundle_id}.emotional_progression`,
      });
    }
  }

  return violations;
}

function auditWorldDnaViolation(entries: FiveShotBundleEntry[]): FiveShotBundleViolation[] {
  const violations: FiveShotBundleViolation[] = [];

  for (const entry of entries) {
    const serialized = JSON.stringify(entry).toLowerCase();
    const forbidden = containsForbiddenWorldToken(serialized);
    if (forbidden) {
      violations.push({
        code: 'FAIL_WORLD_DNA_VIOLATION',
        message: `Forbidden world token "${forbidden}" found on ${entry.bundle_id}`,
        field: `${entry.bundle_id}`,
      });
    }

    for (const storyboardId of entry.scene_ids) {
      const scene = getStoryboardSceneSeedLibrary().find(
        (item) => item.storyboard_id === storyboardId
      );
      if (!scene) continue;

      const anchors = entry.scene_ids.map((id) => {
        const sceneEntry = getStoryboardSceneSeedLibrary().find((item) => item.storyboard_id === id);
        return sceneEntry ? getPrimaryDailyLifeAnchor(sceneEntry) : '';
      });
      const duplicateAnchor = anchors.filter(
        (anchor, index) => anchor && anchors.indexOf(anchor) !== index
      );
      if (duplicateAnchor.length > 0) {
        violations.push({
          code: 'FAIL_WORLD_DNA_VIOLATION',
          message: `Duplicate daily_life_anchor within bundle ${entry.bundle_id}`,
          field: `${entry.bundle_id}.scene_ids`,
        });
      }
    }
  }

  return violations;
}

function auditDuplicateBundle(entries: FiveShotBundleEntry[]): FiveShotBundleViolation[] {
  const violations: FiveShotBundleViolation[] = [];

  for (const bundleId of findDuplicateBundleIds(entries.map((entry) => entry.bundle_id))) {
    violations.push({
      code: 'FAIL_DUPLICATE_BUNDLE',
      message: `Duplicate bundle_id detected: ${bundleId}`,
      field: 'bundle_id',
    });
  }

  return violations;
}

function primaryFailure(violations: FiveShotBundleViolation[]): FiveShotBundleAuditResult {
  const priority: FiveShotBundleAuditResult[] = [
    'FAIL_BUNDLE_COMPLETENESS',
    'FAIL_DUPLICATE_BUNDLE',
    'FAIL_SCENE_REFERENCE',
    'FAIL_WORLD_DNA_VIOLATION',
    'FAIL_DECISION_REFERENCE',
    'FAIL_WORLD_REFERENCE',
    'FAIL_LOCATION_REFERENCE',
    'FAIL_EMOTIONAL_PROGRESSION',
    'FAIL_ACTING_PROGRESSION',
    'FAIL_CAMERA_PROGRESSION',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditFiveShotBundle(projectRoot: string): FiveShotBundleViolation[] {
  void projectRoot;
  const entries = getFiveShotBundleSeedLibrary();
  const violations: FiveShotBundleViolation[] = [];

  violations.push(...auditBundleCompleteness(entries));
  violations.push(...auditDuplicateBundle(entries));
  violations.push(...auditSceneReference(entries));
  violations.push(...auditOrchestrationInKeywords(entries));
  violations.push(...auditWorldDnaViolation(entries));
  violations.push(...auditDecisionReference(entries));
  violations.push(...auditWorldReference(entries));
  violations.push(...auditLocationReference(entries));
  violations.push(...auditEmotionalProgression(entries));
  violations.push(...auditActingProgression(entries));
  violations.push(...auditCameraProgression(entries));

  return violations;
}

export function writeFiveShotBundlePreview(
  projectRoot: string,
  preview: FiveShotBundlePreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeFiveShotBundleReport(
  projectRoot: string,
  report: FiveShotBundleReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runFiveShotBundleAudit(projectRoot: string): FiveShotBundleReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditFiveShotBundle(projectRoot);

  const preview = buildFiveShotBundlePreview();
  if (preview.layer_version !== FIVE_SHOT_BUNDLE_VERSION) {
    violations.push({
      code: 'FAIL_BUNDLE_COMPLETENESS',
      message: 'Preview layer_version mismatch',
      field: 'layer_version',
    });
  }

  if (preview.song_master_id !== FIVE_SHOT_BUNDLE_SONG_MASTER_ID) {
    violations.push({
      code: 'FAIL_BUNDLE_COMPLETENESS',
      message: 'Preview song_master_id mismatch',
      field: 'song_master_id',
    });
  }

  writeFiveShotBundlePreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: FiveShotBundleReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeFiveShotBundleReport(projectRoot, report);
  return report;
}
