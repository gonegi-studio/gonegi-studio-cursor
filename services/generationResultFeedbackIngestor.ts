import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import {
  PRE_GEN_SIMULATOR_REPORT_PATH,
  type PreGenerationSimulatorReport,
  type SlotSimulationResult,
} from './preGenerationSimulator.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const FEEDBACK_INGESTOR_PHASE = 'PHASE-AUDITOR-005' as const;
export const FEEDBACK_INGESTOR_PASS_VERDICT = 'PASS_GENERATION_RESULT_FEEDBACK_INGESTOR_V1' as const;
export const FEEDBACK_INGESTOR_FAIL_VERDICT = 'FAIL_GENERATION_RESULT_FEEDBACK_INGESTOR_V1' as const;
export const GENERATION_FEEDBACK_REPORT_PATH = 'reports/generation-feedback-report.json' as const;
export const MDS005_FEEDBACK_FIXTURE_PATH = 'reports/fixtures/MDS005-generation-feedback.json' as const;

export const VERDICT_VALUES = ['PASS', 'PARTIAL', 'FAIL'] as const;
export type Verdict = (typeof VERDICT_VALUES)[number];

export const FAILURE_TYPES = [
  'identity_drift',
  'costume_drift',
  'hairstyle_drift',
  'duplication',
  'location_drift',
  'prop_drift',
  'composition_drift',
  'lighting_drift',
  'other',
] as const;

export type FailureType = (typeof FAILURE_TYPES)[number];
export type CharacterVerdict = Verdict | 'N/A';

export type CharacterResults = {
  gonegi: CharacterVerdict;
  dana: CharacterVerdict;
  gamja: CharacterVerdict;
  aengdu: CharacterVerdict;
};

export type GenerationResultEntry = {
  slot_id: string;
  image_file: string;
  verdict: Verdict;
  characters: CharacterResults;
  failure_types: FailureType[];
  notes: string;
};

export type RegenerationNote = {
  note_id: string;
  slot_id?: string;
  scene_label?: string;
  description: string;
  outcome: Verdict;
  applied_to_adjusted_pass_rate: boolean;
};

export type GenerationResultFeedbackInput = {
  test_id: string;
  scenario_file: string;
  upload_bundle_id: string;
  generated_at: string;
  results: GenerationResultEntry[];
  regeneration_notes?: RegenerationNote[];
};

export type NormalizedFeedback = {
  test_id: string;
  scenario_file: string;
  upload_bundle_id: string;
  generated_at: string;
  total_images: number;
  pass_count: number;
  partial_count: number;
  fail_count: number;
  pass_rate: number;
  adjusted_pass_rate: number;
  character_pass_rates: Record<string, number>;
  failure_type_counts: Record<FailureType, number>;
  high_risk_slots: string[];
  slot_results: GenerationResultEntry[];
  regeneration_notes: RegenerationNote[];
};

export type SimulatorComparison = {
  simulator_report_path: string;
  prediction_accuracy: number;
  predicted_pass_rate: number;
  actual_pass_rate: number;
  adjusted_pass_rate: number;
  false_safe_slots: string[];
  unexpected_failures: string[];
  partial_prediction_gaps: string[];
};

export type SlotRiskUpdate = {
  slot_id: string;
  predicted_risk_score: number;
  predicted_risk_level: string;
  actual_verdict: Verdict;
  suggested_risk_delta: number;
  failure_types: FailureType[];
};

export type SimulatorWeightUpdate = {
  dimension: string;
  current_observed_failures: number;
  suggested_weight_delta: number;
  reason: string;
};

export type GenerationFeedbackReport = {
  ingestor_id: string;
  phase: typeof FEEDBACK_INGESTOR_PHASE;
  timestamp: string;
  source_fixture: string;
  normalized_feedback: NormalizedFeedback;
  summary: {
    total_images: number;
    pass_count: number;
    partial_count: number;
    fail_count: number;
    pass_rate: number;
    actual_pass_rate: number;
    adjusted_pass_rate: number;
    failure_type_counts: Record<FailureType, number>;
    high_risk_slots: string[];
  };
  slot_results: GenerationResultEntry[];
  character_results: Record<string, { pass: number; partial: number; fail: number; na: number; pass_rate: number }>;
  failure_patterns: readonly string[];
  simulator_vs_actual: SimulatorComparison;
  slot_risk_updates: readonly SlotRiskUpdate[];
  suggested_simulator_weight_updates: readonly SimulatorWeightUpdate[];
  final_verdict: typeof FEEDBACK_INGESTOR_PASS_VERDICT | typeof FEEDBACK_INGESTOR_FAIL_VERDICT;
};

const TRACKED_CHARACTERS = ['gonegi', 'dana', 'gamja', 'aengdu'] as const;

function emptyCharacterResults(): CharacterResults {
  return { gonegi: 'N/A', dana: 'N/A', gamja: 'N/A', aengdu: 'N/A' };
}

function emptyFailureTypeCounts(): Record<FailureType, number> {
  return {
    identity_drift: 0,
    costume_drift: 0,
    hairstyle_drift: 0,
    duplication: 0,
    location_drift: 0,
    prop_drift: 0,
    composition_drift: 0,
    lighting_drift: 0,
    other: 0,
  };
}

function normalizeCharacterResults(raw: unknown): CharacterResults {
  const base = emptyCharacterResults();
  if (!raw || typeof raw !== 'object') return base;
  for (const key of TRACKED_CHARACTERS) {
    const value = (raw as Record<string, unknown>)[key];
    if (value === 'PASS' || value === 'PARTIAL' || value === 'FAIL' || value === 'N/A') {
      base[key] = value;
    }
  }
  return base;
}

function normalizeFailureTypes(raw: unknown): FailureType[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is FailureType =>
    typeof v === 'string' && (FAILURE_TYPES as readonly string[]).includes(v)
  );
}

export function normalizeGenerationFeedback(
  input: GenerationResultFeedbackInput
): NormalizedFeedback {
  const slot_results: GenerationResultEntry[] = input.results.map((row) => ({
    slot_id: String(row.slot_id),
    image_file: String(row.image_file ?? ''),
    verdict: row.verdict,
    characters: normalizeCharacterResults(row.characters),
    failure_types: normalizeFailureTypes(row.failure_types),
    notes: String(row.notes ?? ''),
  }));

  const pass_count = slot_results.filter((r) => r.verdict === 'PASS').length;
  const partial_count = slot_results.filter((r) => r.verdict === 'PARTIAL').length;
  const fail_count = slot_results.filter((r) => r.verdict === 'FAIL').length;
  const total_images = slot_results.length;
  const pass_rate = total_images > 0 ? Number((pass_count / total_images).toFixed(4)) : 0;

  const regeneration_notes = input.regeneration_notes ?? [];
  let adjusted_pass_count = pass_count;
  for (const note of regeneration_notes) {
    if (note.applied_to_adjusted_pass_rate && note.outcome === 'PASS') {
      adjusted_pass_count += 1;
    }
  }
  const adjusted_pass_rate = Number(
    Math.min(1, adjusted_pass_count / Math.max(total_images, 1)).toFixed(4)
  );

  const character_pass_rates: Record<string, number> = {};
  for (const character of TRACKED_CHARACTERS) {
    const relevant = slot_results.filter((r) => r.characters[character] !== 'N/A');
    const passes = relevant.filter((r) => r.characters[character] === 'PASS').length;
    character_pass_rates[character] =
      relevant.length > 0 ? Number((passes / relevant.length).toFixed(4)) : 1;
  }

  const failure_type_counts = emptyFailureTypeCounts();
  for (const row of slot_results) {
    for (const ft of row.failure_types) failure_type_counts[ft] += 1;
  }

  const high_risk_slots = slot_results
    .filter((r) => r.verdict === 'FAIL' || r.verdict === 'PARTIAL')
    .map((r) => r.slot_id);

  return {
    test_id: input.test_id,
    scenario_file: input.scenario_file,
    upload_bundle_id: input.upload_bundle_id,
    generated_at: input.generated_at,
    total_images,
    pass_count,
    partial_count,
    fail_count,
    pass_rate,
    adjusted_pass_rate,
    character_pass_rates,
    failure_type_counts,
    high_risk_slots,
    slot_results,
    regeneration_notes,
  };
}

function loadSimulatorReport(projectRoot: string): PreGenerationSimulatorReport | null {
  return readJsonRecord(projectRoot, PRE_GEN_SIMULATOR_REPORT_PATH) as PreGenerationSimulatorReport | null;
}

function compareWithSimulator(
  normalized: NormalizedFeedback,
  simulator: PreGenerationSimulatorReport | null
): SimulatorComparison {
  if (!simulator) {
    return {
      simulator_report_path: PRE_GEN_SIMULATOR_REPORT_PATH,
      prediction_accuracy: 0,
      predicted_pass_rate: 0,
      actual_pass_rate: normalized.pass_rate,
      adjusted_pass_rate: normalized.adjusted_pass_rate,
      false_safe_slots: [],
      unexpected_failures: [],
      partial_prediction_gaps: [],
    };
  }

  const simBySlot = new Map<string, SlotSimulationResult>(
    simulator.slot_results.map((r) => [r.slot_id, r])
  );

  const false_safe_slots: string[] = [];
  const unexpected_failures: string[] = [];
  const partial_prediction_gaps: string[] = [];
  let accurate = 0;

  for (const actual of normalized.slot_results) {
    const predicted = simBySlot.get(actual.slot_id);
    if (!predicted) continue;

    const predictedSafe = predicted.risk_level === 'LOW' && predicted.risk_score < 30;
    const actualBad = actual.verdict === 'FAIL' || actual.verdict === 'PARTIAL';

    if (predictedSafe && actual.verdict === 'FAIL') {
      false_safe_slots.push(actual.slot_id);
      unexpected_failures.push(actual.slot_id);
    } else if (predictedSafe && actual.verdict === 'PARTIAL') {
      partial_prediction_gaps.push(actual.slot_id);
    }

    const predictedPass = predicted.risk_score < 50;
    const actualPass = actual.verdict === 'PASS';
    if (predictedPass === actualPass) accurate += 1;
  }

  const compared = normalized.slot_results.filter((r) => simBySlot.has(r.slot_id)).length;
  const prediction_accuracy =
    compared > 0 ? Number((accurate / compared).toFixed(4)) : 0;

  return {
    simulator_report_path: PRE_GEN_SIMULATOR_REPORT_PATH,
    prediction_accuracy,
    predicted_pass_rate: simulator.expected_pass_rate,
    actual_pass_rate: normalized.pass_rate,
    adjusted_pass_rate: normalized.adjusted_pass_rate,
    false_safe_slots: Object.freeze(false_safe_slots),
    unexpected_failures: Object.freeze(unexpected_failures),
    partial_prediction_gaps: Object.freeze(partial_prediction_gaps),
  };
}

function buildCharacterResults(
  normalized: NormalizedFeedback
): GenerationFeedbackReport['character_results'] {
  const out: GenerationFeedbackReport['character_results'] = {};
  for (const character of TRACKED_CHARACTERS) {
    const rows = normalized.slot_results.filter((r) => r.characters[character] !== 'N/A');
    const pass = rows.filter((r) => r.characters[character] === 'PASS').length;
    const partial = rows.filter((r) => r.characters[character] === 'PARTIAL').length;
    const fail = rows.filter((r) => r.characters[character] === 'FAIL').length;
    const na = normalized.total_images - rows.length;
    out[character] = {
      pass,
      partial,
      fail,
      na,
      pass_rate: rows.length > 0 ? Number((pass / rows.length).toFixed(4)) : 1,
    };
  }
  return out;
}

function buildFailurePatterns(normalized: NormalizedFeedback): string[] {
  const patterns: string[] = [];
  const counts = normalized.failure_type_counts;
  const sorted = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  for (const [type, count] of sorted) {
    patterns.push(`${type}: ${count} occurrence(s) across partial/fail slots`);
  }

  if (normalized.partial_count > 0 && counts.composition_drift > 0) {
    patterns.push('Outdoor/layout-heavy slots correlate with composition_drift partials.');
  }
  if (normalized.partial_count > 0 && counts.duplication > 0) {
    patterns.push('Multi-character slots show duplication pressure despite LOW simulator risk.');
  }
  if (patterns.length === 0) {
    patterns.push('No recurring failure patterns — generation aligned with simulator LOW forecast.');
  }
  return patterns;
}

function buildSlotRiskUpdates(
  normalized: NormalizedFeedback,
  simulator: PreGenerationSimulatorReport | null
): SlotRiskUpdate[] {
  if (!simulator) return [];
  const simBySlot = new Map(simulator.slot_results.map((r) => [r.slot_id, r]));

  return normalized.slot_results.map((actual) => {
    const predicted = simBySlot.get(actual.slot_id);
    const predictedScore = predicted?.risk_score ?? 0;
    let suggested_risk_delta = 0;
    if (actual.verdict === 'PARTIAL') suggested_risk_delta = 12;
    if (actual.verdict === 'FAIL') suggested_risk_delta = 25;
    if (actual.verdict === 'PASS' && predictedScore > 20) suggested_risk_delta = -5;

    return {
      slot_id: actual.slot_id,
      predicted_risk_score: predictedScore,
      predicted_risk_level: predicted?.risk_level ?? 'UNKNOWN',
      actual_verdict: actual.verdict,
      suggested_risk_delta,
      failure_types: actual.failure_types,
    };
  });
}

function buildWeightUpdates(normalized: NormalizedFeedback): SimulatorWeightUpdate[] {
  const counts = normalized.failure_type_counts;
  const updates: SimulatorWeightUpdate[] = [];

  const mapping: [FailureType, string][] = [
    ['identity_drift', 'identity_risk'],
    ['costume_drift', 'costume_risk'],
    ['hairstyle_drift', 'hairstyle_risk'],
    ['duplication', 'duplication_risk'],
    ['location_drift', 'location_risk'],
    ['prop_drift', 'prop_risk'],
    ['composition_drift', 'composition_risk'],
    ['lighting_drift', 'lighting_risk'],
  ];

  for (const [failureType, dimension] of mapping) {
    const n = counts[failureType];
    if (n <= 0) continue;
    updates.push({
      dimension,
      current_observed_failures: n,
      suggested_weight_delta: Math.min(0.25, n * 0.05),
      reason: `${failureType} observed ${n} time(s) in MDS-005 feedback — increase ${dimension} weight in PHASE-AUDITOR-006.`,
    });
  }

  if (normalized.partial_count > 0) {
    updates.push({
      dimension: 'token_pressure_risk',
      current_observed_failures: normalized.partial_count,
      suggested_weight_delta: 0.03,
      reason: 'Partial slots suggest token-pressure calibration for outdoor/layout stacks.',
    });
  }

  return updates;
}

export function ingestGenerationFeedback(
  projectRoot: string,
  input: GenerationResultFeedbackInput
): GenerationFeedbackReport {
  const root = resolveProjectRoot(projectRoot);
  const normalized = normalizeGenerationFeedback(input);
  const simulator = loadSimulatorReport(root);
  const simulator_vs_actual = compareWithSimulator(normalized, simulator);

  const report: GenerationFeedbackReport = {
    ingestor_id: `feedback_${Date.now().toString(36)}`,
    phase: FEEDBACK_INGESTOR_PHASE,
    timestamp: new Date().toISOString(),
    source_fixture: input.scenario_file,
    normalized_feedback: normalized,
    summary: {
      total_images: normalized.total_images,
      pass_count: normalized.pass_count,
      partial_count: normalized.partial_count,
      fail_count: normalized.fail_count,
      pass_rate: normalized.pass_rate,
      actual_pass_rate: normalized.pass_rate,
      adjusted_pass_rate: normalized.adjusted_pass_rate,
      failure_type_counts: normalized.failure_type_counts,
      high_risk_slots: normalized.high_risk_slots,
    },
    slot_results: normalized.slot_results,
    character_results: buildCharacterResults(normalized),
    failure_patterns: Object.freeze(buildFailurePatterns(normalized)),
    simulator_vs_actual,
    slot_risk_updates: Object.freeze(buildSlotRiskUpdates(normalized, simulator)),
    suggested_simulator_weight_updates: Object.freeze(buildWeightUpdates(normalized)),
    final_verdict: FEEDBACK_INGESTOR_PASS_VERDICT,
  };

  return report;
}

export function writeGenerationFeedbackReport(
  projectRoot: string,
  report: GenerationFeedbackReport
): string {
  const root = resolveProjectRoot(projectRoot);
  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  const payload = {
    ...report,
    report_type: 'generation_feedback_report',
    report_version: 'v1',
    export_path: GENERATION_FEEDBACK_REPORT_PATH,
    next_phase: 'PHASE-AUDITOR-006 SIMULATOR_CALIBRATION_V1',
  };
  fs.writeFileSync(
    path.join(root, GENERATION_FEEDBACK_REPORT_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );
  return GENERATION_FEEDBACK_REPORT_PATH;
}

export function runMds005FeedbackIngestion(projectRoot?: string): GenerationFeedbackReport {
  const root = resolveProjectRoot(projectRoot);
  const fixturePath = path.join(root, MDS005_FEEDBACK_FIXTURE_PATH);
  const input = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as GenerationResultFeedbackInput;
  const report = ingestGenerationFeedback(root, input);
  writeGenerationFeedbackReport(root, report);
  return report;
}
