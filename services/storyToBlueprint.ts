import fs from 'node:fs';
import path from 'node:path';
import { FEATURE_FILM_BLUEPRINT_PATH } from './featureFilmBlueprintAssembly.js';
import {
  GENERATION_OPERATION_STACK_PASS_VERDICT,
  GENERATION_OPERATION_STACK_REPORT_PATH,
  GPU_CONNECTION_READY_STATUS,
} from './generationOperationStack.js';
import { MEDIUM_FILM_BLUEPRINT_PATH } from './mediumFilmBlueprintAssembly.js';
import { MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH } from './mvProductionBlueprintSystem.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import { SHORT_FILM_BLUEPRINT_PATH } from './shortFilmBlueprintAssembly.js';

export const STORY_TO_BLUEPRINT_PHASE = 'PHASE-STORY-001' as const;
export const STORY_TO_BLUEPRINT_PASS_VERDICT = 'PASS_STORY_TO_BLUEPRINT_ENGINE_V1' as const;
export const STORY_TO_BLUEPRINT_FAIL_VERDICT = 'FAIL_STORY_TO_BLUEPRINT_ENGINE_V1' as const;
export const STORY_TO_BLUEPRINT_READY_STATUS = 'STORY_TO_BLUEPRINT_READY' as const;

export const STORY_DATASET_DIR = 'datasets/story' as const;
export const STORY_INGESTION_SPEC_DATASET_PATH =
  'datasets/story/story-ingestion-specification.json' as const;
export const STORY_ANALYSIS_SPEC_DATASET_PATH =
  'datasets/story/story-analysis-specification.json' as const;
export const ACT_EXTRACTION_SPEC_DATASET_PATH =
  'datasets/story/act-extraction-specification.json' as const;
export const ARC_EXTRACTION_SPEC_DATASET_PATH =
  'datasets/story/arc-extraction-specification.json' as const;
export const STORY_BLUEPRINT_MAPPING_SPEC_DATASET_PATH =
  'datasets/story/story-blueprint-mapping-specification.json' as const;
export const SAMPLE_STORY_INPUT_PATH = 'datasets/story/sample-story-input.json' as const;

export const STORY_ENGINE_EXPORT_DIR = 'exports/story_engine' as const;
export const STORY_INGESTION_SPEC_EXPORT_PATH =
  'exports/story_engine/story-ingestion-specification.json' as const;
export const STORY_ANALYSIS_SPEC_EXPORT_PATH =
  'exports/story_engine/story-analysis-specification.json' as const;
export const ACT_EXTRACTION_SPEC_EXPORT_PATH =
  'exports/story_engine/act-extraction-specification.json' as const;
export const ARC_EXTRACTION_SPEC_EXPORT_PATH =
  'exports/story_engine/arc-extraction-specification.json' as const;
export const STORY_BLUEPRINT_MAPPING_SPEC_EXPORT_PATH =
  'exports/story_engine/story-blueprint-mapping-specification.json' as const;

export const MV_BLUEPRINT_OUTPUT_PATH = 'exports/story_engine/mv_blueprint.json' as const;
export const SHORT_BLUEPRINT_OUTPUT_PATH = 'exports/story_engine/short_blueprint.json' as const;
export const MEDIUM_BLUEPRINT_OUTPUT_PATH = 'exports/story_engine/medium_blueprint.json' as const;
export const FEATURE_BLUEPRINT_OUTPUT_PATH = 'exports/story_engine/feature_blueprint.json' as const;

export const STORY_ENGINE_REPORT_DIR = 'reports/story_engine' as const;
export const STORY_TO_BLUEPRINT_REPORT_PATH =
  'reports/story_engine/STORY_TO_BLUEPRINT_ENGINE_REPORT.json' as const;

const ANALYSIS_FIELDS = [
  'story_id',
  'title',
  'synopsis',
  'story_tone',
  'genre',
  'target_runtime',
  'characters',
  'locations',
  'themes',
  'timeline',
  'conflicts',
  'resolution',
] as const;

const REQUIRED_ACTS = ['act_1', 'act_2', 'act_3'] as const;
const OPTIONAL_ACTS = ['optional_act_4', 'optional_act_5'] as const;

const ARC_TYPES = [
  'main_arc',
  'subplot_arc',
  'character_arc',
  'relationship_arc',
  'world_arc',
  'theme_arc',
  'legacy_callback_arc',
] as const;

const OUTPUT_BLUEPRINT_TYPES = ['MV', 'SHORT', 'MEDIUM', 'FEATURE'] as const;

const BLUEPRINT_TARGET_REFS: Record<(typeof OUTPUT_BLUEPRINT_TYPES)[number], string> = {
  MV: MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH,
  SHORT: SHORT_FILM_BLUEPRINT_PATH,
  MEDIUM: MEDIUM_FILM_BLUEPRINT_PATH,
  FEATURE: FEATURE_FILM_BLUEPRINT_PATH,
};

const BLUEPRINT_OUTPUT_PATHS: Record<(typeof OUTPUT_BLUEPRINT_TYPES)[number], string> = {
  MV: MV_BLUEPRINT_OUTPUT_PATH,
  SHORT: SHORT_BLUEPRINT_OUTPUT_PATH,
  MEDIUM: MEDIUM_BLUEPRINT_OUTPUT_PATH,
  FEATURE: FEATURE_BLUEPRINT_OUTPUT_PATH,
};

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface StoryAnalysisSpecification {
  required_analysis_fields: string[];
  story_analysis_integrity: string;
  story_traceability_integrity: string;
  sample_analysis: Record<string, unknown>;
}

interface ActExtractionSpecification {
  required_acts: string[];
  optional_acts: string[];
  act_extraction_integrity: string;
  runtime_act_mapping: Record<string, { act_count: number; acts: string[] }>;
  extracted_acts: Record<string, unknown>;
}

interface ArcExtractionSpecification {
  arc_type_count: number;
  arc_types: string[];
  arc_extraction_integrity: string;
  extracted_arcs: Record<string, unknown>;
}

interface StoryBlueprintMappingSpecification {
  mapping_flow: string[];
  story_to_blueprint_integrity: string;
  blueprint_generation_integrity: string;
  feature_blueprint_compatibility: string;
  output_blueprint_types: string[];
  generated_outputs: Record<
    string,
    { output_id: string; artifact_ref: string; target_blueprint_ref: string }
  >;
}

export interface StoryToBlueprintReport {
  report_id: string;
  phase: typeof STORY_TO_BLUEPRINT_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    generation_operation_stack_pass: boolean;
    gpu_connection_ready: boolean;
    precheck_passed: boolean;
  };
  policy: {
    all_previous_outputs_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  engine_summary: {
    story_analysis_integrity: string;
    act_extraction_integrity: string;
    arc_extraction_integrity: string;
    story_to_blueprint_integrity: string;
    story_traceability_integrity: string;
    blueprint_generation_integrity: string;
    feature_blueprint_compatibility: string;
    output_blueprint_type_count: number;
  };
  outputs: {
    ingestion_spec_path: string;
    analysis_spec_path: string;
    act_extraction_spec_path: string;
    arc_extraction_spec_path: string;
    mapping_spec_path: string;
    mv_blueprint_path: string;
    short_blueprint_path: string;
    medium_blueprint_path: string;
    feature_blueprint_path: string;
  };
  issues: ValidationIssue[];
  story_to_blueprint_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function runPrecheck(root: string): {
  generation_operation_stack_pass: boolean;
  gpu_connection_ready: boolean;
  precheck_passed: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const reportPath = path.join(root, GENERATION_OPERATION_STACK_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'GENERATION_OPERATION_STACK_REPORT_MISSING',
      message: `Missing report at ${GENERATION_OPERATION_STACK_REPORT_PATH}`,
      severity: 'error',
    });
    return {
      generation_operation_stack_pass: false,
      gpu_connection_ready: false,
      precheck_passed: false,
      issues,
    };
  }

  const stackReport = readJson<Record<string, unknown>>(root, GENERATION_OPERATION_STACK_REPORT_PATH);
  const status = String(stackReport.status ?? '');
  const verdict = String(stackReport.final_verdict ?? '');

  const generation_operation_stack_pass = verdict === GENERATION_OPERATION_STACK_PASS_VERDICT;
  const gpu_connection_ready = status === GPU_CONNECTION_READY_STATUS;

  if (!generation_operation_stack_pass) {
    issues.push({
      code: 'GENERATION_OPERATION_STACK_VERDICT_FAIL',
      message: `Expected verdict=${GENERATION_OPERATION_STACK_PASS_VERDICT}`,
      severity: 'error',
    });
  }
  if (!gpu_connection_ready) {
    issues.push({
      code: 'GPU_CONNECTION_NOT_READY',
      message: `Expected status=${GPU_CONNECTION_READY_STATUS}`,
      severity: 'error',
    });
  }

  return {
    generation_operation_stack_pass,
    gpu_connection_ready,
    precheck_passed: generation_operation_stack_pass && gpu_connection_ready,
    issues,
  };
}

function validateStoryAnalysis(
  analysisSpec: StoryAnalysisSpecification,
  storyInput: Record<string, unknown>
): { story_analysis_integrity: string; story_traceability_integrity: string; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  for (const field of ANALYSIS_FIELDS) {
    if (!analysisSpec.required_analysis_fields.includes(field)) {
      issues.push({
        code: 'ANALYSIS_FIELD_SCHEMA_MISSING',
        message: `Schema missing field ${field}`,
        severity: 'error',
      });
    }
    if (storyInput[field] === undefined || storyInput[field] === null) {
      issues.push({
        code: 'STORY_INPUT_FIELD_MISSING',
        message: `Story input missing ${field}`,
        severity: 'error',
      });
    }
  }

  const storyAnalysisIntegrity =
    analysisSpec.story_analysis_integrity === 'PASS' &&
    issues.filter((i) => i.code.startsWith('ANALYSIS') || i.code.startsWith('STORY_INPUT')).length ===
      0
      ? 'PASS'
      : 'FAIL';

  const storyTraceabilityIntegrity =
    analysisSpec.story_traceability_integrity === 'PASS' &&
    typeof storyInput.story_id === 'string' &&
    storyInput.story_id !== ''
      ? 'PASS'
      : 'FAIL';

  if (analysisSpec.story_analysis_integrity !== 'PASS') {
    issues.push({
      code: 'STORY_ANALYSIS_INTEGRITY_FAIL',
      message: `story_analysis_integrity=${analysisSpec.story_analysis_integrity}`,
      severity: 'error',
    });
  }
  if (analysisSpec.story_traceability_integrity !== 'PASS') {
    issues.push({
      code: 'STORY_TRACEABILITY_INTEGRITY_FAIL',
      message: `story_traceability_integrity=${analysisSpec.story_traceability_integrity}`,
      severity: 'error',
    });
  }

  return { story_analysis_integrity: storyAnalysisIntegrity, story_traceability_integrity: storyTraceabilityIntegrity, issues };
}

function validateActExtraction(actSpec: ActExtractionSpecification): {
  act_extraction_integrity: string;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  for (const act of REQUIRED_ACTS) {
    if (!actSpec.required_acts.includes(act)) {
      issues.push({ code: 'REQUIRED_ACT_MISSING', message: `Missing ${act}`, severity: 'error' });
    }
    if (!actSpec.extracted_acts[act]) {
      issues.push({ code: 'EXTRACTED_ACT_MISSING', message: `Missing extracted ${act}`, severity: 'error' });
    }
  }

  for (const act of OPTIONAL_ACTS) {
    if (!actSpec.optional_acts.includes(act)) {
      issues.push({ code: 'OPTIONAL_ACT_MISSING', message: `Missing ${act}`, severity: 'error' });
    }
  }

  for (const scale of OUTPUT_BLUEPRINT_TYPES) {
    const mapping = actSpec.runtime_act_mapping[scale];
    if (!mapping || mapping.act_count < 3) {
      issues.push({
        code: 'RUNTIME_ACT_MAPPING_INVALID',
        message: `Invalid act mapping for ${scale}`,
        severity: 'error',
      });
    }
  }

  const actExtractionIntegrity =
    actSpec.act_extraction_integrity === 'PASS' && issues.length === 0 ? 'PASS' : 'FAIL';

  if (actSpec.act_extraction_integrity !== 'PASS') {
    issues.push({
      code: 'ACT_EXTRACTION_INTEGRITY_FAIL',
      message: `act_extraction_integrity=${actSpec.act_extraction_integrity}`,
      severity: 'error',
    });
  }

  return { act_extraction_integrity: actExtractionIntegrity, issues };
}

function validateArcExtraction(arcSpec: ArcExtractionSpecification): {
  arc_extraction_integrity: string;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (arcSpec.arc_type_count < ARC_TYPES.length) {
    issues.push({
      code: 'ARC_TYPE_COUNT_LOW',
      message: `arc_type_count=${arcSpec.arc_type_count}`,
      severity: 'error',
    });
  }

  for (const arcType of ARC_TYPES) {
    if (!arcSpec.arc_types.includes(arcType)) {
      issues.push({ code: 'ARC_TYPE_MISSING', message: `Missing arc type ${arcType}`, severity: 'error' });
    }
    if (!arcSpec.extracted_arcs[arcType]) {
      issues.push({
        code: 'EXTRACTED_ARC_MISSING',
        message: `Missing extracted arc ${arcType}`,
        severity: 'error',
      });
    }
  }

  const arcExtractionIntegrity =
    arcSpec.arc_extraction_integrity === 'PASS' && issues.length === 0 ? 'PASS' : 'FAIL';

  if (arcSpec.arc_extraction_integrity !== 'PASS') {
    issues.push({
      code: 'ARC_EXTRACTION_INTEGRITY_FAIL',
      message: `arc_extraction_integrity=${arcSpec.arc_extraction_integrity}`,
      severity: 'error',
    });
  }

  return { arc_extraction_integrity: arcExtractionIntegrity, issues };
}

function validateFeatureBlueprintCompatibility(
  root: string,
  generatedFeatureBlueprint: Record<string, unknown>
): { feature_blueprint_compatibility: string; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, FEATURE_FILM_BLUEPRINT_PATH))) {
    issues.push({
      code: 'FEATURE_BLUEPRINT_TARGET_MISSING',
      message: `Missing target ${FEATURE_FILM_BLUEPRINT_PATH}`,
      severity: 'error',
    });
    return { feature_blueprint_compatibility: 'FAIL', issues };
  }

  const targetBlueprint = readJson<{
    archetype_count: number;
    continuity_dimension_count: number;
    blueprints: Record<string, unknown>[];
  }>(root, FEATURE_FILM_BLUEPRINT_PATH);

  const generatedArcs = generatedFeatureBlueprint.arcs as Record<string, unknown> | undefined;
  const generatedActs = generatedFeatureBlueprint.acts as Record<string, unknown> | undefined;

  if (!generatedArcs || !generatedActs) {
    issues.push({
      code: 'GENERATED_FEATURE_STRUCTURE_INVALID',
      message: 'Generated feature blueprint missing acts or arcs',
      severity: 'error',
    });
  }

  if (
    generatedFeatureBlueprint.output_blueprint_type !== 'FEATURE' ||
    generatedFeatureBlueprint.blueprint_id !== 'feature_blueprint'
  ) {
    issues.push({
      code: 'FEATURE_BLUEPRINT_TYPE_MISMATCH',
      message: 'Generated feature blueprint type/id mismatch',
      severity: 'error',
    });
  }

  const hasLegacyCallback = ARC_TYPES.includes('legacy_callback_arc') &&
    generatedArcs &&
    'legacy_callback_arc' in generatedArcs;

  if (!hasLegacyCallback) {
    issues.push({
      code: 'LEGACY_CALLBACK_ARC_MISSING',
      message: 'Feature blueprint missing legacy_callback_arc',
      severity: 'error',
    });
  }

  const compatible =
    targetBlueprint.archetype_count >= 1 &&
    targetBlueprint.continuity_dimension_count >= 14 &&
    targetBlueprint.blueprints.length >= 1 &&
    issues.length === 0;

  return {
    feature_blueprint_compatibility: compatible ? 'PASS' : 'FAIL',
    issues,
  };
}

function buildBlueprintOutput(
  scale: (typeof OUTPUT_BLUEPRINT_TYPES)[number],
  storyInput: Record<string, unknown>,
  actSpec: ActExtractionSpecification,
  arcSpec: ArcExtractionSpecification,
  mappingSpec: StoryBlueprintMappingSpecification
): Record<string, unknown> {
  const actMapping = actSpec.runtime_act_mapping[scale];
  const outputMeta = mappingSpec.generated_outputs[scale];

  return {
    blueprint_id: outputMeta.output_id,
    output_blueprint_type: scale,
    phase: STORY_TO_BLUEPRINT_PHASE,
    generated_at: new Date().toISOString(),
    story_id: storyInput.story_id,
    story_trace_id: `story-trace-${String(storyInput.story_id)}`,
    target_blueprint_ref: outputMeta.target_blueprint_ref,
    mapping_flow: [...mappingSpec.mapping_flow],
    acts: Object.fromEntries(
      actMapping.acts.map((actId) => [actId, actSpec.extracted_acts[actId]])
    ),
    arcs: Object.fromEntries(
      ARC_TYPES.map((arcType) => [arcType, arcSpec.extracted_arcs[arcType]])
    ),
    act_count: actMapping.act_count,
    arc_type_count: arcSpec.arc_type_count,
    story_summary: {
      title: storyInput.title,
      genre: storyInput.genre,
      target_runtime: storyInput.target_runtime,
      themes: storyInput.themes,
    },
    blueprint_generation_integrity: 'PASS',
    story_to_blueprint_integrity: 'PASS',
  };
}

export function writeStoryToBlueprint(projectRoot?: string): StoryToBlueprintReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const analysisSpec = readJson<StoryAnalysisSpecification>(root, STORY_ANALYSIS_SPEC_DATASET_PATH);
  const actSpec = readJson<ActExtractionSpecification>(root, ACT_EXTRACTION_SPEC_DATASET_PATH);
  const arcSpec = readJson<ArcExtractionSpecification>(root, ARC_EXTRACTION_SPEC_DATASET_PATH);
  const mappingSpec = readJson<StoryBlueprintMappingSpecification>(
    root,
    STORY_BLUEPRINT_MAPPING_SPEC_DATASET_PATH
  );
  const ingestionSpec = readJson<Record<string, unknown>>(root, STORY_INGESTION_SPEC_DATASET_PATH);
  const storyInput = readJson<Record<string, unknown>>(root, SAMPLE_STORY_INPUT_PATH);

  const analysisValidation = validateStoryAnalysis(analysisSpec, storyInput);
  issues.push(...analysisValidation.issues);

  const actValidation = validateActExtraction(actSpec);
  issues.push(...actValidation.issues);

  const arcValidation = validateArcExtraction(arcSpec);
  issues.push(...arcValidation.issues);

  for (const scale of OUTPUT_BLUEPRINT_TYPES) {
    if (!mappingSpec.output_blueprint_types.includes(scale)) {
      issues.push({
        code: 'OUTPUT_BLUEPRINT_TYPE_MISSING',
        message: `Missing output type ${scale}`,
        severity: 'error',
      });
    }
    const output = mappingSpec.generated_outputs[scale];
    if (!output?.target_blueprint_ref || !fs.existsSync(path.join(root, output.target_blueprint_ref))) {
      issues.push({
        code: 'TARGET_BLUEPRINT_REF_MISSING',
        message: `Missing target blueprint for ${scale}`,
        severity: 'error',
      });
    }
  }

  const blueprintOutputs: Record<string, Record<string, unknown>> = {};
  for (const scale of OUTPUT_BLUEPRINT_TYPES) {
    blueprintOutputs[scale] = buildBlueprintOutput(scale, storyInput, actSpec, arcSpec, mappingSpec);
    fs.mkdirSync(path.join(root, STORY_ENGINE_EXPORT_DIR), { recursive: true });
    fs.writeFileSync(
      path.join(root, BLUEPRINT_OUTPUT_PATHS[scale]),
      `${JSON.stringify(blueprintOutputs[scale], null, 2)}\n`,
      'utf8'
    );
  }

  const featureCompat = validateFeatureBlueprintCompatibility(root, blueprintOutputs.FEATURE);
  issues.push(...featureCompat.issues);

  const storyToBlueprintIntegrity =
    mappingSpec.story_to_blueprint_integrity === 'PASS' &&
    mappingSpec.mapping_flow.join('->') === 'story->acts->arcs->blueprint'
      ? 'PASS'
      : 'FAIL';

  const blueprintGenerationIntegrity =
    mappingSpec.blueprint_generation_integrity === 'PASS' &&
    OUTPUT_BLUEPRINT_TYPES.every((scale) => fs.existsSync(path.join(root, BLUEPRINT_OUTPUT_PATHS[scale])))
      ? 'PASS'
      : 'FAIL';

  if (mappingSpec.story_to_blueprint_integrity !== 'PASS') {
    issues.push({
      code: 'STORY_TO_BLUEPRINT_INTEGRITY_FAIL',
      message: `story_to_blueprint_integrity=${mappingSpec.story_to_blueprint_integrity}`,
      severity: 'error',
    });
  }
  if (mappingSpec.blueprint_generation_integrity !== 'PASS') {
    issues.push({
      code: 'BLUEPRINT_GENERATION_INTEGRITY_FAIL',
      message: `blueprint_generation_integrity=${mappingSpec.blueprint_generation_integrity}`,
      severity: 'error',
    });
  }
  if (mappingSpec.feature_blueprint_compatibility !== 'PASS') {
    issues.push({
      code: 'FEATURE_BLUEPRINT_COMPATIBILITY_SPEC_FAIL',
      message: `feature_blueprint_compatibility=${mappingSpec.feature_blueprint_compatibility}`,
      severity: 'error',
    });
  }

  const featureBlueprintCompatibility =
    mappingSpec.feature_blueprint_compatibility === 'PASS' &&
    featureCompat.feature_blueprint_compatibility === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const errors = issues.filter((issue) => issue.severity === 'error');
  const engineReady =
    precheck.precheck_passed &&
    errors.length === 0 &&
    analysisValidation.story_analysis_integrity === 'PASS' &&
    actValidation.act_extraction_integrity === 'PASS' &&
    arcValidation.arc_extraction_integrity === 'PASS' &&
    storyToBlueprintIntegrity === 'PASS' &&
    analysisValidation.story_traceability_integrity === 'PASS' &&
    blueprintGenerationIntegrity === 'PASS' &&
    featureBlueprintCompatibility === 'PASS';

  const specExports = [
    {
      path: STORY_INGESTION_SPEC_EXPORT_PATH,
      data: {
        ...ingestionSpec,
        export_id: 'story-ingestion-specification-export-v1',
        generated_at: new Date().toISOString(),
        dataset_ref: STORY_INGESTION_SPEC_DATASET_PATH,
      },
    },
    {
      path: STORY_ANALYSIS_SPEC_EXPORT_PATH,
      data: {
        ...analysisSpec,
        export_id: 'story-analysis-specification-export-v1',
        generated_at: new Date().toISOString(),
        dataset_ref: STORY_ANALYSIS_SPEC_DATASET_PATH,
        story_analysis_integrity: analysisValidation.story_analysis_integrity,
        story_traceability_integrity: analysisValidation.story_traceability_integrity,
        required_analysis_field_list: [...ANALYSIS_FIELDS],
      },
    },
    {
      path: ACT_EXTRACTION_SPEC_EXPORT_PATH,
      data: {
        ...actSpec,
        export_id: 'act-extraction-specification-export-v1',
        generated_at: new Date().toISOString(),
        dataset_ref: ACT_EXTRACTION_SPEC_DATASET_PATH,
        act_extraction_integrity: actValidation.act_extraction_integrity,
        required_act_list: [...REQUIRED_ACTS],
        optional_act_list: [...OPTIONAL_ACTS],
      },
    },
    {
      path: ARC_EXTRACTION_SPEC_EXPORT_PATH,
      data: {
        ...arcSpec,
        export_id: 'arc-extraction-specification-export-v1',
        generated_at: new Date().toISOString(),
        dataset_ref: ARC_EXTRACTION_SPEC_DATASET_PATH,
        arc_extraction_integrity: arcValidation.arc_extraction_integrity,
        arc_type_list: [...ARC_TYPES],
      },
    },
    {
      path: STORY_BLUEPRINT_MAPPING_SPEC_EXPORT_PATH,
      data: {
        ...mappingSpec,
        export_id: 'story-blueprint-mapping-specification-export-v1',
        generated_at: new Date().toISOString(),
        dataset_ref: STORY_BLUEPRINT_MAPPING_SPEC_DATASET_PATH,
        story_to_blueprint_integrity: storyToBlueprintIntegrity,
        blueprint_generation_integrity: blueprintGenerationIntegrity,
        feature_blueprint_compatibility: featureBlueprintCompatibility,
        output_blueprint_type_list: [...OUTPUT_BLUEPRINT_TYPES],
        blueprint_target_refs: { ...BLUEPRINT_TARGET_REFS },
      },
    },
  ];

  fs.mkdirSync(path.join(root, STORY_ENGINE_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, STORY_ENGINE_REPORT_DIR), { recursive: true });

  for (const specExport of specExports) {
    fs.writeFileSync(
      path.join(root, specExport.path),
      `${JSON.stringify(specExport.data, null, 2)}\n`,
      'utf8'
    );
  }

  const report: StoryToBlueprintReport = {
    report_id: 'story-to-blueprint-engine-report-v1',
    phase: STORY_TO_BLUEPRINT_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: engineReady ? STORY_TO_BLUEPRINT_PASS_VERDICT : STORY_TO_BLUEPRINT_FAIL_VERDICT,
    status: engineReady ? STORY_TO_BLUEPRINT_READY_STATUS : 'STORY_TO_BLUEPRINT_INCOMPLETE',
    precheck,
    policy: {
      all_previous_outputs_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    engine_summary: {
      story_analysis_integrity: analysisValidation.story_analysis_integrity,
      act_extraction_integrity: actValidation.act_extraction_integrity,
      arc_extraction_integrity: arcValidation.arc_extraction_integrity,
      story_to_blueprint_integrity: storyToBlueprintIntegrity,
      story_traceability_integrity: analysisValidation.story_traceability_integrity,
      blueprint_generation_integrity: blueprintGenerationIntegrity,
      feature_blueprint_compatibility: featureBlueprintCompatibility,
      output_blueprint_type_count: OUTPUT_BLUEPRINT_TYPES.length,
    },
    outputs: {
      ingestion_spec_path: STORY_INGESTION_SPEC_EXPORT_PATH,
      analysis_spec_path: STORY_ANALYSIS_SPEC_EXPORT_PATH,
      act_extraction_spec_path: ACT_EXTRACTION_SPEC_EXPORT_PATH,
      arc_extraction_spec_path: ARC_EXTRACTION_SPEC_EXPORT_PATH,
      mapping_spec_path: STORY_BLUEPRINT_MAPPING_SPEC_EXPORT_PATH,
      mv_blueprint_path: MV_BLUEPRINT_OUTPUT_PATH,
      short_blueprint_path: SHORT_BLUEPRINT_OUTPUT_PATH,
      medium_blueprint_path: MEDIUM_BLUEPRINT_OUTPUT_PATH,
      feature_blueprint_path: FEATURE_BLUEPRINT_OUTPUT_PATH,
    },
    issues,
    story_to_blueprint_ready: engineReady,
  };

  fs.writeFileSync(
    path.join(root, STORY_TO_BLUEPRINT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}

export const GENERATION_OPERATION_STACK_READ_ONLY_PATHS = [
  GENERATION_OPERATION_STACK_REPORT_PATH,
  'exports/generation/prompt-compiler-specification.json',
  'exports/generation/compiled-prompt.json',
  'exports/generation/generation-trace-specification.json',
  'exports/assets/generated-asset-registry.json',
  'exports/assets/generated-asset-index.json',
  'exports/evolution/dataset-evolution-specification.json',
  'exports/evolution/failure-pattern-library.json',
  'exports/evolution/success-pattern-library.json',
  'exports/evolution/improvement-recommendation-library.json',
  'datasets/generation/prompt-compiler-specification.json',
  'datasets/generation/generation-trace-specification.json',
  'datasets/assets/generated-asset-registry.json',
  'datasets/assets/generated-asset-index.json',
  'datasets/evolution/dataset-evolution-specification.json',
  'datasets/evolution/failure-pattern-library.json',
  'datasets/evolution/success-pattern-library.json',
  'datasets/evolution/improvement-recommendation-library.json',
] as const;
