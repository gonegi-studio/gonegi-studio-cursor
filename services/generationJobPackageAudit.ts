import fs from 'node:fs';
import path from 'node:path';
import {
  getCharacterContinuitySeedLibrary,
} from './characterContinuityDefinitions.js';
import {
  getImagePromptPackSeedLibrary,
} from './imagePromptPackDefinitions.js';
import {
  getLocationContinuitySeedLibrary,
} from './locationContinuityDefinitions.js';
import {
  getPromptPackPairSeedLibrary,
} from './promptPackPairingDefinitions.js';
import {
  STORYBOARD_SEED_COUNT,
  getStoryboardSceneSeedLibrary,
} from './storyboardLayerDefinitions.js';
import {
  getVideoPromptPackSeedLibrary,
} from './videoPromptPackDefinitions.js';
import {
  getWorldContinuitySeedLibrary,
  WORLD_CONTINUITY_WORLD_ID,
} from './worldContinuityDefinitions.js';
import {
  GENERATION_JOB_PACKAGE_ID,
  GENERATION_JOB_PACKAGE_SEED_COUNT,
  GENERATION_JOB_PACKAGE_SONG_MASTER_ID,
  GENERATION_JOB_PACKAGE_VERSION,
  READINESS_SCORE_MAX,
  READINESS_SCORE_MIN,
  REQUIRED_GENERATION_JOB_PACKAGE_FIELDS,
  buildGenerationJobPackagePreview,
  findDuplicateJobPackageIds,
  getExpectedGenerationSequenceLength,
  getExpectedReadinessScore,
  getGenerationJobPackageSeedLibrary,
  type GenerationJobPackageEntry,
  type GenerationJobPackagePreview,
  type RequiredGenerationJobPackageField,
} from './generationJobPackageDefinitions.js';

export type GenerationJobPackageAuditResult =
  | 'PASS'
  | 'FAIL_JOB_COMPLETENESS'
  | 'FAIL_WORLD_REFERENCE'
  | 'FAIL_CHARACTER_REFERENCE'
  | 'FAIL_LOCATION_REFERENCE'
  | 'FAIL_STORYBOARD_REFERENCE'
  | 'FAIL_PROMPT_PACK_REFERENCE'
  | 'FAIL_SEQUENCE_INTEGRITY'
  | 'FAIL_READINESS_SCORE'
  | 'FAIL_DUPLICATE_JOB';

export interface GenerationJobPackageViolation {
  code: GenerationJobPackageAuditResult;
  message: string;
  field?: string;
}

export interface GenerationJobPackageReport {
  auditTimestamp: string;
  auditResult: GenerationJobPackageAuditResult;
  violations: GenerationJobPackageViolation[];
}

const PREVIEW_FILE = 'generation-job-package-preview.json';
const REPORT_FILE = 'generation-job-package-report.json';

const WORLD_IDS = new Set(getWorldContinuitySeedLibrary().map((entry) => entry.world_id));
const CHARACTER_CONTINUITY_IDS = new Set(
  getCharacterContinuitySeedLibrary().map((entry) => entry.continuity_id)
);
const LOCATION_CONTINUITY_IDS = new Set<string>(
  getLocationContinuitySeedLibrary().map((entry) => entry.location_id)
);
const STORYBOARD_IDS = new Set(
  getStoryboardSceneSeedLibrary().map((scene) => scene.storyboard_id)
);
const IMAGE_PACK_IDS = new Set(
  getImagePromptPackSeedLibrary().map((pack) => pack.prompt_pack_id)
);
const VIDEO_PACK_IDS = new Set(
  getVideoPromptPackSeedLibrary().map((pack) => pack.video_prompt_pack_id)
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

function auditJobCompleteness(
  entries: GenerationJobPackageEntry[]
): GenerationJobPackageViolation[] {
  const violations: GenerationJobPackageViolation[] = [];

  if (entries.length !== GENERATION_JOB_PACKAGE_SEED_COUNT) {
    violations.push({
      code: 'FAIL_JOB_COMPLETENESS',
      message: `Generation job package layer must contain exactly ${GENERATION_JOB_PACKAGE_SEED_COUNT} job for ${GENERATION_JOB_PACKAGE_SONG_MASTER_ID}`,
      field: 'seed_generation_job_packages.length',
    });
  }

  for (const entry of entries) {
    for (const field of REQUIRED_GENERATION_JOB_PACKAGE_FIELDS) {
      const value = entry[field as RequiredGenerationJobPackageField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_JOB_COMPLETENESS',
          message: `Missing required field ${field} on job ${entry.job_package_id}`,
          field: `${entry.job_package_id}.${field}`,
        });
        continue;
      }

      if (
        field === 'character_continuity_ids' ||
        field === 'location_continuity_ids' ||
        field === 'storyboard_ids' ||
        field === 'image_prompt_pack_ids' ||
        field === 'video_prompt_pack_ids' ||
        field === 'prompt_pair_ids' ||
        field === 'generation_sequence'
      ) {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_JOB_COMPLETENESS',
            message: `Field ${field} must be a non-empty string array on job ${entry.job_package_id}`,
            field: `${entry.job_package_id}.${field}`,
          });
        }
        continue;
      }

      if (field === 'readiness_score') {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          violations.push({
            code: 'FAIL_JOB_COMPLETENESS',
            message: `Field readiness_score must be an integer on job ${entry.job_package_id}`,
            field: `${entry.job_package_id}.readiness_score`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_JOB_COMPLETENESS',
          message: `Field ${field} must be a non-empty string on job ${entry.job_package_id}`,
          field: `${entry.job_package_id}.${field}`,
        });
      }
    }

    if (entry.job_package_id !== GENERATION_JOB_PACKAGE_ID) {
      violations.push({
        code: 'FAIL_JOB_COMPLETENESS',
        message: `job_package_id must be ${GENERATION_JOB_PACKAGE_ID}`,
        field: `${entry.job_package_id}.job_package_id`,
      });
    }

    if (entry.song_master_id !== GENERATION_JOB_PACKAGE_SONG_MASTER_ID) {
      violations.push({
        code: 'FAIL_JOB_COMPLETENESS',
        message: `song_master_id must be ${GENERATION_JOB_PACKAGE_SONG_MASTER_ID}`,
        field: `${entry.job_package_id}.song_master_id`,
      });
    }
  }

  if (!entries.some((entry) => entry.job_package_id === GENERATION_JOB_PACKAGE_ID)) {
    violations.push({
      code: 'FAIL_JOB_COMPLETENESS',
      message: `Missing generation job package ${GENERATION_JOB_PACKAGE_ID}`,
      field: GENERATION_JOB_PACKAGE_ID,
    });
  }

  return violations;
}

function auditWorldReference(entries: GenerationJobPackageEntry[]): GenerationJobPackageViolation[] {
  const violations: GenerationJobPackageViolation[] = [];

  for (const entry of entries) {
    if (!WORLD_IDS.has(entry.world_id)) {
      violations.push({
        code: 'FAIL_WORLD_REFERENCE',
        message: `Unknown world_id "${entry.world_id}" on job ${entry.job_package_id}`,
        field: `${entry.job_package_id}.world_id`,
      });
    }

    if (entry.world_id !== WORLD_CONTINUITY_WORLD_ID) {
      violations.push({
        code: 'FAIL_WORLD_REFERENCE',
        message: `world_id must be ${WORLD_CONTINUITY_WORLD_ID}`,
        field: `${entry.job_package_id}.world_id`,
      });
    }

    const worldBindToken = `step:00:world-bind:${entry.world_id}`;
    if (!entry.generation_sequence.includes(worldBindToken)) {
      violations.push({
        code: 'FAIL_WORLD_REFERENCE',
        message: `generation_sequence must include ${worldBindToken}`,
        field: `${entry.job_package_id}.generation_sequence`,
      });
    }
  }

  return violations;
}

function auditCharacterReference(
  entries: GenerationJobPackageEntry[]
): GenerationJobPackageViolation[] {
  const violations: GenerationJobPackageViolation[] = [];

  for (const entry of entries) {
    for (const continuityId of CHARACTER_CONTINUITY_IDS) {
      if (!entry.character_continuity_ids.includes(continuityId)) {
        violations.push({
          code: 'FAIL_CHARACTER_REFERENCE',
          message: `character_continuity_ids must include ${continuityId}`,
          field: `${entry.job_package_id}.character_continuity_ids`,
        });
      }
    }

    for (const continuityId of entry.character_continuity_ids) {
      if (!CHARACTER_CONTINUITY_IDS.has(continuityId)) {
        violations.push({
          code: 'FAIL_CHARACTER_REFERENCE',
          message: `Unknown character continuity id "${continuityId}" on job ${entry.job_package_id}`,
          field: `${entry.job_package_id}.character_continuity_ids`,
        });
      }
    }
  }

  return violations;
}

function auditLocationReference(
  entries: GenerationJobPackageEntry[]
): GenerationJobPackageViolation[] {
  const violations: GenerationJobPackageViolation[] = [];

  for (const entry of entries) {
    for (const locationId of LOCATION_CONTINUITY_IDS) {
      if (!entry.location_continuity_ids.includes(locationId)) {
        violations.push({
          code: 'FAIL_LOCATION_REFERENCE',
          message: `location_continuity_ids must include ${locationId}`,
          field: `${entry.job_package_id}.location_continuity_ids`,
        });
      }
    }

    for (const locationId of entry.location_continuity_ids) {
      if (!LOCATION_CONTINUITY_IDS.has(locationId)) {
        violations.push({
          code: 'FAIL_LOCATION_REFERENCE',
          message: `Unknown location continuity id "${locationId}" on job ${entry.job_package_id}`,
          field: `${entry.job_package_id}.location_continuity_ids`,
        });
      }
    }
  }

  return violations;
}

function auditStoryboardReference(
  entries: GenerationJobPackageEntry[]
): GenerationJobPackageViolation[] {
  const violations: GenerationJobPackageViolation[] = [];

  for (const entry of entries) {
    if (entry.storyboard_ids.length !== STORYBOARD_SEED_COUNT) {
      violations.push({
        code: 'FAIL_STORYBOARD_REFERENCE',
        message: `storyboard_ids must contain exactly ${STORYBOARD_SEED_COUNT} scenes`,
        field: `${entry.job_package_id}.storyboard_ids`,
      });
    }

    for (const storyboardId of STORYBOARD_IDS) {
      if (!entry.storyboard_ids.includes(storyboardId)) {
        violations.push({
          code: 'FAIL_STORYBOARD_REFERENCE',
          message: `storyboard_ids must include ${storyboardId}`,
          field: `${entry.job_package_id}.storyboard_ids`,
        });
      }

      const hasStoryboardStep = entry.generation_sequence.some((step) =>
        step.includes(`:storyboard:${storyboardId}`)
      );
      if (!hasStoryboardStep) {
        violations.push({
          code: 'FAIL_STORYBOARD_REFERENCE',
          message: `generation_sequence must include storyboard step for ${storyboardId}`,
          field: `${entry.job_package_id}.generation_sequence`,
        });
      }
    }

    for (const storyboardId of entry.storyboard_ids) {
      if (!STORYBOARD_IDS.has(storyboardId)) {
        violations.push({
          code: 'FAIL_STORYBOARD_REFERENCE',
          message: `Unknown storyboard_id "${storyboardId}" on job ${entry.job_package_id}`,
          field: `${entry.job_package_id}.storyboard_ids`,
        });
      }
    }
  }

  return violations;
}

function auditPromptPackReference(
  entries: GenerationJobPackageEntry[]
): GenerationJobPackageViolation[] {
  const violations: GenerationJobPackageViolation[] = [];
  const pairs = getPromptPackPairSeedLibrary();

  for (const entry of entries) {
    if (entry.image_prompt_pack_ids.length !== STORYBOARD_SEED_COUNT) {
      violations.push({
        code: 'FAIL_PROMPT_PACK_REFERENCE',
        message: `image_prompt_pack_ids must contain exactly ${STORYBOARD_SEED_COUNT} packs`,
        field: `${entry.job_package_id}.image_prompt_pack_ids`,
      });
    }

    if (entry.video_prompt_pack_ids.length !== STORYBOARD_SEED_COUNT) {
      violations.push({
        code: 'FAIL_PROMPT_PACK_REFERENCE',
        message: `video_prompt_pack_ids must contain exactly ${STORYBOARD_SEED_COUNT} packs`,
        field: `${entry.job_package_id}.video_prompt_pack_ids`,
      });
    }

    if (entry.prompt_pair_ids.length !== STORYBOARD_SEED_COUNT) {
      violations.push({
        code: 'FAIL_PROMPT_PACK_REFERENCE',
        message: `prompt_pair_ids must contain exactly ${STORYBOARD_SEED_COUNT} pairs`,
        field: `${entry.job_package_id}.prompt_pair_ids`,
      });
    }

    for (const imagePackId of IMAGE_PACK_IDS) {
      if (!entry.image_prompt_pack_ids.includes(imagePackId)) {
        violations.push({
          code: 'FAIL_PROMPT_PACK_REFERENCE',
          message: `image_prompt_pack_ids must include ${imagePackId}`,
          field: `${entry.job_package_id}.image_prompt_pack_ids`,
        });
      }
    }

    for (const videoPackId of VIDEO_PACK_IDS) {
      if (!entry.video_prompt_pack_ids.includes(videoPackId)) {
        violations.push({
          code: 'FAIL_PROMPT_PACK_REFERENCE',
          message: `video_prompt_pack_ids must include ${videoPackId}`,
          field: `${entry.job_package_id}.video_prompt_pack_ids`,
        });
      }
    }

    for (const pairId of PAIR_IDS) {
      if (!entry.prompt_pair_ids.includes(pairId)) {
        violations.push({
          code: 'FAIL_PROMPT_PACK_REFERENCE',
          message: `prompt_pair_ids must include ${pairId}`,
          field: `${entry.job_package_id}.prompt_pair_ids`,
        });
      }
    }

    for (const pair of pairs) {
      const imageToken = `step:${String(pair.scene_order).padStart(2, '0')}:image-first:${pair.image_prompt_pack_id}`;
      const videoToken = `step:${String(pair.scene_order).padStart(2, '0')}:video-second:${pair.video_prompt_pack_id}`;
      const pairToken = `step:${String(pair.scene_order).padStart(2, '0')}:pair:${pair.pair_id}`;

      if (!entry.generation_sequence.includes(imageToken)) {
        violations.push({
          code: 'FAIL_PROMPT_PACK_REFERENCE',
          message: `generation_sequence must include ${imageToken}`,
          field: `${entry.job_package_id}.generation_sequence`,
        });
      }

      if (!entry.generation_sequence.includes(videoToken)) {
        violations.push({
          code: 'FAIL_PROMPT_PACK_REFERENCE',
          message: `generation_sequence must include ${videoToken}`,
          field: `${entry.job_package_id}.generation_sequence`,
        });
      }

      if (!entry.generation_sequence.includes(pairToken)) {
        violations.push({
          code: 'FAIL_PROMPT_PACK_REFERENCE',
          message: `generation_sequence must include ${pairToken}`,
          field: `${entry.job_package_id}.generation_sequence`,
        });
      }
    }
  }

  return violations;
}

function auditSequenceIntegrity(
  entries: GenerationJobPackageEntry[]
): GenerationJobPackageViolation[] {
  const violations: GenerationJobPackageViolation[] = [];
  const expectedLength = getExpectedGenerationSequenceLength();

  for (const entry of entries) {
    if (entry.generation_sequence.length !== expectedLength) {
      violations.push({
        code: 'FAIL_SEQUENCE_INTEGRITY',
        message: `generation_sequence must contain exactly ${expectedLength} steps`,
        field: `${entry.job_package_id}.generation_sequence`,
      });
    }

    if (!entry.generation_sequence.includes('step:00:pipeline:no-ai-studio-no-gpu')) {
      violations.push({
        code: 'FAIL_SEQUENCE_INTEGRITY',
        message: 'generation_sequence must declare no-ai-studio-no-gpu pipeline guard',
        field: `${entry.job_package_id}.generation_sequence`,
      });
    }

    for (let sceneOrder = 1; sceneOrder <= STORYBOARD_SEED_COUNT; sceneOrder += 1) {
      const order = String(sceneOrder).padStart(2, '0');
      const imageIndex = entry.generation_sequence.findIndex((step) =>
        step.startsWith(`step:${order}:image-first:`)
      );
      const videoIndex = entry.generation_sequence.findIndex((step) =>
        step.startsWith(`step:${order}:video-second:`)
      );

      if (imageIndex === -1 || videoIndex === -1) {
        violations.push({
          code: 'FAIL_SEQUENCE_INTEGRITY',
          message: `generation_sequence missing image/video steps for scene ${sceneOrder}`,
          field: `${entry.job_package_id}.generation_sequence`,
        });
        continue;
      }

      if (imageIndex >= videoIndex) {
        violations.push({
          code: 'FAIL_SEQUENCE_INTEGRITY',
          message: `image-first must precede video-second for scene ${sceneOrder}`,
          field: `${entry.job_package_id}.generation_sequence`,
        });
      }
    }
  }

  return violations;
}

function auditReadinessScore(
  entries: GenerationJobPackageEntry[]
): GenerationJobPackageViolation[] {
  const violations: GenerationJobPackageViolation[] = [];
  const expectedScore = getExpectedReadinessScore();

  for (const entry of entries) {
    if (entry.readiness_score < READINESS_SCORE_MIN || entry.readiness_score > READINESS_SCORE_MAX) {
      violations.push({
        code: 'FAIL_READINESS_SCORE',
        message: `readiness_score must be between ${READINESS_SCORE_MIN} and ${READINESS_SCORE_MAX}`,
        field: `${entry.job_package_id}.readiness_score`,
      });
    }

    if (entry.readiness_score !== expectedScore) {
      violations.push({
        code: 'FAIL_READINESS_SCORE',
        message: `readiness_score must match computed readiness on ${entry.job_package_id}`,
        field: `${entry.job_package_id}.readiness_score`,
      });
    }
  }

  return violations;
}

function auditDuplicateJob(entries: GenerationJobPackageEntry[]): GenerationJobPackageViolation[] {
  const violations: GenerationJobPackageViolation[] = [];

  for (const jobPackageId of findDuplicateJobPackageIds(
    entries.map((entry) => entry.job_package_id)
  )) {
    violations.push({
      code: 'FAIL_DUPLICATE_JOB',
      message: `Duplicate job_package_id detected: ${jobPackageId}`,
      field: 'job_package_id',
    });
  }

  return violations;
}

function primaryFailure(
  violations: GenerationJobPackageViolation[]
): GenerationJobPackageAuditResult {
  const priority: GenerationJobPackageAuditResult[] = [
    'FAIL_JOB_COMPLETENESS',
    'FAIL_DUPLICATE_JOB',
    'FAIL_WORLD_REFERENCE',
    'FAIL_CHARACTER_REFERENCE',
    'FAIL_LOCATION_REFERENCE',
    'FAIL_STORYBOARD_REFERENCE',
    'FAIL_PROMPT_PACK_REFERENCE',
    'FAIL_SEQUENCE_INTEGRITY',
    'FAIL_READINESS_SCORE',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditGenerationJobPackage(
  projectRoot: string
): GenerationJobPackageViolation[] {
  void projectRoot;
  const entries = getGenerationJobPackageSeedLibrary();
  const violations: GenerationJobPackageViolation[] = [];

  violations.push(...auditJobCompleteness(entries));
  violations.push(...auditDuplicateJob(entries));
  violations.push(...auditWorldReference(entries));
  violations.push(...auditCharacterReference(entries));
  violations.push(...auditLocationReference(entries));
  violations.push(...auditStoryboardReference(entries));
  violations.push(...auditPromptPackReference(entries));
  violations.push(...auditSequenceIntegrity(entries));
  violations.push(...auditReadinessScore(entries));

  return violations;
}

export function writeGenerationJobPackagePreview(
  projectRoot: string,
  preview: GenerationJobPackagePreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeGenerationJobPackageReport(
  projectRoot: string,
  report: GenerationJobPackageReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runGenerationJobPackageAudit(
  projectRoot: string
): GenerationJobPackageReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditGenerationJobPackage(projectRoot);

  const preview = buildGenerationJobPackagePreview();
  if (preview.layer_version !== GENERATION_JOB_PACKAGE_VERSION) {
    violations.push({
      code: 'FAIL_JOB_COMPLETENESS',
      message: 'Preview layer_version mismatch',
      field: 'layer_version',
    });
  }

  writeGenerationJobPackagePreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: GenerationJobPackageReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeGenerationJobPackageReport(projectRoot, report);
  return report;
}
