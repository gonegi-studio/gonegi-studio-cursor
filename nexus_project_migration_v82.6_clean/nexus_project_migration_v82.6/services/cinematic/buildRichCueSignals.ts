import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { CinematicExtractionResult } from '../../types';
import {
  CANONICAL_EXPORT_FILE,
  loadCanonicalExportDataset,
} from '../datasetCompletionAudit';
import { buildCompactCueDataset, COMPACT_CUE_EXPORT_PATH } from './buildCompactCueDataset';
import { compactGroundedValues } from './buildCompactCueDataset';

export const RICH_CUE_SIGNAL_VERSION = 'PHASE-35B-v1' as const;
export const RICH_CUE_EXPORT_FILENAME = 'rich-cinematic-signals.json';
export const RICH_CUE_EXPORT_PATH = 'exports/rich-cinematic-signals.json';
export const RICH_CUE_SCHEMA_PATH = 'schemas/richCinematicSignal.schema.json';
export const RICH_LAYER_MAX_INCREASE_RATIO = 0.25;

export interface RichCinematicSignals {
  camera_momentum: {
    direction: string;
    intensity_curve: string;
    stability: string;
    velocity_norm?: number;
  };
  emotional_carryover: {
    from_previous_scene: string;
    transition_mode: string;
    carry_strength: number;
  };
  montage_rhythm: {
    tempo: string;
    cut_density: string;
    visual_breathing_room: string;
  };
  scene_energy_waveform: {
    start_energy: number;
    peak_energy: number;
    end_energy: number;
  };
  spatial_continuity: {
    camera_axis_lock: boolean;
    environmental_anchor: string;
    screen_direction: string;
  };
  motion_bridge: {
    hair_motion: string;
    coat_motion: string;
    walking_sync: string;
  };
}

export interface RichCueSceneSignal {
  scene_id: string;
  scene_index: number;
  rich_cinematic_signals: RichCinematicSignals;
}

export interface RichCueSizeAudit {
  compact_cue_bytes: number;
  rich_layer_bytes: number;
  combined_bytes: number;
  increase_ratio: number;
  increase_percent: number;
  max_increase_ratio: typeof RICH_LAYER_MAX_INCREASE_RATIO;
  within_budget: boolean;
}

export interface RichCueSignalExport {
  schema_version: typeof RICH_CUE_SIGNAL_VERSION;
  phase: 'PHASE-35B';
  source_dataset: {
    file: string;
    size_bytes: number;
    scene_count: number;
  };
  generated_at: string;
  scene_count: number;
  conversion_checksum: string;
  size_audit: RichCueSizeAudit;
  signals: RichCueSceneSignal[];
}

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function readNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value != null && typeof value === 'object' && 'value' in (value as object)) {
    return readNumber((value as { value: unknown }).value, fallback);
  }
  return fallback;
}

function moodLabel(scene: CinematicExtractionResult): string {
  const mood = scene.emotional_carryover?.underlying_mood_base;
  if (mood) return String(mood);
  const dread = readNumber(scene.scene_state?.emotion?.dread);
  const melancholy = readNumber(scene.scene_state?.emotion?.melancholy);
  const anticipation = readNumber(scene.scene_state?.emotion?.anticipation);
  if (melancholy >= dread && melancholy >= anticipation) return 'lingering_melancholy';
  if (anticipation >= dread) return 'rising_anticipation';
  if (dread > 0.55) return 'tension_buildup';
  return 'neutral_cadence';
}

function deriveCameraMomentum(scene: CinematicExtractionResult): RichCinematicSignals['camera_momentum'] {
  const motion = compactGroundedValues(scene.director_dna?.camera_motion ?? {}) as Record<
    string,
    number
  >;
  const continuous = motion.continuous_motion ?? 0.5;
  const kinetic = motion.kinetic_aggression ?? 0.3;
  const staticPatience = motion.static_patience ?? 0.2;
  const velocity = readNumber(scene.scene_state?.physics?.camera_velocity_mps);

  let direction = 'lateral_drift';
  if (continuous >= 0.65 && kinetic >= 0.45) direction = 'forward_tracking';
  else if (kinetic >= 0.55) direction = 'push_in';
  else if (staticPatience >= 0.5) direction = 'locked_observation';

  let intensity_curve = 'steady';
  if (kinetic >= 0.5 && continuous >= 0.55) intensity_curve = 'slow_acceleration';
  else if (staticPatience >= 0.45) intensity_curve = 'decelerating_hold';

  const stability =
    staticPatience >= 0.4 ? 'steady' : kinetic >= 0.5 ? 'fluid' : 'handheld_soft';

  return {
    direction,
    intensity_curve,
    stability,
    velocity_norm: Number(velocity.toFixed(3)),
  };
}

function deriveEmotionalCarryover(
  scene: CinematicExtractionResult,
  previousScene?: CinematicExtractionResult
): RichCinematicSignals['emotional_carryover'] {
  const carry = scene.emotional_carryover?.carryover_intensity ?? 0;
  const emotionContinuity = scene.sequence_graph?.transition_logic?.emotion_continuity ?? 0;
  const strength = Number(Math.min(1, Math.max(carry, emotionContinuity)).toFixed(3));

  const fromPrevious = previousScene
    ? moodLabel(previousScene)
    : scene.sequence_graph?.previous_node
      ? 'sequence_inherited'
      : 'opening_beat';

  let transition_mode = 'hard_cut';
  if (strength >= 0.75) transition_mode = 'soft_resolution';
  else if (strength >= 0.5) transition_mode = 'overlap_dissolve';
  else if (strength >= 0.3) transition_mode = 'match_cut';

  return {
    from_previous_scene: fromPrevious,
    transition_mode,
    carry_strength: strength,
  };
}

function deriveMontageRhythm(scene: CinematicExtractionResult): RichCinematicSignals['montage_rhythm'] {
  const pacing = compactGroundedValues(scene.director_dna?.editing_pacing ?? {}) as Record<
    string,
    number
  >;
  const avgDuration = pacing.avg_shot_duration ?? 5;
  const montageIntensity = pacing.montage_intensity ?? 0;
  const cutPressure = pacing.cut_pressure ?? 0.2;
  const rhythmUniformity = pacing.rhythm_uniformity ?? 0.8;

  let tempo = 'andante';
  if (avgDuration >= 6.5 && montageIntensity < 0.2) tempo = 'adagio';
  else if (montageIntensity >= 0.45 || cutPressure >= 0.55) tempo = 'allegro';
  else if (avgDuration <= 3.5) tempo = 'moderato';

  const cut_density =
    cutPressure >= 0.55 || montageIntensity >= 0.5
      ? 'high'
      : cutPressure <= 0.2
        ? 'low'
        : 'medium';

  const visual_breathing_room =
    rhythmUniformity >= 0.8 && cut_density === 'low'
      ? 'high'
      : cut_density === 'high'
        ? 'low'
        : 'medium';

  return { tempo, cut_density, visual_breathing_room };
}

function deriveEnergyWaveform(scene: CinematicExtractionResult): RichCinematicSignals['scene_energy_waveform'] {
  const emotion = compactGroundedValues(scene.scene_state?.emotion ?? {}) as Record<string, number>;
  const dread = emotion.dread ?? 0;
  const melancholy = emotion.melancholy ?? 0;
  const anticipation = emotion.anticipation ?? 0;
  const catharsis = emotion.catharsis_ready ?? 0;
  const waveform = scene.scene_state?.temporal?.pacing_waveform ?? [];

  const base = Number(((dread + melancholy + anticipation) / 3).toFixed(3));
  const peak = Number(
    Math.min(1, Math.max(base, catharsis, ...waveform.slice(0, 6))).toFixed(3)
  );
  const start = Number(Math.max(0, base - 0.12).toFixed(3));
  const end = Number(Math.max(0, (base + anticipation * 0.2 - dread * 0.1)).toFixed(3));

  return {
    start_energy: start,
    peak_energy: peak,
    end_energy: end,
  };
}

function deriveEnvironmentalAnchor(scene: CinematicExtractionResult): string {
  const tokens = scene.layers?.scene_language?.environment_tokens ?? [];
  const narrative = scene.scene_indexing?.shot_purpose?.join(' ') ?? '';
  const haystack = `${tokens.join(' ')} ${narrative}`.toLowerCase();
  const hasWalkBeat = (scene.relationship_graph ?? []).some((edge) => {
    const blob = `${edge.subject} ${edge.predicate ?? ''} ${edge.object ?? ''} ${edge.relation ?? ''}`.toLowerCase();
    return blob.includes('walk') || blob.includes('stride') || blob.includes('companion');
  });
  if (
    haystack.includes('harbor') ||
    haystack.includes('terrace') ||
    haystack.includes('dock') ||
    (haystack.includes('environmental') && hasWalkBeat)
  ) {
    return 'harbor_terrace';
  }
  if (haystack.includes('market') || haystack.includes('plaza')) return 'village_plaza';
  if (haystack.includes('window') || haystack.includes('interior')) return 'interior_window';
  if (haystack.includes('rain') || haystack.includes('street')) return 'rain_street';
  if (haystack.includes('dream') || haystack.includes('memory')) return 'dream_memory_haze';
  return slugAnchor(scene.scene_indexing?.director_family ?? scene.category ?? 'cinematic_space');
}

function slugAnchor(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

function deriveSpatialContinuity(scene: CinematicExtractionResult): RichCinematicSignals['spatial_continuity'] {
  const continuity = scene.continuity_memory;
  const axisLock =
    continuity?.continuity_lock_status === 'ACTIVE_LOCKED' ||
    readNumber(scene.director_dna?.composition_logic?.spatial_honesty) >= 0.9;

  const screen_direction =
    readNumber(scene.scene_state?.physics?.camera_velocity_mps) >= 0.4
      ? 'left_to_right'
      : readNumber(scene.scene_state?.physics?.camera_velocity_mps) <= -0.05
        ? 'right_to_left'
        : 'neutral_axis';

  return {
    camera_axis_lock: axisLock,
    environmental_anchor: deriveEnvironmentalAnchor(scene),
    screen_direction,
  };
}

function deriveMotionBridge(scene: CinematicExtractionResult): RichCinematicSignals['motion_bridge'] {
  const rhythm = scene.camera_rhythm_memory;
  const motionDensity = readNumber(scene.scene_state?.physics?.motion_density);
  const frameRate = rhythm?.frame_rate_hz ?? 24;

  const hair_motion =
    motionDensity >= 0.55
      ? 'active_wind_sweep'
      : motionDensity >= 0.3
        ? 'gentle_sea_breeze'
        : 'still_air';

  const coat_motion =
    readNumber(scene.director_dna?.camera_motion?.continuous_motion) >= 0.6
      ? 'soft_trailing'
      : 'minimal_fold';

  const walking_sync =
    rhythm?.rhythm_continuity != null && rhythm.rhythm_continuity >= 0.9
      ? 'matched_cadence'
      : frameRate >= 24
        ? 'paced_stride'
        : 'ambient_drift';

  return { hair_motion, coat_motion, walking_sync };
}

export function extractRichCinematicSignals(
  scene: CinematicExtractionResult,
  sceneIndex: number,
  previousScene?: CinematicExtractionResult
): RichCueSceneSignal {
  return {
    scene_id: scene.scene_indexing?.scene_id ?? scene.id,
    scene_index: sceneIndex,
    rich_cinematic_signals: {
      camera_momentum: deriveCameraMomentum(scene),
      emotional_carryover: deriveEmotionalCarryover(scene, previousScene),
      montage_rhythm: deriveMontageRhythm(scene),
      scene_energy_waveform: deriveEnergyWaveform(scene),
      spatial_continuity: deriveSpatialContinuity(scene),
      motion_bridge: deriveMotionBridge(scene),
    },
  };
}

function buildSizeAudit(richLayerBytes: number, rootDir: string): RichCueSizeAudit {
  const compactPath = path.join(rootDir, COMPACT_CUE_EXPORT_PATH);
  let compact_cue_bytes = Buffer.byteLength(
    JSON.stringify(buildCompactCueDataset(rootDir).export),
    'utf8'
  );

  if (fs.existsSync(compactPath)) {
    compact_cue_bytes = fs.statSync(compactPath).size;
  }

  const rich_layer_bytes = richLayerBytes;

  const combined_bytes = compact_cue_bytes + rich_layer_bytes;
  const increase_ratio =
    compact_cue_bytes > 0 ? rich_layer_bytes / compact_cue_bytes : 0;

  return {
    compact_cue_bytes,
    rich_layer_bytes,
    combined_bytes,
    increase_ratio: Number(increase_ratio.toFixed(6)),
    increase_percent: Number((increase_ratio * 100).toFixed(2)),
    max_increase_ratio: RICH_LAYER_MAX_INCREASE_RATIO,
    within_budget: increase_ratio <= RICH_LAYER_MAX_INCREASE_RATIO,
  };
}

let cachedRichBuild: RichCueSignalExport | null = null;

export function buildRichCueSignalDataset(rootDir = process.cwd()): RichCueSignalExport {
  if (cachedRichBuild) return cachedRichBuild;

  const { dataset, source_file, size_bytes } = loadCanonicalExportDataset();
  const signals: RichCueSceneSignal[] = [];

  for (let index = 0; index < dataset.length; index += 1) {
    const scene = dataset[index];
    const previous = index > 0 ? dataset[index - 1] : undefined;
    signals.push(extractRichCinematicSignals(scene, index, previous));
  }

  const exportPayload: RichCueSignalExport = {
    schema_version: RICH_CUE_SIGNAL_VERSION,
    phase: 'PHASE-35B',
    source_dataset: {
      file: source_file,
      size_bytes,
      scene_count: dataset.length,
    },
    generated_at: new Date().toISOString(),
    scene_count: signals.length,
    conversion_checksum: '',
    size_audit: {
      compact_cue_bytes: 0,
      rich_layer_bytes: 0,
      combined_bytes: 0,
      increase_ratio: 0,
      increase_percent: 0,
      max_increase_ratio: RICH_LAYER_MAX_INCREASE_RATIO,
      within_budget: true,
    },
    signals,
  };

  const serializedWithoutAudit = JSON.stringify({ ...exportPayload, size_audit: null });
  const richLayerBytes = Buffer.byteLength(serializedWithoutAudit, 'utf8');
  exportPayload.size_audit = buildSizeAudit(richLayerBytes, rootDir);
  exportPayload.conversion_checksum = digest([
    RICH_CUE_SIGNAL_VERSION,
    String(size_bytes),
    JSON.stringify(exportPayload),
  ]);

  cachedRichBuild = exportPayload;
  return cachedRichBuild;
}

export function buildRichCueSignalPreview(rootDir = process.cwd()) {
  const datasetExport = buildRichCueSignalDataset(rootDir);
  const signals = datasetExport.signals;

  const cameraDirections: Record<string, number> = {};
  const transitionModes: Record<string, number> = {};
  const tempos: Record<string, number> = {};
  const anchors: Record<string, number> = {};
  let carrySum = 0;
  let energyPeakSum = 0;

  for (const row of signals) {
    const rich = row.rich_cinematic_signals;
    cameraDirections[rich.camera_momentum.direction] =
      (cameraDirections[rich.camera_momentum.direction] ?? 0) + 1;
    transitionModes[rich.emotional_carryover.transition_mode] =
      (transitionModes[rich.emotional_carryover.transition_mode] ?? 0) + 1;
    tempos[rich.montage_rhythm.tempo] = (tempos[rich.montage_rhythm.tempo] ?? 0) + 1;
    anchors[rich.spatial_continuity.environmental_anchor] =
      (anchors[rich.spatial_continuity.environmental_anchor] ?? 0) + 1;
    carrySum += rich.emotional_carryover.carry_strength;
    energyPeakSum += rich.scene_energy_waveform.peak_energy;
  }

  const sceneCount = signals.length;

  return {
    phase: 'PHASE-35B' as const,
    schema_version: RICH_CUE_SIGNAL_VERSION,
    schema_path: RICH_CUE_SCHEMA_PATH,
    scene_count: sceneCount,
    source_dataset: datasetExport.source_dataset,
    size_audit: datasetExport.size_audit,
    camera_momentum_coverage: {
      scenes_with_signals: sceneCount,
      direction_distribution: cameraDirections,
    },
    emotion_carryover_coverage: {
      scenes_with_carryover: sceneCount,
      avg_carry_strength: sceneCount > 0 ? Number((carrySum / sceneCount).toFixed(4)) : 0,
      transition_mode_distribution: transitionModes,
    },
    montage_rhythm_stats: {
      tempo_distribution: tempos,
      scenes_with_montage_rhythm: sceneCount,
    },
    energy_waveform_stats: {
      scenes_with_waveform: sceneCount,
      avg_peak_energy: sceneCount > 0 ? Number((energyPeakSum / sceneCount).toFixed(4)) : 0,
    },
    spatial_continuity_stats: {
      environmental_anchor_distribution: anchors,
      axis_locked_scenes: signals.filter(
        (row) => row.rich_cinematic_signals.spatial_continuity.camera_axis_lock
      ).length,
    },
    sample_signals: signals.slice(0, 2),
    export_path: RICH_CUE_EXPORT_PATH,
    export_filename: RICH_CUE_EXPORT_FILENAME,
    readonly_source: CANONICAL_EXPORT_FILE,
    comparison_35a_vs_35b: {
      compact_cue_bytes: datasetExport.size_audit.compact_cue_bytes,
      rich_layer_bytes: datasetExport.size_audit.rich_layer_bytes,
      increase_percent: datasetExport.size_audit.increase_percent,
      within_25_percent_budget: datasetExport.size_audit.within_budget,
    },
    generated_at: datasetExport.generated_at,
  };
}

function writeRichCueExportArtifact(serialized: string, rootDir: string): void {
  const exportsDir = path.join(rootDir, 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(exportsDir, RICH_CUE_EXPORT_FILENAME), serialized, 'utf8');
}

export function buildRichCueSignalExportDownload(rootDir = process.cwd()): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const datasetExport = buildRichCueSignalDataset(rootDir);
  const body = JSON.stringify(datasetExport, null, 2);
  writeRichCueExportArtifact(body, rootDir);

  return {
    filename: RICH_CUE_EXPORT_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: digest([body]),
  };
}

export function getRichCueSignalBySceneId(sceneId: string): RichCueSceneSignal | null {
  const dataset = buildRichCueSignalDataset();
  return dataset.signals.find((row) => row.scene_id === sceneId) ?? null;
}

export function resetRichCueSignalCache(): void {
  cachedRichBuild = null;
}
