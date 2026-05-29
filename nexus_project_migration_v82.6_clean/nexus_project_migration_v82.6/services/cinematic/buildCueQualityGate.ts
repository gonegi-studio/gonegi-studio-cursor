import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { buildCompactCueDataset } from './buildCompactCueDataset';
import { buildRichCueSignalDataset, type RichCinematicSignals } from './buildRichCueSignals';
import {
  buildAllScenePairDiagnostics,
  type ContinuityPairDiagnostics,
  type SlideshowDriftRisk,
} from './buildContinuityValidationReport';

export const CUE_QUALITY_GATE_VERSION = 'PHASE-35D-v1' as const;
export const CUE_QUALITY_GATE_PHASE = 'PHASE-35D' as const;
export const CUE_QUALITY_REPORT_FILENAME = 'cue-quality-report.json';
export const CUE_QUALITY_REPORT_PATH = 'exports/cue-quality-report.json';

export const PAIR_QUALITY_EXCELLENT = 0.9;
export const PAIR_QUALITY_GOOD = 0.8;
export const PAIR_QUALITY_WARNING = 0.7;

export const GATE_CAMERA_MIN = 0.8;
export const GATE_EMOTION_MIN = 0.85;
export const GATE_WEAK_PAIR_RATIO_MAX = 0.1;

export type PairQualityTier = 'Excellent' | 'Good' | 'Warning' | 'Fail';
export type GateStatus = 'PASS' | 'FAIL';

export interface WeakPairIssue {
  pair: string;
  from_scene_id: string;
  to_scene_id: string;
  from_scene_index: number;
  to_scene_index: number;
  issue: string;
  category: 'camera' | 'emotion' | 'montage' | 'spatial';
  pair_quality_score: number;
  quality_tier: PairQualityTier;
  suggested_fix: string;
}

export interface ScenePairQualityRecord {
  pair: string;
  from_scene_id: string;
  to_scene_id: string;
  from_scene_index: number;
  to_scene_index: number;
  pair_quality_score: number;
  quality_tier: PairQualityTier;
  camera_continuity: number;
  emotional_continuity: number;
  montage_stability: number;
  spatial_persistence: number;
  issues: string[];
  is_weak: boolean;
}

export interface CueQualityGatePreview {
  phase: typeof CUE_QUALITY_GATE_PHASE;
  schema_version: typeof CUE_QUALITY_GATE_VERSION;
  scene_count: number;
  pair_count: number;
  weak_pairs: WeakPairIssue[];
  quality_distribution: Record<PairQualityTier, number>;
  top_risk_pairs: ScenePairQualityRecord[];
  gate_status: GateStatus;
  gate_checks: {
    camera_continuity: number;
    camera_continuity_pass: boolean;
    emotional_continuity: number;
    emotional_continuity_pass: boolean;
    weak_pair_ratio: number;
    weak_pair_ratio_pass: boolean;
    slideshow_drift_risk: SlideshowDriftRisk;
    slideshow_drift_pass: boolean;
  };
  aggregate_scores: {
    camera_continuity_score: number;
    emotional_continuity_score: number;
    montage_stability_score: number;
    spatial_persistence_score: number;
  };
  generated_at: string;
}

export interface CueQualityReportExport extends CueQualityGatePreview {
  pair_records: ScenePairQualityRecord[];
  repair_hints: WeakPairIssue[];
  report_checksum: string;
  diagnosis_only: true;
}

/** Issues that alone can mark a pair weak (expected anthology location changes excluded). */
const CRITICAL_WEAK_ISSUES = new Set([
  'camera_reset',
  'axis_jump',
  'direction_reversal',
  'momentum_collapse',
  'emotion_reset',
  'emotion_discontinuity',
  'carryover_collapse',
  'tempo_discontinuity',
  'cut_density_shock',
  'rhythm_collapse',
  'screen_direction_flip',
  'axis_lock_break',
  'scene_independence',
  'generic_static_framing',
  'sequence_graph_break',
]);

const REPAIR_HINTS: Record<string, string> = {
  camera_reset: 'preserve camera momentum and avoid abrupt framing reset between scenes',
  axis_jump: 'maintain camera axis lock across the cut',
  direction_reversal: 'align camera tracking direction with the previous scene',
  momentum_collapse: 'restore continuous motion curve and velocity cadence',
  emotion_discontinuity: 'smooth emotion curve transition between adjacent beats',
  emotion_reset: 'increase emotional carryover strength before the cut',
  carryover_collapse: 'raise carry_strength in emotional_carryover layer',
  tempo_discontinuity: 'align montage tempo between adjacent scenes',
  cut_density_shock: 'shift cut_density gradually instead of an abrupt jump',
  rhythm_collapse: 'restore rhythm_uniformity in editing pacing',
  environment_anchor_loss: 'preserve environmental_anchor across the scene pair',
  screen_direction_flip: 'keep consistent screen_direction (avoid LTR/RTR flip)',
  axis_lock_break: 'keep camera_axis_lock active on both sides of the cut',
  scene_independence: 'bridge sequence_graph nodes and carry emotional continuity',
  generic_static_framing: 'avoid static framing reset after dynamic camera motion',
  sequence_graph_break: 'reconnect sequence_graph previous_node linkage',
};

function round4(value: number): number {
  return Number(value.toFixed(4));
}

function pairLabel(fromIndex: number, toIndex: number): string {
  return `scene_${String(fromIndex + 1).padStart(2, '0')} -> scene_${String(toIndex + 1).padStart(2, '0')}`;
}

function tierFromScore(score: number): PairQualityTier {
  if (score >= PAIR_QUALITY_EXCELLENT) return 'Excellent';
  if (score >= PAIR_QUALITY_GOOD) return 'Good';
  if (score >= PAIR_QUALITY_WARNING) return 'Warning';
  return 'Fail';
}

function tempoRank(tempo: string): number {
  const ranks: Record<string, number> = { adagio: 1, andante: 2, moderato: 3, allegro: 4 };
  return ranks[tempo] ?? 2;
}

function directionFamily(direction: string): string {
  if (direction.includes('forward') || direction.includes('push')) return 'forward';
  if (direction.includes('lateral') || direction.includes('drift')) return 'lateral';
  if (direction.includes('locked') || direction.includes('observation')) return 'static';
  return 'mixed';
}

function detectWeakIssues(
  pair: ContinuityPairDiagnostics,
  prevRich: RichCinematicSignals,
  nextRich: RichCinematicSignals
): Array<{ issue: string; category: WeakPairIssue['category'] }> {
  const found: Array<{ issue: string; category: WeakPairIssue['category'] }> = [];

  if (pair.camera_continuity < 0.55 || pair.slideshow_drift_flags.includes('camera_reset_syndrome')) {
    found.push({ issue: 'camera_reset', category: 'camera' });
  }

  if (
    prevRich.spatial_continuity.camera_axis_lock &&
    !nextRich.spatial_continuity.camera_axis_lock
  ) {
    found.push({ issue: 'axis_jump', category: 'camera' });
  }

  if (
    directionFamily(prevRich.camera_momentum.direction) !==
      directionFamily(nextRich.camera_momentum.direction) &&
    pair.camera_continuity < 0.65
  ) {
    found.push({ issue: 'direction_reversal', category: 'camera' });
  }

  const velocityDrop =
    (prevRich.camera_momentum.velocity_norm ?? 0) - (nextRich.camera_momentum.velocity_norm ?? 0);
  if (velocityDrop > 0.45 && pair.camera_continuity < 0.6) {
    found.push({ issue: 'momentum_collapse', category: 'camera' });
  }

  if (pair.emotional_continuity < 0.5 || pair.slideshow_drift_flags.includes('emotion_reset_syndrome')) {
    found.push({ issue: 'emotion_reset', category: 'emotion' });
  }

  if (nextRich.emotional_carryover.carry_strength < 0.4) {
    found.push({ issue: 'carryover_collapse', category: 'emotion' });
  }

  if (pair.emotional_continuity < 0.6 && nextRich.emotional_carryover.transition_mode === 'hard_cut') {
    found.push({ issue: 'emotion_discontinuity', category: 'emotion' });
  }

  const tempoDelta = Math.abs(
    tempoRank(prevRich.montage_rhythm.tempo) - tempoRank(nextRich.montage_rhythm.tempo)
  );
  if (tempoDelta >= 2 || pair.slideshow_drift_flags.includes('tempo_discontinuity')) {
    found.push({ issue: 'tempo_discontinuity', category: 'montage' });
  }

  if (
    prevRich.montage_rhythm.cut_density === 'low' &&
    nextRich.montage_rhythm.cut_density === 'high'
  ) {
    found.push({ issue: 'cut_density_shock', category: 'montage' });
  }

  if (pair.montage_stability < 0.5) {
    found.push({ issue: 'rhythm_collapse', category: 'montage' });
  }

  if (
    prevRich.spatial_continuity.environmental_anchor !==
      nextRich.spatial_continuity.environmental_anchor &&
    pair.spatial_persistence < 0.65
  ) {
    found.push({ issue: 'environment_anchor_loss', category: 'spatial' });
  }

  if (
    prevRich.spatial_continuity.screen_direction === 'left_to_right' &&
    nextRich.spatial_continuity.screen_direction === 'right_to_left'
  ) {
    found.push({ issue: 'screen_direction_flip', category: 'spatial' });
  }

  if (!nextRich.spatial_continuity.camera_axis_lock && pair.spatial_persistence < 0.6) {
    found.push({ issue: 'axis_lock_break', category: 'spatial' });
  }

  for (const flag of pair.slideshow_drift_flags) {
    if (flag === 'scene_independence') {
      found.push({ issue: 'scene_independence', category: 'emotion' });
    }
    if (flag === 'generic_static_framing') {
      found.push({ issue: 'generic_static_framing', category: 'camera' });
    }
    if (flag === 'sequence_graph_break') {
      found.push({ issue: 'sequence_graph_break', category: 'emotion' });
    }
    if (flag === 'environment_anchor_break') {
      found.push({ issue: 'environment_anchor_loss', category: 'spatial' });
    }
  }

  const seen = new Set<string>();
  return found.filter((entry) => {
    if (seen.has(entry.issue)) return false;
    seen.add(entry.issue);
    return true;
  });
}

function buildPairQualityRecord(
  pair: ContinuityPairDiagnostics,
  prevRich: RichCinematicSignals,
  nextRich: RichCinematicSignals
): { record: ScenePairQualityRecord; weakIssues: WeakPairIssue[] } {
  const pair_quality_score = round4(
    (pair.camera_continuity +
      pair.emotional_continuity +
      pair.montage_stability +
      pair.spatial_persistence) /
      4
  );
  const quality_tier = tierFromScore(pair_quality_score);
  const issueEntries = detectWeakIssues(pair, prevRich, nextRich);
  const issues = issueEntries.map((entry) => entry.issue);
  const hasCriticalIssue = issues.some((issue) => CRITICAL_WEAK_ISSUES.has(issue));
  const is_weak = pair_quality_score < PAIR_QUALITY_WARNING || hasCriticalIssue;

  const weakIssues: WeakPairIssue[] = issueEntries.map((entry) => ({
    pair: pairLabel(pair.from_scene_index, pair.to_scene_index),
    from_scene_id: pair.from_scene_id,
    to_scene_id: pair.to_scene_id,
    from_scene_index: pair.from_scene_index,
    to_scene_index: pair.to_scene_index,
    issue: entry.issue,
    category: entry.category,
    pair_quality_score,
    quality_tier,
    suggested_fix: REPAIR_HINTS[entry.issue] ?? 'review rich cinematic signals for this pair',
  }));

  return {
    record: {
      pair: pairLabel(pair.from_scene_index, pair.to_scene_index),
      from_scene_id: pair.from_scene_id,
      to_scene_id: pair.to_scene_id,
      from_scene_index: pair.from_scene_index,
      to_scene_index: pair.to_scene_index,
      pair_quality_score,
      quality_tier,
      camera_continuity: pair.camera_continuity,
      emotional_continuity: pair.emotional_continuity,
      montage_stability: pair.montage_stability,
      spatial_persistence: pair.spatial_persistence,
      issues,
      is_weak,
    },
    weakIssues,
  };
}

function evaluateGate(
  scores: ReturnType<typeof buildAllScenePairDiagnostics>['scores'],
  weakPairCount: number,
  pairCount: number
): CueQualityGatePreview['gate_checks'] & { gate_status: GateStatus } {
  const weak_pair_ratio = pairCount > 0 ? round4(weakPairCount / pairCount) : 0;
  const camera_continuity_pass = scores.camera_continuity_score > GATE_CAMERA_MIN;
  const emotional_continuity_pass = scores.emotional_continuity_score > GATE_EMOTION_MIN;
  const weak_pair_ratio_pass = weak_pair_ratio < GATE_WEAK_PAIR_RATIO_MAX;
  const slideshow_drift_pass = scores.slideshow_drift_risk === 'low';

  const gate_status: GateStatus =
    camera_continuity_pass &&
    emotional_continuity_pass &&
    weak_pair_ratio_pass &&
    slideshow_drift_pass
      ? 'PASS'
      : 'FAIL';

  return {
    gate_status,
    gate_checks: {
      camera_continuity: scores.camera_continuity_score,
      camera_continuity_pass,
      emotional_continuity: scores.emotional_continuity_score,
      emotional_continuity_pass,
      weak_pair_ratio,
      weak_pair_ratio_pass,
      slideshow_drift_risk: scores.slideshow_drift_risk,
      slideshow_drift_pass,
    },
  };
}

let cachedGate: CueQualityGatePreview | null = null;
let cachedReport: CueQualityReportExport | null = null;
let cachedPairRecords: ScenePairQualityRecord[] | null = null;

export function buildAllScenePairQualityRecords(): ScenePairQualityRecord[] {
  if (cachedPairRecords) return cachedPairRecords;

  const { pairs } = buildAllScenePairDiagnostics(true);
  const rich = buildRichCueSignalDataset();
  const richBySceneId = new Map(
    rich.signals.map((row) => [row.scene_id, row.rich_cinematic_signals])
  );

  const pairRecords: ScenePairQualityRecord[] = [];
  for (const pair of pairs) {
    const prevRich = richBySceneId.get(pair.from_scene_id);
    const nextRich = richBySceneId.get(pair.to_scene_id);
    if (!prevRich || !nextRich) continue;
    pairRecords.push(buildPairQualityRecord(pair, prevRich, nextRich).record);
  }

  cachedPairRecords = pairRecords;
  return pairRecords;
}

export function buildCueQualityGatePreview(): CueQualityGatePreview {
  if (cachedGate) return cachedGate;

  const { pairs, scores } = buildAllScenePairDiagnostics(true);
  const rich = buildRichCueSignalDataset();
  const richBySceneId = new Map(
    rich.signals.map((row) => [row.scene_id, row.rich_cinematic_signals])
  );

  const pairRecords: ScenePairQualityRecord[] = [];
  const weakPairs: WeakPairIssue[] = [];
  const quality_distribution: Record<PairQualityTier, number> = {
    Excellent: 0,
    Good: 0,
    Warning: 0,
    Fail: 0,
  };

  for (const pair of pairs) {
    const prevRich = richBySceneId.get(pair.from_scene_id);
    const nextRich = richBySceneId.get(pair.to_scene_id);
    if (!prevRich || !nextRich) continue;

    const { record, weakIssues } = buildPairQualityRecord(pair, prevRich, nextRich);
    pairRecords.push(record);
    quality_distribution[record.quality_tier] += 1;
    if (record.is_weak) {
      const criticalHints = weakIssues.filter((hint) => CRITICAL_WEAK_ISSUES.has(hint.issue));
      weakPairs.push(...(criticalHints.length > 0 ? criticalHints : weakIssues.slice(0, 1)));
    }
  }

  cachedPairRecords = pairRecords;

  const weakPairCount = pairRecords.filter((record) => record.is_weak).length;
  const gateEval = evaluateGate(scores, weakPairCount, pairRecords.length);

  const top_risk_pairs = [...pairRecords]
    .sort((a, b) => a.pair_quality_score - b.pair_quality_score)
    .slice(0, 5);

  cachedGate = {
    phase: CUE_QUALITY_GATE_PHASE,
    schema_version: CUE_QUALITY_GATE_VERSION,
    scene_count: buildCompactCueDataset().export.scene_count,
    pair_count: pairRecords.length,
    weak_pairs: weakPairs,
    quality_distribution,
    top_risk_pairs,
    gate_status: gateEval.gate_status,
    gate_checks: gateEval.gate_checks,
    aggregate_scores: {
      camera_continuity_score: scores.camera_continuity_score,
      emotional_continuity_score: scores.emotional_continuity_score,
      montage_stability_score: scores.montage_stability_score,
      spatial_persistence_score: scores.spatial_persistence_score,
    },
    generated_at: new Date().toISOString(),
  };

  return cachedGate;
}

export function buildCueQualityReportExport(): CueQualityReportExport {
  if (cachedReport) return cachedReport;

  const preview = buildCueQualityGatePreview();
  const { pairs } = buildAllScenePairDiagnostics(true);
  const rich = buildRichCueSignalDataset();
  const richBySceneId = new Map(
    rich.signals.map((row) => [row.scene_id, row.rich_cinematic_signals])
  );

  const pair_records: ScenePairQualityRecord[] = [];
  for (const pair of pairs) {
    const prevRich = richBySceneId.get(pair.from_scene_id);
    const nextRich = richBySceneId.get(pair.to_scene_id);
    if (!prevRich || !nextRich) continue;
    pair_records.push(buildPairQualityRecord(pair, prevRich, nextRich).record);
  }

  cachedReport = {
    ...preview,
    pair_records,
    repair_hints: preview.weak_pairs,
    report_checksum: '',
    diagnosis_only: true,
  };

  cachedReport.report_checksum = crypto
    .createHash('sha256')
    .update(JSON.stringify(cachedReport))
    .digest('hex');

  return cachedReport;
}

function writeCueQualityReportArtifact(serialized: string, rootDir = process.cwd()): void {
  const exportsDir = path.join(rootDir, 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(exportsDir, CUE_QUALITY_REPORT_FILENAME), serialized, 'utf8');
}

export function buildCueQualityReportDownload(rootDir = process.cwd()): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const report = buildCueQualityReportExport();
  const body = JSON.stringify(report, null, 2);
  writeCueQualityReportArtifact(body, rootDir);

  return {
    filename: CUE_QUALITY_REPORT_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetCueQualityGateCache(): void {
  cachedGate = null;
  cachedReport = null;
  cachedPairRecords = null;
}
