import fs from 'node:fs';
import path from 'node:path';
import { getPromptPackPairSeedLibrary } from './promptPackPairingDefinitions.js';
import { getStoryboardSceneSeedLibrary } from './storyboardLayerDefinitions.js';
import {
  CONTINUITY_SCORE_MAX,
  CONTINUITY_SCORE_MIN,
  LOCATION_CONTINUITY_SEED_COUNT,
  LOCATION_CONTINUITY_SONG_MASTER_ID,
  LOCATION_CONTINUITY_VERSION,
  REQUIRED_LOCATION_CONTINUITY_FIELDS,
  SEED_LOCATION_IDS,
  buildLocationContinuityPreview,
  findDuplicateLocationIds,
  getLocationContinuityById,
  getLocationContinuitySeedLibrary,
  getLocationsForStoryboardScene,
  getPromptPackPairByStoryboardId,
  getStoryboardSceneById,
  isValidLocationId,
  type LocationContinuityEntry,
  type LocationContinuityPreview,
  type RequiredLocationContinuityField,
} from './locationContinuityDefinitions.js';

export type LocationContinuityAuditResult =
  | 'PASS'
  | 'FAIL_LOCATION_COMPLETENESS'
  | 'FAIL_LOCATION_REFERENCE'
  | 'FAIL_ENVIRONMENT_ANCHOR'
  | 'FAIL_SCENE_REFERENCE'
  | 'FAIL_DUPLICATE_LOCATION'
  | 'FAIL_CONTINUITY_SCORE';

export interface LocationContinuityViolation {
  code: LocationContinuityAuditResult;
  message: string;
  field?: string;
}

export interface LocationContinuityReport {
  auditTimestamp: string;
  auditResult: LocationContinuityAuditResult;
  violations: LocationContinuityViolation[];
}

const PREVIEW_FILE = 'location-continuity-preview.json';
const REPORT_FILE = 'location-continuity-report.json';

const STORYBOARD_IDS = new Set(
  getStoryboardSceneSeedLibrary().map((scene) => scene.storyboard_id)
);

const PAIR_IDS = new Set(getPromptPackPairSeedLibrary().map((pair) => pair.pair_id));

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

function auditLocationCompleteness(
  entries: LocationContinuityEntry[]
): LocationContinuityViolation[] {
  const violations: LocationContinuityViolation[] = [];

  if (entries.length !== LOCATION_CONTINUITY_SEED_COUNT) {
    violations.push({
      code: 'FAIL_LOCATION_COMPLETENESS',
      message: `Location continuity layer must contain exactly ${LOCATION_CONTINUITY_SEED_COUNT} entries for ${LOCATION_CONTINUITY_SONG_MASTER_ID}`,
      field: 'seed_location_continuity.length',
    });
  }

  for (const entry of entries) {
    for (const field of REQUIRED_LOCATION_CONTINUITY_FIELDS) {
      const value = entry[field as RequiredLocationContinuityField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_LOCATION_COMPLETENESS',
          message: `Missing required field ${field} on location ${entry.location_id}`,
          field: `${entry.location_id}.${field}`,
        });
        continue;
      }

      if (
        field === 'environment_anchor' ||
        field === 'architecture_anchor' ||
        field === 'lighting_anchor' ||
        field === 'weather_anchor' ||
        field === 'color_anchor' ||
        field === 'scene_references'
      ) {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_LOCATION_COMPLETENESS',
            message: `Field ${field} must be a non-empty string array on location ${entry.location_id}`,
            field: `${entry.location_id}.${field}`,
          });
        }
        continue;
      }

      if (field === 'continuity_score') {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          violations.push({
            code: 'FAIL_LOCATION_COMPLETENESS',
            message: `Field continuity_score must be an integer on location ${entry.location_id}`,
            field: `${entry.location_id}.continuity_score`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_LOCATION_COMPLETENESS',
          message: `Field ${field} must be a non-empty string on location ${entry.location_id}`,
          field: `${entry.location_id}.${field}`,
        });
      }
    }
  }

  for (const locationId of SEED_LOCATION_IDS) {
    if (!entries.some((entry) => entry.location_id === locationId)) {
      violations.push({
        code: 'FAIL_LOCATION_COMPLETENESS',
        message: `Missing location continuity entry for ${locationId}`,
        field: locationId,
      });
    }
  }

  return violations;
}

function auditLocationReference(entries: LocationContinuityEntry[]): LocationContinuityViolation[] {
  const violations: LocationContinuityViolation[] = [];

  for (const entry of entries) {
    if (!isValidLocationId(entry.location_id)) {
      violations.push({
        code: 'FAIL_LOCATION_REFERENCE',
        message: `Invalid location_id on ${entry.location_id}`,
        field: `${entry.location_id}.location_id`,
      });
    }

    if (!entry.location_name.trim()) {
      violations.push({
        code: 'FAIL_LOCATION_REFERENCE',
        message: `location_name must be non-empty on ${entry.location_id}`,
        field: `${entry.location_id}.location_name`,
      });
    }

    const profile = getLocationContinuityById(entry.location_id);
    if (profile && profile.location_name !== entry.location_name) {
      violations.push({
        code: 'FAIL_LOCATION_REFERENCE',
        message: `location_name must match seed profile on ${entry.location_id}`,
        field: `${entry.location_id}.location_name`,
      });
    }
  }

  return violations;
}

function auditEnvironmentAnchor(entries: LocationContinuityEntry[]): LocationContinuityViolation[] {
  const violations: LocationContinuityViolation[] = [];

  for (const entry of entries) {
    if (!entry.environment_anchor.includes(entry.location_id)) {
      violations.push({
        code: 'FAIL_ENVIRONMENT_ANCHOR',
        message: `environment_anchor must include location_id token on ${entry.location_id}`,
        field: `${entry.location_id}.environment_anchor`,
      });
    }

    if (entry.environment_anchor.length < 3) {
      violations.push({
        code: 'FAIL_ENVIRONMENT_ANCHOR',
        message: `environment_anchor must contain at least three tokens on ${entry.location_id}`,
        field: `${entry.location_id}.environment_anchor`,
      });
    }

    for (const anchorField of [
      'architecture_anchor',
      'lighting_anchor',
      'weather_anchor',
      'color_anchor',
    ] as const) {
      if (entry[anchorField].length < 3) {
        violations.push({
          code: 'FAIL_ENVIRONMENT_ANCHOR',
          message: `${anchorField} must contain at least three tokens on ${entry.location_id}`,
          field: `${entry.location_id}.${anchorField}`,
        });
      }
    }
  }

  return violations;
}

function auditSceneReference(entries: LocationContinuityEntry[]): LocationContinuityViolation[] {
  const violations: LocationContinuityViolation[] = [];

  for (const entry of entries) {
    const pairReferences = entry.scene_references.filter((reference) =>
      reference.startsWith('pair:')
    );
    const storyboardReferences = entry.scene_references.filter((reference) =>
      reference.startsWith('storyboard:')
    );

    if (pairReferences.length === 0) {
      violations.push({
        code: 'FAIL_SCENE_REFERENCE',
        message: `scene_references must include prompt pair tokens on ${entry.location_id}`,
        field: `${entry.location_id}.scene_references`,
      });
    }

    if (storyboardReferences.length === 0) {
      violations.push({
        code: 'FAIL_SCENE_REFERENCE',
        message: `scene_references must include storyboard tokens on ${entry.location_id}`,
        field: `${entry.location_id}.scene_references`,
      });
    }

    if (pairReferences.length !== storyboardReferences.length) {
      violations.push({
        code: 'FAIL_SCENE_REFERENCE',
        message: `scene_references must pair storyboard and prompt pair tokens on ${entry.location_id}`,
        field: `${entry.location_id}.scene_references`,
      });
    }

    for (const reference of entry.scene_references) {
      if (reference.startsWith('storyboard:')) {
        const storyboardId = reference.slice('storyboard:'.length);
        if (!STORYBOARD_IDS.has(storyboardId)) {
          violations.push({
            code: 'FAIL_SCENE_REFERENCE',
            message: `Unknown storyboard reference "${storyboardId}" on ${entry.location_id}`,
            field: `${entry.location_id}.scene_references`,
          });
          continue;
        }

        const locations = getLocationsForStoryboardScene(storyboardId);
        if (!locations.includes(entry.location_id)) {
          violations.push({
            code: 'FAIL_SCENE_REFERENCE',
            message: `Storyboard ${storyboardId} is not mapped to ${entry.location_id}`,
            field: `${entry.location_id}.scene_references`,
          });
        }
      }

      if (reference.startsWith('pair:')) {
        const pairId = reference.slice('pair:'.length);
        if (!PAIR_IDS.has(pairId)) {
          violations.push({
            code: 'FAIL_SCENE_REFERENCE',
            message: `Unknown prompt pair reference "${pairId}" on ${entry.location_id}`,
            field: `${entry.location_id}.scene_references`,
          });
          continue;
        }

        const storyboardId = pairId.replace(/^PAIR-/, '');
        const scene = getStoryboardSceneById(storyboardId);
        const pair = getPromptPackPairByStoryboardId(storyboardId);
        if (!scene || !pair) continue;

        if (pair.pair_id !== pairId) {
          violations.push({
            code: 'FAIL_SCENE_REFERENCE',
            message: `Prompt pair reference mismatch on ${entry.location_id}`,
            field: `${entry.location_id}.scene_references`,
          });
        }

        const storyboardToken = `storyboard:${storyboardId}`;
        if (!entry.scene_references.includes(storyboardToken)) {
          violations.push({
            code: 'FAIL_SCENE_REFERENCE',
            message: `Missing matching storyboard token for ${pairId} on ${entry.location_id}`,
            field: `${entry.location_id}.scene_references`,
          });
        }
      }
    }

    const duplicateReferences = entry.scene_references.filter(
      (reference, index) => entry.scene_references.indexOf(reference) !== index
    );
    for (const reference of [...new Set(duplicateReferences)]) {
      violations.push({
        code: 'FAIL_SCENE_REFERENCE',
        message: `Duplicate scene reference ${reference} on ${entry.location_id}`,
        field: `${entry.location_id}.scene_references`,
      });
    }
  }

  for (const storyboardId of STORYBOARD_IDS) {
    const locations = getLocationsForStoryboardScene(storyboardId);
    for (const locationId of locations) {
      const entry = entries.find((item) => item.location_id === locationId);
      if (!entry) continue;

      const pair = getPromptPackPairByStoryboardId(storyboardId);
      if (!pair) continue;

      const pairToken = `pair:${pair.pair_id}`;
      const storyboardToken = `storyboard:${storyboardId}`;

      if (!entry.scene_references.includes(pairToken)) {
        violations.push({
          code: 'FAIL_SCENE_REFERENCE',
          message: `Location ${locationId} must reference ${pairToken}`,
          field: `${entry.location_id}.scene_references`,
        });
      }

      if (!entry.scene_references.includes(storyboardToken)) {
        violations.push({
          code: 'FAIL_SCENE_REFERENCE',
          message: `Location ${locationId} must reference ${storyboardToken}`,
          field: `${entry.location_id}.scene_references`,
        });
      }
    }
  }

  return violations;
}

function auditDuplicateLocation(entries: LocationContinuityEntry[]): LocationContinuityViolation[] {
  const violations: LocationContinuityViolation[] = [];

  for (const locationId of findDuplicateLocationIds(
    entries.map((entry) => entry.location_id)
  )) {
    violations.push({
      code: 'FAIL_DUPLICATE_LOCATION',
      message: `Duplicate location_id detected: ${locationId}`,
      field: 'location_id',
    });
  }

  const locationNames = entries.map((entry) => entry.location_name);
  const duplicateNames = locationNames.filter(
    (name, index) => locationNames.indexOf(name) !== index
  );
  for (const name of [...new Set(duplicateNames)]) {
    violations.push({
      code: 'FAIL_DUPLICATE_LOCATION',
      message: `Duplicate location_name detected: ${name}`,
      field: 'location_name',
    });
  }

  return violations;
}

function auditContinuityScore(entries: LocationContinuityEntry[]): LocationContinuityViolation[] {
  const violations: LocationContinuityViolation[] = [];
  const pairCount = getPromptPackPairSeedLibrary().length;

  for (const entry of entries) {
    if (entry.continuity_score < CONTINUITY_SCORE_MIN || entry.continuity_score > CONTINUITY_SCORE_MAX) {
      violations.push({
        code: 'FAIL_CONTINUITY_SCORE',
        message: `continuity_score must be between ${CONTINUITY_SCORE_MIN} and ${CONTINUITY_SCORE_MAX} on ${entry.location_id}`,
        field: `${entry.location_id}.continuity_score`,
      });
    }

    const referencedPairCount = entry.scene_references.filter((reference) =>
      reference.startsWith('pair:')
    ).length;

    const expectedScore = pairCount
      ? Math.min(
          CONTINUITY_SCORE_MAX,
          Math.max(
            CONTINUITY_SCORE_MIN,
            Math.round((referencedPairCount / pairCount) * CONTINUITY_SCORE_MAX)
          )
        )
      : CONTINUITY_SCORE_MIN;

    if (entry.continuity_score !== expectedScore) {
      violations.push({
        code: 'FAIL_CONTINUITY_SCORE',
        message: `continuity_score must match scene coverage ratio on ${entry.location_id}`,
        field: `${entry.location_id}.continuity_score`,
      });
    }
  }

  return violations;
}

function primaryFailure(
  violations: LocationContinuityViolation[]
): LocationContinuityAuditResult {
  const priority: LocationContinuityAuditResult[] = [
    'FAIL_LOCATION_COMPLETENESS',
    'FAIL_DUPLICATE_LOCATION',
    'FAIL_LOCATION_REFERENCE',
    'FAIL_ENVIRONMENT_ANCHOR',
    'FAIL_SCENE_REFERENCE',
    'FAIL_CONTINUITY_SCORE',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditLocationContinuity(projectRoot: string): LocationContinuityViolation[] {
  void projectRoot;
  const entries = getLocationContinuitySeedLibrary();
  const violations: LocationContinuityViolation[] = [];

  violations.push(...auditLocationCompleteness(entries));
  violations.push(...auditDuplicateLocation(entries));
  violations.push(...auditLocationReference(entries));
  violations.push(...auditEnvironmentAnchor(entries));
  violations.push(...auditSceneReference(entries));
  violations.push(...auditContinuityScore(entries));

  return violations;
}

export function writeLocationContinuityPreview(
  projectRoot: string,
  preview: LocationContinuityPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeLocationContinuityReport(
  projectRoot: string,
  report: LocationContinuityReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runLocationContinuityAudit(projectRoot: string): LocationContinuityReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditLocationContinuity(projectRoot);

  const preview = buildLocationContinuityPreview();
  if (preview.layer_version !== LOCATION_CONTINUITY_VERSION) {
    violations.push({
      code: 'FAIL_LOCATION_COMPLETENESS',
      message: 'Preview layer_version mismatch',
      field: 'layer_version',
    });
  }

  writeLocationContinuityPreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: LocationContinuityReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeLocationContinuityReport(projectRoot, report);
  return report;
}
