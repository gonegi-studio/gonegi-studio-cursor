import fs from 'node:fs';
import path from 'node:path';
import {
  KEYFRAME_COMPILER_PASS_VERDICT,
  KEYFRAME_COMPILER_REPORT_PATH,
} from './gonegiKeyframePlanValidator.js';
import {
  MOTION_COMPILER_PHASE,
  GONEGI_MOTION_PLAN_REGISTRY_PATH,
  GONEGI_MOTION_PLAN_SCHEMA_PATH,
  GONEGI_MOTION_PLANS_DIR,
  SEED_GONEGI_MOTION_PLAN_SPECS,
  deriveSegmentCount,
  type GonegiMotionPlan,
  loadGonegiMotionPlan,
} from './gonegiKeyframeToMotionCompiler.js';
import { loadGonegiKeyframePlan } from './gonegiVideoStateToKeyframeCompiler.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOTION_COMPILER_PASS_VERDICT = 'PASS_GONEGI_KEYFRAME_TO_MOTION_COMPILER_V2' as const;
export const MOTION_COMPILER_FAIL_VERDICT = 'FAIL_GONEGI_KEYFRAME_TO_MOTION_COMPILER_V2' as const;
export const MOTION_COMPILER_REPORT_PATH = 'reports/gonegi-keyframe-to-motion-report.json' as const;
export const MOTION_COMPILER_MD_PATH = 'reports/GONEGI_KEYFRAME_TO_MOTION.md' as const;

const BLEND_ID = 'gonegi-master-director-blend-v1' as const;

export type GonegiMotionPlanValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  gonegi_motion_plan_id?: string;
};

export type GonegiMotionPlanValidationResult = {
  gonegi_motion_plan_id: string;
  source_keyframe_plan_id: string;
  status: 'PASS' | 'FAIL';
  issues: GonegiMotionPlanValidationIssue[];
};

export type GonegiKeyframeToMotionReport = {
  report_id: string;
  phase: typeof MOTION_COMPILER_PHASE;
  timestamp: string;
  motion_plans: number;
  identity_locks: 'PASS' | 'FAIL';
  continuity: 'PASS' | 'FAIL';
  segment_counts: 'PASS' | 'FAIL';
  timestamps: 'PASS' | 'FAIL';
  translation_trace: 'PASS' | 'FAIL';
  replacement_trace: 'PASS' | 'FAIL';
  registry: 'PASS' | 'FAIL';
  plan_validations: GonegiMotionPlanValidationResult[];
  design_only: true;
  gpu_execution: false;
  final_verdict: typeof MOTION_COMPILER_PASS_VERDICT | typeof MOTION_COMPILER_FAIL_VERDICT;
  issues: GonegiMotionPlanValidationIssue[];
};

function locksPreserved(
  source: { identity_locks: string[]; location_locks: string[]; composition_locks?: string[] },
  target: { identity_locks: string[]; location_locks: string[]; composition_locks?: string[] }
): boolean {
  for (const lock of source.identity_locks) {
    if (!target.identity_locks.includes(lock)) return false;
  }
  for (const lock of source.location_locks) {
    if (!target.location_locks.includes(lock)) return false;
  }
  for (const lock of source.composition_locks ?? []) {
    if (!(target.composition_locks ?? []).includes(lock)) return false;
  }
  return true;
}

function translationTracePreserved(
  source: GonegiMotionPlan['translation_trace'],
  target: GonegiMotionPlan['translation_trace']
): boolean {
  return (
    source.translation_id === target.translation_id &&
    source.source_world_type === target.source_world_type &&
    source.target_world_identity === target.target_world_identity &&
    source.applied_dimensions.every((dim) => target.applied_dimensions.includes(dim)) &&
    Boolean(target.motion_plan_translation?.compiler_phase)
  );
}

function replacementTracePreserved(
  source: GonegiMotionPlan['replacement_trace'],
  target: GonegiMotionPlan['replacement_trace']
): boolean {
  return (
    source.contract_id === target.contract_id &&
    source.replacements_applied.length === target.replacements_applied.length &&
    source.replacements_applied.every((entry, index) => {
      const other = target.replacements_applied[index];
      return (
        entry.source_role === other.source_role &&
        entry.target_character_id === other.target_character_id
      );
    }) &&
    source.companions_injected.every((id) => target.companions_injected.includes(id))
  );
}

function segmentTimestampsOrdered(plan: GonegiMotionPlan): boolean {
  for (let i = 0; i < plan.motion_segments.length; i += 1) {
    const segment = plan.motion_segments[i];
    if (segment.from_timestamp >= segment.to_timestamp) return false;
    if (segment.from_keyframe !== i || segment.to_keyframe !== i + 1) return false;
    if (Math.abs(segment.duration_seconds - (segment.to_timestamp - segment.from_timestamp)) > 0.001) {
      return false;
    }
    if (i > 0) {
      const prev = plan.motion_segments[i - 1];
      if (segment.from_timestamp < prev.to_timestamp) return false;
    }
  }
  return true;
}

function validatePlan(plan: GonegiMotionPlan, projectRoot: string): GonegiMotionPlanValidationResult {
  const issues: GonegiMotionPlanValidationIssue[] = [];

  const keyframePlan = loadGonegiKeyframePlan(projectRoot, plan.source_keyframe_plan_id);
  if (!keyframePlan) {
    issues.push({
      code: 'SOURCE_KEYFRAME_PLAN_MISSING',
      message: `Gonegi keyframe plan ${plan.source_keyframe_plan_id} not found`,
      severity: 'error',
      gonegi_motion_plan_id: plan.gonegi_motion_plan_id,
    });
  }

  const expectedSegmentCount = keyframePlan
    ? deriveSegmentCount(keyframePlan.keyframe_count)
    : null;

  if (expectedSegmentCount !== null) {
    if (plan.segment_count !== expectedSegmentCount) {
      issues.push({
        code: 'SEGMENT_COUNT_INVALID',
        message: `segment_count must be ${expectedSegmentCount} for ${keyframePlan!.keyframe_count} keyframes`,
        severity: 'error',
        gonegi_motion_plan_id: plan.gonegi_motion_plan_id,
      });
    }
    if (plan.motion_segments.length !== expectedSegmentCount) {
      issues.push({
        code: 'SEGMENT_ARRAY_LENGTH_INVALID',
        message: `motion_segments must contain ${expectedSegmentCount} entries`,
        severity: 'error',
        gonegi_motion_plan_id: plan.gonegi_motion_plan_id,
      });
    }
  }

  if (!segmentTimestampsOrdered(plan)) {
    issues.push({
      code: 'TIMESTAMPS_NOT_ORDERED',
      message: 'motion segment timestamps must be monotonically ordered and match keyframe indices',
      severity: 'error',
      gonegi_motion_plan_id: plan.gonegi_motion_plan_id,
    });
  }

  if (keyframePlan) {
    const sourceIdentity = new Set(keyframePlan.identity_locks);
    for (const lock of plan.identity_locks) {
      if (!sourceIdentity.has(lock)) {
        issues.push({
          code: 'IDENTITY_LOCK_NOT_PRESERVED',
          message: `identity lock missing from source: ${lock}`,
          severity: 'error',
          gonegi_motion_plan_id: plan.gonegi_motion_plan_id,
        });
        break;
      }
    }

    if (!locksPreserved(keyframePlan.continuity_locks, plan.continuity_locks)) {
      issues.push({
        code: 'CONTINUITY_LOCKS_NOT_PRESERVED',
        message: 'continuity_locks must preserve all locks from source keyframe plan',
        severity: 'error',
        gonegi_motion_plan_id: plan.gonegi_motion_plan_id,
      });
    }

    if (!translationTracePreserved(keyframePlan.translation_trace, plan.translation_trace)) {
      issues.push({
        code: 'TRANSLATION_TRACE_NOT_PRESERVED',
        message: 'translation_trace must preserve source keyframe plan trace',
        severity: 'error',
        gonegi_motion_plan_id: plan.gonegi_motion_plan_id,
      });
    }

    if (!replacementTracePreserved(keyframePlan.replacement_trace, plan.replacement_trace)) {
      issues.push({
        code: 'REPLACEMENT_TRACE_NOT_PRESERVED',
        message: 'replacement_trace must preserve source keyframe plan trace',
        severity: 'error',
        gonegi_motion_plan_id: plan.gonegi_motion_plan_id,
      });
    }
  }

  if (plan.director_blend_ref !== BLEND_ID) {
    issues.push({
      code: 'DIRECTOR_BLEND_NOT_LINKED',
      message: `director_blend_ref must link to ${BLEND_ID}`,
      severity: 'error',
      gonegi_motion_plan_id: plan.gonegi_motion_plan_id,
    });
  }

  if (!plan.motion_defaults?.camera_motion_category_default) {
    issues.push({
      code: 'MOTION_DEFAULTS_MISSING',
      message: 'motion_defaults must be present from video state defaults',
      severity: 'error',
      gonegi_motion_plan_id: plan.gonegi_motion_plan_id,
    });
  }

  const flags = plan.execution_flags;
  if (
    !flags.design_only ||
    flags.gpu_execution ||
    flags.external_call_allowed ||
    flags.frame_extraction ||
    flags.ocr ||
    flags.generation
  ) {
    issues.push({
      code: 'EXECUTION_FLAGS_INVALID',
      message: 'execution_flags must remain design-only with no execution enabled',
      severity: 'error',
      gonegi_motion_plan_id: plan.gonegi_motion_plan_id,
    });
  }

  if (plan.production_status.production_registry) {
    issues.push({
      code: 'PRODUCTION_REGISTRY_LEAK',
      message: 'gonegi motion plans must not register in production motion registry',
      severity: 'error',
      gonegi_motion_plan_id: plan.gonegi_motion_plan_id,
    });
  }

  return {
    gonegi_motion_plan_id: plan.gonegi_motion_plan_id,
    source_keyframe_plan_id: plan.source_keyframe_plan_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

export function validateGonegiMotionPlans(projectRoot?: string): GonegiKeyframeToMotionReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: GonegiMotionPlanValidationIssue[] = [];
  const timestamp = new Date().toISOString();
  const planValidations: GonegiMotionPlanValidationResult[] = [];
  const loadedPlans: GonegiMotionPlan[] = [];

  const upstreamReportPath = path.join(root, KEYFRAME_COMPILER_REPORT_PATH);
  if (!fs.existsSync(upstreamReportPath)) {
    issues.push({
      code: 'UPSTREAM_REPORT_MISSING',
      message: `Missing upstream report: ${KEYFRAME_COMPILER_REPORT_PATH}`,
      severity: 'error',
    });
  } else {
    const upstream = JSON.parse(fs.readFileSync(upstreamReportPath, 'utf8')) as {
      final_verdict?: string;
    };
    if (upstream.final_verdict !== KEYFRAME_COMPILER_PASS_VERDICT) {
      issues.push({
        code: 'UPSTREAM_KEYFRAME_COMPILER_NOT_PASS',
        message: `Upstream keyframe compiler must pass: ${KEYFRAME_COMPILER_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  let registryStatus: 'PASS' | 'FAIL' = 'FAIL';
  const registryPath = path.join(root, GONEGI_MOTION_PLAN_REGISTRY_PATH);
  if (!fs.existsSync(registryPath)) {
    issues.push({
      code: 'REGISTRY_MISSING',
      message: `Missing registry: ${GONEGI_MOTION_PLAN_REGISTRY_PATH}`,
      severity: 'error',
    });
  } else {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as {
      gonegi_motion_plans?: Array<{ gonegi_motion_plan_id: string }>;
    };
    const registryIds = new Set(
      (registry.gonegi_motion_plans ?? []).map((e) => e.gonegi_motion_plan_id)
    );
    registryStatus =
      SEED_GONEGI_MOTION_PLAN_SPECS.every((s) => registryIds.has(s.gonegi_motion_plan_id)) &&
      registryIds.size === SEED_GONEGI_MOTION_PLAN_SPECS.length
        ? 'PASS'
        : 'FAIL';
    if (registryStatus === 'FAIL') {
      issues.push({
        code: 'REGISTRY_INCOMPLETE',
        message: 'Registry must list exactly 4 gonegi motion plans',
        severity: 'error',
      });
    }
  }

  if (!fs.existsSync(path.join(root, GONEGI_MOTION_PLAN_SCHEMA_PATH))) {
    issues.push({
      code: 'SCHEMA_MISSING',
      message: `Missing schema: ${GONEGI_MOTION_PLAN_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  for (const spec of SEED_GONEGI_MOTION_PLAN_SPECS) {
    const plan = loadGonegiMotionPlan(root, spec.gonegi_motion_plan_id);
    if (!plan) {
      issues.push({
        code: 'MISSING_MOTION_PLAN',
        message: `Missing motion plan ${spec.gonegi_motion_plan_id}`,
        severity: 'error',
        gonegi_motion_plan_id: spec.gonegi_motion_plan_id,
      });
      planValidations.push({
        gonegi_motion_plan_id: spec.gonegi_motion_plan_id,
        source_keyframe_plan_id: spec.source_keyframe_plan_id,
        status: 'FAIL',
        issues: [
          {
            code: 'MISSING_MOTION_PLAN',
            message: `Missing motion plan ${spec.gonegi_motion_plan_id}`,
            severity: 'error',
            gonegi_motion_plan_id: spec.gonegi_motion_plan_id,
          },
        ],
      });
      continue;
    }

    loadedPlans.push(plan);
    const validation = validatePlan(plan, root);
    planValidations.push(validation);
    issues.push(...validation.issues);
  }

  let identityLocks: 'PASS' | 'FAIL' = 'FAIL';
  let continuity: 'PASS' | 'FAIL' = 'FAIL';
  let segmentCounts: 'PASS' | 'FAIL' = 'FAIL';
  let timestamps: 'PASS' | 'FAIL' = 'FAIL';
  let translationTrace: 'PASS' | 'FAIL' = 'FAIL';
  let replacementTrace: 'PASS' | 'FAIL' = 'FAIL';

  if (loadedPlans.length === SEED_GONEGI_MOTION_PLAN_SPECS.length) {
    identityLocks = loadedPlans.every((plan) => {
      const keyframePlan = loadGonegiKeyframePlan(root, plan.source_keyframe_plan_id);
      if (!keyframePlan) return false;
      return keyframePlan.identity_locks.every((lock) => plan.identity_locks.includes(lock));
    })
      ? 'PASS'
      : 'FAIL';

    continuity = loadedPlans.every((plan) => {
      const keyframePlan = loadGonegiKeyframePlan(root, plan.source_keyframe_plan_id);
      return keyframePlan
        ? locksPreserved(keyframePlan.continuity_locks, plan.continuity_locks)
        : false;
    })
      ? 'PASS'
      : 'FAIL';

    segmentCounts = loadedPlans.every((plan) => {
      const keyframePlan = loadGonegiKeyframePlan(root, plan.source_keyframe_plan_id);
      if (!keyframePlan) return false;
      return (
        plan.segment_count === deriveSegmentCount(keyframePlan.keyframe_count) &&
        plan.motion_segments.length === plan.segment_count
      );
    })
      ? 'PASS'
      : 'FAIL';

    timestamps = loadedPlans.every((plan) => segmentTimestampsOrdered(plan)) ? 'PASS' : 'FAIL';

    translationTrace = loadedPlans.every((plan) => {
      const keyframePlan = loadGonegiKeyframePlan(root, plan.source_keyframe_plan_id);
      return keyframePlan
        ? translationTracePreserved(keyframePlan.translation_trace, plan.translation_trace)
        : false;
    })
      ? 'PASS'
      : 'FAIL';

    replacementTrace = loadedPlans.every((plan) => {
      const keyframePlan = loadGonegiKeyframePlan(root, plan.source_keyframe_plan_id);
      return keyframePlan
        ? replacementTracePreserved(keyframePlan.replacement_trace, plan.replacement_trace)
        : false;
    })
      ? 'PASS'
      : 'FAIL';
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const final_verdict =
    errors.length === 0 &&
    loadedPlans.length === SEED_GONEGI_MOTION_PLAN_SPECS.length &&
    registryStatus === 'PASS' &&
    identityLocks === 'PASS' &&
    continuity === 'PASS' &&
    segmentCounts === 'PASS' &&
    timestamps === 'PASS' &&
    translationTrace === 'PASS' &&
    replacementTrace === 'PASS'
      ? MOTION_COMPILER_PASS_VERDICT
      : MOTION_COMPILER_FAIL_VERDICT;

  return {
    report_id: 'gonegi-keyframe-to-motion-report-v1',
    phase: MOTION_COMPILER_PHASE,
    timestamp,
    motion_plans: loadedPlans.length,
    identity_locks: identityLocks,
    continuity: continuity,
    segment_counts: segmentCounts,
    timestamps: timestamps,
    translation_trace: translationTrace,
    replacement_trace: replacementTrace,
    registry: registryStatus,
    plan_validations: planValidations,
    design_only: true,
    gpu_execution: false,
    final_verdict,
    issues,
  };
}

function buildMarkdown(report: GonegiKeyframeToMotionReport): string {
  const lines = [
    '# Gonegi Keyframe to Motion Plan Summary',
    '',
    `**Phase:** ${MOTION_COMPILER_PHASE}`,
    `**Verdict:** ${report.final_verdict}`,
    `**Timestamp:** ${report.timestamp}`,
    '',
    '## Pass Metrics',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| motion_plans | ${report.motion_plans} |`,
    `| identity_locks | ${report.identity_locks} |`,
    `| continuity | ${report.continuity} |`,
    `| segment_counts | ${report.segment_counts} |`,
    `| timestamps | ${report.timestamps} |`,
    `| translation_trace | ${report.translation_trace} |`,
    `| replacement_trace | ${report.replacement_trace} |`,
    `| design_only | ${report.design_only} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    '',
    '## Segment Count Rules',
    '',
    '| Keyframes | Motion Segments |',
    '|-----------|-----------------|',
    '| 5 | 4 |',
    '| 6 | 5 |',
    '| 7 | 6 |',
    '',
    '## Motion Categories',
    '',
    '- **camera_motion:** static, pan, tilt, push_in, pull_out, orbit',
    '- **character_motion:** idle, walk, turn, look, gesture, sit, stand',
    '- **emotion_motion:** calm, wonder, hope, reunion, farewell',
    '- **environment_motion:** wind, water, cloud, foliage, ambient',
    '',
    '## Compiled Motion Plans',
    '',
    '| gonegi_motion_plan_id | source_keyframe_plan_id |',
    '|-----------------------|-------------------------|',
  ];

  for (const spec of SEED_GONEGI_MOTION_PLAN_SPECS) {
    lines.push(`| ${spec.gonegi_motion_plan_id} | ${spec.source_keyframe_plan_id} |`);
  }

  lines.push('', '## Pipeline Chain', '', '```');
  lines.push('gonegi keyframe → motion segments → gpu payload → future video runtime');
  lines.push('```', '');

  if (report.plan_validations.length > 0) {
    lines.push('## Plan Validations', '');
    for (const v of report.plan_validations) {
      lines.push(`- **${v.gonegi_motion_plan_id}** ← ${v.source_keyframe_plan_id}: ${v.status}`);
    }
    lines.push('');
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(
        `- [${issue.severity}] **${issue.code}**${issue.gonegi_motion_plan_id ? ` (${issue.gonegi_motion_plan_id})` : ''}: ${issue.message}`
      );
    }
    lines.push('');
  }

  lines.push('## Artifacts', '');
  lines.push(`- Schema: \`${GONEGI_MOTION_PLAN_SCHEMA_PATH}\``);
  lines.push(`- Registry: \`${GONEGI_MOTION_PLAN_REGISTRY_PATH}\``);
  lines.push(`- Plans: \`${GONEGI_MOTION_PLANS_DIR}/\``);
  lines.push(`- Report: \`${MOTION_COMPILER_REPORT_PATH}\``);
  lines.push('');

  return lines.join('\n');
}

export function writeGonegiMotionPlanReport(projectRoot?: string): GonegiKeyframeToMotionReport {
  const root = resolveProjectRoot(projectRoot);
  const report = validateGonegiMotionPlans(root);

  fs.writeFileSync(
    path.join(root, MOTION_COMPILER_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, MOTION_COMPILER_MD_PATH), buildMarkdown(report), 'utf8');

  return report;
}
