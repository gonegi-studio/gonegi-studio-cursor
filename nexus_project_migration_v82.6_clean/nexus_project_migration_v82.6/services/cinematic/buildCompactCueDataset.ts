import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { CinematicExtractionResult } from '../../types';
import {
  CANONICAL_EXPORT_FILE,
  loadCanonicalExportDataset,
} from '../datasetCompletionAudit';

export const COMPACT_CUE_DATASET_VERSION = 'PHASE-35A-v1' as const;
export const COMPACT_CUE_EXPORT_FILENAME = 'compact-cinematic-cues.json';
export const COMPACT_CUE_EXPORT_PATH = 'exports/compact-cinematic-cues.json';
export const COMPACT_CUE_SCHEMA_PATH = 'schemas/compactCinematicCue.schema.json';

/** Top-level source fields stripped by PHASE-35A (render/runtime/engine/orchestration). */
export const REMOVED_TOP_LEVEL_FIELDS = [
  'generative_layer',
  'generation_cache',
  'latent_steering',
  'production_v72',
  'production_v82',
  'recursive_merge_state',
  'validation_metrics',
  'audit_metrics',
  'canonical_dna',
  'generation_validation',
  'human_semantic_bridge',
  'layers',
  'visual_atoms',
  'confidence_profile',
  'schema_migration_history',
  'pipeline_v22_6',
  'feedback_calibration',
  'golden_record',
  'audit_summary',
  'schema_meta',
  'analysis_timestamp',
  'source_hash',
  'core_dna_id',
] as const;

export interface CompactCinematicCue {
  scene_id: string;
  scene_index: number;
  scene_pack_id: string;
  beat_order: number;
  shot_purpose: string[];
  narrative_intent: string;
  shot_fingerprint: {
    composition_hash?: string;
    lighting_hash?: string;
    motion_hash?: string;
    palette_hash?: string;
  };
  camera_motion: Record<string, unknown>;
  lens_language: Record<string, unknown>;
  focus_behavior: Record<string, unknown>;
  blocking_pattern: Record<string, unknown>;
  transition_dna: Record<string, unknown>;
  editing_pacing: Record<string, unknown>;
  pacing_waveform: number[];
  tempo_signature: string;
  emotion_motion_bridge: Record<string, unknown>;
  emotion_curve: Record<string, unknown>;
  carryover_intensity: number;
  emotional_decay_tau: number | null;
  continuity_graph: Record<string, unknown>;
  motif_graph: Record<string, unknown>;
  relationship_graph_compressed: Array<{
    subject: string;
    predicate?: string;
    object?: string;
    relation?: string;
    target?: string;
    weight?: number;
  }>;
}

export interface CompactCueDatasetExport {
  schema_version: typeof COMPACT_CUE_DATASET_VERSION;
  phase: 'PHASE-35A';
  source_dataset: {
    file: string;
    size_bytes: number;
    scene_count: number;
  };
  generated_at: string;
  scene_count: number;
  conversion_checksum: string;
  cues: CompactCinematicCue[];
}

export interface CompactCueCameraGrammarStats {
  scenes_with_camera_motion: number;
  scenes_with_lens_language: number;
  scenes_with_focus_behavior: number;
  scenes_with_blocking_pattern: number;
  unique_director_families: string[];
}

export interface CompactCueTransitionStats {
  scenes_with_transition_logic: number;
  scenes_with_next_candidates: number;
  avg_next_candidate_count: number;
}

export interface CompactCueEmotionMotionStats {
  scenes_with_carryover: number;
  scenes_with_emotion_curve: number;
  scenes_with_emotion_motion_bridge: number;
  avg_carryover_intensity: number;
}

export interface CompactCueSizeReduction {
  source_bytes: number;
  compact_bytes: number;
  reduction_bytes: number;
  reduction_ratio: number;
  reduction_percent: number;
}

export interface CompactCueConversionAudit {
  schema_path: string;
  removed_fields: string[];
  removed_field_scene_coverage: Record<string, number>;
  cue_size_reduction: CompactCueSizeReduction;
  camera_grammar_stats: CompactCueCameraGrammarStats;
  transition_stats: CompactCueTransitionStats;
  emotion_motion_stats: CompactCueEmotionMotionStats;
}

export interface CompactCueBuildResult {
  export: CompactCueDatasetExport;
  audit: CompactCueConversionAudit;
}

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Collapse GroundedValue trees to plain values for cue-only storage. */
export function compactGroundedValues<T = unknown>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => compactGroundedValues(item)) as T;
  }
  if (!isRecord(input)) return input;

  if ('value' in input && (typeof input.confidence === 'number' || typeof input.source === 'string')) {
    return compactGroundedValues(input.value) as T;
  }

  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    output[key] = compactGroundedValues(value);
  }
  return output as T;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function deriveScenePackId(scene: CinematicExtractionResult, sceneIndex: number): string {
  const category = scene.category?.trim();
  const family = scene.scene_indexing?.director_family?.trim();
  if (category && family) {
    return `${slugify(category)}-${slugify(family)}`;
  }
  if (family) return `pack-${slugify(family)}`;
  const sceneId = scene.scene_indexing?.scene_id ?? scene.id;
  return `pack-${slugify(sceneId)}-${sceneIndex + 1}`;
}

function deriveNarrativeIntent(scene: CinematicExtractionResult): string {
  const purpose = scene.scene_indexing?.shot_purpose?.join(', ');
  const narrative =
    scene.production_v82?.narrative_causality?.purpose ??
    scene.production_v72?.narrative_causality?.purpose;
  if (purpose && narrative) return `${purpose} | ${narrative}`;
  if (purpose) return purpose;
  if (narrative) return String(narrative);
  return scene.scene_indexing?.director_family ?? 'cinematic_beat';
}

function buildShotFingerprint(scene: CinematicExtractionResult): CompactCinematicCue['shot_fingerprint'] {
  if (scene.shot_fingerprint) {
    return { ...scene.shot_fingerprint };
  }

  const palette =
    scene.scene_state?.physics?.chroma_intensity != null
      ? digest([String(compactGroundedValues(scene.scene_state.physics.chroma_intensity))])
      : undefined;

  return {
    composition_hash: digest([
      scene.scene_indexing?.scene_id ?? scene.id,
      'composition',
    ]).slice(0, 16),
    lighting_hash: digest([
      String(compactGroundedValues(scene.director_dna?.lighting_behavior ?? {})),
      'lighting',
    ]).slice(0, 16),
    motion_hash: digest([
      String(compactGroundedValues(scene.director_dna?.camera_motion ?? {})),
      'motion',
    ]).slice(0, 16),
    palette_hash: palette?.slice(0, 16),
  };
}

function buildTransitionDna(scene: CinematicExtractionResult): Record<string, unknown> {
  const graph = scene.sequence_graph;
  return compactGroundedValues({
    previous_node: graph?.previous_node ?? null,
    current_node: graph?.current_node ?? scene.scene_indexing?.scene_id ?? scene.id,
    next_candidates: graph?.next_candidates ?? [],
    transition_logic: graph?.transition_logic ?? null,
    transition_rules: graph?.transition_rules ?? null,
  });
}

function buildEmotionMotionBridge(scene: CinematicExtractionResult): Record<string, unknown> {
  return compactGroundedValues({
    emotional_carryover: scene.emotional_carryover ?? null,
    camera_rhythm_memory: scene.camera_rhythm_memory ?? null,
    emotion_continuity: scene.sequence_graph?.transition_logic?.emotion_continuity ?? null,
  });
}

function compressRelationshipGraph(
  scene: CinematicExtractionResult
): CompactCinematicCue['relationship_graph_compressed'] {
  return (scene.relationship_graph ?? []).map((edge) => ({
    subject: edge.subject,
    predicate: edge.predicate,
    object: edge.object,
    relation: edge.relation,
    target: edge.target,
    weight: edge.weight,
  }));
}

export function convertSceneToCompactCue(
  scene: CinematicExtractionResult,
  sceneIndex: number
): CompactCinematicCue {
  const director = scene.director_dna;
  const temporalBridge =
    scene.production_v82?.temporal_bridge ??
    scene.production_v72?.temporal_bridge ??
    scene.temporal_bridge;

  const decayTau = temporalBridge?.emotional_decay_tau;
  const emotionalDecayTau =
    typeof decayTau === 'number'
      ? decayTau
      : decayTau != null
        ? Number(compactGroundedValues(decayTau))
        : scene.emotional_carryover?.decay_ratio_per_frame != null
          ? 1 / Math.max(scene.emotional_carryover.decay_ratio_per_frame, 0.001)
          : null;

  return {
    scene_id: scene.scene_indexing?.scene_id ?? scene.id,
    scene_index: sceneIndex,
    scene_pack_id: deriveScenePackId(scene, sceneIndex),
    beat_order: scene.production_v82?.sequence_context?.shot_index ?? sceneIndex + 1,
    shot_purpose: [...(scene.scene_indexing?.shot_purpose ?? [])],
    narrative_intent: deriveNarrativeIntent(scene),
    shot_fingerprint: buildShotFingerprint(scene),
    camera_motion: compactGroundedValues(director?.camera_motion ?? {}),
    lens_language: compactGroundedValues(director?.lens_behavior ?? {}),
    focus_behavior: compactGroundedValues(scene.scene_state?.optics ?? {}),
    blocking_pattern: compactGroundedValues({
      composition_logic: director?.composition_logic ?? {},
      dominance: director?.composition_logic?.dominance ?? null,
    }),
    transition_dna: buildTransitionDna(scene),
    editing_pacing: compactGroundedValues(director?.editing_pacing ?? {}),
    pacing_waveform: [...(scene.scene_state?.temporal?.pacing_waveform ?? [])],
    tempo_signature: String(
      compactGroundedValues(
        scene.scene_state?.temporal?.time_tension_curve ?? 'steady_temporal_cadence'
      )
    ),
    emotion_motion_bridge: buildEmotionMotionBridge(scene),
    emotion_curve: compactGroundedValues(scene.scene_state?.emotion ?? {}),
    carryover_intensity: scene.emotional_carryover?.carryover_intensity ?? 0,
    emotional_decay_tau: Number.isFinite(emotionalDecayTau as number)
      ? (emotionalDecayTau as number)
      : null,
    continuity_graph: compactGroundedValues(scene.continuity_memory ?? {}),
    motif_graph: compactGroundedValues(scene.motif_persistence ?? {}),
    relationship_graph_compressed: compressRelationshipGraph(scene),
  };
}

function buildRemovedFieldCoverage(
  scenes: CinematicExtractionResult[]
): Record<string, number> {
  const coverage: Record<string, number> = {};
  for (const field of REMOVED_TOP_LEVEL_FIELDS) {
    coverage[field] = 0;
  }

  for (const scene of scenes) {
    for (const field of REMOVED_TOP_LEVEL_FIELDS) {
      if (field in scene && (scene as Record<string, unknown>)[field] !== undefined) {
        coverage[field] += 1;
      }
    }
  }

  return coverage;
}

function buildAudit(
  scenes: CinematicExtractionResult[],
  cues: CompactCinematicCue[],
  sourceBytes: number,
  compactBytes: number
): CompactCueConversionAudit {
  const directorFamilies = new Set<string>();
  let transitionLogic = 0;
  let nextCandidates = 0;
  let nextCandidateTotal = 0;
  let carryover = 0;
  let emotionCurve = 0;
  let emotionBridge = 0;
  let carryoverSum = 0;

  for (const scene of scenes) {
    const family = scene.scene_indexing?.director_family;
    if (family) directorFamilies.add(family);
    if (scene.sequence_graph?.transition_logic) transitionLogic += 1;
    const candidates = scene.sequence_graph?.next_candidates ?? [];
    if (candidates.length > 0) {
      nextCandidates += 1;
      nextCandidateTotal += candidates.length;
    }
    if (scene.emotional_carryover) carryover += 1;
    if (scene.scene_state?.emotion) emotionCurve += 1;
  }

  for (const cue of cues) {
    if (Object.keys(cue.emotion_motion_bridge).length > 0) emotionBridge += 1;
    carryoverSum += cue.carryover_intensity;
  }

  const reductionBytes = Math.max(0, sourceBytes - compactBytes);
  const reductionRatio = sourceBytes > 0 ? reductionBytes / sourceBytes : 0;

  return {
    schema_path: COMPACT_CUE_SCHEMA_PATH,
    removed_fields: [...REMOVED_TOP_LEVEL_FIELDS],
    removed_field_scene_coverage: buildRemovedFieldCoverage(scenes),
    cue_size_reduction: {
      source_bytes: sourceBytes,
      compact_bytes: compactBytes,
      reduction_bytes: reductionBytes,
      reduction_ratio: Number(reductionRatio.toFixed(6)),
      reduction_percent: Number((reductionRatio * 100).toFixed(2)),
    },
    camera_grammar_stats: {
      scenes_with_camera_motion: cues.filter((c) => Object.keys(c.camera_motion).length > 0).length,
      scenes_with_lens_language: cues.filter((c) => Object.keys(c.lens_language).length > 0).length,
      scenes_with_focus_behavior: cues.filter((c) => Object.keys(c.focus_behavior).length > 0).length,
      scenes_with_blocking_pattern: cues.filter((c) => Object.keys(c.blocking_pattern).length > 0)
        .length,
      unique_director_families: [...directorFamilies].sort(),
    },
    transition_stats: {
      scenes_with_transition_logic: transitionLogic,
      scenes_with_next_candidates: nextCandidates,
      avg_next_candidate_count:
        scenes.length > 0 ? Number((nextCandidateTotal / scenes.length).toFixed(3)) : 0,
    },
    emotion_motion_stats: {
      scenes_with_carryover: carryover,
      scenes_with_emotion_curve: emotionCurve,
      scenes_with_emotion_motion_bridge: emotionBridge,
      avg_carryover_intensity:
        cues.length > 0 ? Number((carryoverSum / cues.length).toFixed(4)) : 0,
    },
  };
}

let cachedBuild: CompactCueBuildResult | null = null;

export function buildCompactCueDataset(rootDir = process.cwd()): CompactCueBuildResult {
  if (cachedBuild) return cachedBuild;

  const { dataset, source_file, size_bytes } = loadCanonicalExportDataset();
  const cues = dataset.map((scene, index) => convertSceneToCompactCue(scene, index));

  const exportPayload: CompactCueDatasetExport = {
    schema_version: COMPACT_CUE_DATASET_VERSION,
    phase: 'PHASE-35A',
    source_dataset: {
      file: source_file,
      size_bytes,
      scene_count: dataset.length,
    },
    generated_at: new Date().toISOString(),
    scene_count: cues.length,
    conversion_checksum: '',
    cues,
  };

  exportPayload.conversion_checksum = digest([
    COMPACT_CUE_DATASET_VERSION,
    String(size_bytes),
    JSON.stringify(cues),
  ]);

  const compactSerialized = JSON.stringify(exportPayload);
  const compactBytes = Buffer.byteLength(compactSerialized, 'utf8');
  const audit = buildAudit(dataset, cues, size_bytes, compactBytes);

  cachedBuild = { export: exportPayload, audit };
  return cachedBuild;
}

export function buildCompactCueDatasetPreview() {
  const { export: datasetExport, audit } = buildCompactCueDataset();

  return {
    phase: 'PHASE-35A' as const,
    schema_version: COMPACT_CUE_DATASET_VERSION,
    schema_path: COMPACT_CUE_SCHEMA_PATH,
    source_dataset: datasetExport.source_dataset,
    scene_count: datasetExport.scene_count,
    conversion_checksum: datasetExport.conversion_checksum,
    removed_fields: audit.removed_fields,
    removed_field_scene_coverage: audit.removed_field_scene_coverage,
    cue_size_reduction: audit.cue_size_reduction,
    camera_grammar_stats: audit.camera_grammar_stats,
    transition_stats: audit.transition_stats,
    emotion_motion_stats: audit.emotion_motion_stats,
    export_path: COMPACT_CUE_EXPORT_PATH,
    export_filename: COMPACT_CUE_EXPORT_FILENAME,
    readonly_source: CANONICAL_EXPORT_FILE,
    sample_cues: datasetExport.cues.slice(0, 2),
    pipeline_connections_disabled: {
      music_drama: true,
      generate_optimized_image: true,
      prompt_bridge: true,
      single_canvas: true,
      gemini_scenario_expansion: true,
    },
    generated_at: datasetExport.generated_at,
  };
}

function writeCompactCueExportArtifact(serialized: string, rootDir: string): void {
  const exportsDir = path.join(rootDir, 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(exportsDir, COMPACT_CUE_EXPORT_FILENAME), serialized, 'utf8');
}

export function buildCompactCueDatasetExportDownload(rootDir = process.cwd()): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const { export: datasetExport } = buildCompactCueDataset();
  const body = JSON.stringify(datasetExport, null, 2);
  writeCompactCueExportArtifact(body, rootDir);

  return {
    filename: COMPACT_CUE_EXPORT_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: digest([body]),
  };
}

export function resetCompactCueDatasetCache(): void {
  cachedBuild = null;
}
