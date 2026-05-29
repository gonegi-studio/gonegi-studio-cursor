import crypto from 'crypto';
import { buildCompactCueDataset, type CompactCinematicCue } from './buildCompactCueDataset';
import {
  buildRichCueSignalDataset,
  type RichCueSceneSignal,
  type RichCinematicSignals,
} from './buildRichCueSignals';
import {
  ESTIMATED_BRIDGED_PROMPT_BASELINE,
  resolveSceneContinuityForPrompt,
} from '../sceneContinuityResolver';

export const CONTINUITY_VALIDATION_VERSION = 'PHASE-35C-v1' as const;
export const CONTINUITY_VALIDATION_PHASE = 'PHASE-35C' as const;

export const CANONICAL_CONTINUITY_TEST_PROMPT =
  'Gonegi and Dana walk along the harbor terrace at golden hour, hopeful forward motion.';

export type SlideshowDriftRisk = 'low' | 'medium' | 'high';

export interface ContinuityValidationScores {
  camera_continuity_score: number;
  emotional_continuity_score: number;
  montage_stability_score: number;
  spatial_persistence_score: number;
  slideshow_drift_risk: SlideshowDriftRisk;
  continuity_persistence_score: number;
}

export interface ContinuityPairDiagnostics {
  from_scene_id: string;
  to_scene_id: string;
  from_scene_index: number;
  to_scene_index: number;
  camera_continuity: number;
  emotional_continuity: number;
  montage_stability: number;
  spatial_persistence: number;
  slideshow_drift_flags: string[];
}

export interface Comparison35aVs35b {
  compact_only: ContinuityValidationScores;
  compact_plus_rich: ContinuityValidationScores;
  deltas: {
    camera_continuity: number;
    emotional_continuity: number;
    montage_stability: number;
    spatial_persistence: number;
    continuity_persistence: number;
  };
  prompt_inflation: {
    modulation_char_count: number;
    estimated_bridged_baseline: number;
    inflation_ratio: number;
    within_15_percent_budget: boolean;
  };
  slideshow_drift_improved: boolean;
  rich_layer_improves_continuity: boolean;
  emotional_carryover_improved: boolean;
  montage_coherence_improved: boolean;
  camera_persistence_delta: number;
  prompt_inflation_within_budget: boolean;
}

export interface ContinuityValidationReport {
  phase: typeof CONTINUITY_VALIDATION_PHASE;
  schema_version: typeof CONTINUITY_VALIDATION_VERSION;
  generated_at: string;
  scene_count: number;
  source_layers: ['compact_cue', 'rich_cinematic_signals'];
  camera_continuity_score: number;
  emotional_continuity_score: number;
  montage_stability_score: number;
  spatial_persistence_score: number;
  slideshow_drift_risk: SlideshowDriftRisk;
  continuity_persistence_score: number;
  comparison_35a_vs_35b: Comparison35aVs35b;
  pair_diagnostics_sample: ContinuityPairDiagnostics[];
  validation_checksum: string;
  evaluation_constraints: {
    no_image_ai_scoring: true;
    no_gemini_subjective_critique: true;
    no_render_payload_expansion: true;
    no_llm_cinematic_rewrite: true;
  };
}

function round4(value: number): number {
  return Number(value.toFixed(4));
}

function clamp01(value: number): number {
  return round4(Math.min(1, Math.max(0, value)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return round4(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function readNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return fallback;
}

function tempoRank(tempo: string): number {
  const ranks: Record<string, number> = {
    adagio: 1,
    andante: 2,
    moderato: 3,
    allegro: 4,
  };
  return ranks[tempo] ?? 2;
}

function directionFamily(direction: string): string {
  if (direction.includes('forward') || direction.includes('push')) return 'forward';
  if (direction.includes('lateral') || direction.includes('drift')) return 'lateral';
  if (direction.includes('locked') || direction.includes('observation')) return 'static';
  return 'mixed';
}

function scorePairCamera35A(prev: CompactCinematicCue, next: CompactCinematicCue): number {
  const prevMotion = prev.camera_motion as Record<string, number>;
  const nextMotion = next.camera_motion as Record<string, number>;
  const keys = ['continuous_motion', 'human_tracking_bias', 'kinetic_aggression', 'static_patience'];
  const deltas = keys.map((key) => Math.abs(readNumber(prevMotion[key]) - readNumber(nextMotion[key])));
  const motionSim = 1 - average(deltas);

  const prevTransition = prev.transition_dna as Record<string, unknown>;
  const nextTransition = next.transition_dna as Record<string, unknown>;
  const logic = prevTransition.transition_logic as Record<string, number> | undefined;
  const flow = readNumber(logic?.emotion_continuity, 0.5);
  const nodeLink =
    String(prevTransition.current_node ?? '') === String(nextTransition.previous_node ?? '')
      ? 1
      : 0.55;

  return clamp01(motionSim * 0.65 + flow * 0.2 + nodeLink * 0.15);
}

function scorePairCamera35B(
  prevRich: RichCinematicSignals,
  nextRich: RichCinematicSignals
): number {
  const dirMatch =
    directionFamily(prevRich.camera_momentum.direction) ===
    directionFamily(nextRich.camera_momentum.direction)
      ? 1
      : 0.45;
  const curveMatch =
    prevRich.camera_momentum.intensity_curve === nextRich.camera_momentum.intensity_curve ? 1 : 0.7;
  const stabilityMatch =
    prevRich.camera_momentum.stability === nextRich.camera_momentum.stability ? 1 : 0.75;
  const velocityDelta = Math.abs(
    (prevRich.camera_momentum.velocity_norm ?? 0) - (nextRich.camera_momentum.velocity_norm ?? 0)
  );
  const velocitySim = clamp01(1 - Math.min(1, velocityDelta / 1.2));

  return clamp01(dirMatch * 0.35 + curveMatch * 0.2 + stabilityMatch * 0.2 + velocitySim * 0.25);
}

function scorePairEmotion35A(prev: CompactCinematicCue, next: CompactCinematicCue): number {
  const prevEmotion = prev.emotion_curve as Record<string, number>;
  const nextEmotion = next.emotion_curve as Record<string, number>;
  const keys = ['dread', 'melancholy', 'anticipation', 'catharsis_ready'];
  const deltas = keys.map((key) => Math.abs(readNumber(prevEmotion[key]) - readNumber(nextEmotion[key])));
  const curveSim = 1 - average(deltas);

  const carry = clamp01(prev.carryover_intensity);
  const bridge = prev.emotion_motion_bridge as Record<string, unknown>;
  const transitionLogic = (prev.transition_dna as Record<string, unknown>)
    ?.transition_logic as Record<string, number> | undefined;
  const continuity = readNumber(
    (bridge.emotion_continuity as number | undefined) ??
      transitionLogic?.emotion_continuity,
    0.5
  );

  return clamp01(curveSim * 0.55 + carry * 0.25 + continuity * 0.2);
}

function scorePairEmotion35B(
  prevRich: RichCinematicSignals,
  nextRich: RichCinematicSignals
): number {
  const carry = clamp01(nextRich.emotional_carryover.carry_strength);
  const moodLink =
    nextRich.emotional_carryover.from_previous_scene ===
      prevRich.emotional_carryover.from_previous_scene ||
    nextRich.emotional_carryover.from_previous_scene.includes(
      prevRich.emotional_carryover.from_previous_scene.split('_')[0] ?? ''
    )
      ? 0.85
      : 0.65;
  const transitionSoft =
    nextRich.emotional_carryover.transition_mode === 'hard_cut'
      ? 0.45
      : nextRich.emotional_carryover.transition_mode === 'soft_resolution'
        ? 1
        : 0.78;

  const energyPrev = prevRich.scene_energy_waveform;
  const energyNext = nextRich.scene_energy_waveform;
  const energySim = clamp01(
    1 -
      (Math.abs(energyPrev.end_energy - energyNext.start_energy) +
        Math.abs(energyPrev.peak_energy - energyNext.peak_energy) * 0.35) /
        2
  );

  return clamp01(carry * 0.4 + moodLink * 0.2 + transitionSoft * 0.15 + energySim * 0.25);
}

function scorePairMontage35A(prev: CompactCinematicCue, next: CompactCinematicCue): number {
  const prevPacing = prev.editing_pacing as Record<string, number>;
  const nextPacing = next.editing_pacing as Record<string, number>;
  const durationDelta = Math.abs(
    readNumber(prevPacing.avg_shot_duration) - readNumber(nextPacing.avg_shot_duration)
  );
  const rhythmDelta = Math.abs(
    readNumber(prevPacing.rhythm_uniformity) - readNumber(nextPacing.rhythm_uniformity)
  );
  const cutDelta = Math.abs(readNumber(prevPacing.cut_pressure) - readNumber(nextPacing.cut_pressure));

  const durationSim = clamp01(1 - Math.min(1, durationDelta / 8));
  const rhythmSim = clamp01(1 - rhythmDelta);
  const cutSim = clamp01(1 - cutDelta);
  const waveformSim = clamp01(
    1 -
      average(
        prev.pacing_waveform.slice(0, 6).map((value, index) => {
          const nextValue = next.pacing_waveform[index] ?? value;
          return Math.abs(value - nextValue);
        })
      )
  );

  return clamp01(durationSim * 0.3 + rhythmSim * 0.25 + cutSim * 0.2 + waveformSim * 0.25);
}

function scorePairMontage35B(
  prevRich: RichCinematicSignals,
  nextRich: RichCinematicSignals
): number {
  const tempoDelta = Math.abs(
    tempoRank(prevRich.montage_rhythm.tempo) - tempoRank(nextRich.montage_rhythm.tempo)
  );
  const tempoSim = tempoDelta === 0 ? 1 : tempoDelta === 1 ? 0.82 : 0.45;
  const cutMatch = prevRich.montage_rhythm.cut_density === nextRich.montage_rhythm.cut_density ? 1 : 0.68;
  const breathingMatch =
    prevRich.montage_rhythm.visual_breathing_room === nextRich.montage_rhythm.visual_breathing_room
      ? 1
      : 0.72;

  return clamp01(tempoSim * 0.45 + cutMatch * 0.3 + breathingMatch * 0.25);
}

function scorePairSpatial35A(prev: CompactCinematicCue, next: CompactCinematicCue): number {
  const prevBlock = prev.blocking_pattern as Record<string, unknown>;
  const nextBlock = next.blocking_pattern as Record<string, unknown>;
  const prevDom = (prevBlock.dominance ?? {}) as Record<string, unknown>;
  const nextDom = (nextBlock.dominance ?? {}) as Record<string, unknown>;
  const layerMatch = prevDom.layer_priority === nextDom.layer_priority ? 1 : 0.7;
  const occupancyDelta = Math.abs(
    readNumber(prevDom.frame_occupancy_ratio) - readNumber(nextDom.frame_occupancy_ratio)
  );
  const occupancySim = clamp01(1 - Math.min(1, occupancyDelta));

  const continuity = prev.continuity_graph as Record<string, unknown>;
  const lockBoost = continuity.continuity_lock_status === 'ACTIVE_LOCKED' ? 0.15 : 0;

  return clamp01(layerMatch * 0.45 + occupancySim * 0.4 + lockBoost);
}

function scorePairSpatial35B(
  prevRich: RichCinematicSignals,
  nextRich: RichCinematicSignals
): number {
  const anchorMatch =
    prevRich.spatial_continuity.environmental_anchor ===
    nextRich.spatial_continuity.environmental_anchor
      ? 1
      : 0.62;
  const directionMatch =
    prevRich.spatial_continuity.screen_direction === nextRich.spatial_continuity.screen_direction
      ? 1
      : nextRich.spatial_continuity.screen_direction === 'neutral_axis'
        ? 0.78
        : 0.5;
  const axisLock =
    prevRich.spatial_continuity.camera_axis_lock && nextRich.spatial_continuity.camera_axis_lock
      ? 1
      : 0.7;

  return clamp01(anchorMatch * 0.4 + directionMatch * 0.35 + axisLock * 0.25);
}

function detectPairSlideshowFlags(
  prevCue: CompactCinematicCue,
  nextCue: CompactCinematicCue,
  prevRich: RichCinematicSignals,
  nextRich: RichCinematicSignals,
  pairScores: {
    camera: number;
    emotion: number;
    montage: number;
    spatial: number;
  }
): string[] {
  const flags: string[] = [];

  if (pairScores.camera < 0.55) flags.push('camera_reset_syndrome');
  if (pairScores.emotion < 0.5) flags.push('emotion_reset_syndrome');
  if (pairScores.montage < 0.5) flags.push('tempo_discontinuity');
  if (pairScores.spatial < 0.55) flags.push('environment_anchor_break');

  if (
    nextRich.emotional_carryover.transition_mode === 'hard_cut' &&
    nextRich.emotional_carryover.carry_strength < 0.35
  ) {
    flags.push('scene_independence');
  }

  if (
    nextRich.camera_momentum.direction === 'locked_observation' &&
    prevRich.camera_momentum.direction !== 'locked_observation' &&
    pairScores.camera < 0.6
  ) {
    flags.push('generic_static_framing');
  }

  const prevTransition = prevCue.transition_dna as Record<string, unknown>;
  const nextTransition = nextCue.transition_dna as Record<string, unknown>;
  if (
    String(prevTransition.current_node ?? '') !== String(nextTransition.previous_node ?? '') &&
    nextRich.emotional_carryover.carry_strength < 0.4
  ) {
    flags.push('sequence_graph_break');
  }

  return flags;
}

function aggregateSlideshowRisk(flagCounts: Record<string, number>, pairCount: number): SlideshowDriftRisk {
  const totalFlags = Object.values(flagCounts).reduce((sum, count) => sum + count, 0);
  const rate = pairCount > 0 ? totalFlags / pairCount : 0;
  const severe =
    (flagCounts.scene_independence ?? 0) +
    (flagCounts.camera_reset_syndrome ?? 0) +
    (flagCounts.emotion_reset_syndrome ?? 0);

  if (severe >= 6 || rate >= 2.5) return 'high';
  if (severe >= 2 || rate >= 1.2) return 'medium';
  return 'low';
}

function buildLayerScores(
  cues: CompactCinematicCue[],
  richBySceneId: Map<string, RichCinematicSignals>,
  useRichLayer: boolean
): {
  scores: ContinuityValidationScores;
  pairs: ContinuityPairDiagnostics[];
  flagCounts: Record<string, number>;
} {
  const pairDiagnostics: ContinuityPairDiagnostics[] = [];
  const flagCounts: Record<string, number> = {};

  const cameraScores: number[] = [];
  const emotionScores: number[] = [];
  const montageScores: number[] = [];
  const spatialScores: number[] = [];

  for (let index = 1; index < cues.length; index += 1) {
    const prevCue = cues[index - 1];
    const nextCue = cues[index];
    const prevRich = richBySceneId.get(prevCue.scene_id);
    const nextRich = richBySceneId.get(nextCue.scene_id);
    if (!prevRich || !nextRich) continue;

    const camera = useRichLayer
      ? scorePairCamera35B(prevRich, nextRich)
      : scorePairCamera35A(prevCue, nextCue);
    const emotion = useRichLayer
      ? scorePairEmotion35B(prevRich, nextRich)
      : scorePairEmotion35A(prevCue, nextCue);
    const montage = useRichLayer
      ? scorePairMontage35B(prevRich, nextRich)
      : scorePairMontage35A(prevCue, nextCue);
    const spatial = useRichLayer
      ? scorePairSpatial35B(prevRich, nextRich)
      : scorePairSpatial35A(prevCue, nextCue);

    cameraScores.push(camera);
    emotionScores.push(emotion);
    montageScores.push(montage);
    spatialScores.push(spatial);

    const flags = detectPairSlideshowFlags(prevCue, nextCue, prevRich, nextRich, {
      camera,
      emotion,
      montage,
      spatial,
    });
    for (const flag of flags) {
      flagCounts[flag] = (flagCounts[flag] ?? 0) + 1;
    }

    pairDiagnostics.push({
      from_scene_id: prevCue.scene_id,
      to_scene_id: nextCue.scene_id,
      from_scene_index: prevCue.scene_index,
      to_scene_index: nextCue.scene_index,
      camera_continuity: camera,
      emotional_continuity: emotion,
      montage_stability: montage,
      spatial_persistence: spatial,
      slideshow_drift_flags: flags,
    });
  }

  const camera_continuity_score = average(cameraScores);
  const emotional_continuity_score = average(emotionScores);
  const montage_stability_score = average(montageScores);
  const spatial_persistence_score = average(spatialScores);
  const continuity_persistence_score = average([
    camera_continuity_score,
    emotional_continuity_score,
    montage_stability_score,
    spatial_persistence_score,
  ]);

  const slideshow_drift_risk = aggregateSlideshowRisk(flagCounts, Math.max(1, cues.length - 1));

  return {
    scores: {
      camera_continuity_score,
      emotional_continuity_score,
      montage_stability_score,
      spatial_persistence_score,
      slideshow_drift_risk,
      continuity_persistence_score,
    },
    pairs: pairDiagnostics,
    flagCounts,
  };
}

function buildPromptInflationComparison(prompt: string) {
  const continuity = resolveSceneContinuityForPrompt(prompt, {
    baselinePromptLength: ESTIMATED_BRIDGED_PROMPT_BASELINE,
  });
  const inflation_ratio = round4(
    continuity.modulation_char_count / ESTIMATED_BRIDGED_PROMPT_BASELINE
  );

  return {
    modulation_char_count: continuity.modulation_char_count,
    estimated_bridged_baseline: ESTIMATED_BRIDGED_PROMPT_BASELINE,
    inflation_ratio,
    within_15_percent_budget: inflation_ratio <= 0.15,
  };
}

function buildComparison35aVs35b(
  compactOnly: ContinuityValidationScores,
  compactPlusRich: ContinuityValidationScores,
  promptInflation: Comparison35aVs35b['prompt_inflation']
): Comparison35aVs35b {
  const riskRank: Record<SlideshowDriftRisk, number> = { low: 0, medium: 1, high: 2 };

  return {
    compact_only: compactOnly,
    compact_plus_rich: compactPlusRich,
    deltas: {
      camera_continuity: round4(
        compactPlusRich.camera_continuity_score - compactOnly.camera_continuity_score
      ),
      emotional_continuity: round4(
        compactPlusRich.emotional_continuity_score - compactOnly.emotional_continuity_score
      ),
      montage_stability: round4(
        compactPlusRich.montage_stability_score - compactOnly.montage_stability_score
      ),
      spatial_persistence: round4(
        compactPlusRich.spatial_persistence_score - compactOnly.spatial_persistence_score
      ),
      continuity_persistence: round4(
        compactPlusRich.continuity_persistence_score - compactOnly.continuity_persistence_score
      ),
    },
    prompt_inflation: promptInflation,
    slideshow_drift_improved:
      riskRank[compactPlusRich.slideshow_drift_risk] < riskRank[compactOnly.slideshow_drift_risk],
    emotional_carryover_improved: round4(
      compactPlusRich.emotional_continuity_score - compactOnly.emotional_continuity_score
    ) > 0,
    montage_coherence_improved: round4(
      compactPlusRich.montage_stability_score - compactOnly.montage_stability_score
    ) > 0,
    camera_persistence_delta: round4(
      compactPlusRich.camera_continuity_score - compactOnly.camera_continuity_score
    ),
    prompt_inflation_within_budget: promptInflation.within_15_percent_budget,
    rich_layer_improves_continuity:
      promptInflation.within_15_percent_budget &&
      (compactPlusRich.emotional_continuity_score > compactOnly.emotional_continuity_score ||
        compactPlusRich.montage_stability_score > compactOnly.montage_stability_score) &&
      riskRank[compactPlusRich.slideshow_drift_risk] <= riskRank[compactOnly.slideshow_drift_risk],
  };
}

let cachedReport: ContinuityValidationReport | null = null;

export function buildContinuityValidationReport(
  testPrompt: string = CANONICAL_CONTINUITY_TEST_PROMPT
): ContinuityValidationReport {
  if (cachedReport) return cachedReport;

  const compact = buildCompactCueDataset();
  const rich = buildRichCueSignalDataset();
  const cues = compact.export.cues;
  const richBySceneId = new Map(
    rich.signals.map((row) => [row.scene_id, row.rich_cinematic_signals])
  );

  const layer35a = buildLayerScores(cues, richBySceneId, false);
  const layer35b = buildLayerScores(cues, richBySceneId, true);
  const promptInflation = buildPromptInflationComparison(testPrompt);
  const comparison = buildComparison35aVs35b(
    layer35a.scores,
    layer35b.scores,
    promptInflation
  );

  const report: ContinuityValidationReport = {
    phase: CONTINUITY_VALIDATION_PHASE,
    schema_version: CONTINUITY_VALIDATION_VERSION,
    generated_at: new Date().toISOString(),
    scene_count: cues.length,
    source_layers: ['compact_cue', 'rich_cinematic_signals'],
    camera_continuity_score: layer35b.scores.camera_continuity_score,
    emotional_continuity_score: layer35b.scores.emotional_continuity_score,
    montage_stability_score: layer35b.scores.montage_stability_score,
    spatial_persistence_score: layer35b.scores.spatial_persistence_score,
    slideshow_drift_risk: layer35b.scores.slideshow_drift_risk,
    continuity_persistence_score: layer35b.scores.continuity_persistence_score,
    comparison_35a_vs_35b: comparison,
    pair_diagnostics_sample: layer35b.pairs,
    validation_checksum: '',
    evaluation_constraints: {
      no_image_ai_scoring: true,
      no_gemini_subjective_critique: true,
      no_render_payload_expansion: true,
      no_llm_cinematic_rewrite: true,
    },
  };

  report.validation_checksum = crypto
    .createHash('sha256')
    .update(JSON.stringify(report))
    .digest('hex');

  cachedReport = report;
  return report;
}

export function buildContinuityValidationPreview(
  testPrompt?: string
): ContinuityValidationReport {
  return buildContinuityValidationReport(testPrompt ?? CANONICAL_CONTINUITY_TEST_PROMPT);
}

export function resetContinuityValidationCache(): void {
  cachedReport = null;
}

/** Full pairwise diagnostics for PHASE-35D quality gate (rich-layer scoring). */
export function buildAllScenePairDiagnostics(useRichLayer = true): {
  pairs: ContinuityPairDiagnostics[];
  scores: ContinuityValidationScores;
} {
  const compact = buildCompactCueDataset();
  const rich = buildRichCueSignalDataset();
  const richBySceneId = new Map(
    rich.signals.map((row) => [row.scene_id, row.rich_cinematic_signals])
  );
  const layer = buildLayerScores(compact.export.cues, richBySceneId, useRichLayer);
  return { pairs: layer.pairs, scores: layer.scores };
}
