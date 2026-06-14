import fs from 'node:fs';
import path from 'node:path';
import { UPLOAD_STANDARD_PASS_VERDICT, CANONICAL_UPLOAD_REPORT_PATH } from './appUploadStandardization.js';
import { MOVIE_COORDINATE_PASS_VERDICT, MOVIE_COORDINATE_REPORT_PATH } from './movieSceneCoordinateValidator.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import { TITANIC_SOURCE_ID } from './sourceVideoNumericalAndCinematicDna.js';

export const MOVIE_GEOMETRY_SEMANTIC_PHASE = 'PHASE-MOVIE-RECONSTRUCTION-DATASET-001' as const;
export const MOVIE_GEOMETRY_SEMANTIC_SYSTEM_ID = 'MOVIE_GEOMETRY_AND_SEMANTIC_DNA_SYSTEM_V2' as const;
export const MOVIE_GEOMETRY_SEMANTIC_PASS_VERDICT = 'PASS_MOVIE_GEOMETRY_AND_SEMANTIC_DNA_SYSTEM_V2' as const;
export const MOVIE_GEOMETRY_SEMANTIC_FAIL_VERDICT = 'FAIL_MOVIE_GEOMETRY_AND_SEMANTIC_DNA_SYSTEM_V2' as const;

export const MOVIE_RECONSTRUCTION_DATASET_DIR = 'datasets/movie_reconstruction' as const;
export const SEMANTIC_ANCHOR_LIBRARY_PATH = 'datasets/movie_reconstruction/semantic_anchor_library.json' as const;
export const SEMANTIC_ANCHOR_SCHEMA_PATH = 'datasets/movie_reconstruction/semantic-anchor-library.schema.json' as const;
export const SEMANTIC_PRESERVATION_LAYER_PATH = 'datasets/movie_reconstruction/semantic-preservation-layer.json' as const;
export const WORLD_TRANSLATION_RULES_PATH = 'datasets/movie_reconstruction/world-translation-rules.json' as const;
export const MOVIE_GEOMETRY_SEMANTIC_REPORT_PATH =
  'reports/movie_reconstruction/MOVIE_GEOMETRY_AND_SEMANTIC_DNA_SYSTEM_REPORT.json' as const;

const ANCHOR_TYPES = [
  'iconic_pose',
  'iconic_camera',
  'iconic_transition',
  'iconic_environment',
  'iconic_blocking',
] as const;

const REQUIRED_TITANIC_ANCHORS = [
  'titanic_bow_pose',
  'titanic_staircase_encounter',
  'titanic_farewell_pose',
  'titanic_sunset_rail_pose',
] as const;

const ANCHOR_REQUIRED_FIELDS = [
  'anchor_id',
  'anchor_type',
  'semantic_meaning',
  'emotion',
  'participants',
  'relative_distance',
  'orientation',
  'interaction_type',
  'iconic_score',
] as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface SemanticAnchor {
  anchor_id: string;
  anchor_type: string;
  semantic_meaning: string;
  emotion: string;
  participants: number;
  relative_distance: string;
  orientation: string;
  interaction_type: string;
  iconic_score: number;
}

export interface MovieGeometrySemanticDnaReport {
  report_id: string;
  phase: typeof MOVIE_GEOMETRY_SEMANTIC_PHASE;
  system_id: typeof MOVIE_GEOMETRY_SEMANTIC_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  semantic_system_passed: boolean;
  precheck: { precheck_passed: boolean; gates: Record<string, boolean> };
  validation_summary: Record<string, string | number | boolean>;
  issues: ValidationIssue[];
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function tryReadJson(root: string, rel: string): Record<string, unknown> | null {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  return readJson<Record<string, unknown>>(root, rel);
}

function validateAnchorStructure(anchors: SemanticAnchor[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const anchor of anchors) {
    for (const field of ANCHOR_REQUIRED_FIELDS) {
      const value = anchor[field as keyof SemanticAnchor];
      if (value === undefined || value === null || value === '') {
        issues.push({
          code: 'ANCHOR_FIELD_MISSING',
          message: `Anchor ${anchor.anchor_id ?? 'unknown'} missing field ${field}`,
          severity: 'error',
        });
      }
    }
    if (typeof anchor.participants !== 'number' || anchor.participants < 0) {
      issues.push({
        code: 'ANCHOR_PARTICIPANTS_INVALID',
        message: `Anchor ${anchor.anchor_id} participants must be >= 0`,
        severity: 'error',
      });
    }
    if (typeof anchor.iconic_score !== 'number' || anchor.iconic_score < 0 || anchor.iconic_score > 1) {
      issues.push({
        code: 'ANCHOR_ICONIC_SCORE_INVALID',
        message: `Anchor ${anchor.anchor_id} iconic_score must be between 0 and 1`,
        severity: 'error',
      });
    }
    if (!ANCHOR_TYPES.includes(anchor.anchor_type as (typeof ANCHOR_TYPES)[number])) {
      issues.push({
        code: 'ANCHOR_TYPE_INVALID',
        message: `Anchor ${anchor.anchor_id} has invalid anchor_type ${anchor.anchor_type}`,
        severity: 'error',
      });
    }
  }

  return issues;
}

function validateSemanticPreservationLayer(root: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const layer = readJson<Record<string, unknown>>(root, SEMANTIC_PRESERVATION_LAYER_PATH);
  const pipeline = layer.pipeline as { stage_id: string; stage_name: string }[] | undefined;
  const success = layer.success_condition as Record<string, unknown> | undefined;
  const example = layer.reference_example as Record<string, unknown> | undefined;

  const expectedStages = [
    'movie_scene',
    'geometry_reconstruction',
    'semantic_anchor_preservation',
    'gonegi_world_translation',
    'image_generation',
  ];

  if (!pipeline || pipeline.length !== expectedStages.length) {
    issues.push({ code: 'PIPELINE_STAGE_COUNT', message: 'Semantic preservation pipeline must have 5 stages', severity: 'error' });
  } else {
    for (let i = 0; i < expectedStages.length; i += 1) {
      if (pipeline[i]?.stage_id !== expectedStages[i]) {
        issues.push({
          code: 'PIPELINE_STAGE_ORDER',
          message: `Pipeline stage ${i} expected ${expectedStages[i]}, got ${pipeline[i]?.stage_id}`,
          severity: 'error',
        });
      }
    }
  }

  const preserveGeometry = success?.preserve_geometry as string[] | undefined;
  if (!preserveGeometry?.includes('camera') || !preserveGeometry?.includes('blocking') || !preserveGeometry?.includes('composition') || !preserveGeometry?.includes('environment')) {
    issues.push({ code: 'SUCCESS_GEOMETRY_INCOMPLETE', message: 'Success condition must preserve camera, blocking, composition, environment', severity: 'error' });
  }
  if (success?.preserve_semantic_meaning !== true) {
    issues.push({ code: 'SEMANTIC_MEANING_NOT_REQUIRED', message: 'preserve_semantic_meaning must be true', severity: 'error' });
  }

  const originalMeaning = example?.original_meaning as string[] | undefined;
  if (!originalMeaning?.includes('freedom') || !originalMeaning?.includes('romance') || !originalMeaning?.includes('wonder')) {
    issues.push({ code: 'TITANIC_BOW_EXAMPLE_INCOMPLETE', message: 'Titanic bow example must preserve freedom, romance, wonder', severity: 'error' });
  }
  if (example?.required_output_label !== 'Titanic Scene Reconstructed Inside Gonegi World') {
    issues.push({ code: 'OUTPUT_LABEL_MISMATCH', message: 'Required output label mismatch', severity: 'error' });
  }

  return issues;
}

function validateWorldTranslationRules(root: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const rules = readJson<Record<string, unknown>>(root, WORLD_TRANSLATION_RULES_PATH);
  const dominance = rules.dominance_rule as Record<string, unknown> | undefined;
  const movieControls = rules.movie_dataset_controls as string[] | undefined;
  const gonegiControls = rules.gonegi_dataset_controls as string[] | undefined;

  const movieExpected = ['scene_geometry', 'camera', 'blocking', 'composition', 'semantic_anchors'];
  const gonegiExpected = [
    'architecture',
    'materials',
    'environment_identity',
    'character_identity',
    'cultural_identity',
    'color_identity',
  ];

  for (const field of movieExpected) {
    if (!movieControls?.includes(field)) {
      issues.push({ code: 'MOVIE_CONTROL_MISSING', message: `Movie dataset must control ${field}`, severity: 'error' });
    }
  }
  for (const field of gonegiExpected) {
    if (!gonegiControls?.includes(field)) {
      issues.push({ code: 'GONEGI_CONTROL_MISSING', message: `Gonegi dataset must control ${field}`, severity: 'error' });
    }
  }

  const movieDominates = dominance?.movie_geometry_dominates as string[] | undefined;
  const gonegiDominates = dominance?.gonegi_world_dominates as string[] | undefined;
  if (!movieDominates?.includes('semantic_anchors') || !gonegiDominates?.includes('character_identity')) {
    issues.push({ code: 'DOMINANCE_RULE_INCOMPLETE', message: 'Dominance rule must split geometry vs appearance control', severity: 'error' });
  }

  if (rules.required_outcome_label !== 'Titanic Scene Reconstructed Inside Gonegi World') {
    issues.push({ code: 'REQUIRED_OUTCOME_LABEL', message: 'World translation required outcome label mismatch', severity: 'error' });
  }

  const forbidden = rules.forbidden_outcomes as string[] | undefined;
  if (!forbidden?.includes('Titanic Copy') || !forbidden?.includes('Generic Harbor Scene')) {
    issues.push({ code: 'FORBIDDEN_OUTCOMES_INCOMPLETE', message: 'Forbidden outcomes must include Titanic Copy and Generic Harbor Scene', severity: 'error' });
  }

  if (!fs.existsSync(path.join(root, String(rules.translation_contract_ref ?? '')))) {
    issues.push({ code: 'TRANSLATION_CONTRACT_MISSING', message: 'World translation contract reference missing', severity: 'error' });
  }

  return issues;
}

function runPrecheck(root: string): {
  precheck_passed: boolean;
  gates: Record<string, boolean>;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const uploadReport = tryReadJson(root, CANONICAL_UPLOAD_REPORT_PATH);
  const coordinateReport = tryReadJson(root, MOVIE_COORDINATE_REPORT_PATH);

  const gates = {
    canonical_upload_pass: String(uploadReport?.final_verdict ?? '') === UPLOAD_STANDARD_PASS_VERDICT,
    movie_coordinate_pass: String(coordinateReport?.final_verdict ?? '') === MOVIE_COORDINATE_PASS_VERDICT,
    semantic_anchor_library_exists: fs.existsSync(path.join(root, SEMANTIC_ANCHOR_LIBRARY_PATH)),
    semantic_preservation_layer_exists: fs.existsSync(path.join(root, SEMANTIC_PRESERVATION_LAYER_PATH)),
    world_translation_rules_exists: fs.existsSync(path.join(root, WORLD_TRANSLATION_RULES_PATH)),
  };

  if (!gates.canonical_upload_pass) {
    issues.push({ code: 'CANONICAL_UPLOAD_PRECHECK_FAIL', message: 'Canonical upload standard not PASS', severity: 'error' });
  }
  if (!gates.movie_coordinate_pass) {
    issues.push({ code: 'MOVIE_COORDINATE_PRECHECK_FAIL', message: 'Movie coordinate system not PASS', severity: 'error' });
  }

  return { precheck_passed: Object.values(gates).every(Boolean), gates, issues };
}

export function writeMovieGeometrySemanticDnaSystem(projectRoot?: string): MovieGeometrySemanticDnaReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];
  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  if (!precheck.precheck_passed) {
    const fail: MovieGeometrySemanticDnaReport = {
      report_id: 'movie-geometry-semantic-dna-system-report-v1',
      phase: MOVIE_GEOMETRY_SEMANTIC_PHASE,
      system_id: MOVIE_GEOMETRY_SEMANTIC_SYSTEM_ID,
      generated_at: new Date().toISOString(),
      final_verdict: MOVIE_GEOMETRY_SEMANTIC_FAIL_VERDICT,
      semantic_system_passed: false,
      precheck: { precheck_passed: false, gates: precheck.gates },
      validation_summary: {},
      issues,
    };
    fs.mkdirSync(path.join(root, 'reports/movie_reconstruction'), { recursive: true });
    fs.writeFileSync(path.join(root, MOVIE_GEOMETRY_SEMANTIC_REPORT_PATH), `${JSON.stringify(fail, null, 2)}\n`, 'utf8');
    return fail;
  }

  const library = readJson<{
    library_id: string;
    anchor_types: string[];
    anchors: SemanticAnchor[];
  }>(root, SEMANTIC_ANCHOR_LIBRARY_PATH);

  issues.push(...validateAnchorStructure(library.anchors));
  issues.push(...validateSemanticPreservationLayer(root));
  issues.push(...validateWorldTranslationRules(root));

  const anchorTypeCoverage = ANCHOR_TYPES.map((type) => ({
    anchor_type: type,
    covered: library.anchors.some((a) => a.anchor_type === type),
  }));
  const missingAnchorTypes = anchorTypeCoverage.filter((c) => !c.covered).map((c) => c.anchor_type);
  if (missingAnchorTypes.length > 0) {
    issues.push({
      code: 'ANCHOR_TYPE_COVERAGE_GAP',
      message: `Missing anchor types: ${missingAnchorTypes.join(', ')}`,
      severity: 'error',
    });
  }

  const titanicAnchorStatus = REQUIRED_TITANIC_ANCHORS.map((id) => ({
    anchor_id: id,
    present: library.anchors.some((a) => a.anchor_id === id),
  }));
  const missingTitanic = titanicAnchorStatus.filter((a) => !a.present).map((a) => a.anchor_id);
  if (missingTitanic.length > 0) {
    issues.push({
      code: 'TITANIC_ANCHOR_MISSING',
      message: `Missing required Titanic anchors: ${missingTitanic.join(', ')}`,
      severity: 'error',
    });
  }

  const titanicBow = library.anchors.find((a) => a.anchor_id === 'titanic_bow_pose');
  const bowMeaningPreserved =
    Boolean(titanicBow?.emotion?.includes('freedom')) &&
    Boolean(titanicBow?.emotion?.includes('romance')) &&
    Boolean(titanicBow?.emotion?.includes('wonder'));
  if (!bowMeaningPreserved) {
    issues.push({
      code: 'TITANIC_BOW_MEANING_INCOMPLETE',
      message: 'titanic_bow_pose must preserve freedom, romance, wonder',
      severity: 'error',
    });
  }

  const semanticSystemPassed = issues.filter((i) => i.severity === 'error').length === 0;

  const validationSummary: Record<string, string | number | boolean> = {
    semantic_anchor_count: library.anchors.length,
    anchor_type_count: ANCHOR_TYPES.length,
    anchor_types_covered: ANCHOR_TYPES.length - missingAnchorTypes.length,
    titanic_anchor_count: REQUIRED_TITANIC_ANCHORS.length - missingTitanic.length,
    titanic_bow_meaning_preserved: bowMeaningPreserved,
    semantic_preservation_layer_valid: issues.filter((i) => i.code.startsWith('PIPELINE') || i.code.startsWith('SUCCESS') || i.code.startsWith('TITANIC_BOW_EXAMPLE')).length === 0,
    world_translation_rules_valid: issues.filter((i) => i.code.includes('CONTROL') || i.code.includes('DOMINANCE') || i.code.includes('OUTCOME')).length === 0,
    movie_geometry_dominates_structure: true,
    gonegi_world_dominates_appearance: true,
    semantic_meaning_preservation_enabled: true,
    titanic_source_id: TITANIC_SOURCE_ID,
    gpu_execution: false,
    video_generation: false,
    next_order: semanticSystemPassed ? 'PHASE-VIDEO-SHORT-TEST-001' : 'PHASE-MOVIE-RECONSTRUCTION-DATASET-PATCH-001',
    policy: SAFE_CREATE_POLICY,
  };

  const report: MovieGeometrySemanticDnaReport = {
    report_id: 'movie-geometry-semantic-dna-system-report-v1',
    phase: MOVIE_GEOMETRY_SEMANTIC_PHASE,
    system_id: MOVIE_GEOMETRY_SEMANTIC_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: semanticSystemPassed ? MOVIE_GEOMETRY_SEMANTIC_PASS_VERDICT : MOVIE_GEOMETRY_SEMANTIC_FAIL_VERDICT,
    semantic_system_passed: semanticSystemPassed,
    precheck: { precheck_passed: true, gates: precheck.gates },
    validation_summary: validationSummary,
    issues,
  };

  const fullReport = {
    ...report,
    task_10_semantic_anchor_library: {
      path: SEMANTIC_ANCHOR_LIBRARY_PATH,
      anchor_count: library.anchors.length,
      anchor_type_coverage: anchorTypeCoverage,
      titanic_anchors: titanicAnchorStatus,
    },
    task_11_semantic_preservation_layer: {
      path: SEMANTIC_PRESERVATION_LAYER_PATH,
      pipeline_stages: 5,
      preserves: ['camera', 'blocking', 'composition', 'environment', 'semantic_meaning'],
      reference_example: 'titanic_bow_scene_gonegi_translation',
    },
    task_12_world_translation_rules: {
      path: WORLD_TRANSLATION_RULES_PATH,
      dominance_rule: 'Movie Geometry dominates structure. Gonegi World dominates appearance.',
      required_outcome: 'Titanic Scene Reconstructed Inside Gonegi World',
      forbidden_outcomes: ['Titanic Copy', 'Generic Harbor Scene'],
    },
    production_readiness_gates: {
      semantic_anchor_library_complete: missingTitanic.length === 0 && missingAnchorTypes.length === 0,
      semantic_preservation_layer_defined: true,
      world_translation_rules_defined: true,
      titanic_bow_meaning_preserved: bowMeaningPreserved,
    },
    next_pipeline: semanticSystemPassed ? ['PHASE-VIDEO-SHORT-TEST-001'] : ['PHASE-MOVIE-RECONSTRUCTION-DATASET-PATCH-001'],
  };

  fs.mkdirSync(path.join(root, 'reports/movie_reconstruction'), { recursive: true });
  fs.writeFileSync(path.join(root, MOVIE_GEOMETRY_SEMANTIC_REPORT_PATH), `${JSON.stringify(fullReport, null, 2)}\n`, 'utf8');

  return report;
}
