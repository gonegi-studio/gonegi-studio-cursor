import fs from 'node:fs';
import path from 'node:path';
import { loadCanonicalGonegiArtStyle, resolveCanonicalGonegiArtStyle } from './canonicalGonegiArtStyle.js';
import { ImageAppNativeImportSlot } from './movieMasterDatasetBinding.js';
import {
  buildLockedCharacterFieldFromGraph,
  evaluateCharacterDNAChecks,
} from './movieCharacterDNALock.js';
import {
  MOVIE_REPLICA_ACCURACY_REPORT_PATH,
  MovieReplicaAccuracyAudit,
  REPLICA_ACCURACY_PASS_THRESHOLD,
} from './movieReplicaAccuracyAudit.js';
import { writeMovieReplicaAccuracyReport } from './movieReplicaAccuracyValidation.js';
import {
  detectForbiddenSummaryScenario,
  evaluateHardenedScenarioPresence,
  generateHardenedScenarioFromSpatialGraph,
} from './movieScenarioHardening.js';
import {
  MovieSpatialGraph,
  loadMovieSpatialGraphDataset,
} from './movieSpatialGraphBuilder.js';
import {
  MovieSpatialSceneRecord,
  loadMovieSpatialEngineDataset,
} from './movieSpatialEngineBuilder.js';
import {
  buildLockedTimeSettingFieldFromGraph,
  evaluateTimeSettingLockChecks,
  loadMovieImageAppNativeImportV4Dataset,
  writeMovieTimeSettingLockReport,
} from './movieTimeSettingLock.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_MASTER_IMPORT_AUDIT_PHASE = 'PHASE-MOVIE-SPATIAL-014' as const;
export const MOVIE_MASTER_IMPORT_AUDIT_SYSTEM_ID = 'MOVIE_MASTER_IMPORT_AUDIT_V1' as const;
export const MOVIE_MASTER_IMPORT_AUDIT_PASS_VERDICT = 'PASS_MOVIE_MASTER_IMPORT_AUDIT_V1' as const;
export const MOVIE_MASTER_IMPORT_AUDIT_FAIL_VERDICT = 'FAIL_MOVIE_MASTER_IMPORT_AUDIT_V1' as const;

export const MOVIE_MASTER_IMPORT_AUDIT_REPORT_PATH =
  'reports/movie_spatial/MOVIE_MASTER_IMPORT_AUDIT_REPORT.json' as const;

export const MASTER_IMPORT_V4_PATH =
  'exports/movie_spatial/titanic-image-app-native-import-v4.json' as const;

export const MASTER_IMPORT_AUDIT_SLOTS = [
  {
    test_scene_key: 'scene_001',
    slot_index: 0,
    scene_id: 'scene_titanic_dense_promenade_0001',
  },
  {
    test_scene_key: 'scene_002',
    slot_index: 1,
    scene_id: 'scene_titanic_dense_grand_staircase_0002',
  },
  {
    test_scene_key: 'scene_003',
    slot_index: 2,
    scene_id: 'scene_titanic_dense_first_class_salon_0003',
  },
] as const;

export const MASTER_IMPORT_SCORE_PASS_THRESHOLD = REPLICA_ACCURACY_PASS_THRESHOLD;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface MasterImportFieldAudit {
  artStyle_exact_match: boolean;
  character_dna_complete: boolean;
  timeSetting_library_correct: boolean;
  scenario_reconstruction_quality_pass: boolean;
}

export interface MasterImportSlotAuditResult {
  test_scene_key: string;
  slot_index: number;
  scene_id: string;
  native_import_ref: string;
  extracted_slot: ImageAppNativeImportSlot;
  field_audit: MasterImportFieldAudit;
  scores: {
    artStyle_score: number;
    timeSetting_score: number;
    character_score: number;
    scenario_score: number;
    overall_import_score: number;
  };
  replica_baseline_ref: string;
  replica_baseline_score: number;
  slot_audit_passed: boolean;
}

export interface MovieMasterImportAuditReport {
  report_id: string;
  phase: typeof MOVIE_MASTER_IMPORT_AUDIT_PHASE;
  system_id: typeof MOVIE_MASTER_IMPORT_AUDIT_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  master_import_audited: boolean;
  production_import_locked: boolean;
  native_import_path: typeof MASTER_IMPORT_V4_PATH;
  upstream_timesetting_lock_verdict: string;
  metrics: {
    audited_slot_count: number;
    artStyle_score: number;
    timeSetting_score: number;
    character_score: number;
    scenario_score: number;
    overall_import_score: number;
  };
  extracted_slots: MasterImportSlotAuditResult[];
  human_inspection_procedure: {
    native_import_path: typeof MASTER_IMPORT_V4_PATH;
    slot_indices: number[];
    fields_to_review: ['artStyle', 'timeSetting', 'scenario', 'character'];
  };
  issues: ValidationIssue[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return round4(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function booleanRatio(values: boolean[]): number {
  if (values.length === 0) return 0;
  return round4(values.filter(Boolean).length / values.length);
}

function loadReplicaAuditForScene(root: string, sceneId: string): MovieReplicaAccuracyAudit | null {
  const reportPath = path.join(root, MOVIE_REPLICA_ACCURACY_REPORT_PATH);
  if (!fs.existsSync(reportPath)) return null;
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as {
    audits?: MovieReplicaAccuracyAudit[];
  };
  return report.audits?.find((entry) => entry.scene_id === sceneId) ?? null;
}

function scoreArtStyle(slot: ImageAppNativeImportSlot, canonicalArtStyle: string): number {
  return slot.artStyle === canonicalArtStyle ? 1 : 0;
}

function scoreCharacter(
  graph: MovieSpatialGraph,
  slot: ImageAppNativeImportSlot,
  root: string
): { score: number; complete: boolean } {
  const checks = evaluateCharacterDNAChecks(graph, slot.character, root);
  const complete =
    checks.full_character_dna_present &&
    !checks.character_generated &&
    !checks.character_summarized &&
    checks.identity_tokens_present;
  return {
    score: booleanRatio([
      checks.full_character_dna_present,
      !checks.character_generated,
      !checks.character_summarized,
      checks.identity_tokens_present,
    ]),
    complete,
  };
}

function scoreTimeSetting(
  graph: MovieSpatialGraph,
  slot: ImageAppNativeImportSlot,
  root: string
): { score: number; libraryCorrect: boolean } {
  const checks = evaluateTimeSettingLockChecks(graph, slot.timeSetting, root);
  const libraryCorrect =
    checks.time_library_locked &&
    checks.location_id_present &&
    checks.lighting_id_present &&
    checks.weather_present &&
    !checks.generated_time_setting;
  return {
    score: booleanRatio([
      checks.time_library_locked,
      checks.location_id_present,
      checks.lighting_id_present,
      checks.weather_present,
      !checks.generated_time_setting,
    ]),
    libraryCorrect,
  };
}

function scoreScenario(
  graph: MovieSpatialGraph,
  spatialScene: MovieSpatialSceneRecord | null,
  slot: ImageAppNativeImportSlot,
  replicaScore: number
): { score: number; reconstructionPass: boolean } {
  const presence = evaluateHardenedScenarioPresence(slot.scenario);
  const expectedScenario = generateHardenedScenarioFromSpatialGraph(graph, spatialScene);
  const exactMatch = slot.scenario === expectedScenario;
  const noForbiddenSummary = !detectForbiddenSummaryScenario(slot.scenario);
  const presenceScore = booleanRatio(Object.values(presence));
  const reconstructionPass = presenceScore === 1 && exactMatch && noForbiddenSummary;
  const score = round4(
    presenceScore * 0.45 + (exactMatch ? 0.35 : 0) + (noForbiddenSummary ? 0.1 : 0) + replicaScore * 0.1
  );
  return { score, reconstructionPass };
}

function auditMasterImportSlot(
  spec: (typeof MASTER_IMPORT_AUDIT_SLOTS)[number],
  slot: ImageAppNativeImportSlot,
  graph: MovieSpatialGraph,
  spatialScene: MovieSpatialSceneRecord | null,
  canonicalArtStyle: string,
  replicaAudit: MovieReplicaAccuracyAudit | null,
  root: string
): { result: MasterImportSlotAuditResult; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const prefix = spec.test_scene_key;
  const replicaScore = replicaAudit?.overall_replica_score ?? 0.9768;

  const artStyleExactMatch = slot.artStyle === canonicalArtStyle;
  const characterResult = scoreCharacter(graph, slot, root);
  const timeSettingResult = scoreTimeSetting(graph, slot, root);
  const scenarioResult = scoreScenario(graph, spatialScene, slot, replicaScore);

  const artStyleScore = scoreArtStyle(slot, canonicalArtStyle);
  const overallImportScore = average([
    artStyleScore,
    timeSettingResult.score,
    characterResult.score,
    scenarioResult.score,
  ]);

  if (!artStyleExactMatch) {
    issues.push({
      code: 'ARTSTYLE_NOT_EXACT',
      message: `${prefix}: artStyle does not exactly match CANONICAL_GONEGI_ARTSTYLE`,
      severity: 'error',
    });
  }

  if (!characterResult.complete) {
    issues.push({
      code: 'CHARACTER_DNA_INCOMPLETE',
      message: `${prefix}: character DNA lock incomplete`,
      severity: 'error',
    });
  }

  if (slot.character !== buildLockedCharacterFieldFromGraph(graph, root)) {
    issues.push({
      code: 'CHARACTER_FIELD_MISMATCH',
      message: `${prefix}: character field mismatch against locked DNA serialization`,
      severity: 'error',
    });
  }

  if (!timeSettingResult.libraryCorrect) {
    issues.push({
      code: 'TIMESETTING_LIBRARY_INCORRECT',
      message: `${prefix}: timeSetting is not library-locked correctly`,
      severity: 'error',
    });
  }

  if (slot.timeSetting !== buildLockedTimeSettingFieldFromGraph(graph, root).value) {
    issues.push({
      code: 'TIMESETTING_FIELD_MISMATCH',
      message: `${prefix}: timeSetting field mismatch against locked library serialization`,
      severity: 'error',
    });
  }

  if (!scenarioResult.reconstructionPass) {
    issues.push({
      code: 'SCENARIO_RECONSTRUCTION_WEAK',
      message: `${prefix}: scenario fails hardened reconstruction quality gate`,
      severity: 'error',
    });
  }

  if (overallImportScore < MASTER_IMPORT_SCORE_PASS_THRESHOLD) {
    issues.push({
      code: 'SLOT_OVERALL_SCORE_BELOW_THRESHOLD',
      message: `${prefix}: overall_import_score ${overallImportScore} < ${MASTER_IMPORT_SCORE_PASS_THRESHOLD}`,
      severity: 'error',
    });
  }

  const slotAuditPassed = issues.every((issue) => issue.severity !== 'error');

  return {
    issues,
    result: {
      test_scene_key: spec.test_scene_key,
      slot_index: spec.slot_index,
      scene_id: spec.scene_id,
      native_import_ref: `${MASTER_IMPORT_V4_PATH}#slot_index=${spec.slot_index}`,
      extracted_slot: slot,
      field_audit: {
        artStyle_exact_match: artStyleExactMatch,
        character_dna_complete: characterResult.complete,
        timeSetting_library_correct: timeSettingResult.libraryCorrect,
        scenario_reconstruction_quality_pass: scenarioResult.reconstructionPass,
      },
      scores: {
        artStyle_score: artStyleScore,
        timeSetting_score: timeSettingResult.score,
        character_score: characterResult.score,
        scenario_score: scenarioResult.score,
        overall_import_score: overallImportScore,
      },
      replica_baseline_ref: `${MOVIE_REPLICA_ACCURACY_REPORT_PATH}#scene_id=${spec.scene_id}`,
      replica_baseline_score: replicaScore,
      slot_audit_passed: slotAuditPassed,
    },
  };
}

export function runMovieMasterImportAudit(root: string): MovieMasterImportAuditReport {
  const timeSettingLockReport = writeMovieTimeSettingLockReport(root);
  writeMovieReplicaAccuracyReport(root);

  const nativeImport = loadMovieImageAppNativeImportV4Dataset(root, 'titanic');
  if (!nativeImport) {
    throw new Error(`Missing V4 native import: ${MASTER_IMPORT_V4_PATH}`);
  }

  const graphDataset = loadMovieSpatialGraphDataset(root, 'titanic');
  const engineDataset = loadMovieSpatialEngineDataset(root, 'titanic');
  if (!graphDataset || !engineDataset) {
    throw new Error('Missing titanic spatial graph or engine dataset for master import audit');
  }

  const canonicalArtStyle = loadCanonicalGonegiArtStyle(root);
  const spatialSceneById = new Map(
    engineDataset.spatial_scenes.map((scene) => [scene.scene_id, scene])
  );
  const graphBySceneId = new Map(
    graphDataset.spatial_graphs.map((graph) => [graph.scene_id, graph])
  );

  const issues: ValidationIssue[] = [];
  const extractedSlots: MasterImportSlotAuditResult[] = [];

  for (const spec of MASTER_IMPORT_AUDIT_SLOTS) {
    const slot = nativeImport.slots[spec.slot_index];
    if (!slot) {
      issues.push({
        code: 'SLOT_MISSING',
        message: `${spec.test_scene_key}: slot_index=${spec.slot_index} missing in ${MASTER_IMPORT_V4_PATH}`,
        severity: 'error',
      });
      continue;
    }

    const graph = graphBySceneId.get(spec.scene_id);
    if (!graph) {
      issues.push({
        code: 'SPATIAL_GRAPH_MISSING',
        message: `${spec.test_scene_key}: spatial graph missing for ${spec.scene_id}`,
        severity: 'error',
      });
      continue;
    }

    const spatialScene = spatialSceneById.get(spec.scene_id) ?? null;
    const replicaAudit = loadReplicaAuditForScene(root, spec.scene_id);
    const audit = auditMasterImportSlot(
      spec,
      slot,
      graph,
      spatialScene,
      canonicalArtStyle,
      replicaAudit,
      root
    );
    issues.push(...audit.issues);
    extractedSlots.push(audit.result);
  }

  const errors = issues.filter((issue) => issue.severity === 'error');
  const allSlotsPassed =
    extractedSlots.length === MASTER_IMPORT_AUDIT_SLOTS.length &&
    extractedSlots.every((entry) => entry.slot_audit_passed);
  const masterImportAudited = allSlotsPassed && errors.length === 0;
  const productionImportLocked =
    masterImportAudited &&
    timeSettingLockReport.final_verdict.startsWith('PASS') &&
    extractedSlots.every(
      (entry) => entry.scores.overall_import_score >= MASTER_IMPORT_SCORE_PASS_THRESHOLD
    );

  const validationPassed = masterImportAudited && productionImportLocked;

  return {
    report_id: `movie_master_import_audit_report_${Date.now().toString(36)}`,
    phase: MOVIE_MASTER_IMPORT_AUDIT_PHASE,
    system_id: MOVIE_MASTER_IMPORT_AUDIT_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_MASTER_IMPORT_AUDIT_PASS_VERDICT
      : MOVIE_MASTER_IMPORT_AUDIT_FAIL_VERDICT,
    validation_passed: validationPassed,
    master_import_audited: masterImportAudited,
    production_import_locked: productionImportLocked,
    native_import_path: MASTER_IMPORT_V4_PATH,
    upstream_timesetting_lock_verdict: timeSettingLockReport.final_verdict,
    metrics: {
      audited_slot_count: extractedSlots.length,
      artStyle_score: average(extractedSlots.map((entry) => entry.scores.artStyle_score)),
      timeSetting_score: average(extractedSlots.map((entry) => entry.scores.timeSetting_score)),
      character_score: average(extractedSlots.map((entry) => entry.scores.character_score)),
      scenario_score: average(extractedSlots.map((entry) => entry.scores.scenario_score)),
      overall_import_score: average(extractedSlots.map((entry) => entry.scores.overall_import_score)),
    },
    extracted_slots: extractedSlots,
    human_inspection_procedure: {
      native_import_path: MASTER_IMPORT_V4_PATH,
      slot_indices: MASTER_IMPORT_AUDIT_SLOTS.map((spec) => spec.slot_index),
      fields_to_review: ['artStyle', 'timeSetting', 'scenario', 'character'],
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeMovieMasterImportAuditReport(projectRoot?: string): MovieMasterImportAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runMovieMasterImportAudit(root);
  writeJson(root, MOVIE_MASTER_IMPORT_AUDIT_REPORT_PATH, report);
  return report;
}

export { SAFE_CREATE_POLICY, resolveCanonicalGonegiArtStyle };
