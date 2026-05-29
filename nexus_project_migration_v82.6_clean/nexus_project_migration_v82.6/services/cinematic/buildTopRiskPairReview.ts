import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { CompactCinematicCue } from './buildCompactCueDataset';
import { buildCompactCueDataset } from './buildCompactCueDataset';
import { buildRichCueSignalDataset, type RichCinematicSignals } from './buildRichCueSignals';
import { buildAllScenePairDiagnostics } from './buildContinuityValidationReport';
import {
  buildCueQualityGatePreview,
  type GateStatus,
  type ScenePairQualityRecord,
} from './buildCueQualityGate';

export const TOP_RISK_PAIR_REVIEW_VERSION = 'PHASE-35E-v1' as const;
export const TOP_RISK_PAIR_REVIEW_PHASE = 'PHASE-35E' as const;
export const TOP_RISK_PAIR_REVIEW_REPORT_FILENAME = 'top-risk-pair-review.json';
export const TOP_RISK_PAIR_REVIEW_REPORT_PATH = 'exports/top-risk-pair-review.json';
export const DEFAULT_TOP_RISK_PAIR_COUNT = 5;

type ContinuityDimension = 'camera' | 'emotion' | 'montage' | 'spatial';

export interface CueSceneSummary {
  scene_id: string;
  scene_index: number;
  scene_pack_id: string;
  narrative_intent: string;
  shot_purpose: string[];
  tempo_signature: string;
  carryover_intensity: number;
}

export interface RichSignalFieldDelta {
  from: string | number | boolean;
  to: string | number | boolean;
  delta?: string | number;
}

export interface RichSignalDelta {
  camera_momentum: {
    direction: RichSignalFieldDelta;
    intensity_curve: RichSignalFieldDelta;
    stability: RichSignalFieldDelta;
    velocity_norm: RichSignalFieldDelta;
  };
  emotional_carryover: {
    from_previous_scene: RichSignalFieldDelta;
    transition_mode: RichSignalFieldDelta;
    carry_strength: RichSignalFieldDelta;
  };
  montage_rhythm: {
    tempo: RichSignalFieldDelta;
    cut_density: RichSignalFieldDelta;
    visual_breathing_room: RichSignalFieldDelta;
  };
  spatial_continuity: {
    environmental_anchor: RichSignalFieldDelta;
    screen_direction: RichSignalFieldDelta;
    camera_axis_lock: RichSignalFieldDelta;
  };
  scene_energy_waveform: {
    end_to_start_energy: RichSignalFieldDelta;
    peak_energy: RichSignalFieldDelta;
  };
}

export interface TopRiskPairDetailedReview {
  pair_id: string;
  from_scene_id: string;
  to_scene_id: string;
  from_scene_index: number;
  to_scene_index: number;
  pair_quality_score: number;
  quality_tier: string;
  score_breakdown: {
    camera_continuity: number;
    emotional_continuity: number;
    montage_stability: number;
    spatial_persistence: number;
  };
  weakest_dimension: ContinuityDimension;
  weakest_dimension_score: number;
  issue_flags: string[];
  advisory_flags: string[];
  previous_scene_cue_summary: CueSceneSummary;
  next_scene_cue_summary: CueSceneSummary;
  rich_signal_delta: RichSignalDelta;
  suggested_human_review_note: string;
  repair_hints: string[];
  rank: number;
}

export interface TopRiskPairReviewPreview {
  phase: typeof TOP_RISK_PAIR_REVIEW_PHASE;
  schema_version: typeof TOP_RISK_PAIR_REVIEW_VERSION;
  scene_count: number;
  pair_count: number;
  top_risk_pair_count: number;
  gate_status: GateStatus;
  gate_reference: ReturnType<typeof buildCueQualityGatePreview>['gate_checks'];
  top_risk_pairs: TopRiskPairDetailedReview[];
  focus_pair_verification: {
    pair_id: string;
    visible_in_top_risk: boolean;
    camera_continuity: number | null;
    weak_camera_bridge_visible: boolean;
    human_readable_repair_hint_present: boolean;
  } | null;
  diagnosis_only: true;
  no_auto_fix: true;
  generated_at: string;
}

export interface TopRiskPairReviewReportExport extends TopRiskPairReviewPreview {
  report_checksum: string;
}

const HUMAN_REVIEW_HINTS: Record<string, string> = {
  weak_camera_bridge:
    'Camera grammar drops across this cut — verify tracking direction and momentum before approving longform continuity.',
  direction_reversal:
    'Camera direction reverses between scenes — confirm intentional axis shift or add a bridging camera move.',
  momentum_collapse:
    'Camera velocity cadence collapses — consider matching motion curve to previous scene.',
  axis_jump:
    'Camera axis lock breaks on the incoming scene — review spatial continuity with storyboard.',
  camera_reset:
    'Framing resets like a slideshow cut — preserve camera momentum through the transition.',
  emotion_reset:
    'Emotional carryover resets — verify mood bridge matches narrative intent.',
  carryover_collapse:
    'Carry strength is low — increase emotional_carryover before this pair in editorial review.',
  tempo_discontinuity:
    'Montage tempo jumps sharply — align tempo or add breathing-room cut pattern.',
  environment_anchor_loss:
    'Environment anchor changes with weak spatial score — confirm location jump is intentional.',
  screen_direction_flip:
    'Screen direction flips — check eyeline and walking vector continuity.',
};

function round4(value: number): number {
  return Number(value.toFixed(4));
}

function pairLabel(fromIndex: number, toIndex: number): string {
  return `scene_${String(fromIndex + 1).padStart(2, '0')} -> scene_${String(toIndex + 1).padStart(2, '0')}`;
}

function fieldDelta<T extends string | number | boolean>(
  from: T,
  to: T
): RichSignalFieldDelta {
  const delta =
    typeof from === 'number' && typeof to === 'number'
      ? round4(to - from)
      : from !== to
        ? `${from} -> ${to}`
        : 'unchanged';
  return { from, to, delta };
}

function buildCueSummary(cue: CompactCinematicCue): CueSceneSummary {
  return {
    scene_id: cue.scene_id,
    scene_index: cue.scene_index,
    scene_pack_id: cue.scene_pack_id,
    narrative_intent: cue.narrative_intent,
    shot_purpose: [...cue.shot_purpose],
    tempo_signature: cue.tempo_signature,
    carryover_intensity: cue.carryover_intensity,
  };
}

function buildRichSignalDelta(
  prevRich: RichCinematicSignals,
  nextRich: RichCinematicSignals
): RichSignalDelta {
  return {
    camera_momentum: {
      direction: fieldDelta(
        prevRich.camera_momentum.direction,
        nextRich.camera_momentum.direction
      ),
      intensity_curve: fieldDelta(
        prevRich.camera_momentum.intensity_curve,
        nextRich.camera_momentum.intensity_curve
      ),
      stability: fieldDelta(
        prevRich.camera_momentum.stability,
        nextRich.camera_momentum.stability
      ),
      velocity_norm: fieldDelta(
        prevRich.camera_momentum.velocity_norm ?? 0,
        nextRich.camera_momentum.velocity_norm ?? 0
      ),
    },
    emotional_carryover: {
      from_previous_scene: fieldDelta(
        prevRich.emotional_carryover.from_previous_scene,
        nextRich.emotional_carryover.from_previous_scene
      ),
      transition_mode: fieldDelta(
        prevRich.emotional_carryover.transition_mode,
        nextRich.emotional_carryover.transition_mode
      ),
      carry_strength: fieldDelta(
        prevRich.emotional_carryover.carry_strength,
        nextRich.emotional_carryover.carry_strength
      ),
    },
    montage_rhythm: {
      tempo: fieldDelta(prevRich.montage_rhythm.tempo, nextRich.montage_rhythm.tempo),
      cut_density: fieldDelta(
        prevRich.montage_rhythm.cut_density,
        nextRich.montage_rhythm.cut_density
      ),
      visual_breathing_room: fieldDelta(
        prevRich.montage_rhythm.visual_breathing_room,
        nextRich.montage_rhythm.visual_breathing_room
      ),
    },
    spatial_continuity: {
      environmental_anchor: fieldDelta(
        prevRich.spatial_continuity.environmental_anchor,
        nextRich.spatial_continuity.environmental_anchor
      ),
      screen_direction: fieldDelta(
        prevRich.spatial_continuity.screen_direction,
        nextRich.spatial_continuity.screen_direction
      ),
      camera_axis_lock: fieldDelta(
        prevRich.spatial_continuity.camera_axis_lock,
        nextRich.spatial_continuity.camera_axis_lock
      ),
    },
    scene_energy_waveform: {
      end_to_start_energy: fieldDelta(
        prevRich.scene_energy_waveform.end_energy,
        nextRich.scene_energy_waveform.start_energy
      ),
      peak_energy: fieldDelta(
        prevRich.scene_energy_waveform.peak_energy,
        nextRich.scene_energy_waveform.peak_energy
      ),
    },
  };
}

function weakestDimension(record: ScenePairQualityRecord): {
  dimension: ContinuityDimension;
  score: number;
} {
  const dimensions: Array<{ dimension: ContinuityDimension; score: number }> = [
    { dimension: 'camera', score: record.camera_continuity },
    { dimension: 'emotion', score: record.emotional_continuity },
    { dimension: 'montage', score: record.montage_stability },
    { dimension: 'spatial', score: record.spatial_persistence },
  ];
  return dimensions.sort((a, b) => a.score - b.score)[0];
}

function detectAdvisoryFlags(
  record: ScenePairQualityRecord,
  prevRich: RichCinematicSignals,
  nextRich: RichCinematicSignals
): string[] {
  const flags: string[] = [];

  if (record.camera_continuity < 0.72) {
    flags.push('weak_camera_bridge');
  }

  if (
    prevRich.camera_momentum.direction !== nextRich.camera_momentum.direction &&
    record.camera_continuity < 0.75
  ) {
    flags.push('direction_reversal');
  }

  if (
    (prevRich.camera_momentum.velocity_norm ?? 0) - (nextRich.camera_momentum.velocity_norm ?? 0) >
      0.35 &&
    record.camera_continuity < 0.7
  ) {
    flags.push('momentum_collapse');
  }

  if (record.emotional_continuity < 0.75) {
    flags.push('emotion_softening');
  }

  if (record.montage_stability < 0.85) {
    flags.push('montage_softening');
  }

  if (
    prevRich.spatial_continuity.environmental_anchor !==
    nextRich.spatial_continuity.environmental_anchor
  ) {
    flags.push('environment_anchor_change');
  }

  return flags;
}

function buildRepairHints(flags: string[]): string[] {
  return flags.map((flag) => HUMAN_REVIEW_HINTS[flag] ?? `Review ${flag} for this scene pair`);
}

function buildHumanReviewNote(
  pairId: string,
  record: ScenePairQualityRecord,
  weakest: { dimension: ContinuityDimension; score: number },
  delta: RichSignalDelta,
  flags: string[]
): string {
  const parts = [
    `Pair ${pairId} ranks as a top-risk transition (quality ${record.pair_quality_score}, tier ${record.quality_tier}).`,
    `Weakest dimension is ${weakest.dimension} at ${weakest.score}.`,
  ];

  if (weakest.dimension === 'camera') {
    parts.push(
      `Camera bridge: ${delta.camera_momentum.direction.from} -> ${delta.camera_momentum.direction.to} (${String(delta.camera_momentum.direction.delta)}), velocity ${delta.camera_momentum.velocity_norm.from} -> ${delta.camera_momentum.velocity_norm.to}.`
    );
  }

  if (flags.includes('weak_camera_bridge')) {
    parts.push(
      'This is a weak camera bridge — human review should confirm whether the cut is an intentional director-family shift or an accidental slideshow reset.'
    );
  }

  if (flags.length > 0) {
    parts.push(`Advisory flags: ${flags.join(', ')}.`);
  }

  parts.push('No automatic repair is applied in PHASE-35E; adjust cues or rich signals manually if needed.');

  return parts.join(' ');
}

function buildDetailedReview(
  record: ScenePairQualityRecord,
  rank: number,
  cueBySceneId: Map<string, CompactCinematicCue>,
  richBySceneId: Map<string, RichCinematicSignals>,
  pairDiagnosticsFlags: string[]
): TopRiskPairDetailedReview {
  const prevCue = cueBySceneId.get(record.from_scene_id)!;
  const nextCue = cueBySceneId.get(record.to_scene_id)!;
  const prevRich = richBySceneId.get(record.from_scene_id)!;
  const nextRich = richBySceneId.get(record.to_scene_id)!;

  const weakest = weakestDimension(record);
  const rich_signal_delta = buildRichSignalDelta(prevRich, nextRich);
  const advisory_flags = detectAdvisoryFlags(record, prevRich, nextRich);
  const issue_flags = [...new Set([...record.issues, ...pairDiagnosticsFlags, ...advisory_flags])];
  const repair_hints = buildRepairHints(
    issue_flags.filter((flag) => HUMAN_REVIEW_HINTS[flag] != null)
  );

  return {
    pair_id: record.pair,
    from_scene_id: record.from_scene_id,
    to_scene_id: record.to_scene_id,
    from_scene_index: record.from_scene_index,
    to_scene_index: record.to_scene_index,
    pair_quality_score: record.pair_quality_score,
    quality_tier: record.quality_tier,
    score_breakdown: {
      camera_continuity: record.camera_continuity,
      emotional_continuity: record.emotional_continuity,
      montage_stability: record.montage_stability,
      spatial_persistence: record.spatial_persistence,
    },
    weakest_dimension: weakest.dimension,
    weakest_dimension_score: weakest.score,
    issue_flags,
    advisory_flags,
    previous_scene_cue_summary: buildCueSummary(prevCue),
    next_scene_cue_summary: buildCueSummary(nextCue),
    rich_signal_delta,
    suggested_human_review_note: buildHumanReviewNote(
      record.pair,
      record,
      weakest,
      rich_signal_delta,
      advisory_flags
    ),
    repair_hints:
      repair_hints.length > 0
        ? repair_hints
        : [
            HUMAN_REVIEW_HINTS.weak_camera_bridge ??
              'Review this pair manually before longform export.',
          ],
    rank,
  };
}

let cachedPreview: TopRiskPairReviewPreview | null = null;
let cachedReport: TopRiskPairReviewReportExport | null = null;

export function buildTopRiskPairReviewPreview(
  topCount = DEFAULT_TOP_RISK_PAIR_COUNT
): TopRiskPairReviewPreview {
  if (cachedPreview && cachedPreview.top_risk_pair_count === topCount) return cachedPreview;

  const gate = buildCueQualityGatePreview();
  const compact = buildCompactCueDataset();
  const rich = buildRichCueSignalDataset();
  const { pairs: pairDiagnostics } = buildAllScenePairDiagnostics(true);

  const cueBySceneId = new Map(compact.export.cues.map((cue) => [cue.scene_id, cue]));
  const richBySceneId = new Map(
    rich.signals.map((row) => [row.scene_id, row.rich_cinematic_signals])
  );
  const flagsByPair = new Map(
    pairDiagnostics.map((pair) => [
      pairLabel(pair.from_scene_index, pair.to_scene_index),
      pair.slideshow_drift_flags,
    ])
  );

  const topRecords = [...gate.top_risk_pairs].sort(
    (a, b) => a.pair_quality_score - b.pair_quality_score
  );

  const top_risk_pairs = topRecords.map((record, index) =>
    buildDetailedReview(
      record,
      index + 1,
      cueBySceneId,
      richBySceneId,
      flagsByPair.get(record.pair) ?? []
    )
  );

  const focus = top_risk_pairs.find((review) => review.pair_id === 'scene_07 -> scene_08') ?? null;

  cachedPreview = {
    phase: TOP_RISK_PAIR_REVIEW_PHASE,
    schema_version: TOP_RISK_PAIR_REVIEW_VERSION,
    scene_count: gate.scene_count,
    pair_count: gate.pair_count,
    top_risk_pair_count: top_risk_pairs.length,
    gate_status: gate.gate_status,
    gate_reference: gate.gate_checks,
    top_risk_pairs,
    focus_pair_verification: focus
      ? {
          pair_id: focus.pair_id,
          visible_in_top_risk: true,
          camera_continuity: focus.score_breakdown.camera_continuity,
          weak_camera_bridge_visible: focus.advisory_flags.includes('weak_camera_bridge'),
          human_readable_repair_hint_present: focus.repair_hints.length > 0,
        }
      : null,
    diagnosis_only: true,
    no_auto_fix: true,
    generated_at: new Date().toISOString(),
  };

  return cachedPreview;
}

export function buildTopRiskPairReviewReportExport(
  topCount = DEFAULT_TOP_RISK_PAIR_COUNT
): TopRiskPairReviewReportExport {
  if (cachedReport) return cachedReport;

  const preview = buildTopRiskPairReviewPreview(topCount);
  cachedReport = {
    ...preview,
    report_checksum: crypto.createHash('sha256').update(JSON.stringify(preview)).digest('hex'),
  };
  return cachedReport;
}

function writeTopRiskReviewArtifact(serialized: string, rootDir = process.cwd()): void {
  const exportsDir = path.join(rootDir, 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(exportsDir, TOP_RISK_PAIR_REVIEW_REPORT_FILENAME), serialized, 'utf8');
}

export function buildTopRiskPairReviewReportDownload(rootDir = process.cwd()): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const report = buildTopRiskPairReviewReportExport();
  const body = JSON.stringify(report, null, 2);
  writeTopRiskReviewArtifact(body, rootDir);

  return {
    filename: TOP_RISK_PAIR_REVIEW_REPORT_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetTopRiskPairReviewCache(): void {
  cachedPreview = null;
  cachedReport = null;
}
