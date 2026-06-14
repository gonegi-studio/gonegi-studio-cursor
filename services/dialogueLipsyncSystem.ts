import fs from 'node:fs';
import path from 'node:path';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import {
  PROMPT_EVALUATION_PASS_VERDICT,
  PROMPT_EVALUATION_READY_STATUS,
  PROMPT_EVALUATION_REPORT_PATH,
} from './promptEvaluationSystem.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  ARC_EXTRACTION_SPEC_DATASET_PATH,
  STORY_TO_BLUEPRINT_PASS_VERDICT,
  STORY_TO_BLUEPRINT_REPORT_PATH,
} from './storyToBlueprint.js';
import { TEMPORAL_MEMORY_SPEC_EXPORT_PATH } from './temporalMemoryValidation.js';

export const DIALOGUE_LIPSYNC_PHASE = 'PHASE-DIALOGUE-001' as const;
export const DIALOGUE_LIPSYNC_PASS_VERDICT = 'PASS_DIALOGUE_LIPSYNC_SYSTEM_V1' as const;
export const DIALOGUE_LIPSYNC_FAIL_VERDICT = 'FAIL_DIALOGUE_LIPSYNC_SYSTEM_V1' as const;
export const DIALOGUE_LIPSYNC_READY_STATUS = 'DIALOGUE_LIPSYNC_READY' as const;

export const LIPSYNC_INGESTION_SPEC_DATASET_PATH =
  'datasets/dialogue/lipsync-ingestion-specification.json' as const;
export const DIALOGUE_SPEC_DATASET_PATH =
  'datasets/dialogue/dialogue-specification.json' as const;
export const LIPSYNC_TIMING_SPEC_DATASET_PATH =
  'datasets/dialogue/lipsync-timing-specification.json' as const;
export const DIALOGUE_CONTINUITY_SPEC_DATASET_PATH =
  'datasets/dialogue/dialogue-continuity-specification.json' as const;
export const SAMPLE_DIALOGUE_ENTRY_PATH = 'datasets/dialogue/sample-dialogue-entry.json' as const;

export const DIALOGUE_LIPSYNC_EXPORT_DIR = 'exports/dialogue_lipsync' as const;
export const LIPSYNC_INGESTION_SPEC_EXPORT_PATH =
  'exports/dialogue_lipsync/lipsync-ingestion-specification.json' as const;
export const DIALOGUE_SPEC_EXPORT_PATH =
  'exports/dialogue_lipsync/dialogue-specification.json' as const;
export const LIPSYNC_TIMING_SPEC_EXPORT_PATH =
  'exports/dialogue_lipsync/lipsync-timing-specification.json' as const;
export const DIALOGUE_CONTINUITY_SPEC_EXPORT_PATH =
  'exports/dialogue_lipsync/dialogue-continuity-specification.json' as const;
export const LIPSYNC_DIALOGUE_OUTPUT_PATH =
  'exports/dialogue_lipsync/lipsync-dialogue-output.json' as const;

export const DIALOGUE_LIPSYNC_REPORT_DIR = 'reports/dialogue_lipsync' as const;
export const DIALOGUE_LIPSYNC_REPORT_PATH =
  'reports/dialogue_lipsync/DIALOGUE_LIPSYNC_SYSTEM_REPORT.json' as const;

const DIALOGUE_FIELDS = [
  'dialogue_id',
  'character_id',
  'scene_id',
  'speaker',
  'dialogue_text',
  'emotion',
  'intent',
  'speaking_style',
  'relationship_context',
  'memory_context',
  'pause_points',
  'emphasis_points',
  'duration_estimate',
] as const;

const CONTINUITY_DIMENSIONS = [
  'character_voice_consistency',
  'emotion_consistency',
  'relationship_consistency',
  'timeline_consistency',
  'memory_consistency',
  'dialogue_style_consistency',
] as const;

const DIALOGUE_STYLE_EXAMPLES = [
  'Gonagi_style',
  'Dana_style',
  'Pietro_style',
  'Bardo_style',
] as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface DialogueEntry {
  dialogue_id: string;
  character_id: string;
  scene_id: string;
  speaker: string;
  dialogue_text: string;
  emotion: string;
  intent: string;
  speaking_style: string;
  relationship_context: Record<string, unknown>;
  memory_context: Record<string, unknown>;
  pause_points: unknown[];
  emphasis_points: unknown[];
  duration_estimate: number;
}

interface DialogueSpecification {
  required_fields: string[];
  context_fields: string[];
  relationship_context_integrity: string;
  memory_context_integrity: string;
  dialogue_spec_integrity: string;
  sample_dialogue: DialogueEntry;
}

interface DialogueContinuitySpecification {
  continuity_dimension_count: number;
  continuity_dimensions: string[];
  dialogue_style_consistency: string;
  dialogue_style_examples: string[];
  dialogue_continuity_integrity: string;
  style_profiles: Record<string, unknown>;
}

export interface DialogueLipsyncReport {
  report_id: string;
  phase: typeof DIALOGUE_LIPSYNC_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    prompt_evaluation_pass: boolean;
    precheck_passed: boolean;
  };
  policy: {
    all_previous_outputs_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  lipsync_summary: {
    relationship_context_integrity: string;
    memory_context_integrity: string;
    dialogue_style_consistency: string;
    story_engine_compatibility: string;
    temporal_memory_compatibility: string;
    relationship_arc_compatibility: string;
    dialogue_spec_integrity: string;
    lipsync_timing_integrity: string;
    dialogue_continuity_integrity: string;
  };
  outputs: {
    ingestion_spec_path: string;
    dialogue_spec_path: string;
    timing_spec_path: string;
    continuity_spec_path: string;
    lipsync_dialogue_output_path: string;
  };
  issues: ValidationIssue[];
  dialogue_lipsync_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function runPrecheck(root: string): {
  prompt_evaluation_pass: boolean;
  precheck_passed: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const reportPath = path.join(root, PROMPT_EVALUATION_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'PROMPT_EVALUATION_REPORT_MISSING',
      message: `Missing report at ${PROMPT_EVALUATION_REPORT_PATH}`,
      severity: 'error',
    });
    return { prompt_evaluation_pass: false, precheck_passed: false, issues };
  }

  const evalReport = readJson<Record<string, unknown>>(root, PROMPT_EVALUATION_REPORT_PATH);
  const verdict = String(evalReport.final_verdict ?? '');
  const status = String(evalReport.status ?? '');

  const prompt_evaluation_pass =
    verdict === PROMPT_EVALUATION_PASS_VERDICT && status === PROMPT_EVALUATION_READY_STATUS;

  if (!prompt_evaluation_pass) {
    issues.push({
      code: 'PROMPT_EVALUATION_PRECHECK_FAIL',
      message: `Expected ${PROMPT_EVALUATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return { prompt_evaluation_pass, precheck_passed: prompt_evaluation_pass, issues };
}

function validateDialogueEntry(entry: DialogueEntry, spec: DialogueSpecification): {
  relationship_context_integrity: string;
  memory_context_integrity: string;
  dialogue_spec_integrity: string;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  for (const field of DIALOGUE_FIELDS) {
    if (!spec.required_fields.includes(field)) {
      issues.push({
        code: 'DIALOGUE_FIELD_SCHEMA_MISSING',
        message: `Schema missing field ${field}`,
        severity: 'error',
      });
    }
    if (entry[field] === undefined || entry[field] === null) {
      issues.push({
        code: 'DIALOGUE_ENTRY_FIELD_MISSING',
        message: `Entry missing ${field}`,
        severity: 'error',
      });
    }
  }

  const relCtx = entry.relationship_context;
  if (!relCtx?.relationship_id || !relCtx?.participant_ids) {
    issues.push({
      code: 'RELATIONSHIP_CONTEXT_INCOMPLETE',
      message: 'relationship_context missing required bindings',
      severity: 'error',
    });
  }

  const memCtx = entry.memory_context;
  if (!memCtx?.callback_id || !memCtx?.memory_horizon_ref) {
    issues.push({
      code: 'MEMORY_CONTEXT_INCOMPLETE',
      message: 'memory_context missing required bindings',
      severity: 'error',
    });
  }

  const relationshipContextIntegrity =
    spec.relationship_context_integrity === 'PASS' &&
    issues.filter((i) => i.code.startsWith('RELATIONSHIP')).length === 0
      ? 'PASS'
      : 'FAIL';

  const memoryContextIntegrity =
    spec.memory_context_integrity === 'PASS' &&
    issues.filter((i) => i.code.startsWith('MEMORY')).length === 0
      ? 'PASS'
      : 'FAIL';

  const dialogueSpecIntegrity =
    spec.dialogue_spec_integrity === 'PASS' &&
    issues.filter((i) => i.code.startsWith('DIALOGUE')).length === 0
      ? 'PASS'
      : 'FAIL';

  return {
    relationship_context_integrity: relationshipContextIntegrity,
    memory_context_integrity: memoryContextIntegrity,
    dialogue_spec_integrity: dialogueSpecIntegrity,
    issues,
  };
}

function validateContinuitySpec(
  root: string,
  continuitySpec: DialogueContinuitySpecification,
  dialogueEntry: DialogueEntry
): {
  dialogue_style_consistency: string;
  story_engine_compatibility: string;
  temporal_memory_compatibility: string;
  relationship_arc_compatibility: string;
  dialogue_continuity_integrity: string;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  for (const dimension of CONTINUITY_DIMENSIONS) {
    if (!continuitySpec.continuity_dimensions.includes(dimension)) {
      issues.push({
        code: 'CONTINUITY_DIMENSION_MISSING',
        message: `Missing dimension ${dimension}`,
        severity: 'error',
      });
    }
  }

  for (const style of DIALOGUE_STYLE_EXAMPLES) {
    if (!continuitySpec.dialogue_style_examples.includes(style)) {
      issues.push({
        code: 'DIALOGUE_STYLE_EXAMPLE_MISSING',
        message: `Missing style example ${style}`,
        severity: 'error',
      });
    }
    if (!continuitySpec.style_profiles[style]) {
      issues.push({
        code: 'DIALOGUE_STYLE_PROFILE_MISSING',
        message: `Missing style profile ${style}`,
        severity: 'error',
      });
    }
  }

  const speakingStyle = dialogueEntry.speaking_style;
  if (!DIALOGUE_STYLE_EXAMPLES.includes(speakingStyle as (typeof DIALOGUE_STYLE_EXAMPLES)[number])) {
    issues.push({
      code: 'SPEAKING_STYLE_UNREGISTERED',
      message: `speaking_style=${speakingStyle}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, STORY_TO_BLUEPRINT_REPORT_PATH))) {
    issues.push({
      code: 'STORY_ENGINE_REPORT_MISSING',
      message: `Missing ${STORY_TO_BLUEPRINT_REPORT_PATH}`,
      severity: 'error',
    });
  } else {
    const storyReport = readJson<Record<string, unknown>>(root, STORY_TO_BLUEPRINT_REPORT_PATH);
    if (String(storyReport.final_verdict ?? '') !== STORY_TO_BLUEPRINT_PASS_VERDICT) {
      issues.push({
        code: 'STORY_ENGINE_NOT_PASS',
        message: 'Story engine not PASS',
        severity: 'error',
      });
    }
  }

  if (!fs.existsSync(path.join(root, TEMPORAL_MEMORY_SPEC_EXPORT_PATH))) {
    issues.push({
      code: 'TEMPORAL_MEMORY_REF_MISSING',
      message: `Missing ${TEMPORAL_MEMORY_SPEC_EXPORT_PATH}`,
      severity: 'error',
    });
  } else if (
    String(dialogueEntry.memory_context.memory_horizon_ref) !== TEMPORAL_MEMORY_SPEC_EXPORT_PATH
  ) {
    issues.push({
      code: 'MEMORY_HORIZON_REF_MISMATCH',
      message: 'memory_context.memory_horizon_ref mismatch',
      severity: 'error',
    });
  }

  const arcSpec = readJson<{ arc_types: string[]; extracted_arcs: Record<string, unknown> }>(
    root,
    ARC_EXTRACTION_SPEC_DATASET_PATH
  );
  if (!arcSpec.arc_types.includes('relationship_arc') || !arcSpec.extracted_arcs.relationship_arc) {
    issues.push({
      code: 'RELATIONSHIP_ARC_MISSING',
      message: 'relationship_arc not in story arc extraction',
      severity: 'error',
    });
  }

  const relArcRef = String(dialogueEntry.relationship_context.relationship_arc_ref ?? '');
  if (relArcRef !== 'relationship_arc' && !arcSpec.extracted_arcs[relArcRef]) {
    issues.push({
      code: 'RELATIONSHIP_ARC_REF_UNLINKED',
      message: `relationship_arc_ref=${relArcRef}`,
      severity: 'error',
    });
  }

  const dialogueStyleConsistency =
    continuitySpec.dialogue_style_consistency === 'PASS' &&
    issues.filter((i) => i.code.startsWith('DIALOGUE_STYLE') || i.code === 'SPEAKING_STYLE_UNREGISTERED')
      .length === 0
      ? 'PASS'
      : 'FAIL';

  const storyEngineCompatibility =
    issues.filter((i) => i.code.startsWith('STORY_ENGINE')).length === 0 ? 'PASS' : 'FAIL';

  const temporalMemoryCompatibility =
    issues.filter((i) => i.code.startsWith('TEMPORAL_MEMORY') || i.code === 'MEMORY_HORIZON_REF_MISMATCH')
      .length === 0
      ? 'PASS'
      : 'FAIL';

  const relationshipArcCompatibility =
    issues.filter((i) => i.code.startsWith('RELATIONSHIP_ARC')).length === 0 ? 'PASS' : 'FAIL';

  const dialogueContinuityIntegrity =
    continuitySpec.dialogue_continuity_integrity === 'PASS' &&
    continuitySpec.continuity_dimension_count >= CONTINUITY_DIMENSIONS.length &&
    issues.filter((i) => i.code === 'CONTINUITY_DIMENSION_MISSING').length === 0
      ? 'PASS'
      : 'FAIL';

  return {
    dialogue_style_consistency: dialogueStyleConsistency,
    story_engine_compatibility: storyEngineCompatibility,
    temporal_memory_compatibility: temporalMemoryCompatibility,
    relationship_arc_compatibility: relationshipArcCompatibility,
    dialogue_continuity_integrity: dialogueContinuityIntegrity,
    issues,
  };
}

export function writeDialogueLipsyncSystem(projectRoot?: string): DialogueLipsyncReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const ingestionSpec = readJson<Record<string, unknown>>(
    root,
    LIPSYNC_INGESTION_SPEC_DATASET_PATH
  );
  const dialogueSpec = readJson<DialogueSpecification>(root, DIALOGUE_SPEC_DATASET_PATH);
  const timingSpec = readJson<{ lipsync_timing_integrity: string }>(
    root,
    LIPSYNC_TIMING_SPEC_DATASET_PATH
  );
  const continuitySpec = readJson<DialogueContinuitySpecification>(
    root,
    DIALOGUE_CONTINUITY_SPEC_DATASET_PATH
  );
  const dialogueEntry = readJson<DialogueEntry>(root, SAMPLE_DIALOGUE_ENTRY_PATH);

  const dialogueValidation = validateDialogueEntry(dialogueEntry, dialogueSpec);
  issues.push(...dialogueValidation.issues);

  const continuityValidation = validateContinuitySpec(root, continuitySpec, dialogueEntry);
  issues.push(...continuityValidation.issues);

  const lipsyncTimingIntegrity =
    timingSpec.lipsync_timing_integrity === 'PASS' ? 'PASS' : 'FAIL';

  const errors = issues.filter((issue) => issue.severity === 'error');
  const lipsyncReady =
    precheck.precheck_passed &&
    errors.length === 0 &&
    dialogueValidation.relationship_context_integrity === 'PASS' &&
    dialogueValidation.memory_context_integrity === 'PASS' &&
    continuityValidation.dialogue_style_consistency === 'PASS' &&
    continuityValidation.story_engine_compatibility === 'PASS' &&
    continuityValidation.temporal_memory_compatibility === 'PASS' &&
    continuityValidation.relationship_arc_compatibility === 'PASS';

  const lipsyncOutput = {
    output_id: 'lipsync-dialogue-output-v1',
    phase: DIALOGUE_LIPSYNC_PHASE,
    generated_at: new Date().toISOString(),
    dialogue: dialogueEntry,
    lipsync_timing: {
      duration_estimate: dialogueEntry.duration_estimate,
      pause_points: dialogueEntry.pause_points,
      emphasis_points: dialogueEntry.emphasis_points,
      speaking_style_profile: continuitySpec.style_profiles[dialogueEntry.speaking_style],
    },
    continuity_bindings: {
      relationship_context_integrity: dialogueValidation.relationship_context_integrity,
      memory_context_integrity: dialogueValidation.memory_context_integrity,
      dialogue_style_consistency: continuityValidation.dialogue_style_consistency,
    },
    compatibility: {
      story_engine_compatibility: continuityValidation.story_engine_compatibility,
      temporal_memory_compatibility: continuityValidation.temporal_memory_compatibility,
      relationship_arc_compatibility: continuityValidation.relationship_arc_compatibility,
    },
  };

  const specExports = [
    {
      path: LIPSYNC_INGESTION_SPEC_EXPORT_PATH,
      data: {
        ...ingestionSpec,
        export_id: 'lipsync-ingestion-specification-export-v1',
        generated_at: new Date().toISOString(),
        dataset_ref: LIPSYNC_INGESTION_SPEC_DATASET_PATH,
      },
    },
    {
      path: DIALOGUE_SPEC_EXPORT_PATH,
      data: {
        ...dialogueSpec,
        export_id: 'dialogue-specification-export-v1',
        generated_at: new Date().toISOString(),
        dataset_ref: DIALOGUE_SPEC_DATASET_PATH,
        required_field_list: [...DIALOGUE_FIELDS],
        relationship_context_integrity: dialogueValidation.relationship_context_integrity,
        memory_context_integrity: dialogueValidation.memory_context_integrity,
        dialogue_spec_integrity: dialogueValidation.dialogue_spec_integrity,
      },
    },
    {
      path: LIPSYNC_TIMING_SPEC_EXPORT_PATH,
      data: {
        ...timingSpec,
        export_id: 'lipsync-timing-specification-export-v1',
        generated_at: new Date().toISOString(),
        dataset_ref: LIPSYNC_TIMING_SPEC_DATASET_PATH,
        lipsync_timing_integrity: lipsyncTimingIntegrity,
      },
    },
    {
      path: DIALOGUE_CONTINUITY_SPEC_EXPORT_PATH,
      data: {
        ...continuitySpec,
        export_id: 'dialogue-continuity-specification-export-v1',
        generated_at: new Date().toISOString(),
        dataset_ref: DIALOGUE_CONTINUITY_SPEC_DATASET_PATH,
        continuity_dimension_list: [...CONTINUITY_DIMENSIONS],
        dialogue_style_example_list: [...DIALOGUE_STYLE_EXAMPLES],
        dialogue_style_consistency: continuityValidation.dialogue_style_consistency,
        dialogue_continuity_integrity: continuityValidation.dialogue_continuity_integrity,
      },
    },
  ];

  fs.mkdirSync(path.join(root, DIALOGUE_LIPSYNC_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, DIALOGUE_LIPSYNC_REPORT_DIR), { recursive: true });

  for (const specExport of specExports) {
    fs.writeFileSync(
      path.join(root, specExport.path),
      `${JSON.stringify(specExport.data, null, 2)}\n`,
      'utf8'
    );
  }

  fs.writeFileSync(
    path.join(root, LIPSYNC_DIALOGUE_OUTPUT_PATH),
    `${JSON.stringify(lipsyncOutput, null, 2)}\n`,
    'utf8'
  );

  const report: DialogueLipsyncReport = {
    report_id: 'dialogue-lipsync-system-report-v1',
    phase: DIALOGUE_LIPSYNC_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: lipsyncReady ? DIALOGUE_LIPSYNC_PASS_VERDICT : DIALOGUE_LIPSYNC_FAIL_VERDICT,
    status: lipsyncReady ? DIALOGUE_LIPSYNC_READY_STATUS : 'DIALOGUE_LIPSYNC_INCOMPLETE',
    precheck,
    policy: {
      all_previous_outputs_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    lipsync_summary: {
      relationship_context_integrity: dialogueValidation.relationship_context_integrity,
      memory_context_integrity: dialogueValidation.memory_context_integrity,
      dialogue_style_consistency: continuityValidation.dialogue_style_consistency,
      story_engine_compatibility: continuityValidation.story_engine_compatibility,
      temporal_memory_compatibility: continuityValidation.temporal_memory_compatibility,
      relationship_arc_compatibility: continuityValidation.relationship_arc_compatibility,
      dialogue_spec_integrity: dialogueValidation.dialogue_spec_integrity,
      lipsync_timing_integrity: lipsyncTimingIntegrity,
      dialogue_continuity_integrity: continuityValidation.dialogue_continuity_integrity,
    },
    outputs: {
      ingestion_spec_path: LIPSYNC_INGESTION_SPEC_EXPORT_PATH,
      dialogue_spec_path: DIALOGUE_SPEC_EXPORT_PATH,
      timing_spec_path: LIPSYNC_TIMING_SPEC_EXPORT_PATH,
      continuity_spec_path: DIALOGUE_CONTINUITY_SPEC_EXPORT_PATH,
      lipsync_dialogue_output_path: LIPSYNC_DIALOGUE_OUTPUT_PATH,
    },
    issues,
    dialogue_lipsync_ready: lipsyncReady,
  };

  fs.writeFileSync(
    path.join(root, DIALOGUE_LIPSYNC_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}

export const PROMPT_EVALUATION_READ_ONLY_PATHS = [
  PROMPT_EVALUATION_REPORT_PATH,
  'exports/prompt_evaluation/prompt-quality-specification.json',
  'exports/prompt_evaluation/prompt-scorecard.json',
  'exports/prompt_evaluation/prompt-risk-report.json',
  'exports/prompt_evaluation/prompt-improvement-report.json',
  'exports/prompt_evaluation/generation-readiness.json',
  'datasets/prompt_evaluation/prompt-quality-specification.json',
  'datasets/prompt_evaluation/prompt-scorecard.json',
  'datasets/prompt_evaluation/prompt-risk-library.json',
  'datasets/prompt_evaluation/prompt-improvement-library.json',
] as const;
