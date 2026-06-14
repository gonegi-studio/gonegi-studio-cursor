import fs from 'node:fs';
import path from 'node:path';
import { IMAGE_APP_LATEST_DIR } from './exportGovernance.js';
import { IMAGE_APP_LATEST_ALLOWLIST } from './imageAppExportGovernance.js';
import { IDENTITY_DRIFT_REPORT_PATH } from './identityDriftPredictor.js';
import { PROJECT_AUDITOR_REPORT_PATH } from './projectAuditor.js';
import { riskLevelFromScore } from './auditors/identityDrift/driftPredictorShared.js';
import type { IdentityDriftPredictorReport } from './identityDriftPredictor.js';
import type { ProjectAuditResult } from './projectAuditor.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import { readJsonRecord } from './auditors/auditorShared.js';

export const PRE_GEN_SIMULATOR_PHASE = 'PHASE-AUDITOR-004' as const;
export const PRE_GEN_SIMULATOR_PASS_VERDICT = 'PASS_PRE_GENERATION_SIMULATOR_V1' as const;
export const PRE_GEN_SIMULATOR_FAIL_VERDICT = 'FAIL_PRE_GENERATION_SIMULATOR_V1' as const;
export const PRE_GEN_SIMULATOR_REPORT_PATH = 'reports/pre-generation-simulator-report.json' as const;
export const MDS005_FIXTURE_PATH =
  'reports/fixtures/MDS005_15_IMAGE_PRODUCTION_TEST_V2_16_FULL_FORMAT.json' as const;
export const SIMULATOR_CALIBRATION_CONFIG_PATH = 'datasets/auditor/simulator-calibration-v1.json' as const;

export const DEFAULT_SLOT_DIMENSION_WEIGHTS = Object.freeze({
  identity_risk: 1.2,
  costume_risk: 0.9,
  hairstyle_risk: 0.7,
  duplication_risk: 1.1,
  location_risk: 1.0,
  prop_risk: 0.8,
  composition_risk: 1.0,
  lighting_risk: 0.85,
  token_pressure_risk: 0.75,
});

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type ParsedScenarioSlot = {
  slot_id: string;
  characters: string[];
  location_id: string;
  lighting_id: string;
  composition_id: string;
  shot_type: string;
  scenario_text: string;
  character_text: string;
};

export type SlotRiskDimensions = {
  identity_risk: number;
  costume_risk: number;
  hairstyle_risk: number;
  duplication_risk: number;
  location_risk: number;
  prop_risk: number;
  composition_risk: number;
  lighting_risk: number;
  token_pressure_risk: number;
};

export type SimulatorCalibrationConfig = {
  calibration_id: string;
  phase: string;
  generated_at: string;
  source_feedback_test: string;
  source_feedback_report?: string;
  source_simulator_report?: string;
  identity_weight: number;
  costume_weight: number;
  hairstyle_weight: number;
  duplication_weight: number;
  location_weight: number;
  composition_weight: number;
  lighting_weight: number;
  token_pressure_weight: number;
  outdoor_layout_bonus?: Partial<SlotRiskDimensions>;
  multi_character_bonus?: Partial<SlotRiskDimensions>;
  calibrated_pass_credit?: Partial<Record<RiskLevel, number>>;
};

export type SlotSimulationResult = {
  slot_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  dimensions: SlotRiskDimensions;
  top_risk_reasons: readonly string[];
  recommended_action: string;
};

export type QuotaRecommendation = {
  safe_slots: readonly string[];
  watch_slots: readonly string[];
  skip_or_rewrite_slots: readonly string[];
};

export type GenerationRiskEstimate = {
  overall_risk: number;
  overall_risk_level: RiskLevel;
  dimension_averages: SlotRiskDimensions;
  expected_pass_rate: number;
  critical_slot_count: number;
  high_slot_count: number;
};

export type PreGenerationSimulatorReport = {
  simulator_id: string;
  phase: typeof PRE_GEN_SIMULATOR_PHASE;
  timestamp: string;
  scenario_path: string;
  upload_set_count: number;
  upload_set_files: readonly string[];
  calibrated: boolean;
  calibration_id: string | null;
  generation_risk_estimate: GenerationRiskEstimate;
  overall_risk: number;
  slot_results: readonly SlotSimulationResult[];
  highest_risk_slots: readonly string[];
  quota_recommendation: QuotaRecommendation;
  expected_pass_rate: number;
  final_verdict: typeof PRE_GEN_SIMULATOR_PASS_VERDICT | typeof PRE_GEN_SIMULATOR_FAIL_VERDICT;
};

export function loadSimulatorCalibrationConfig(
  projectRoot: string
): SimulatorCalibrationConfig | null {
  const doc = readJsonRecord(projectRoot, SIMULATOR_CALIBRATION_CONFIG_PATH);
  if (!doc || doc.calibration_id !== 'simulator-calibration-v1') return null;
  return doc as unknown as SimulatorCalibrationConfig;
}

function dimensionWeightsFromCalibration(
  calibration: SimulatorCalibrationConfig | null
): Record<keyof SlotRiskDimensions, number> {
  if (!calibration) return { ...DEFAULT_SLOT_DIMENSION_WEIGHTS };
  return {
    identity_risk: calibration.identity_weight,
    costume_risk: calibration.costume_weight,
    hairstyle_risk: calibration.hairstyle_weight,
    duplication_risk: calibration.duplication_weight,
    location_risk: calibration.location_weight,
    prop_risk: DEFAULT_SLOT_DIMENSION_WEIGHTS.prop_risk,
    composition_risk: calibration.composition_weight,
    lighting_risk: calibration.lighting_weight,
    token_pressure_risk: calibration.token_pressure_weight,
  };
}

const INDOOR_ANCHORED_LOCATIONS = new Set([
  'gonegi_bedroom_01',
  'gonegi_window_corner_01',
  'family_bakery_kitchen_01',
  'family_bakery_dining_01',
  'dana_bedroom_01',
  'dana_window_corner_01',
]);

const OUTDOOR_LAYOUT_LOCATIONS = new Set([
  'olive_hill_overlook_01',
  'harbor_watch_point_01',
  'harbor_sunset_bench_01',
  'harbor_cliff_path_01',
  'dockside_walkway_01',
  'lighthouse_overlook_01',
  'harbor_main_dock_01',
]);

const KNOWN_COMPOSITIONS = new Set([
  'gonegi_bedroom_reading',
  'gonegi_window_reflection',
  'dana_window_reading',
  'bakery_breakfast',
  'bakery_evening_cleanup',
  'olive_hill_rest',
  'harbor_watch_point',
  'harbor_sunset_bench',
]);

const EP01_FORBIDDEN_CHARACTERS = new Set(['dana', 'aengdu']);

function loadJson<T>(projectRoot: string, rel: string): T | null {
  const doc = readJsonRecord(projectRoot, rel);
  return doc as T | null;
}

export function parseScenarioSlots(scenario: Record<string, unknown>): ParsedScenarioSlot[] {
  const slots = scenario.slots;
  if (!Array.isArray(slots)) return [];

  return slots
    .filter((row) => row && typeof row === 'object')
    .map((row) => {
      const s = row as Record<string, unknown>;
      const characters = Array.isArray(s.characters)
        ? s.characters.filter((c): c is string => typeof c === 'string')
        : typeof s.character_id === 'string'
          ? [s.character_id]
          : [];

      return {
        slot_id: String(s.slot_id ?? s.render_slot_id ?? 'unknown'),
        characters,
        location_id: String(s.location_id ?? ''),
        lighting_id: String(s.lighting_id ?? s.lighting_anchor_id ?? ''),
        composition_id: String(s.composition_id ?? ''),
        shot_type: String(s.shot_type ?? 'medium'),
        scenario_text: String(s.scenario_text ?? s.prompt_summary ?? s.scene_goal ?? ''),
        character_text: String(s.character_text ?? s.character_prompt ?? ''),
      };
    });
}

export function loadLatestUploadSet(projectRoot: string): string[] {
  const latestDir = path.join(projectRoot, IMAGE_APP_LATEST_DIR);
  if (!fs.existsSync(latestDir)) return [];
  return IMAGE_APP_LATEST_ALLOWLIST.filter((name) =>
    fs.existsSync(path.join(latestDir, name))
  );
}

export function loadIdentityDriftReport(projectRoot: string): IdentityDriftPredictorReport | null {
  return loadJson(projectRoot, IDENTITY_DRIFT_REPORT_PATH);
}

export function loadProjectAuditorReport(projectRoot: string): ProjectAuditResult | null {
  return loadJson(projectRoot, PROJECT_AUDITOR_REPORT_PATH);
}

function baselineFromReports(
  drift: IdentityDriftPredictorReport | null,
  auditor: ProjectAuditResult | null
): SlotRiskDimensions {
  const driftIdentity = drift?.overall_identity_risk ?? 15;
  return {
    identity_risk: Math.min(40, driftIdentity * 0.35),
    costume_risk: Math.min(30, (drift?.costume_risk ?? 0) * 0.4),
    hairstyle_risk: Math.min(25, (drift?.hairstyle_risk ?? 5) * 0.5),
    duplication_risk: Math.min(30, (drift?.duplication_risk ?? 5) * 0.5),
    location_risk: Math.min(35, (auditor?.continuity_risk_score ?? 12) * 0.3),
    prop_risk: Math.min(20, 5),
    composition_risk: Math.min(35, (auditor?.adapter_risk_score ?? 20) * 0.25),
    lighting_risk: Math.min(25, 8),
    token_pressure_risk: Math.min(30, (drift?.anchor_dilution_risk ?? 15) * 0.35),
  };
}

function applyCalibrationBonuses(
  slot: ParsedScenarioSlot,
  dimensions: SlotRiskDimensions,
  calibration: SimulatorCalibrationConfig | null
): void {
  if (!calibration) return;

  if (OUTDOOR_LAYOUT_LOCATIONS.has(slot.location_id) && calibration.outdoor_layout_bonus) {
    for (const [key, bonus] of Object.entries(calibration.outdoor_layout_bonus) as [
      keyof SlotRiskDimensions,
      number,
    ][]) {
      if (typeof bonus === 'number') dimensions[key] += bonus;
    }
  }

  const humanCount = slot.characters.filter((c) => !['gamja', 'aengdu'].includes(c)).length;
  if (humanCount >= 2 && calibration.multi_character_bonus) {
    for (const [key, bonus] of Object.entries(calibration.multi_character_bonus) as [
      keyof SlotRiskDimensions,
      number,
    ][]) {
      if (typeof bonus === 'number') dimensions[key] += bonus;
    }
  }
}

function scoreSlot(
  slot: ParsedScenarioSlot,
  baseline: SlotRiskDimensions,
  uploadCount: number,
  calibration: SimulatorCalibrationConfig | null = null
): SlotSimulationResult {
  const dimensions: SlotRiskDimensions = { ...baseline };
  const reasons: string[] = [];

  if (slot.characters.some((c) => EP01_FORBIDDEN_CHARACTERS.has(c))) {
    dimensions.identity_risk += 25;
    reasons.push('EP01-forbidden character present');
  }

  if (slot.characters.length > 2) {
    dimensions.duplication_risk += 18;
    reasons.push('Multiple characters increase duplication risk');
  } else if (slot.characters.length === 2) {
    dimensions.duplication_risk += 8;
  }

  const mainHumans = slot.characters.filter((c) => !['gamja', 'aengdu'].includes(c));
  if (mainHumans.length > 1 && slot.scenario_text.toLowerCase().includes('solo')) {
    dimensions.duplication_risk += 20;
    reasons.push('Solo scene text conflicts with multiple characters');
  }

  if (!slot.location_id) {
    dimensions.location_risk += 30;
    reasons.push('Missing location_id');
  } else if (INDOOR_ANCHORED_LOCATIONS.has(slot.location_id)) {
    dimensions.location_risk = Math.max(0, dimensions.location_risk - 5);
  } else if (OUTDOOR_LAYOUT_LOCATIONS.has(slot.location_id)) {
    dimensions.location_risk += 6;
    dimensions.composition_risk += 8;
    reasons.push('Outdoor layout stack active — moderate composition pressure');
  } else {
    dimensions.location_risk += 15;
    reasons.push('Location lacks indoor/outdoor anchor registry');
  }

  if (!slot.lighting_id) {
    dimensions.lighting_risk += 22;
    reasons.push('Missing lighting_id');
  }

  if (!slot.composition_id) {
    dimensions.composition_risk += 12;
    reasons.push('Missing composition_id');
  } else if (!KNOWN_COMPOSITIONS.has(slot.composition_id)) {
    dimensions.composition_risk += 10;
    reasons.push('Unknown composition_id');
  }

  if (INDOOR_ANCHORED_LOCATIONS.has(slot.location_id) && uploadCount >= 14) {
    dimensions.prop_risk += 4;
  }

  const textLen = slot.scenario_text.length + slot.character_text.length;
  if (textLen > 420) {
    dimensions.token_pressure_risk += 15;
    reasons.push('Long scenario text increases token pressure');
  } else if (textLen > 280) {
    dimensions.token_pressure_risk += 8;
  }

  if (slot.shot_type.includes('wide') && OUTDOOR_LAYOUT_LOCATIONS.has(slot.location_id)) {
    dimensions.composition_risk += 5;
  }

  if (slot.characters.includes('gamja') && slot.location_id.startsWith('family_bakery')) {
    dimensions.identity_risk += 3;
  }

  applyCalibrationBonuses(slot, dimensions, calibration);

  const weights = dimensionWeightsFromCalibration(calibration);

  let weightedSum = 0;
  let weightTotal = 0;
  for (const key of Object.keys(dimensions) as (keyof SlotRiskDimensions)[]) {
    const capped = Math.min(100, dimensions[key]);
    dimensions[key] = capped;
    weightedSum += capped * weights[key];
    weightTotal += weights[key];
  }

  const weightedScore = Math.min(100, Math.round(weightedSum / weightTotal));
  const peakDimension = Math.max(...Object.values(dimensions));
  const risk_score = calibration
    ? Math.min(100, Math.round(weightedScore * 0.55 + peakDimension * 0.55))
    : weightedScore;
  const risk_level = riskLevelFromScore(risk_score);

  const sortedDims = (Object.entries(dimensions) as [keyof SlotRiskDimensions, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, v]) => `${k}=${v}`);

  const top_risk_reasons = Object.freeze([
    ...reasons.slice(0, 3),
    ...sortedDims,
  ].slice(0, 4));

  const recommended_action =
    risk_level === 'CRITICAL'
      ? 'Skip or rewrite slot before spending quota.'
      : risk_level === 'HIGH'
        ? 'Rewrite composition/character focus or reduce outdoor enforcement before render.'
        : risk_level === 'MODERATE'
          ? 'Proceed with watch — verify anchors and solo-character rules.'
          : 'Safe to spend quota on this slot.';

  return {
    slot_id: slot.slot_id,
    risk_score,
    risk_level,
    dimensions,
    top_risk_reasons,
    recommended_action,
  };
}

function averageDimensions(results: SlotSimulationResult[]): SlotRiskDimensions {
  const keys = Object.keys(results[0]?.dimensions ?? {}) as (keyof SlotRiskDimensions)[];
  const avg = {} as SlotRiskDimensions;
  for (const key of keys) {
    const sum = results.reduce((s, r) => s + r.dimensions[key], 0);
    avg[key] = results.length ? Math.round(sum / results.length) : 0;
  }
  return avg;
}

function buildQuotaRecommendation(results: SlotSimulationResult[]): QuotaRecommendation {
  return {
    safe_slots: Object.freeze(
      results.filter((r) => r.risk_level === 'LOW').map((r) => r.slot_id)
    ),
    watch_slots: Object.freeze(
      results.filter((r) => r.risk_level === 'MODERATE' || r.risk_level === 'HIGH').map((r) => r.slot_id)
    ),
    skip_or_rewrite_slots: Object.freeze(
      results.filter((r) => r.risk_level === 'CRITICAL').map((r) => r.slot_id)
    ),
  };
}

function computeExpectedPassRate(
  results: SlotSimulationResult[],
  calibration: SimulatorCalibrationConfig | null = null
): number {
  if (results.length === 0) return 0;

  if (calibration?.calibrated_pass_credit) {
    const credit = calibration.calibrated_pass_credit;
    const totalCredit = results.reduce((sum, r) => {
      const value = credit[r.risk_level] ?? (r.risk_level === 'LOW' ? 1 : 0);
      return sum + value;
    }, 0);
    return Number((totalCredit / results.length).toFixed(4));
  }

  const passSlots = results.filter(
    (r) => r.risk_level !== 'CRITICAL' && r.risk_score < 50
  ).length;
  return Number((passSlots / results.length).toFixed(4));
}

export function runPreGenerationSimulation(input: {
  projectRoot: string;
  scenario: Record<string, unknown>;
  scenarioPath: string;
  identityDriftReport?: IdentityDriftPredictorReport | null;
  projectAuditorReport?: ProjectAuditResult | null;
  calibration?: SimulatorCalibrationConfig | null;
}): PreGenerationSimulatorReport {
  const root = resolveProjectRoot(input.projectRoot);
  const slots = parseScenarioSlots(input.scenario);
  const drift = input.identityDriftReport ?? loadIdentityDriftReport(root);
  const auditor = input.projectAuditorReport ?? loadProjectAuditorReport(root);
  const uploadSet = loadLatestUploadSet(root);
  const baseline = baselineFromReports(drift, auditor);
  const calibration =
    input.calibration === undefined
      ? loadSimulatorCalibrationConfig(root)
      : input.calibration;

  const slot_results = slots.map((slot) => scoreSlot(slot, baseline, uploadSet.length, calibration));
  const overall_risk =
    slot_results.length > 0
      ? Math.max(...slot_results.map((r) => r.risk_score))
      : 100;

  const expected_pass_rate = computeExpectedPassRate(slot_results, calibration);
  const critical_slot_count = slot_results.filter((r) => r.risk_level === 'CRITICAL').length;
  const high_slot_count = slot_results.filter((r) => r.risk_level === 'HIGH').length;

  const pass =
    critical_slot_count === 0 &&
    (calibration
      ? expected_pass_rate >= 0.75 && expected_pass_rate <= 0.95
      : expected_pass_rate >= 0.85) &&
    riskLevelFromScore(overall_risk) !== 'CRITICAL';

  const sorted = [...slot_results].sort((a, b) => b.risk_score - a.risk_score);

  return {
    simulator_id: `pregen_${Date.now().toString(36)}`,
    phase: PRE_GEN_SIMULATOR_PHASE,
    timestamp: new Date().toISOString(),
    scenario_path: input.scenarioPath,
    upload_set_count: uploadSet.length,
    upload_set_files: Object.freeze(uploadSet),
    calibrated: calibration !== null,
    calibration_id: calibration?.calibration_id ?? null,
    generation_risk_estimate: {
      overall_risk,
      overall_risk_level: riskLevelFromScore(overall_risk),
      dimension_averages: averageDimensions(slot_results),
      expected_pass_rate,
      critical_slot_count,
      high_slot_count,
    },
    overall_risk,
    slot_results: Object.freeze(slot_results),
    highest_risk_slots: Object.freeze(sorted.slice(0, 5).map((r) => r.slot_id)),
    quota_recommendation: buildQuotaRecommendation(slot_results),
    expected_pass_rate,
    final_verdict: pass ? PRE_GEN_SIMULATOR_PASS_VERDICT : PRE_GEN_SIMULATOR_FAIL_VERDICT,
  };
}

export function writePreGenerationSimulatorReport(
  projectRoot: string,
  report: PreGenerationSimulatorReport
): string {
  const root = resolveProjectRoot(projectRoot);
  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  const payload = {
    ...report,
    report_type: 'pre_generation_simulator_report',
    report_version: 'v1',
    export_path: PRE_GEN_SIMULATOR_REPORT_PATH,
    next_phase: 'PHASE-AUDITOR-006 SIMULATOR_CALIBRATION_V1',
  };
  fs.writeFileSync(
    path.join(root, PRE_GEN_SIMULATOR_REPORT_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );
  return PRE_GEN_SIMULATOR_REPORT_PATH;
}

export function runMds005FixtureVerification(projectRoot?: string): PreGenerationSimulatorReport {
  const root = resolveProjectRoot(projectRoot);
  const fixturePath = path.join(root, MDS005_FIXTURE_PATH);
  const scenario = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as Record<string, unknown>;
  const report = runPreGenerationSimulation({
    projectRoot: root,
    scenario,
    scenarioPath: MDS005_FIXTURE_PATH,
    calibration: loadSimulatorCalibrationConfig(root),
  });
  writePreGenerationSimulatorReport(root, report);
  return report;
}
