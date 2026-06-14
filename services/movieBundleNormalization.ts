import fs from 'node:fs';
import path from 'node:path';
import {
  MOVIE_DATASET_RUNTIME_COMPOSITION_PATH,
  TITANIC_MOVIE_DATASET_BUNDLE_PATH,
} from './movieDatasetSeparation.js';
import { MULTI_MOVIE_RUNTIME_PASS_VERDICT, MOVIE_RUNTIME_VALIDATION_REPORT_PATH } from './multiMovieRuntimeValidation.js';
import { REAL_IMAGE_GENERATION_PASS_VERDICT, REAL_IMAGE_GENERATION_REPORT_PATH } from './realImageGenerationValidation.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  SPIRITED_AWAY_BLOCKING_REGISTRY_PATH,
  SPIRITED_AWAY_BUNDLE_PATH,
  SPIRITED_AWAY_CAMERA_REGISTRY_PATH,
  SPIRITED_AWAY_COMPOSITION_REGISTRY_PATH,
  SPIRITED_AWAY_SCENE_REGISTRY_PATH,
  SPIRITED_AWAY_SEMANTIC_ANCHOR_REGISTRY_PATH,
  SPIRITED_AWAY_WORLD_TRANSLATION_RULES_PATH,
} from './spiritedAwayMovieDataset.js';
import {
  SPIRITED_AWAY_IMAGE_ADAPTER_PATH,
  SPIRITED_AWAY_SHOT_FINGERPRINT_REGISTRY_PATH,
  SPIRITED_AWAY_SHOT_REGISTRY_PATH,
  SPIRITED_AWAY_SHOT_TRANSITION_REGISTRY_PATH,
  SPIRITED_AWAY_VIDEO_ADAPTER_PATH,
} from './spiritedAwayShotReconstruction.js';
import {
  SPIRITED_AWAY_CHARACTER_STATE_REGISTRY_PATH,
  SPIRITED_AWAY_ENVIRONMENT_CONTINUITY_REGISTRY_PATH,
  SPIRITED_AWAY_SHOT_SEQUENCE_REGISTRY_PATH,
  SPIRITED_AWAY_TEMPORAL_ADAPTER_PATH,
  SPIRITED_AWAY_TEMPORAL_TRANSITION_REGISTRY_PATH,
} from './spiritedAwayTemporalReconstruction.js';
import {
  SPIRITED_AWAY_CAMERA_MOTION_REGISTRY_PATH,
  SPIRITED_AWAY_ENVIRONMENT_MOTION_REGISTRY_PATH,
  SPIRITED_AWAY_MOTION_ADAPTER_PATH,
  SPIRITED_AWAY_MOTION_CONTINUITY_REGISTRY_PATH,
  SPIRITED_AWAY_MOTION_GRAMMAR_REGISTRY_PATH,
  SPIRITED_AWAY_SUBJECT_MOTION_REGISTRY_PATH,
} from './spiritedAwayMotionReconstruction.js';
import {
  SPIRITED_AWAY_IMAGE_VALIDATION_METRICS_PATH,
  SPIRITED_AWAY_IMAGE_VALIDATION_PASS_VERDICT,
  SPIRITED_AWAY_IMAGE_VALIDATION_REPORT_PATH,
  SPIRITED_AWAY_IMAGE_VALIDATION_SCENES_PATH,
} from './spiritedAwayImageReconstructionValidation.js';
import {
  SPIRITED_AWAY_VIDEO_VALIDATION_METRICS_PATH,
  SPIRITED_AWAY_VIDEO_VALIDATION_PASS_VERDICT,
  SPIRITED_AWAY_VIDEO_VALIDATION_REPORT_PATH,
  SPIRITED_AWAY_VIDEO_VALIDATION_SEQUENCES_PATH,
} from './spiritedAwayVideoReconstructionValidation.js';
import {
  TITANIC_BLOCKING_REGISTRY_PATH,
  TITANIC_CAMERA_REGISTRY_PATH,
  TITANIC_COMPOSITION_REGISTRY_PATH,
  TITANIC_RECONSTRUCTION_ADAPTER_PATH,
  TITANIC_SCENE_REGISTRY_PATH,
  TITANIC_SEMANTIC_ANCHOR_REGISTRY_PATH,
  TITANIC_WORLD_TRANSLATION_RULES_PATH,
} from './titanicMovieReconstructionDataset.js';
import {
  TITANIC_CAMERA_MOTION_REGISTRY_PATH,
  TITANIC_ENVIRONMENT_MOTION_REGISTRY_PATH,
  TITANIC_MOTION_ADAPTER_PATH,
  TITANIC_MOTION_CONTINUITY_REGISTRY_PATH,
  TITANIC_MOTION_GRAMMAR_REGISTRY_PATH,
  TITANIC_SUBJECT_MOTION_REGISTRY_PATH,
} from './titanicMotionReconstruction.js';
import {
  TITANIC_IMAGE_TEST_SCENES_PATH,
  TITANIC_IMAGE_VALIDATION_PASS_VERDICT,
  TITANIC_IMAGE_VALIDATION_REPORT_PATH,
} from './titanicImageReconstructionValidation.js';
import {
  TITANIC_IMAGE_ADAPTER_PATH,
  TITANIC_SHOT_FINGERPRINT_REGISTRY_PATH,
  TITANIC_SHOT_REGISTRY_PATH,
  TITANIC_SHOT_TRANSITION_REGISTRY_PATH,
  TITANIC_VIDEO_ADAPTER_PATH,
} from './titanicShotReconstruction.js';
import {
  TITANIC_SCENE_TRANSITION_REGISTRY_PATH,
  TITANIC_VIDEO_ADAPTER_V2_PATH,
  TITANIC_VIDEO_RENDER_PLAN_REGISTRY_PATH,
  TITANIC_VIDEO_SEQUENCE_REGISTRY_PATH,
  TITANIC_VIDEO_TIMELINE_REGISTRY_PATH,
} from './titanicVideoReconstruction.js';
import {
  TITANIC_VIDEO_VALIDATION_METRICS_PATH,
  TITANIC_VIDEO_VALIDATION_PASS_VERDICT,
  TITANIC_VIDEO_VALIDATION_REPORT_PATH,
  TITANIC_VIDEO_VALIDATION_SCENES_PATH,
} from './titanicVideoReconstructionValidation.js';

export const MOVIE_BUNDLE_NORMALIZATION_PHASE = 'PHASE-MOVIE-BUNDLE-NORMALIZATION-001' as const;
export const MOVIE_BUNDLE_NORMALIZATION_ID = 'MOVIE_BUNDLE_NORMALIZATION_V1' as const;
export const MOVIE_BUNDLE_NORMALIZATION_PASS_VERDICT = 'PASS_MOVIE_BUNDLE_NORMALIZATION_V1' as const;
export const MOVIE_BUNDLE_NORMALIZATION_FAIL_VERDICT = 'FAIL_MOVIE_BUNDLE_NORMALIZATION_V1' as const;
export const MOVIE_BUNDLE_NORMALIZATION_REPORT_PATH =
  'reports/movie_reconstruction/MOVIE_BUNDLE_NORMALIZATION_REPORT.json' as const;

export const CRITICAL_LAYER_KEYS = [
  'scene_registry',
  'camera_registry',
  'blocking_registry',
  'composition_registry',
  'semantic_anchor_registry',
  'shot_layer',
  'temporal_layer',
  'motion_layer',
  'image_validation_layer',
  'video_validation_layer',
] as const;

export type CriticalLayerKey = (typeof CRITICAL_LAYER_KEYS)[number];
export const FULL_EMBEDDED_BUNDLE_MODE = 'full_embedded' as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface BundleNormalizationReport {
  phase: typeof MOVIE_BUNDLE_NORMALIZATION_PHASE;
  normalization_id: typeof MOVIE_BUNDLE_NORMALIZATION_ID;
  generated_at: string;
  titanic_bundle_path: typeof TITANIC_MOVIE_DATASET_BUNDLE_PATH;
  spirited_away_bundle_path: typeof SPIRITED_AWAY_BUNDLE_PATH;
  titanic_bundle_mode: string;
  spirited_away_bundle_mode: string;
  bundle_schema_match: boolean;
  critical_layer_missing_count: number;
  critical_layers: Record<CriticalLayerKey, { titanic_embedded: boolean; spirited_away_embedded: boolean }>;
  normalization_passed: boolean;
  final_verdict: string;
  issues: ValidationIssue[];
  precheck: Record<string, unknown>;
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function tryReadJson<T>(root: string, rel: string): T | null {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  return readJson<T>(root, rel);
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function fileExists(root: string, rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

function buildShotLayerEmbedded(
  root: string,
  movie: 'titanic' | 'spirited_away',
  paths: {
    shotRegistry: string;
    shotTransition: string;
    shotFingerprint: string;
    imageAdapter: string;
    videoAdapter: string;
    phase: string;
    systemId: string;
    shotsDir: string;
  },
  summary: Record<string, unknown>
): Record<string, unknown> {
  return {
    embedded: true,
    phase: paths.phase,
    system_id: paths.systemId,
    shots_dir: paths.shotsDir,
    movie_id: movie,
    shot_registry: readJson(root, paths.shotRegistry),
    shot_transition_registry: readJson(root, paths.shotTransition),
    shot_fingerprint_registry: readJson(root, paths.shotFingerprint),
    image_adapter: readJson(root, paths.imageAdapter),
    video_adapter: readJson(root, paths.videoAdapter),
    summary,
    normalized_at: new Date().toISOString(),
  };
}

function buildTitanicTemporalLayerEmbedded(root: string, existing?: Record<string, unknown>): Record<string, unknown> {
  return {
    embedded: true,
    phase: 'PHASE-TITANIC-VIDEO-RECONSTRUCTION-001',
    system_id: 'TITANIC_VIDEO_RECONSTRUCTION_SYSTEM_V1',
    movie_id: 'titanic',
    video_dir: 'datasets/movie_reconstruction/titanic_video',
    video_sequence_registry: readJson(root, TITANIC_VIDEO_SEQUENCE_REGISTRY_PATH),
    scene_transition_registry: readJson(root, TITANIC_SCENE_TRANSITION_REGISTRY_PATH),
    video_timeline_registry: readJson(root, TITANIC_VIDEO_TIMELINE_REGISTRY_PATH),
    video_render_plan_registry: readJson(root, TITANIC_VIDEO_RENDER_PLAN_REGISTRY_PATH),
    video_adapter_v2: readJson(root, TITANIC_VIDEO_ADAPTER_V2_PATH),
    summary: {
      video_sequence_integrity: existing?.video_sequence_integrity,
      scene_transition_count: existing?.scene_transition_count,
      scene_transition_score: existing?.scene_transition_score,
      timeline_entry_count: existing?.timeline_entry_count,
      timeline_integrity: existing?.timeline_integrity,
      render_plan_count: existing?.render_plan_count,
      total_duration: existing?.total_duration,
      video_generation_status: existing?.video_generation_status,
    },
    normalized_at: new Date().toISOString(),
  };
}

function buildSpiritedTemporalLayerEmbedded(root: string, existing?: Record<string, unknown>): Record<string, unknown> {
  return {
    embedded: true,
    phase: 'PHASE-SPIRITED-AWAY-TEMPORAL-001',
    system_id: 'SPIRITED_AWAY_TEMPORAL_RECONSTRUCTION_V1',
    movie_id: 'spirited_away',
    temporal_dir: 'datasets/movie_reconstruction/spirited_away_temporal',
    shot_sequence_registry: readJson(root, SPIRITED_AWAY_SHOT_SEQUENCE_REGISTRY_PATH),
    character_state_registry: readJson(root, SPIRITED_AWAY_CHARACTER_STATE_REGISTRY_PATH),
    environment_continuity_registry: readJson(root, SPIRITED_AWAY_ENVIRONMENT_CONTINUITY_REGISTRY_PATH),
    temporal_transition_registry: readJson(root, SPIRITED_AWAY_TEMPORAL_TRANSITION_REGISTRY_PATH),
    temporal_adapter: readJson(root, SPIRITED_AWAY_TEMPORAL_ADAPTER_PATH),
    summary: {
      sequence_count: existing?.sequence_count,
      shot_count: existing?.shot_count,
      transition_count: existing?.transition_count,
      temporal_continuity_score: existing?.temporal_continuity_score,
      semantic_continuity_score: existing?.semantic_continuity_score,
    },
    normalized_at: new Date().toISOString(),
  };
}

function buildMotionLayerEmbedded(
  root: string,
  movie: 'titanic' | 'spirited_away',
  phase: string,
  systemId: string,
  motionDir: string,
  grammarPath: string,
  cameraPath: string,
  subjectPath: string,
  environmentPath: string,
  continuityPath: string,
  adapterPath: string,
  summary: Record<string, unknown>
): Record<string, unknown> {
  return {
    embedded: true,
    phase,
    system_id: systemId,
    movie_id: movie,
    motion_dir: motionDir,
    motion_grammar_registry: readJson(root, grammarPath),
    camera_motion_registry: readJson(root, cameraPath),
    subject_motion_registry: readJson(root, subjectPath),
    environment_motion_registry: readJson(root, environmentPath),
    motion_continuity_registry: readJson(root, continuityPath),
    motion_adapter: readJson(root, adapterPath),
    summary,
    normalized_at: new Date().toISOString(),
  };
}

function buildImageValidationLayerEmbedded(
  root: string,
  movie: 'titanic' | 'spirited_away',
  phase: string,
  validationId: string,
  scenesPath: string,
  metricsPath: string | null,
  summary: Record<string, unknown>
): Record<string, unknown> {
  const layer: Record<string, unknown> = {
    embedded: true,
    phase,
    validation_id: validationId,
    movie_id: movie,
    validation_scenes: readJson(root, scenesPath),
    summary,
    normalized_at: new Date().toISOString(),
  };
  if (metricsPath && fileExists(root, metricsPath)) {
    layer.validation_metrics = readJson(root, metricsPath);
  }
  return layer;
}

function buildVideoValidationLayerEmbedded(
  root: string,
  movie: 'titanic' | 'spirited_away',
  phase: string,
  validationId: string,
  sequencesOrScenesPath: string,
  metricsPath: string,
  reportPath: string,
  summary: Record<string, unknown>
): Record<string, unknown> {
  const sequencesOrScenes = readJson<Record<string, unknown>>(root, sequencesOrScenesPath);
  const layer: Record<string, unknown> = {
    embedded: true,
    phase,
    validation_id: validationId,
    movie_id: movie,
    validation_metrics: readJson(root, metricsPath),
    validation_report: tryReadJson(root, reportPath),
    summary,
    normalized_at: new Date().toISOString(),
  };
  if ('validation_sequences' in sequencesOrScenes || movie === 'spirited_away') {
    layer.validation_sequences = sequencesOrScenes;
  } else {
    layer.validation_scenes = sequencesOrScenes;
  }
  return layer;
}

const REF_ONLY_LAYER_KEYS_TO_REMOVE = [
  'scene_registry_ref',
  'camera_registry_ref',
  'blocking_registry_ref',
  'composition_registry_ref',
  'semantic_anchor_registry_ref',
  'world_translation_rules_ref',
  'titanic_shots_layer',
  'spirited_away_shots_layer',
  'video_layer',
  'video_sequence_layer',
  'scene_transition_layer',
  'video_timeline_layer',
  'video_render_plan_layer',
  'spirited_away_temporal_layer',
  'titanic_image_validation_layer',
  'spirited_away_image_validation_layer',
  'titanic_video_validation_layer',
  'camera_motion_layer',
  'subject_motion_layer',
  'environment_motion_layer',
  'motion_continuity_layer',
  'spirited_away_motion_layer',
] as const;

function stripRefOnlyLayers(bundle: Record<string, unknown>): void {
  for (const key of REF_ONLY_LAYER_KEYS_TO_REMOVE) {
    delete bundle[key];
  }
}

function normalizeTitanicBundle(root: string): Record<string, unknown> {
  const existing = readJson<Record<string, unknown>>(root, TITANIC_MOVIE_DATASET_BUNDLE_PATH);
  const shotsMeta = (existing.titanic_shots_layer as Record<string, unknown> | undefined) ?? {};
  const videoMeta = (existing.video_layer as Record<string, unknown> | undefined) ?? {};
  const motionMeta = (existing.motion_layer as Record<string, unknown> | undefined) ?? {};
  const imageMeta = (existing.titanic_image_validation_layer as Record<string, unknown> | undefined) ?? {};
  const videoValMeta = (existing.titanic_video_validation_layer as Record<string, unknown> | undefined) ?? {};

  const bundle: Record<string, unknown> = {
    ...existing,
    bundle_mode: FULL_EMBEDDED_BUNDLE_MODE,
    normalization_phase: MOVIE_BUNDLE_NORMALIZATION_PHASE,
    normalized_at: new Date().toISOString(),
    scene_registry: existing.scene_registry ?? readJson(root, TITANIC_SCENE_REGISTRY_PATH),
    camera_registry: existing.camera_registry ?? readJson(root, TITANIC_CAMERA_REGISTRY_PATH),
    blocking_registry: existing.blocking_registry ?? readJson(root, TITANIC_BLOCKING_REGISTRY_PATH),
    composition_registry: existing.composition_registry ?? readJson(root, TITANIC_COMPOSITION_REGISTRY_PATH),
    semantic_anchor_registry: readJson(root, TITANIC_SEMANTIC_ANCHOR_REGISTRY_PATH),
    world_translation_rules:
      existing.world_translation_rules ?? readJson(root, TITANIC_WORLD_TRANSLATION_RULES_PATH),
    reconstruction_prompt_adapter:
      existing.reconstruction_prompt_adapter ?? readJson(root, TITANIC_RECONSTRUCTION_ADAPTER_PATH),
    shot_layer: buildShotLayerEmbedded(
      root,
      'titanic',
      {
        shotRegistry: TITANIC_SHOT_REGISTRY_PATH,
        shotTransition: TITANIC_SHOT_TRANSITION_REGISTRY_PATH,
        shotFingerprint: TITANIC_SHOT_FINGERPRINT_REGISTRY_PATH,
        imageAdapter: TITANIC_IMAGE_ADAPTER_PATH,
        videoAdapter: TITANIC_VIDEO_ADAPTER_PATH,
        phase: 'PHASE-TITANIC-SHOT-GRAMMAR-001',
        systemId: 'TITANIC_SHOT_RECONSTRUCTION_SYSTEM_V1',
        shotsDir: 'datasets/movie_reconstruction/titanic_shots',
      },
      {
        shot_count: shotsMeta.shot_count,
        scene_count: shotsMeta.scene_count,
        shot_fingerprint_uniqueness: shotsMeta.shot_fingerprint_uniqueness,
        shared_movie_dataset: shotsMeta.shared_movie_dataset,
      }
    ),
    temporal_layer: buildTitanicTemporalLayerEmbedded(root, videoMeta),
    motion_layer: buildMotionLayerEmbedded(
      root,
      'titanic',
      'PHASE-TITANIC-MOTION-GRAMMAR-001',
      'TITANIC_MOTION_RECONSTRUCTION_SYSTEM_V1',
      'datasets/movie_reconstruction/titanic_motion',
      TITANIC_MOTION_GRAMMAR_REGISTRY_PATH,
      TITANIC_CAMERA_MOTION_REGISTRY_PATH,
      TITANIC_SUBJECT_MOTION_REGISTRY_PATH,
      TITANIC_ENVIRONMENT_MOTION_REGISTRY_PATH,
      TITANIC_MOTION_CONTINUITY_REGISTRY_PATH,
      TITANIC_MOTION_ADAPTER_PATH,
      {
        motion_count: motionMeta.motion_count,
        scene_count: motionMeta.scene_count,
        camera_motion_count: motionMeta.camera_motion_count,
        subject_motion_count: motionMeta.subject_motion_count,
        environment_motion_count: motionMeta.environment_motion_count,
        continuity_count: motionMeta.continuity_count,
        motion_grammar_coverage: motionMeta.motion_grammar_coverage,
        camera_motion_score: motionMeta.camera_motion_score,
        subject_motion_score: motionMeta.subject_motion_score,
        environment_motion_score: motionMeta.environment_motion_score,
        motion_continuity_score: motionMeta.motion_continuity_score,
      }
    ),
    image_validation_layer: buildImageValidationLayerEmbedded(
      root,
      'titanic',
      'PHASE-TITANIC-IMAGE-RECONSTRUCTION-TEST-001',
      'TITANIC_IMAGE_RECONSTRUCTION_VALIDATION_V1',
      TITANIC_IMAGE_TEST_SCENES_PATH,
      null,
      {
        test_scene_count: imageMeta.test_scene_count,
        validation_passed: imageMeta.validation_passed,
        titanic_recognition_rate: imageMeta.titanic_recognition_rate,
        semantic_anchor_preservation: imageMeta.semantic_anchor_preservation,
        gonegi_identity_preservation: imageMeta.gonegi_identity_preservation,
      }
    ),
    video_validation_layer: buildVideoValidationLayerEmbedded(
      root,
      'titanic',
      'PHASE-TITANIC-VIDEO-VALIDATION-001',
      'TITANIC_VIDEO_RECONSTRUCTION_VALIDATION_V1',
      TITANIC_VIDEO_VALIDATION_SCENES_PATH,
      TITANIC_VIDEO_VALIDATION_METRICS_PATH,
      TITANIC_VIDEO_VALIDATION_REPORT_PATH,
      {
        validation_sequence_count: videoValMeta.validation_sequence_count,
        validation_passed: videoValMeta.validation_passed,
        sequence_recognition_score: videoValMeta.sequence_recognition_score,
        motion_preservation_score: videoValMeta.motion_preservation_score,
        temporal_continuity_score: videoValMeta.temporal_continuity_score,
      }
    ),
  };

  stripRefOnlyLayers(bundle);
  writeJson(root, TITANIC_MOVIE_DATASET_BUNDLE_PATH, bundle);
  return bundle;
}

function normalizeSpiritedAwayBundle(root: string): Record<string, unknown> {
  const existing = readJson<Record<string, unknown>>(root, SPIRITED_AWAY_BUNDLE_PATH);
  const shotsMeta = (existing.spirited_away_shots_layer as Record<string, unknown> | undefined) ?? {};
  const temporalMeta = (existing.spirited_away_temporal_layer as Record<string, unknown> | undefined) ?? {};
  const motionMeta = (existing.spirited_away_motion_layer as Record<string, unknown> | undefined) ?? {};
  const imageMeta =
    (existing.spirited_away_image_validation_layer as Record<string, unknown> | undefined) ?? {};
  const videoValMeta = (existing.video_validation_layer as Record<string, unknown> | undefined) ?? {};

  const bundle: Record<string, unknown> = {
    ...existing,
    bundle_mode: FULL_EMBEDDED_BUNDLE_MODE,
    normalization_phase: MOVIE_BUNDLE_NORMALIZATION_PHASE,
    normalized_at: new Date().toISOString(),
    scene_registry: readJson(root, SPIRITED_AWAY_SCENE_REGISTRY_PATH),
    camera_registry: readJson(root, SPIRITED_AWAY_CAMERA_REGISTRY_PATH),
    blocking_registry: readJson(root, SPIRITED_AWAY_BLOCKING_REGISTRY_PATH),
    composition_registry: readJson(root, SPIRITED_AWAY_COMPOSITION_REGISTRY_PATH),
    semantic_anchor_registry: readJson(root, SPIRITED_AWAY_SEMANTIC_ANCHOR_REGISTRY_PATH),
    world_translation_rules: readJson(root, SPIRITED_AWAY_WORLD_TRANSLATION_RULES_PATH),
    shot_layer: buildShotLayerEmbedded(
      root,
      'spirited_away',
      {
        shotRegistry: SPIRITED_AWAY_SHOT_REGISTRY_PATH,
        shotTransition: SPIRITED_AWAY_SHOT_TRANSITION_REGISTRY_PATH,
        shotFingerprint: SPIRITED_AWAY_SHOT_FINGERPRINT_REGISTRY_PATH,
        imageAdapter: SPIRITED_AWAY_IMAGE_ADAPTER_PATH,
        videoAdapter: SPIRITED_AWAY_VIDEO_ADAPTER_PATH,
        phase: 'PHASE-SPIRITED-AWAY-SHOT-GRAMMAR-001',
        systemId: 'SPIRITED_AWAY_SHOT_RECONSTRUCTION_V1',
        shotsDir: 'datasets/movie_reconstruction/spirited_away_shots',
      },
      {
        shot_count: shotsMeta.shot_count,
        scene_count: shotsMeta.scene_count,
        shot_fingerprint_uniqueness: shotsMeta.shot_fingerprint_uniqueness,
        semantic_anchor_binding_rate: shotsMeta.semantic_anchor_binding_rate,
        shared_movie_dataset: shotsMeta.shared_movie_dataset,
      }
    ),
    temporal_layer: buildSpiritedTemporalLayerEmbedded(root, temporalMeta),
    motion_layer: buildMotionLayerEmbedded(
      root,
      'spirited_away',
      'PHASE-SPIRITED-AWAY-MOTION-GRAMMAR-001',
      'SPIRITED_AWAY_MOTION_RECONSTRUCTION_V1',
      'datasets/movie_reconstruction/spirited_away_motion',
      SPIRITED_AWAY_MOTION_GRAMMAR_REGISTRY_PATH,
      SPIRITED_AWAY_CAMERA_MOTION_REGISTRY_PATH,
      SPIRITED_AWAY_SUBJECT_MOTION_REGISTRY_PATH,
      SPIRITED_AWAY_ENVIRONMENT_MOTION_REGISTRY_PATH,
      SPIRITED_AWAY_MOTION_CONTINUITY_REGISTRY_PATH,
      SPIRITED_AWAY_MOTION_ADAPTER_PATH,
      {
        motion_count: motionMeta.motion_count,
        scene_count: motionMeta.scene_count,
        camera_motion_count: motionMeta.camera_motion_count,
        subject_motion_count: motionMeta.subject_motion_count,
        environment_motion_count: motionMeta.environment_motion_count,
        continuity_count: motionMeta.continuity_count,
        motion_grammar_coverage: motionMeta.motion_grammar_coverage,
        camera_motion_score: motionMeta.camera_motion_score,
        subject_motion_score: motionMeta.subject_motion_score,
        environment_motion_score: motionMeta.environment_motion_score,
        motion_continuity_score: motionMeta.motion_continuity_score,
      }
    ),
    image_validation_layer: buildImageValidationLayerEmbedded(
      root,
      'spirited_away',
      'PHASE-SPIRITED-AWAY-IMAGE-VALIDATION-001',
      'SPIRITED_AWAY_IMAGE_RECONSTRUCTION_VALIDATION_V1',
      SPIRITED_AWAY_IMAGE_VALIDATION_SCENES_PATH,
      SPIRITED_AWAY_IMAGE_VALIDATION_METRICS_PATH,
      {
        test_scene_count: imageMeta.test_scene_count,
        validation_passed: imageMeta.validation_passed,
        scene_recognition_score: imageMeta.scene_recognition_score,
        geometry_preservation_score: imageMeta.geometry_preservation_score,
        semantic_anchor_score: imageMeta.semantic_anchor_score,
        gonegi_identity_score: imageMeta.gonegi_identity_score,
        generic_harbor_count: imageMeta.generic_harbor_count,
      }
    ),
    video_validation_layer: buildVideoValidationLayerEmbedded(
      root,
      'spirited_away',
      'PHASE-SPIRITED-AWAY-VIDEO-VALIDATION-001',
      'SPIRITED_AWAY_VIDEO_RECONSTRUCTION_VALIDATION_V1',
      SPIRITED_AWAY_VIDEO_VALIDATION_SEQUENCES_PATH,
      SPIRITED_AWAY_VIDEO_VALIDATION_METRICS_PATH,
      SPIRITED_AWAY_VIDEO_VALIDATION_REPORT_PATH,
      {
        validation_sequence_count: videoValMeta.validation_sequence_count,
        validation_passed: videoValMeta.validation_passed,
        sequence_recognition_score: videoValMeta.sequence_recognition_score,
        motion_preservation_score: videoValMeta.motion_preservation_score,
        temporal_continuity_score: videoValMeta.temporal_continuity_score,
        video_reconstruction_verified: videoValMeta.video_reconstruction_verified,
      }
    ),
  };

  delete bundle.semantic_anchors;
  stripRefOnlyLayers(bundle);
  writeJson(root, SPIRITED_AWAY_BUNDLE_PATH, bundle);
  return bundle;
}

export function isCriticalLayerEmbedded(layer: unknown, key: CriticalLayerKey): boolean {
  if (!layer || typeof layer !== 'object') return false;
  const obj = layer as Record<string, unknown>;

  switch (key) {
    case 'scene_registry':
      return Array.isArray(obj.scenes) && obj.scenes.length > 0;
    case 'camera_registry':
      return Array.isArray(obj.cameras) || Array.isArray(obj.camera_patterns);
    case 'blocking_registry':
      return Array.isArray(obj.blockings) || Array.isArray(obj.blocking_patterns);
    case 'composition_registry':
      return Array.isArray(obj.compositions) && obj.compositions.length > 0;
    case 'semantic_anchor_registry':
      return (
        (Array.isArray(obj.anchors) && obj.anchors.length > 0) ||
        (Array.isArray(obj.semantic_anchors) && obj.semantic_anchors.length > 0)
      );
    case 'shot_layer':
      return obj.embedded === true && typeof obj.shot_registry === 'object' && obj.shot_registry !== null;
    case 'temporal_layer':
      return (
        obj.embedded === true &&
        (typeof obj.video_sequence_registry === 'object' ||
          typeof obj.shot_sequence_registry === 'object')
      );
    case 'motion_layer':
      return (
        obj.embedded === true &&
        typeof obj.motion_grammar_registry === 'object' &&
        obj.motion_grammar_registry !== null
      );
    case 'image_validation_layer':
      return obj.embedded === true && typeof obj.validation_scenes === 'object' && obj.validation_scenes !== null;
    case 'video_validation_layer':
      return (
        obj.embedded === true &&
        (typeof obj.validation_sequences === 'object' || typeof obj.validation_scenes === 'object')
      );
    default:
      return false;
  }
}

function hasForbiddenRefOnlyKeys(bundle: Record<string, unknown>): string[] {
  const forbidden: string[] = [];
  for (const key of CRITICAL_LAYER_KEYS) {
    const refKey = `${key}_ref`;
    if (typeof bundle[refKey] === 'string') {
      forbidden.push(refKey);
    }
  }
  for (const key of CRITICAL_LAYER_KEYS) {
    const layer = bundle[key];
    if (!layer || typeof layer !== 'object') continue;
    const obj = layer as Record<string, unknown>;
    const dataKeys = Object.keys(obj).filter(
      (k) => k.endsWith('_ref') && typeof obj[k] === 'string' && !['phase', 'system_id', 'normalized_at'].includes(k)
    );
    if (dataKeys.length > 0 && obj.embedded !== true) {
      forbidden.push(`${key}.${dataKeys.join(',')}`);
    }
  }
  return forbidden;
}

function bundleSchemaMatch(titanic: Record<string, unknown>, spirited: Record<string, unknown>): boolean {
  return CRITICAL_LAYER_KEYS.every((key) => key in titanic && key in spirited);
}

function countCriticalLayerMissing(
  titanic: Record<string, unknown>,
  spirited: Record<string, unknown>
): { count: number; layers: Record<CriticalLayerKey, { titanic_embedded: boolean; spirited_away_embedded: boolean }> } {
  const layers = {} as Record<CriticalLayerKey, { titanic_embedded: boolean; spirited_away_embedded: boolean }>;
  let count = 0;
  for (const key of CRITICAL_LAYER_KEYS) {
    const titanicEmbedded = isCriticalLayerEmbedded(titanic[key], key);
    const spiritedEmbedded = isCriticalLayerEmbedded(spirited[key], key);
    layers[key] = { titanic_embedded: titanicEmbedded, spirited_away_embedded: spiritedEmbedded };
    if (!titanicEmbedded) count += 1;
    if (!spiritedEmbedded) count += 1;
  }
  return { count, layers };
}

function runPrecheck(root: string): { precheck_passed: boolean; details: Record<string, unknown>; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const requiredFiles = [
    TITANIC_MOVIE_DATASET_BUNDLE_PATH,
    SPIRITED_AWAY_BUNDLE_PATH,
    TITANIC_SHOT_REGISTRY_PATH,
    SPIRITED_AWAY_SHOT_REGISTRY_PATH,
    TITANIC_VIDEO_SEQUENCE_REGISTRY_PATH,
    SPIRITED_AWAY_SHOT_SEQUENCE_REGISTRY_PATH,
    TITANIC_MOTION_GRAMMAR_REGISTRY_PATH,
    SPIRITED_AWAY_MOTION_GRAMMAR_REGISTRY_PATH,
    TITANIC_IMAGE_TEST_SCENES_PATH,
    SPIRITED_AWAY_IMAGE_VALIDATION_SCENES_PATH,
    TITANIC_VIDEO_VALIDATION_SCENES_PATH,
    SPIRITED_AWAY_VIDEO_VALIDATION_SEQUENCES_PATH,
  ];
  const missingFiles = requiredFiles.filter((rel) => !fileExists(root, rel));
  if (missingFiles.length > 0) {
    issues.push({
      code: 'PRECHECK_MISSING_FILES',
      message: `Missing required source files: ${missingFiles.join(', ')}`,
      severity: 'error',
    });
  }

  const runtimeReport = tryReadJson<Record<string, unknown>>(root, MOVIE_RUNTIME_VALIDATION_REPORT_PATH);
  const realImageReport = tryReadJson<Record<string, unknown>>(root, REAL_IMAGE_GENERATION_REPORT_PATH);
  const titanicImageReport = tryReadJson<Record<string, unknown>>(root, TITANIC_IMAGE_VALIDATION_REPORT_PATH);
  const titanicVideoReport = tryReadJson<Record<string, unknown>>(root, TITANIC_VIDEO_VALIDATION_REPORT_PATH);
  const spiritedImageReport = tryReadJson<Record<string, unknown>>(root, SPIRITED_AWAY_IMAGE_VALIDATION_REPORT_PATH);
  const spiritedVideoReport = tryReadJson<Record<string, unknown>>(root, SPIRITED_AWAY_VIDEO_VALIDATION_REPORT_PATH);

  const upstreamChecks = {
    multi_movie_runtime:
      String(runtimeReport?.final_verdict ?? '') === MULTI_MOVIE_RUNTIME_PASS_VERDICT,
    real_image_generation:
      String(realImageReport?.final_verdict ?? '') === REAL_IMAGE_GENERATION_PASS_VERDICT,
    titanic_image_validation:
      String(titanicImageReport?.final_verdict ?? '') === TITANIC_IMAGE_VALIDATION_PASS_VERDICT,
    titanic_video_validation:
      String(titanicVideoReport?.final_verdict ?? '') === TITANIC_VIDEO_VALIDATION_PASS_VERDICT,
    spirited_image_validation:
      String(spiritedImageReport?.final_verdict ?? '') === SPIRITED_AWAY_IMAGE_VALIDATION_PASS_VERDICT,
    spirited_video_validation:
      String(spiritedVideoReport?.final_verdict ?? '') === SPIRITED_AWAY_VIDEO_VALIDATION_PASS_VERDICT,
  };

  for (const [name, passed] of Object.entries(upstreamChecks)) {
    if (!passed) {
      issues.push({
        code: 'PRECHECK_UPSTREAM_FAIL',
        message: `Upstream validation not passed: ${name}`,
        severity: 'error',
      });
    }
  }

  return {
    precheck_passed: issues.length === 0,
    details: {
      missing_files: missingFiles,
      upstream_checks: upstreamChecks,
      runtime_composition_exists: fileExists(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH),
    },
    issues,
  };
}

export function writeMovieBundleNormalization(root = resolveProjectRoot()): BundleNormalizationReport {
  const precheck = runPrecheck(root);
  const issues: ValidationIssue[] = [...precheck.issues];

  let titanicBundle: Record<string, unknown> = {};
  let spiritedBundle: Record<string, unknown> = {};

  if (precheck.precheck_passed) {
    titanicBundle = normalizeTitanicBundle(root);
    spiritedBundle = normalizeSpiritedAwayBundle(root);
  } else {
    titanicBundle = tryReadJson(root, TITANIC_MOVIE_DATASET_BUNDLE_PATH) ?? {};
    spiritedBundle = tryReadJson(root, SPIRITED_AWAY_BUNDLE_PATH) ?? {};
  }

  const titanicBundleMode = String(titanicBundle.bundle_mode ?? '');
  const spiritedBundleMode = String(spiritedBundle.bundle_mode ?? '');
  const schemaMatch = bundleSchemaMatch(titanicBundle, spiritedBundle);
  const layerAudit = countCriticalLayerMissing(titanicBundle, spiritedBundle);
  const forbiddenRefs = [
    ...hasForbiddenRefOnlyKeys(titanicBundle),
    ...hasForbiddenRefOnlyKeys(spiritedBundle),
  ];

  if (titanicBundleMode !== FULL_EMBEDDED_BUNDLE_MODE) {
    issues.push({
      code: 'TITANIC_BUNDLE_MODE',
      message: `titanic bundle_mode expected ${FULL_EMBEDDED_BUNDLE_MODE}, got ${titanicBundleMode || 'missing'}`,
      severity: 'error',
    });
  }
  if (spiritedBundleMode !== FULL_EMBEDDED_BUNDLE_MODE) {
    issues.push({
      code: 'SPIRITED_BUNDLE_MODE',
      message: `spirited_away bundle_mode expected ${FULL_EMBEDDED_BUNDLE_MODE}, got ${spiritedBundleMode || 'missing'}`,
      severity: 'error',
    });
  }
  if (!schemaMatch) {
    issues.push({
      code: 'BUNDLE_SCHEMA_MISMATCH',
      message: 'Titanic and Spirited Away bundles do not share the same critical layer keys',
      severity: 'error',
    });
  }
  if (layerAudit.count > 0) {
    issues.push({
      code: 'CRITICAL_LAYER_MISSING',
      message: `critical_layer_missing_count=${layerAudit.count}`,
      severity: 'error',
    });
  }
  if (forbiddenRefs.length > 0) {
    issues.push({
      code: 'REF_ONLY_FORBIDDEN',
      message: `Ref-only keys remain: ${forbiddenRefs.join(', ')}`,
      severity: 'error',
    });
  }

  const normalizationPassed =
    precheck.precheck_passed &&
    titanicBundleMode === FULL_EMBEDDED_BUNDLE_MODE &&
    spiritedBundleMode === FULL_EMBEDDED_BUNDLE_MODE &&
    schemaMatch &&
    layerAudit.count === 0 &&
    forbiddenRefs.length === 0;

  const report: BundleNormalizationReport = {
    phase: MOVIE_BUNDLE_NORMALIZATION_PHASE,
    normalization_id: MOVIE_BUNDLE_NORMALIZATION_ID,
    generated_at: new Date().toISOString(),
    titanic_bundle_path: TITANIC_MOVIE_DATASET_BUNDLE_PATH,
    spirited_away_bundle_path: SPIRITED_AWAY_BUNDLE_PATH,
    titanic_bundle_mode: titanicBundleMode,
    spirited_away_bundle_mode: spiritedBundleMode,
    bundle_schema_match: schemaMatch,
    critical_layer_missing_count: layerAudit.count,
    critical_layers: layerAudit.layers,
    normalization_passed: normalizationPassed,
    final_verdict: normalizationPassed
      ? MOVIE_BUNDLE_NORMALIZATION_PASS_VERDICT
      : MOVIE_BUNDLE_NORMALIZATION_FAIL_VERDICT,
    issues,
    precheck: {
      precheck_passed: precheck.precheck_passed,
      ...precheck.details,
      safe_create_policy: SAFE_CREATE_POLICY,
    },
  };

  writeJson(root, MOVIE_BUNDLE_NORMALIZATION_REPORT_PATH, report);
  return report;
}
