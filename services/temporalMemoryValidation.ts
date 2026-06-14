import fs from 'node:fs';
import path from 'node:path';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  VIDEO_CONSISTENCY_SPEC_EXPORT_PATH,
  VIDEO_CONSISTENCY_SCORECARD_EXPORT_PATH,
  VIDEO_CONSISTENCY_THRESHOLDS_EXPORT_PATH,
  VIDEO_CONSISTENCY_VALIDATION_PASS_VERDICT,
  VIDEO_CONSISTENCY_VALIDATION_READY_STATUS,
  VIDEO_CONSISTENCY_VALIDATION_REPORT_PATH,
  VIDEO_SEQUENCE_SPEC_EXPORT_PATH,
  MOTION_CONSISTENCY_SPEC_EXPORT_PATH,
  TRANSITION_CONSISTENCY_SPEC_EXPORT_PATH,
} from './videoConsistencyValidation.js';

export const TEMPORAL_MEMORY_VALIDATION_PHASE = 'PHASE-L2-CONSISTENCY-003' as const;
export const TEMPORAL_MEMORY_VALIDATION_PASS_VERDICT =
  'PASS_TEMPORAL_MEMORY_VALIDATION_SYSTEM_V1' as const;
export const TEMPORAL_MEMORY_VALIDATION_FAIL_VERDICT =
  'FAIL_TEMPORAL_MEMORY_VALIDATION_SYSTEM_V1' as const;
export const TEMPORAL_MEMORY_VALIDATION_READY_STATUS =
  'TEMPORAL_MEMORY_VALIDATION_READY' as const;

export const TEMPORAL_MEMORY_SPEC_DATASET_PATH =
  'datasets/consistency/temporal-memory-specification.json' as const;
export const TEMPORAL_MEMORY_SCORECARD_DATASET_PATH =
  'datasets/consistency/temporal-memory-scorecard.json' as const;
export const TEMPORAL_MEMORY_THRESHOLDS_DATASET_PATH =
  'datasets/consistency/temporal-memory-thresholds.json' as const;
export const MEMORY_HORIZON_SPEC_DATASET_PATH =
  'datasets/consistency/memory-horizon-specification.json' as const;
export const CALLBACK_MEMORY_SPEC_DATASET_PATH =
  'datasets/consistency/callback-memory-specification.json' as const;
export const WORLD_STATE_MEMORY_SPEC_DATASET_PATH =
  'datasets/consistency/world-state-memory-specification.json' as const;
export const TIMELINE_MEMORY_SPEC_DATASET_PATH =
  'datasets/consistency/timeline-memory-specification.json' as const;

export const TEMPORAL_MEMORY_EXPORT_DIR = 'exports/temporal_memory' as const;
export const TEMPORAL_MEMORY_SPEC_EXPORT_PATH =
  'exports/temporal_memory/temporal-memory-specification.json' as const;
export const TEMPORAL_MEMORY_SCORECARD_EXPORT_PATH =
  'exports/temporal_memory/temporal-memory-scorecard.json' as const;
export const TEMPORAL_MEMORY_THRESHOLDS_EXPORT_PATH =
  'exports/temporal_memory/temporal-memory-thresholds.json' as const;
export const MEMORY_HORIZON_SPEC_EXPORT_PATH =
  'exports/temporal_memory/memory-horizon-specification.json' as const;
export const CALLBACK_MEMORY_SPEC_EXPORT_PATH =
  'exports/temporal_memory/callback-memory-specification.json' as const;
export const WORLD_STATE_MEMORY_SPEC_EXPORT_PATH =
  'exports/temporal_memory/world-state-memory-specification.json' as const;
export const TIMELINE_MEMORY_SPEC_EXPORT_PATH =
  'exports/temporal_memory/timeline-memory-specification.json' as const;

export const TEMPORAL_MEMORY_VALIDATION_DIR = 'reports/temporal_memory' as const;
export const TEMPORAL_MEMORY_VALIDATION_REPORT_PATH =
  'reports/temporal_memory/TEMPORAL_MEMORY_VALIDATION_REPORT.json' as const;

const MEMORY_DIMENSIONS = [
  'character_memory',
  'location_memory',
  'relationship_memory',
  'prop_memory',
  'costume_memory',
  'world_state_memory',
  'theme_memory',
  'callback_memory',
  'legacy_callback_memory',
  'timeline_memory',
] as const;

const CALLBACK_MEMORY_DIMENSIONS = [
  'callback_recall',
  'callback_resolution',
  'callback_chain_memory',
  'callback_forget_rate',
] as const;

const WORLD_STATE_MEMORY_DIMENSIONS = [
  'world_state_persistence',
  'world_state_transition',
  'world_state_recall',
] as const;

const TIMELINE_MEMORY_DIMENSIONS = [
  'timeline_persistence',
  'timeline_transition',
  'timeline_recall',
] as const;

const EXPECTED_MEMORY_HORIZONS = [10, 50, 100, 500, 1000, 5000] as const;
const EXPECTED_MINIMUM_SCORE = 0.8;
const EXPECTED_TARGET_SCORE = 0.9;
const EXPECTED_PRODUCTION_SCORE = 0.95;

const VIDEO_TRACEABILITY_REFS = [
  VIDEO_CONSISTENCY_VALIDATION_REPORT_PATH,
  VIDEO_CONSISTENCY_SPEC_EXPORT_PATH,
  VIDEO_CONSISTENCY_SCORECARD_EXPORT_PATH,
  VIDEO_CONSISTENCY_THRESHOLDS_EXPORT_PATH,
  VIDEO_SEQUENCE_SPEC_EXPORT_PATH,
  MOTION_CONSISTENCY_SPEC_EXPORT_PATH,
  TRANSITION_CONSISTENCY_SPEC_EXPORT_PATH,
] as const;

const MEMORY_TRACEABILITY_LINKS = [
  { memory_dimension: 'callback_memory', spec_ref: CALLBACK_MEMORY_SPEC_DATASET_PATH },
  { memory_dimension: 'legacy_callback_memory', spec_ref: CALLBACK_MEMORY_SPEC_DATASET_PATH },
  { memory_dimension: 'world_state_memory', spec_ref: WORLD_STATE_MEMORY_SPEC_DATASET_PATH },
  { memory_dimension: 'timeline_memory', spec_ref: TIMELINE_MEMORY_SPEC_DATASET_PATH },
] as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface TemporalMemorySpecification {
  spec_id: string;
  memory_dimension_count: number;
  memory_dimensions: string[];
  upstream_checkpoint: string;
  studio_continuity_alignment: Record<string, string>;
}

interface TemporalMemoryScorecard {
  scorecard_id: string;
  dimensions: { dimension: string; weight: number }[];
  composite_scoring: { weighted_average: boolean; weight_sum: number };
}

interface TemporalMemoryThresholds {
  thresholds_id: string;
  minimum_score: number;
  target_score: number;
  production_score: number;
}

interface MemoryHorizonSpecification {
  horizon_spec_id: string;
  memory_horizons: number[];
  memory_horizon_max: number;
}

interface CallbackMemorySpecification {
  callback_memory_spec_id: string;
  callback_memory_dimension_count: number;
  callback_memory_dimensions: string[];
  linked_memory_dimensions: string[];
}

interface WorldStateMemorySpecification {
  world_state_memory_spec_id: string;
  world_state_memory_dimension_count: number;
  world_state_memory_dimensions: string[];
  linked_memory_dimension: string;
}

interface TimelineMemorySpecification {
  timeline_memory_spec_id: string;
  timeline_memory_dimension_count: number;
  timeline_memory_dimensions: string[];
  linked_memory_dimension: string;
}

export interface TemporalMemoryValidationReport {
  report_id: string;
  phase: typeof TEMPORAL_MEMORY_VALIDATION_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    video_consistency_validation_ready: boolean;
    pass_video_consistency_validation_system_v1: boolean;
    precheck_passed: boolean;
  };
  policy: {
    all_previous_outputs_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  validation_summary: {
    memory_dimension_count: number;
    memory_horizon_max: number;
    callback_memory_dimension_count: number;
    world_state_memory_dimension_count: number;
    timeline_memory_dimension_count: number;
    memory_traceability_integrity: string;
    threshold_integrity: string;
    traceability_integrity: string;
    scorecard_weight_integrity: string;
  };
  outputs: {
    specification_path: string;
    scorecard_path: string;
    thresholds_path: string;
    memory_horizon_path: string;
    callback_memory_path: string;
    world_state_memory_path: string;
    timeline_memory_path: string;
  };
  issues: ValidationIssue[];
  temporal_memory_validation_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function runPrecheck(root: string): {
  video_consistency_validation_ready: boolean;
  pass_video_consistency_validation_system_v1: boolean;
  precheck_passed: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const reportPath = path.join(root, VIDEO_CONSISTENCY_VALIDATION_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'VIDEO_CONSISTENCY_REPORT_MISSING',
      message: `Missing video consistency report at ${VIDEO_CONSISTENCY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return {
      video_consistency_validation_ready: false,
      pass_video_consistency_validation_system_v1: false,
      precheck_passed: false,
      issues,
    };
  }

  const videoReport = readJson<Record<string, unknown>>(root, VIDEO_CONSISTENCY_VALIDATION_REPORT_PATH);
  const status = String(videoReport.status ?? '');
  const verdict = String(videoReport.final_verdict ?? '');

  const video_consistency_validation_ready = status === VIDEO_CONSISTENCY_VALIDATION_READY_STATUS;
  const pass_video_consistency_validation_system_v1 =
    verdict === VIDEO_CONSISTENCY_VALIDATION_PASS_VERDICT;

  if (!video_consistency_validation_ready) {
    issues.push({
      code: 'VIDEO_CONSISTENCY_NOT_READY',
      message: `Expected status=${VIDEO_CONSISTENCY_VALIDATION_READY_STATUS}`,
      severity: 'error',
    });
  }
  if (!pass_video_consistency_validation_system_v1) {
    issues.push({
      code: 'VIDEO_CONSISTENCY_VERDICT_FAIL',
      message: `Expected verdict=${VIDEO_CONSISTENCY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return {
    video_consistency_validation_ready,
    pass_video_consistency_validation_system_v1,
    precheck_passed:
      video_consistency_validation_ready && pass_video_consistency_validation_system_v1,
    issues,
  };
}

function validateThresholdIntegrity(thresholds: TemporalMemoryThresholds): {
  threshold_integrity: string;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (thresholds.minimum_score !== EXPECTED_MINIMUM_SCORE) {
    issues.push({
      code: 'MINIMUM_SCORE_MISMATCH',
      message: `minimum_score=${thresholds.minimum_score}, expected ${EXPECTED_MINIMUM_SCORE}`,
      severity: 'error',
    });
  }
  if (thresholds.target_score !== EXPECTED_TARGET_SCORE) {
    issues.push({
      code: 'TARGET_SCORE_MISMATCH',
      message: `target_score=${thresholds.target_score}, expected ${EXPECTED_TARGET_SCORE}`,
      severity: 'error',
    });
  }
  if (thresholds.production_score !== EXPECTED_PRODUCTION_SCORE) {
    issues.push({
      code: 'PRODUCTION_SCORE_MISMATCH',
      message: `production_score=${thresholds.production_score}, expected ${EXPECTED_PRODUCTION_SCORE}`,
      severity: 'error',
    });
  }
  if (
    !(
      thresholds.minimum_score < thresholds.target_score &&
      thresholds.target_score < thresholds.production_score
    )
  ) {
    issues.push({
      code: 'THRESHOLD_ORDER_INVALID',
      message: 'minimum_score < target_score < production_score required',
      severity: 'error',
    });
  }

  return {
    threshold_integrity: issues.length === 0 ? 'PASS' : 'FAIL',
    issues,
  };
}

function validateScorecard(scorecard: TemporalMemoryScorecard): {
  scorecard_weight_integrity: string;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const dimensionSet = new Set(scorecard.dimensions.map((entry) => entry.dimension));

  for (const dimension of MEMORY_DIMENSIONS) {
    if (!dimensionSet.has(dimension)) {
      issues.push({
        code: 'SCORECARD_DIMENSION_MISSING',
        message: `Scorecard missing ${dimension}`,
        severity: 'error',
      });
    }
  }

  const weightSum = Number(
    scorecard.dimensions.reduce((sum, entry) => sum + entry.weight, 0).toFixed(4)
  );
  if (weightSum !== 1) {
    issues.push({
      code: 'SCORECARD_WEIGHT_SUM_INVALID',
      message: `weight_sum=${weightSum}, expected 1.0`,
      severity: 'error',
    });
  }

  return {
    scorecard_weight_integrity: issues.length === 0 ? 'PASS' : 'FAIL',
    issues,
  };
}

function validateSpecification(spec: TemporalMemorySpecification): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (spec.memory_dimension_count < MEMORY_DIMENSIONS.length) {
    issues.push({
      code: 'MEMORY_DIMENSION_SHORTFALL',
      message: `memory_dimension_count=${spec.memory_dimension_count}`,
      severity: 'error',
    });
  }

  for (const dimension of MEMORY_DIMENSIONS) {
    if (!spec.memory_dimensions.includes(dimension)) {
      issues.push({
        code: 'SPEC_DIMENSION_MISSING',
        message: `Specification missing ${dimension}`,
        severity: 'error',
      });
    }
  }

  if (spec.upstream_checkpoint !== VIDEO_CONSISTENCY_VALIDATION_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_CHECKPOINT_MISMATCH',
      message: `upstream_checkpoint=${spec.upstream_checkpoint}`,
      severity: 'error',
    });
  }

  return issues;
}

function validateHorizonSpecification(horizonSpec: MemoryHorizonSpecification): {
  memory_horizon_max: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  for (const horizon of EXPECTED_MEMORY_HORIZONS) {
    if (!horizonSpec.memory_horizons.includes(horizon)) {
      issues.push({
        code: 'MEMORY_HORIZON_MISSING',
        message: `Missing memory horizon ${horizon}`,
        severity: 'error',
      });
    }
  }

  if (horizonSpec.memory_horizon_max < 5000) {
    issues.push({
      code: 'MEMORY_HORIZON_MAX_LOW',
      message: `memory_horizon_max=${horizonSpec.memory_horizon_max}, expected >=5000`,
      severity: 'error',
    });
  }

  return {
    memory_horizon_max: horizonSpec.memory_horizon_max,
    issues,
  };
}

function validateCallbackMemorySpec(callbackSpec: CallbackMemorySpecification): {
  callback_memory_dimension_count: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (callbackSpec.callback_memory_dimension_count < 3) {
    issues.push({
      code: 'CALLBACK_MEMORY_DIMENSION_SHORTFALL',
      message: `callback_memory_dimension_count=${callbackSpec.callback_memory_dimension_count}`,
      severity: 'error',
    });
  }

  for (const dimension of CALLBACK_MEMORY_DIMENSIONS.slice(0, 3)) {
    if (!callbackSpec.callback_memory_dimensions.includes(dimension)) {
      issues.push({
        code: 'CALLBACK_MEMORY_DIMENSION_MISSING',
        message: `Missing callback memory dimension ${dimension}`,
        severity: 'error',
      });
    }
  }

  for (const linked of ['callback_memory', 'legacy_callback_memory']) {
    if (!callbackSpec.linked_memory_dimensions.includes(linked)) {
      issues.push({
        code: 'CALLBACK_MEMORY_LINK_MISSING',
        message: `Missing linked memory dimension ${linked}`,
        severity: 'error',
      });
    }
  }

  return {
    callback_memory_dimension_count: callbackSpec.callback_memory_dimensions.length,
    issues,
  };
}

function validateWorldStateMemorySpec(worldStateSpec: WorldStateMemorySpecification): {
  world_state_memory_dimension_count: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (worldStateSpec.world_state_memory_dimension_count < 3) {
    issues.push({
      code: 'WORLD_STATE_MEMORY_DIMENSION_SHORTFALL',
      message: `world_state_memory_dimension_count=${worldStateSpec.world_state_memory_dimension_count}`,
      severity: 'error',
    });
  }

  for (const dimension of WORLD_STATE_MEMORY_DIMENSIONS) {
    if (!worldStateSpec.world_state_memory_dimensions.includes(dimension)) {
      issues.push({
        code: 'WORLD_STATE_MEMORY_DIMENSION_MISSING',
        message: `Missing world state memory dimension ${dimension}`,
        severity: 'error',
      });
    }
  }

  if (worldStateSpec.linked_memory_dimension !== 'world_state_memory') {
    issues.push({
      code: 'WORLD_STATE_MEMORY_LINK_MISMATCH',
      message: `linked_memory_dimension=${worldStateSpec.linked_memory_dimension}`,
      severity: 'error',
    });
  }

  return {
    world_state_memory_dimension_count: worldStateSpec.world_state_memory_dimensions.length,
    issues,
  };
}

function validateTimelineMemorySpec(timelineSpec: TimelineMemorySpecification): {
  timeline_memory_dimension_count: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (timelineSpec.timeline_memory_dimension_count < 3) {
    issues.push({
      code: 'TIMELINE_MEMORY_DIMENSION_SHORTFALL',
      message: `timeline_memory_dimension_count=${timelineSpec.timeline_memory_dimension_count}`,
      severity: 'error',
    });
  }

  for (const dimension of TIMELINE_MEMORY_DIMENSIONS) {
    if (!timelineSpec.timeline_memory_dimensions.includes(dimension)) {
      issues.push({
        code: 'TIMELINE_MEMORY_DIMENSION_MISSING',
        message: `Missing timeline memory dimension ${dimension}`,
        severity: 'error',
      });
    }
  }

  if (timelineSpec.linked_memory_dimension !== 'timeline_memory') {
    issues.push({
      code: 'TIMELINE_MEMORY_LINK_MISMATCH',
      message: `linked_memory_dimension=${timelineSpec.linked_memory_dimension}`,
      severity: 'error',
    });
  }

  return {
    timeline_memory_dimension_count: timelineSpec.timeline_memory_dimensions.length,
    issues,
  };
}

function buildTraceabilityAudit(root: string): {
  traceability_integrity: string;
  refs: { ref: string; linked: boolean }[];
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const refs: { ref: string; linked: boolean }[] = [];

  for (const refPath of VIDEO_TRACEABILITY_REFS) {
    const linked = fs.existsSync(path.join(root, refPath));
    refs.push({ ref: refPath, linked });
    if (!linked) {
      issues.push({
        code: 'TRACEABILITY_REF_MISSING',
        message: `Missing traceability ref ${refPath}`,
        severity: 'error',
      });
    }
  }

  return {
    traceability_integrity: issues.length === 0 ? 'PASS' : 'FAIL',
    refs,
    issues,
  };
}

function buildMemoryTraceabilityAudit(
  spec: TemporalMemorySpecification,
  root: string
): {
  memory_traceability_integrity: string;
  links: { memory_dimension: string; spec_ref: string; linked: boolean; aligned: boolean }[];
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const links: {
    memory_dimension: string;
    spec_ref: string;
    linked: boolean;
    aligned: boolean;
  }[] = [];

  for (const link of MEMORY_TRACEABILITY_LINKS) {
    const linked = fs.existsSync(path.join(root, link.spec_ref));
    const aligned =
      spec.memory_dimensions.includes(link.memory_dimension) &&
      spec.studio_continuity_alignment[link.memory_dimension.replace('_memory', '_arc')] !==
        undefined ||
      spec.studio_continuity_alignment[link.memory_dimension] !== undefined;

    const alignmentKey =
      link.memory_dimension === 'callback_memory'
        ? 'memory_callback_arc'
        : link.memory_dimension === 'legacy_callback_memory'
          ? 'legacy_callback_arc'
          : link.memory_dimension === 'world_state_memory'
            ? 'world_state_arc'
            : link.memory_dimension === 'timeline_memory'
              ? 'timeline_arc'
              : link.memory_dimension;

    const isAligned =
      spec.memory_dimensions.includes(link.memory_dimension) &&
      (spec.studio_continuity_alignment[alignmentKey] === link.memory_dimension ||
        spec.studio_continuity_alignment[link.memory_dimension] === link.memory_dimension);

    links.push({
      memory_dimension: link.memory_dimension,
      spec_ref: link.spec_ref,
      linked,
      aligned: isAligned,
    });

    if (!linked) {
      issues.push({
        code: 'MEMORY_TRACEABILITY_REF_MISSING',
        message: `Missing memory spec ref ${link.spec_ref}`,
        severity: 'error',
      });
    }
    if (!isAligned) {
      issues.push({
        code: 'MEMORY_TRACEABILITY_ALIGNMENT_FAIL',
        message: `Memory dimension ${link.memory_dimension} not aligned in studio continuity`,
        severity: 'error',
      });
    }
  }

  return {
    memory_traceability_integrity: issues.length === 0 ? 'PASS' : 'FAIL',
    links,
    issues,
  };
}

export function writeTemporalMemoryValidation(
  projectRoot?: string
): TemporalMemoryValidationReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const specification = readJson<TemporalMemorySpecification>(
    root,
    TEMPORAL_MEMORY_SPEC_DATASET_PATH
  );
  const scorecard = readJson<TemporalMemoryScorecard>(
    root,
    TEMPORAL_MEMORY_SCORECARD_DATASET_PATH
  );
  const thresholds = readJson<TemporalMemoryThresholds>(
    root,
    TEMPORAL_MEMORY_THRESHOLDS_DATASET_PATH
  );
  const horizonSpec = readJson<MemoryHorizonSpecification>(
    root,
    MEMORY_HORIZON_SPEC_DATASET_PATH
  );
  const callbackSpec = readJson<CallbackMemorySpecification>(
    root,
    CALLBACK_MEMORY_SPEC_DATASET_PATH
  );
  const worldStateSpec = readJson<WorldStateMemorySpecification>(
    root,
    WORLD_STATE_MEMORY_SPEC_DATASET_PATH
  );
  const timelineSpec = readJson<TimelineMemorySpecification>(
    root,
    TIMELINE_MEMORY_SPEC_DATASET_PATH
  );

  issues.push(...validateSpecification(specification));

  const thresholdValidation = validateThresholdIntegrity(thresholds);
  issues.push(...thresholdValidation.issues);

  const scorecardValidation = validateScorecard(scorecard);
  issues.push(...scorecardValidation.issues);

  const horizonValidation = validateHorizonSpecification(horizonSpec);
  issues.push(...horizonValidation.issues);

  const callbackValidation = validateCallbackMemorySpec(callbackSpec);
  issues.push(...callbackValidation.issues);

  const worldStateValidation = validateWorldStateMemorySpec(worldStateSpec);
  issues.push(...worldStateValidation.issues);

  const timelineValidation = validateTimelineMemorySpec(timelineSpec);
  issues.push(...timelineValidation.issues);

  const traceabilityAudit = buildTraceabilityAudit(root);
  issues.push(...traceabilityAudit.issues);

  const memoryTraceabilityAudit = buildMemoryTraceabilityAudit(specification, root);
  issues.push(...memoryTraceabilityAudit.issues);

  const errors = issues.filter((issue) => issue.severity === 'error');
  const systemReady =
    precheck.precheck_passed &&
    errors.length === 0 &&
    specification.memory_dimensions.length >= MEMORY_DIMENSIONS.length &&
    thresholdValidation.threshold_integrity === 'PASS' &&
    horizonValidation.memory_horizon_max >= 5000 &&
    callbackValidation.callback_memory_dimension_count >= 3 &&
    worldStateValidation.world_state_memory_dimension_count >= 3 &&
    timelineValidation.timeline_memory_dimension_count >= 3 &&
    memoryTraceabilityAudit.memory_traceability_integrity === 'PASS' &&
    traceabilityAudit.traceability_integrity === 'PASS' &&
    scorecardValidation.scorecard_weight_integrity === 'PASS';

  const specificationExport = {
    ...specification,
    export_id: 'temporal-memory-specification-export-v1',
    phase: TEMPORAL_MEMORY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: TEMPORAL_MEMORY_SPEC_DATASET_PATH,
    memory_dimension_count: specification.memory_dimensions.length,
    video_consistency_ref: VIDEO_CONSISTENCY_SPEC_EXPORT_PATH,
    memory_traceability_links: memoryTraceabilityAudit.links,
    traceability_refs: traceabilityAudit.refs,
  };

  const scorecardExport = {
    ...scorecard,
    export_id: 'temporal-memory-scorecard-export-v1',
    phase: TEMPORAL_MEMORY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: TEMPORAL_MEMORY_SCORECARD_DATASET_PATH,
    memory_dimension_count: MEMORY_DIMENSIONS.length,
    dimension_list: [...MEMORY_DIMENSIONS],
  };

  const thresholdsExport = {
    ...thresholds,
    export_id: 'temporal-memory-thresholds-export-v1',
    phase: TEMPORAL_MEMORY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: TEMPORAL_MEMORY_THRESHOLDS_DATASET_PATH,
    threshold_integrity: thresholdValidation.threshold_integrity,
  };

  const horizonSpecExport = {
    ...horizonSpec,
    export_id: 'memory-horizon-specification-export-v1',
    phase: TEMPORAL_MEMORY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: MEMORY_HORIZON_SPEC_DATASET_PATH,
    supported_memory_horizons: [...EXPECTED_MEMORY_HORIZONS],
  };

  const callbackSpecExport = {
    ...callbackSpec,
    export_id: 'callback-memory-specification-export-v1',
    phase: TEMPORAL_MEMORY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: CALLBACK_MEMORY_SPEC_DATASET_PATH,
    callback_memory_dimension_list: [...CALLBACK_MEMORY_DIMENSIONS],
  };

  const worldStateSpecExport = {
    ...worldStateSpec,
    export_id: 'world-state-memory-specification-export-v1',
    phase: TEMPORAL_MEMORY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: WORLD_STATE_MEMORY_SPEC_DATASET_PATH,
    world_state_memory_dimension_list: [...WORLD_STATE_MEMORY_DIMENSIONS],
  };

  const timelineSpecExport = {
    ...timelineSpec,
    export_id: 'timeline-memory-specification-export-v1',
    phase: TEMPORAL_MEMORY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    dataset_ref: TIMELINE_MEMORY_SPEC_DATASET_PATH,
    timeline_memory_dimension_list: [...TIMELINE_MEMORY_DIMENSIONS],
  };

  const report: TemporalMemoryValidationReport = {
    report_id: 'temporal-memory-validation-report-v1',
    phase: TEMPORAL_MEMORY_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: systemReady
      ? TEMPORAL_MEMORY_VALIDATION_PASS_VERDICT
      : TEMPORAL_MEMORY_VALIDATION_FAIL_VERDICT,
    status: systemReady
      ? TEMPORAL_MEMORY_VALIDATION_READY_STATUS
      : 'TEMPORAL_MEMORY_VALIDATION_INCOMPLETE',
    precheck,
    policy: {
      all_previous_outputs_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    validation_summary: {
      memory_dimension_count: specification.memory_dimensions.length,
      memory_horizon_max: horizonValidation.memory_horizon_max,
      callback_memory_dimension_count: callbackValidation.callback_memory_dimension_count,
      world_state_memory_dimension_count: worldStateValidation.world_state_memory_dimension_count,
      timeline_memory_dimension_count: timelineValidation.timeline_memory_dimension_count,
      memory_traceability_integrity: memoryTraceabilityAudit.memory_traceability_integrity,
      threshold_integrity: thresholdValidation.threshold_integrity,
      traceability_integrity: traceabilityAudit.traceability_integrity,
      scorecard_weight_integrity: scorecardValidation.scorecard_weight_integrity,
    },
    outputs: {
      specification_path: TEMPORAL_MEMORY_SPEC_EXPORT_PATH,
      scorecard_path: TEMPORAL_MEMORY_SCORECARD_EXPORT_PATH,
      thresholds_path: TEMPORAL_MEMORY_THRESHOLDS_EXPORT_PATH,
      memory_horizon_path: MEMORY_HORIZON_SPEC_EXPORT_PATH,
      callback_memory_path: CALLBACK_MEMORY_SPEC_EXPORT_PATH,
      world_state_memory_path: WORLD_STATE_MEMORY_SPEC_EXPORT_PATH,
      timeline_memory_path: TIMELINE_MEMORY_SPEC_EXPORT_PATH,
    },
    issues,
    temporal_memory_validation_ready: systemReady,
  };

  fs.mkdirSync(path.join(root, TEMPORAL_MEMORY_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, TEMPORAL_MEMORY_VALIDATION_DIR), { recursive: true });

  fs.writeFileSync(
    path.join(root, TEMPORAL_MEMORY_SPEC_EXPORT_PATH),
    `${JSON.stringify(specificationExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEMPORAL_MEMORY_SCORECARD_EXPORT_PATH),
    `${JSON.stringify(scorecardExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEMPORAL_MEMORY_THRESHOLDS_EXPORT_PATH),
    `${JSON.stringify(thresholdsExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MEMORY_HORIZON_SPEC_EXPORT_PATH),
    `${JSON.stringify(horizonSpecExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, CALLBACK_MEMORY_SPEC_EXPORT_PATH),
    `${JSON.stringify(callbackSpecExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, WORLD_STATE_MEMORY_SPEC_EXPORT_PATH),
    `${JSON.stringify(worldStateSpecExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TIMELINE_MEMORY_SPEC_EXPORT_PATH),
    `${JSON.stringify(timelineSpecExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, TEMPORAL_MEMORY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
