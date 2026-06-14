import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import type { GenerationFeedbackReport } from './generationResultFeedbackIngestor.js';
import { GENERATION_FEEDBACK_REPORT_PATH } from './generationResultFeedbackIngestor.js';
import {
  DEFAULT_SLOT_DIMENSION_WEIGHTS,
  MDS005_FIXTURE_PATH,
  PRE_GEN_SIMULATOR_REPORT_PATH,
  SIMULATOR_CALIBRATION_CONFIG_PATH,
  runPreGenerationSimulation,
  writePreGenerationSimulatorReport,
  type PreGenerationSimulatorReport,
  type SimulatorCalibrationConfig,
  type SlotRiskDimensions,
} from './preGenerationSimulator.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SIMULATOR_CALIBRATION_PHASE = 'PHASE-AUDITOR-006' as const;
export const SIMULATOR_CALIBRATION_PASS_VERDICT = 'PASS_SIMULATOR_CALIBRATION_V1' as const;
export const SIMULATOR_CALIBRATION_FAIL_VERDICT = 'FAIL_SIMULATOR_CALIBRATION_V1' as const;
export const SIMULATOR_CALIBRATION_REPORT_PATH = 'reports/simulator-calibration-report.json' as const;

export { SIMULATOR_CALIBRATION_CONFIG_PATH } from './preGenerationSimulator.js';

export type WeightChange = {
  field: string;
  before: number;
  after: number;
  delta: number;
  reason: string;
};

export type SlotRiskBeforeAfter = {
  slot_id: string;
  risk_score_before: number;
  risk_score_after: number;
  risk_level_before: string;
  risk_level_after: string;
  actual_verdict?: string;
};

export type SimulatorCalibrationReport = {
  calibration_id: string;
  phase: typeof SIMULATOR_CALIBRATION_PHASE;
  timestamp: string;
  previous_expected_pass_rate: number;
  actual_pass_rate: number;
  adjusted_actual_pass_rate: number;
  calibrated_expected_pass_rate: number;
  weight_changes: readonly WeightChange[];
  slot_risk_before_after: readonly SlotRiskBeforeAfter[];
  calibrated_quota: {
    safe_slots: readonly string[];
    watch_slots: readonly string[];
    skip_or_rewrite_slots: readonly string[];
  };
  config_path: string;
  final_verdict: typeof SIMULATOR_CALIBRATION_PASS_VERDICT | typeof SIMULATOR_CALIBRATION_FAIL_VERDICT;
};

const DIMENSION_TO_CONFIG_KEY: Record<string, keyof SimulatorCalibrationConfig> = {
  identity_risk: 'identity_weight',
  costume_risk: 'costume_weight',
  hairstyle_risk: 'hairstyle_weight',
  duplication_risk: 'duplication_weight',
  location_risk: 'location_weight',
  composition_risk: 'composition_weight',
  lighting_risk: 'lighting_weight',
  token_pressure_risk: 'token_pressure_weight',
};

export function buildCalibratedWeights(
  feedback: GenerationFeedbackReport,
  simulator: PreGenerationSimulatorReport | null
): {
  config: SimulatorCalibrationConfig;
  weight_changes: WeightChange[];
} {
  const defaults = { ...DEFAULT_SLOT_DIMENSION_WEIGHTS };
  const weights = {
    identity_weight: defaults.identity_risk,
    costume_weight: defaults.costume_risk,
    hairstyle_weight: defaults.hairstyle_risk,
    duplication_weight: defaults.duplication_risk,
    location_weight: defaults.location_risk,
    composition_weight: defaults.composition_risk,
    lighting_weight: defaults.lighting_risk,
    token_pressure_weight: defaults.token_pressure_risk,
  };

  const changes: WeightChange[] = [];
  for (const update of feedback.suggested_simulator_weight_updates) {
    const configKey = DIMENSION_TO_CONFIG_KEY[update.dimension];
    if (!configKey || !(configKey in weights)) continue;
    if (['identity_weight', 'costume_weight', 'hairstyle_weight'].includes(configKey)) continue;

    const before = weights[configKey as keyof typeof weights];
    const after = Number((before + update.suggested_weight_delta).toFixed(4));
    weights[configKey as keyof typeof weights] = after;
    changes.push({
      field: configKey,
      before,
      after,
      delta: update.suggested_weight_delta,
      reason: update.reason,
    });
  }

  void simulator;

  const config: SimulatorCalibrationConfig = {
    calibration_id: 'simulator-calibration-v1',
    phase: SIMULATOR_CALIBRATION_PHASE,
    generated_at: new Date().toISOString(),
    source_feedback_test: feedback.normalized_feedback.test_id,
    source_feedback_report: GENERATION_FEEDBACK_REPORT_PATH,
    source_simulator_report: PRE_GEN_SIMULATOR_REPORT_PATH,
    ...weights,
    outdoor_layout_bonus: {
      composition_risk: 16,
      location_risk: 12,
      lighting_risk: 10,
      token_pressure_risk: 8,
    },
    multi_character_bonus: {
      duplication_risk: 12,
      composition_risk: 10,
      token_pressure_risk: 5,
    },
    calibrated_pass_credit: {
      LOW: 1,
      MODERATE: 0.5,
      HIGH: 0,
      CRITICAL: 0,
    },
  };

  return { config, weight_changes: changes };
}

export function writeSimulatorCalibrationConfig(
  projectRoot: string,
  config: SimulatorCalibrationConfig
): string {
  const root = resolveProjectRoot(projectRoot);
  const dir = path.join(root, 'datasets/auditor');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(root, SIMULATOR_CALIBRATION_CONFIG_PATH),
    `${JSON.stringify(config, null, 2)}\n`,
    'utf8'
  );
  return SIMULATOR_CALIBRATION_CONFIG_PATH;
}

function slotRiskMap(report: PreGenerationSimulatorReport): Map<string, { score: number; level: string }> {
  return new Map(report.slot_results.map((r) => [r.slot_id, { score: r.risk_score, level: r.risk_level }]));
}

function actualVerdictBySlot(feedback: GenerationFeedbackReport): Map<string, string> {
  return new Map(feedback.slot_results.map((r) => [r.slot_id, r.verdict]));
}

export function runSimulatorCalibration(projectRoot?: string): {
  config: SimulatorCalibrationConfig;
  report: SimulatorCalibrationReport;
  calibrated_simulator: PreGenerationSimulatorReport;
} {
  const root = resolveProjectRoot(projectRoot);
  const feedback = readJsonRecord(root, GENERATION_FEEDBACK_REPORT_PATH) as GenerationFeedbackReport | null;
  const simulatorBefore = readJsonRecord(
    root,
    PRE_GEN_SIMULATOR_REPORT_PATH
  ) as PreGenerationSimulatorReport | null;

  if (!feedback) {
    throw new Error(`Missing ${GENERATION_FEEDBACK_REPORT_PATH}`);
  }

  const { config, weight_changes } = buildCalibratedWeights(feedback, simulatorBefore);
  writeSimulatorCalibrationConfig(root, config);

  const scenario = JSON.parse(
    fs.readFileSync(path.join(root, MDS005_FIXTURE_PATH), 'utf8')
  ) as Record<string, unknown>;

  const beforeReport =
    simulatorBefore ??
    runPreGenerationSimulation({
      projectRoot: root,
      scenario,
      scenarioPath: MDS005_FIXTURE_PATH,
      calibration: null,
    });

  const calibratedSimulator = runPreGenerationSimulation({
    projectRoot: root,
    scenario,
    scenarioPath: MDS005_FIXTURE_PATH,
    calibration: config,
  });

  writePreGenerationSimulatorReport(root, calibratedSimulator);

  const beforeMap = slotRiskMap(beforeReport);
  const afterMap = slotRiskMap(calibratedSimulator);
  const actualMap = actualVerdictBySlot(feedback);

  const slot_risk_before_after: SlotRiskBeforeAfter[] = [...afterMap.keys()].map((slot_id) => ({
    slot_id,
    risk_score_before: beforeMap.get(slot_id)?.score ?? 0,
    risk_score_after: afterMap.get(slot_id)?.score ?? 0,
    risk_level_before: beforeMap.get(slot_id)?.level ?? 'UNKNOWN',
    risk_level_after: afterMap.get(slot_id)?.level ?? 'UNKNOWN',
    actual_verdict: actualMap.get(slot_id),
  }));

  const calibrated_expected_pass_rate = calibratedSimulator.expected_pass_rate;
  const actual_pass_rate = feedback.summary.actual_pass_rate;
  const adjusted_actual_pass_rate = feedback.summary.adjusted_pass_rate;

  const pass =
    calibrated_expected_pass_rate >= 0.75 &&
    calibrated_expected_pass_rate <= 0.9 &&
    calibratedSimulator.quota_recommendation.watch_slots.length > 0 &&
    calibratedSimulator.quota_recommendation.skip_or_rewrite_slots.length === 0 &&
    (feedback.summary.fail_count === 0
      ? calibratedSimulator.generation_risk_estimate.critical_slot_count === 0
      : true);

  const calibrationReport: SimulatorCalibrationReport = {
    calibration_id: config.calibration_id,
    phase: SIMULATOR_CALIBRATION_PHASE,
    timestamp: new Date().toISOString(),
    previous_expected_pass_rate: beforeReport.expected_pass_rate,
    actual_pass_rate,
    adjusted_actual_pass_rate,
    calibrated_expected_pass_rate,
    weight_changes: Object.freeze(weight_changes),
    slot_risk_before_after: Object.freeze(slot_risk_before_after),
    calibrated_quota: {
      safe_slots: calibratedSimulator.quota_recommendation.safe_slots,
      watch_slots: calibratedSimulator.quota_recommendation.watch_slots,
      skip_or_rewrite_slots: calibratedSimulator.quota_recommendation.skip_or_rewrite_slots,
    },
    config_path: SIMULATOR_CALIBRATION_CONFIG_PATH,
    final_verdict: pass ? SIMULATOR_CALIBRATION_PASS_VERDICT : SIMULATOR_CALIBRATION_FAIL_VERDICT,
  };

  const payload = {
    ...calibrationReport,
    report_type: 'simulator_calibration_report',
    report_version: 'v1',
    export_path: SIMULATOR_CALIBRATION_REPORT_PATH,
    next_phase: 'PHASE-AUDITOR-007 AUDITOR_DASHBOARD_SUMMARY_V1',
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, SIMULATOR_CALIBRATION_REPORT_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );

  return { config, report: calibrationReport, calibrated_simulator: calibratedSimulator };
}
