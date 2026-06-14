import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  auditCharacterContinuity,
  type CharacterContinuityAuditResult,
} from './characterContinuityAudit.js';
import {
  auditGenerationJobPackage,
  type GenerationJobPackageAuditResult,
} from './generationJobPackageAudit.js';
import {
  GENERATION_JOB_PACKAGE_ID,
  GENERATION_JOB_PACKAGE_SONG_MASTER_ID,
  getGenerationJobPackageById,
  getGenerationJobPackageSeedLibrary,
} from './generationJobPackageDefinitions.js';
import {
  auditImagePromptPack,
  type ImagePromptPackAuditResult,
} from './imagePromptPackAudit.js';
import {
  auditLocationContinuity,
  type LocationContinuityAuditResult,
} from './locationContinuityAudit.js';
import {
  auditPromptPackPairing,
  type PromptPackPairingAuditResult,
} from './promptPackPairingAudit.js';
import {
  STORYBOARD_SEED_COUNT,
  STORYBOARD_SONG_MASTER_ID,
  getStoryboardSceneSeedLibrary,
} from './storyboardLayerDefinitions.js';
import {
  auditStoryboardLayer,
  type StoryboardLayerAuditResult,
} from './storyboardLayerAudit.js';
import {
  auditVideoPromptPack,
  type VideoPromptPackAuditResult,
} from './videoPromptPackAudit.js';
import {
  auditWorldContinuity,
  type WorldContinuityAuditResult,
} from './worldContinuityAudit.js';
import { WORLD_CONTINUITY_WORLD_ID } from './worldContinuityDefinitions.js';

export const GENERATION_READINESS_VERSION = 'GENERATION-READINESS-PHASE-91-v1' as const;
export const GENERATION_READINESS_FINGERPRINT_SCHEMA_VERSION =
  'GENERATION-READINESS-FINGERPRINT-PHASE-91-v1' as const;

export type GenerationReadinessAuditResult =
  | 'PASS'
  | 'FAIL_JOB_PACKAGE'
  | 'FAIL_WORLD_CONTINUITY'
  | 'FAIL_CHARACTER_CONTINUITY'
  | 'FAIL_LOCATION_CONTINUITY'
  | 'FAIL_STORYBOARD'
  | 'FAIL_IMAGE_PROMPT_PACK'
  | 'FAIL_VIDEO_PROMPT_PACK'
  | 'FAIL_PROMPT_PAIR'
  | 'FAIL_SCENE_READINESS'
  | 'FAIL_GENERATION_TRIGGERED';

export interface GenerationReadinessViolation {
  code: GenerationReadinessAuditResult;
  message: string;
  field?: string;
}

export interface GenerationReadinessLayerStatus {
  generation_job_package: GenerationJobPackageAuditResult;
  world_continuity: WorldContinuityAuditResult;
  character_continuity: CharacterContinuityAuditResult;
  location_continuity: LocationContinuityAuditResult;
  storyboard_layer: StoryboardLayerAuditResult;
  image_prompt_pack: ImagePromptPackAuditResult;
  video_prompt_pack: VideoPromptPackAuditResult;
  prompt_pair: PromptPackPairingAuditResult;
}

export interface GenerationReadinessFingerprint {
  schemaVersion: typeof GENERATION_READINESS_FINGERPRINT_SCHEMA_VERSION;
  jobPackageId: typeof GENERATION_JOB_PACKAGE_ID;
  songMasterId: typeof GENERATION_JOB_PACKAGE_SONG_MASTER_ID;
  worldId: typeof WORLD_CONTINUITY_WORLD_ID;
  sceneCount: typeof STORYBOARD_SEED_COUNT;
  jobPackageChecksum: string;
  generationTriggered: false;
  pipelineGuard: 'no-ai-studio-no-gpu';
  layerStatus: GenerationReadinessLayerStatus;
  frozenAt: string;
}

export interface GenerationReadinessReport {
  auditTimestamp: string;
  auditResult: GenerationReadinessAuditResult;
  violations: GenerationReadinessViolation[];
  layer_status: GenerationReadinessLayerStatus;
  scene_count: number;
  scenes_ready: number;
  job_package_ready: boolean;
  image_app_input_ready: boolean;
  video_app_input_ready: boolean;
  generation_readiness_ready: boolean;
  generation_triggered: false;
}

const REPORT_FILE = 'generation-readiness-report.json';
const FINGERPRINT_FILE = 'generation-readiness-fingerprint.json';

const PIPELINE_GUARD = 'step:00:pipeline:no-ai-studio-no-gpu' as const;

const FORBIDDEN_GENERATION_TOKENS = [
  'ai-studio',
  'gpu-generate',
  'generate:image',
  'generate:video',
  'trigger:generation',
  'run:generation',
  'invoke:gpu',
] as const;

function mapLayerViolations(
  layerViolations: Array<{ code: string; message: string; field?: string }>,
  failCode: GenerationReadinessAuditResult
): GenerationReadinessViolation[] {
  return layerViolations.map((violation) => ({
    code: failCode,
    message: violation.message,
    field: violation.field,
  }));
}

function mapJobPackageViolations(
  layerViolations: Array<{ code: string; message: string; field?: string }>
): GenerationReadinessViolation[] {
  return layerViolations.map((violation) => ({
    code: 'FAIL_JOB_PACKAGE',
    message: violation.message,
    field: violation.field,
  }));
}

function summarizeAuditResult<T extends string>(
  violations: Array<{ code: T }>,
  passCode: T = 'PASS' as T
): T {
  if (violations.length === 0) return passCode;
  return violations[0].code;
}

function buildLayerStatus(projectRoot: string): GenerationReadinessLayerStatus {
  void projectRoot;
  return {
    generation_job_package: summarizeAuditResult(auditGenerationJobPackage(projectRoot)),
    world_continuity: summarizeAuditResult(auditWorldContinuity(projectRoot)),
    character_continuity: summarizeAuditResult(auditCharacterContinuity(projectRoot)),
    location_continuity: summarizeAuditResult(auditLocationContinuity(projectRoot)),
    storyboard_layer: summarizeAuditResult(auditStoryboardLayer(projectRoot)),
    image_prompt_pack: summarizeAuditResult(auditImagePromptPack(projectRoot)),
    video_prompt_pack: summarizeAuditResult(auditVideoPromptPack(projectRoot)),
    prompt_pair: summarizeAuditResult(auditPromptPackPairing(projectRoot)),
  };
}

function computeJobPackageChecksum(): string {
  const payload = JSON.stringify(getGenerationJobPackageSeedLibrary());
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function auditJobPackageLayer(
  projectRoot: string
): GenerationReadinessViolation[] {
  const violations = mapJobPackageViolations(auditGenerationJobPackage(projectRoot));

  if (!getGenerationJobPackageById(GENERATION_JOB_PACKAGE_ID)) {
    violations.push({
      code: 'FAIL_JOB_PACKAGE',
      message: `Generation job package ${GENERATION_JOB_PACKAGE_ID} not found`,
      field: GENERATION_JOB_PACKAGE_ID,
    });
  }

  return violations;
}

function auditSceneReadiness(): GenerationReadinessViolation[] {
  const violations: GenerationReadinessViolation[] = [];
  const job = getGenerationJobPackageById(GENERATION_JOB_PACKAGE_ID);
  const scenes = getStoryboardSceneSeedLibrary();

  if (!job) return violations;

  if (scenes.length !== STORYBOARD_SEED_COUNT) {
    violations.push({
      code: 'FAIL_SCENE_READINESS',
      message: `Expected ${STORYBOARD_SEED_COUNT} storyboard scenes for readiness`,
      field: 'scene_count',
    });
  }

  if (job.storyboard_ids.length !== STORYBOARD_SEED_COUNT) {
    violations.push({
      code: 'FAIL_SCENE_READINESS',
      message: 'Job package must reference all storyboard scenes',
      field: `${job.job_package_id}.storyboard_ids`,
    });
  }

  let scenesReady = 0;
  for (const scene of scenes) {
    const order = String(scene.scene_order).padStart(2, '0');
    const storyboardId = scene.storyboard_id;
    const imagePackId = `IPP-${storyboardId}`;
    const videoPackId = `VPP-${storyboardId}`;
    const pairId = `PAIR-${storyboardId}`;

    const hasStoryboard = job.storyboard_ids.includes(storyboardId);
    const hasImage = job.image_prompt_pack_ids.includes(imagePackId);
    const hasVideo = job.video_prompt_pack_ids.includes(videoPackId);
    const hasPair = job.prompt_pair_ids.includes(pairId);
    const hasImageStep = job.generation_sequence.includes(
      `step:${order}:image-first:${imagePackId}`
    );
    const hasVideoStep = job.generation_sequence.includes(
      `step:${order}:video-second:${videoPackId}`
    );

    if (hasStoryboard && hasImage && hasVideo && hasPair && hasImageStep && hasVideoStep) {
      scenesReady += 1;
      continue;
    }

    violations.push({
      code: 'FAIL_SCENE_READINESS',
      message: `Scene ${storyboardId} is not fully ready for Image App / Video App input`,
      field: storyboardId,
    });
  }

  if (scenesReady !== STORYBOARD_SEED_COUNT) {
    violations.push({
      code: 'FAIL_SCENE_READINESS',
      message: `Only ${scenesReady} of ${STORYBOARD_SEED_COUNT} scenes are ready`,
      field: 'scenes_ready',
    });
  }

  if (job.song_master_id !== STORYBOARD_SONG_MASTER_ID) {
    violations.push({
      code: 'FAIL_SCENE_READINESS',
      message: 'Job package song_master_id must match storyboard song master',
      field: `${job.job_package_id}.song_master_id`,
    });
  }

  return violations;
}

function auditGenerationNotTriggered(): GenerationReadinessViolation[] {
  const violations: GenerationReadinessViolation[] = [];
  const job = getGenerationJobPackageById(GENERATION_JOB_PACKAGE_ID);
  if (!job) return violations;

  if (!job.generation_sequence.includes(PIPELINE_GUARD)) {
    violations.push({
      code: 'FAIL_GENERATION_TRIGGERED',
      message: 'Generation sequence must declare no-ai-studio-no-gpu pipeline guard',
      field: `${job.job_package_id}.generation_sequence`,
    });
  }

  for (const step of job.generation_sequence) {
    if (step === PIPELINE_GUARD) continue;

    for (const token of FORBIDDEN_GENERATION_TOKENS) {
      if (step.toLowerCase().includes(token)) {
        violations.push({
          code: 'FAIL_GENERATION_TRIGGERED',
          message: `Forbidden generation trigger token "${token}" found in sequence step`,
          field: `${job.job_package_id}.generation_sequence`,
        });
      }
    }
  }

  const allowedStepPrefixes = [
    'step:00:world-bind:',
    'step:00:pipeline:',
    'step:',
  ];
  for (const step of job.generation_sequence) {
    if (!allowedStepPrefixes.some((prefix) => step.startsWith(prefix))) {
      violations.push({
        code: 'FAIL_GENERATION_TRIGGERED',
        message: `Unexpected generation sequence step "${step}"`,
        field: `${job.job_package_id}.generation_sequence`,
      });
    }
  }

  return violations;
}

function resolveReadinessResult(
  violations: GenerationReadinessViolation[]
): GenerationReadinessAuditResult {
  if (violations.length === 0) return 'PASS';

  const priority: GenerationReadinessAuditResult[] = [
    'FAIL_JOB_PACKAGE',
    'FAIL_WORLD_CONTINUITY',
    'FAIL_CHARACTER_CONTINUITY',
    'FAIL_LOCATION_CONTINUITY',
    'FAIL_STORYBOARD',
    'FAIL_IMAGE_PROMPT_PACK',
    'FAIL_VIDEO_PROMPT_PACK',
    'FAIL_PROMPT_PAIR',
    'FAIL_SCENE_READINESS',
    'FAIL_GENERATION_TRIGGERED',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }

  return 'FAIL_JOB_PACKAGE';
}

export function buildGenerationReadinessFingerprint(
  projectRoot: string,
  auditTimestamp: string,
  layerStatus: GenerationReadinessLayerStatus
): GenerationReadinessFingerprint | null {
  void projectRoot;
  const job = getGenerationJobPackageById(GENERATION_JOB_PACKAGE_ID);
  if (!job) return null;

  return {
    schemaVersion: GENERATION_READINESS_FINGERPRINT_SCHEMA_VERSION,
    jobPackageId: GENERATION_JOB_PACKAGE_ID,
    songMasterId: GENERATION_JOB_PACKAGE_SONG_MASTER_ID,
    worldId: WORLD_CONTINUITY_WORLD_ID,
    sceneCount: STORYBOARD_SEED_COUNT,
    jobPackageChecksum: computeJobPackageChecksum(),
    generationTriggered: false,
    pipelineGuard: 'no-ai-studio-no-gpu',
    layerStatus,
    frozenAt: auditTimestamp,
  };
}

export function auditGenerationReadiness(
  projectRoot: string
): GenerationReadinessViolation[] {
  const violations: GenerationReadinessViolation[] = [];

  violations.push(...auditJobPackageLayer(projectRoot));
  violations.push(
    ...mapLayerViolations(auditWorldContinuity(projectRoot), 'FAIL_WORLD_CONTINUITY')
  );
  violations.push(
    ...mapLayerViolations(auditCharacterContinuity(projectRoot), 'FAIL_CHARACTER_CONTINUITY')
  );
  violations.push(
    ...mapLayerViolations(auditLocationContinuity(projectRoot), 'FAIL_LOCATION_CONTINUITY')
  );
  violations.push(
    ...mapLayerViolations(auditStoryboardLayer(projectRoot), 'FAIL_STORYBOARD')
  );
  violations.push(
    ...mapLayerViolations(auditImagePromptPack(projectRoot), 'FAIL_IMAGE_PROMPT_PACK')
  );
  violations.push(
    ...mapLayerViolations(auditVideoPromptPack(projectRoot), 'FAIL_VIDEO_PROMPT_PACK')
  );
  violations.push(
    ...mapLayerViolations(auditPromptPackPairing(projectRoot), 'FAIL_PROMPT_PAIR')
  );

  violations.push(...auditSceneReadiness());
  violations.push(...auditGenerationNotTriggered());

  return violations;
}

export function writeGenerationReadinessReport(
  projectRoot: string,
  report: GenerationReadinessReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function writeGenerationReadinessFingerprint(
  projectRoot: string,
  fingerprint: GenerationReadinessFingerprint
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const fingerprintPath = path.join(exportsDir, FINGERPRINT_FILE);
  fs.writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  return fingerprintPath;
}

export function runGenerationReadinessAudit(
  projectRoot: string
): GenerationReadinessReport {
  const auditTimestamp = new Date().toISOString();
  const layerStatus = buildLayerStatus(projectRoot);
  const violations = auditGenerationReadiness(projectRoot);
  const auditResult = resolveReadinessResult(violations);

  const scenes = getStoryboardSceneSeedLibrary();
  const scenesReady = scenes.filter((scene) => {
    const job = getGenerationJobPackageById(GENERATION_JOB_PACKAGE_ID);
    if (!job) return false;
    const order = String(scene.scene_order).padStart(2, '0');
    const storyboardId = scene.storyboard_id;
    return (
      job.storyboard_ids.includes(storyboardId) &&
      job.image_prompt_pack_ids.includes(`IPP-${storyboardId}`) &&
      job.video_prompt_pack_ids.includes(`VPP-${storyboardId}`) &&
      job.prompt_pair_ids.includes(`PAIR-${storyboardId}`) &&
      job.generation_sequence.includes(`step:${order}:image-first:IPP-${storyboardId}`) &&
      job.generation_sequence.includes(`step:${order}:video-second:VPP-${storyboardId}`)
    );
  }).length;

  const jobPackageReady = layerStatus.generation_job_package === 'PASS';
  const imageAppInputReady =
    jobPackageReady &&
    layerStatus.image_prompt_pack === 'PASS' &&
    layerStatus.prompt_pair === 'PASS' &&
    scenesReady === STORYBOARD_SEED_COUNT;
  const videoAppInputReady =
    jobPackageReady &&
    layerStatus.video_prompt_pack === 'PASS' &&
    layerStatus.prompt_pair === 'PASS' &&
    scenesReady === STORYBOARD_SEED_COUNT;

  const report: GenerationReadinessReport = {
    auditTimestamp,
    auditResult,
    violations,
    layer_status: layerStatus,
    scene_count: scenes.length,
    scenes_ready: scenesReady,
    job_package_ready: jobPackageReady,
    image_app_input_ready: imageAppInputReady,
    video_app_input_ready: videoAppInputReady,
    generation_readiness_ready: auditResult === 'PASS',
    generation_triggered: false,
  };

  writeGenerationReadinessReport(projectRoot, report);

  if (auditResult === 'PASS') {
    const fingerprint = buildGenerationReadinessFingerprint(
      projectRoot,
      auditTimestamp,
      layerStatus
    );
    if (fingerprint) {
      writeGenerationReadinessFingerprint(projectRoot, fingerprint);
    }
  }

  return report;
}
