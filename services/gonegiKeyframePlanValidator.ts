import fs from 'node:fs';
import path from 'node:path';
import {
  TRANSLATOR_PASS_VERDICT,
  TRANSLATOR_REPORT_PATH,
} from './gonegiVideoStateValidator.js';
import {
  KEYFRAME_COMPILER_PHASE,
  GONEGI_KEYFRAME_PLAN_REGISTRY_PATH,
  GONEGI_KEYFRAME_PLAN_SCHEMA_PATH,
  GONEGI_KEYFRAME_PLANS_DIR,
  SEED_GONEGI_KEYFRAME_PLAN_SPECS,
  deriveKeyframePlanCount,
  type GonegiKeyframePlan,
  loadGonegiKeyframePlan,
} from './gonegiVideoStateToKeyframeCompiler.js';
import { loadGonegiVideoState } from './gonegiStateToVideoStateTranslator.js';
import { loadGonegiSceneState } from './sourceStateToGonegiStateCompiler.js';
import { VIDEO_STATE_DEFAULTS_ID } from './sourceVideoGrammarToVideoStateCompiler.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const KEYFRAME_COMPILER_PASS_VERDICT = 'PASS_VIDEO_STATE_TO_KEYFRAME_COMPILER_V2' as const;
export const KEYFRAME_COMPILER_FAIL_VERDICT = 'FAIL_VIDEO_STATE_TO_KEYFRAME_COMPILER_V2' as const;
export const KEYFRAME_COMPILER_REPORT_PATH =
  'reports/gonegi-video-state-to-keyframe-report.json' as const;
export const KEYFRAME_COMPILER_MD_PATH = 'reports/GONEGI_VIDEO_STATE_TO_KEYFRAME.md' as const;

const BLEND_ID = 'gonegi-master-director-blend-v1' as const;
const VALID_FPS = new Set([12, 24, 25, 30]);

export type GonegiKeyframePlanValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  gonegi_keyframe_plan_id?: string;
};

export type GonegiKeyframePlanValidationResult = {
  gonegi_keyframe_plan_id: string;
  source_gonegi_video_state_id: string;
  status: 'PASS' | 'FAIL';
  issues: GonegiKeyframePlanValidationIssue[];
};

export type GonegiVideoStateToKeyframeReport = {
  report_id: string;
  phase: typeof KEYFRAME_COMPILER_PHASE;
  timestamp: string;
  keyframe_plans: number;
  identity_locks: 'PASS' | 'FAIL';
  continuity: 'PASS' | 'FAIL';
  timestamps: 'PASS' | 'FAIL';
  translation_trace: 'PASS' | 'FAIL';
  replacement_trace: 'PASS' | 'FAIL';
  registry: 'PASS' | 'FAIL';
  plan_validations: GonegiKeyframePlanValidationResult[];
  design_only: true;
  gpu_execution: false;
  final_verdict: typeof KEYFRAME_COMPILER_PASS_VERDICT | typeof KEYFRAME_COMPILER_FAIL_VERDICT;
  issues: GonegiKeyframePlanValidationIssue[];
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
  source: GonegiKeyframePlan['translation_trace'],
  target: GonegiKeyframePlan['translation_trace']
): boolean {
  return (
    source.translation_id === target.translation_id &&
    source.source_world_type === target.source_world_type &&
    source.target_world_identity === target.target_world_identity &&
    source.applied_dimensions.every((dim) => target.applied_dimensions.includes(dim)) &&
    Boolean(target.keyframe_plan_translation?.compiler_phase)
  );
}

function replacementTracePreserved(
  source: GonegiKeyframePlan['replacement_trace'],
  target: GonegiKeyframePlan['replacement_trace']
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

function timestampsOrdered(plan: GonegiKeyframePlan): boolean {
  for (let i = 1; i < plan.keyframes.length; i += 1) {
    if (plan.keyframes[i].timestamp < plan.keyframes[i - 1].timestamp) {
      return false;
    }
  }
  const last = plan.keyframes[plan.keyframes.length - 1];
  return last.timestamp === plan.duration_seconds;
}

function validatePlan(plan: GonegiKeyframePlan, projectRoot: string): GonegiKeyframePlanValidationResult {
  const issues: GonegiKeyframePlanValidationIssue[] = [];

  const videoState = loadGonegiVideoState(projectRoot, plan.source_gonegi_video_state_id);
  if (!videoState) {
    issues.push({
      code: 'SOURCE_VIDEO_STATE_MISSING',
      message: `Gonegi video state ${plan.source_gonegi_video_state_id} not found`,
      severity: 'error',
      gonegi_keyframe_plan_id: plan.gonegi_keyframe_plan_id,
    });
  }

  if (plan.duration_seconds <= 0 || plan.duration_seconds > 120) {
    issues.push({
      code: 'DURATION_INVALID',
      message: 'duration_seconds must be between 0 and 120',
      severity: 'error',
      gonegi_keyframe_plan_id: plan.gonegi_keyframe_plan_id,
    });
  }

  if (!VALID_FPS.has(plan.fps_target)) {
    issues.push({
      code: 'FPS_INVALID',
      message: `fps_target must be one of ${[...VALID_FPS].join(', ')}`,
      severity: 'error',
      gonegi_keyframe_plan_id: plan.gonegi_keyframe_plan_id,
    });
  }

  let expectedCount: number | null = null;
  try {
    expectedCount = deriveKeyframePlanCount(plan.duration_seconds);
  } catch {
    issues.push({
      code: 'DURATION_UNSUPPORTED',
      message: `Unsupported duration for keyframe count rules: ${plan.duration_seconds}s`,
      severity: 'error',
      gonegi_keyframe_plan_id: plan.gonegi_keyframe_plan_id,
    });
  }

  if (expectedCount !== null) {
    if (plan.keyframe_count !== expectedCount) {
      issues.push({
        code: 'KEYFRAME_COUNT_INVALID',
        message: `keyframe_count must be ${expectedCount} for ${plan.duration_seconds}s duration`,
        severity: 'error',
        gonegi_keyframe_plan_id: plan.gonegi_keyframe_plan_id,
      });
    }
    if (plan.keyframes.length !== expectedCount) {
      issues.push({
        code: 'KEYFRAME_ARRAY_LENGTH_INVALID',
        message: `keyframes array must contain ${expectedCount} entries`,
        severity: 'error',
        gonegi_keyframe_plan_id: plan.gonegi_keyframe_plan_id,
      });
    }
  }

  if (!timestampsOrdered(plan)) {
    issues.push({
      code: 'TIMESTAMPS_NOT_ORDERED',
      message: 'keyframes must have monotonically ordered timestamps ending at duration_seconds',
      severity: 'error',
      gonegi_keyframe_plan_id: plan.gonegi_keyframe_plan_id,
    });
  }

  if (videoState) {
    const sourceIdentity = new Set(videoState.continuity_locks.identity_locks);
    for (const lock of plan.identity_locks) {
      if (!sourceIdentity.has(lock)) {
        issues.push({
          code: 'IDENTITY_LOCK_NOT_PRESERVED',
          message: `identity lock missing from source: ${lock}`,
          severity: 'error',
          gonegi_keyframe_plan_id: plan.gonegi_keyframe_plan_id,
        });
        break;
      }
    }

    if (!locksPreserved(videoState.continuity_locks, plan.continuity_locks)) {
      issues.push({
        code: 'CONTINUITY_LOCKS_NOT_PRESERVED',
        message: 'continuity_locks must preserve all locks from source video state',
        severity: 'error',
        gonegi_keyframe_plan_id: plan.gonegi_keyframe_plan_id,
      });
    }

    if (!translationTracePreserved(videoState.translation_trace, plan.translation_trace)) {
      issues.push({
        code: 'TRANSLATION_TRACE_NOT_PRESERVED',
        message: 'translation_trace must preserve source video state trace',
        severity: 'error',
        gonegi_keyframe_plan_id: plan.gonegi_keyframe_plan_id,
      });
    }

    const gonegiSceneState = loadGonegiSceneState(projectRoot, videoState.gonegi_state_id);
    if (!gonegiSceneState) {
      issues.push({
        code: 'GONEGI_SCENE_STATE_MISSING',
        message: `Gonegi scene state ${videoState.gonegi_state_id} not found for replacement trace`,
        severity: 'error',
        gonegi_keyframe_plan_id: plan.gonegi_keyframe_plan_id,
      });
    } else if (
      !replacementTracePreserved(gonegiSceneState.replacement_trace, plan.replacement_trace)
    ) {
      issues.push({
        code: 'REPLACEMENT_TRACE_NOT_PRESERVED',
        message: 'replacement_trace must preserve gonegi scene state replacement trace',
        severity: 'error',
        gonegi_keyframe_plan_id: plan.gonegi_keyframe_plan_id,
      });
    }
  }

  if (plan.director_blend_ref !== BLEND_ID) {
    issues.push({
      code: 'DIRECTOR_BLEND_NOT_LINKED',
      message: `director_blend_ref must link to ${BLEND_ID}`,
      severity: 'error',
      gonegi_keyframe_plan_id: plan.gonegi_keyframe_plan_id,
    });
  }

  if (plan.video_defaults_ref !== VIDEO_STATE_DEFAULTS_ID) {
    issues.push({
      code: 'VIDEO_DEFAULTS_NOT_LINKED',
      message: `video_defaults_ref must link to ${VIDEO_STATE_DEFAULTS_ID}`,
      severity: 'error',
      gonegi_keyframe_plan_id: plan.gonegi_keyframe_plan_id,
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
      gonegi_keyframe_plan_id: plan.gonegi_keyframe_plan_id,
    });
  }

  if (plan.production_status.production_registry) {
    issues.push({
      code: 'PRODUCTION_REGISTRY_LEAK',
      message: 'gonegi keyframe plans must not register in production keyframe registry',
      severity: 'error',
      gonegi_keyframe_plan_id: plan.gonegi_keyframe_plan_id,
    });
  }

  return {
    gonegi_keyframe_plan_id: plan.gonegi_keyframe_plan_id,
    source_gonegi_video_state_id: plan.source_gonegi_video_state_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

export function validateGonegiKeyframePlans(projectRoot?: string): GonegiVideoStateToKeyframeReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: GonegiKeyframePlanValidationIssue[] = [];
  const timestamp = new Date().toISOString();
  const planValidations: GonegiKeyframePlanValidationResult[] = [];
  const loadedPlans: GonegiKeyframePlan[] = [];

  const upstreamReportPath = path.join(root, TRANSLATOR_REPORT_PATH);
  if (!fs.existsSync(upstreamReportPath)) {
    issues.push({
      code: 'UPSTREAM_REPORT_MISSING',
      message: `Missing upstream report: ${TRANSLATOR_REPORT_PATH}`,
      severity: 'error',
    });
  } else {
    const upstream = JSON.parse(fs.readFileSync(upstreamReportPath, 'utf8')) as {
      final_verdict?: string;
    };
    if (upstream.final_verdict !== TRANSLATOR_PASS_VERDICT) {
      issues.push({
        code: 'UPSTREAM_TRANSLATOR_NOT_PASS',
        message: `Upstream translator must pass: ${TRANSLATOR_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  let registryStatus: 'PASS' | 'FAIL' = 'FAIL';
  const registryPath = path.join(root, GONEGI_KEYFRAME_PLAN_REGISTRY_PATH);
  if (!fs.existsSync(registryPath)) {
    issues.push({
      code: 'REGISTRY_MISSING',
      message: `Missing registry: ${GONEGI_KEYFRAME_PLAN_REGISTRY_PATH}`,
      severity: 'error',
    });
  } else {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as {
      gonegi_keyframe_plans?: Array<{ gonegi_keyframe_plan_id: string }>;
    };
    const registryIds = new Set(
      (registry.gonegi_keyframe_plans ?? []).map((e) => e.gonegi_keyframe_plan_id)
    );
    registryStatus =
      SEED_GONEGI_KEYFRAME_PLAN_SPECS.every((s) => registryIds.has(s.gonegi_keyframe_plan_id)) &&
      registryIds.size === SEED_GONEGI_KEYFRAME_PLAN_SPECS.length
        ? 'PASS'
        : 'FAIL';
    if (registryStatus === 'FAIL') {
      issues.push({
        code: 'REGISTRY_INCOMPLETE',
        message: 'Registry must list exactly 4 gonegi keyframe plans',
        severity: 'error',
      });
    }
  }

  if (!fs.existsSync(path.join(root, GONEGI_KEYFRAME_PLAN_SCHEMA_PATH))) {
    issues.push({
      code: 'SCHEMA_MISSING',
      message: `Missing schema: ${GONEGI_KEYFRAME_PLAN_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  for (const spec of SEED_GONEGI_KEYFRAME_PLAN_SPECS) {
    const plan = loadGonegiKeyframePlan(root, spec.gonegi_keyframe_plan_id);
    if (!plan) {
      issues.push({
        code: 'MISSING_KEYFRAME_PLAN',
        message: `Missing keyframe plan ${spec.gonegi_keyframe_plan_id}`,
        severity: 'error',
        gonegi_keyframe_plan_id: spec.gonegi_keyframe_plan_id,
      });
      planValidations.push({
        gonegi_keyframe_plan_id: spec.gonegi_keyframe_plan_id,
        source_gonegi_video_state_id: spec.source_gonegi_video_state_id,
        status: 'FAIL',
        issues: [
          {
            code: 'MISSING_KEYFRAME_PLAN',
            message: `Missing keyframe plan ${spec.gonegi_keyframe_plan_id}`,
            severity: 'error',
            gonegi_keyframe_plan_id: spec.gonegi_keyframe_plan_id,
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
  let timestamps: 'PASS' | 'FAIL' = 'FAIL';
  let translationTrace: 'PASS' | 'FAIL' = 'FAIL';
  let replacementTrace: 'PASS' | 'FAIL' = 'FAIL';

  if (loadedPlans.length === SEED_GONEGI_KEYFRAME_PLAN_SPECS.length) {
    identityLocks = loadedPlans.every((plan) => {
      const videoState = loadGonegiVideoState(root, plan.source_gonegi_video_state_id);
      if (!videoState) return false;
      return videoState.continuity_locks.identity_locks.every((lock) =>
        plan.identity_locks.includes(lock)
      );
    })
      ? 'PASS'
      : 'FAIL';

    continuity = loadedPlans.every((plan) => {
      const videoState = loadGonegiVideoState(root, plan.source_gonegi_video_state_id);
      return videoState ? locksPreserved(videoState.continuity_locks, plan.continuity_locks) : false;
    })
      ? 'PASS'
      : 'FAIL';

    timestamps = loadedPlans.every((plan) => timestampsOrdered(plan)) ? 'PASS' : 'FAIL';

    translationTrace = loadedPlans.every((plan) => {
      const videoState = loadGonegiVideoState(root, plan.source_gonegi_video_state_id);
      return videoState
        ? translationTracePreserved(videoState.translation_trace, plan.translation_trace)
        : false;
    })
      ? 'PASS'
      : 'FAIL';

    replacementTrace = loadedPlans.every((plan) => {
      const videoState = loadGonegiVideoState(root, plan.source_gonegi_video_state_id);
      if (!videoState) return false;
      const sceneState = loadGonegiSceneState(root, videoState.gonegi_state_id);
      return sceneState
        ? replacementTracePreserved(sceneState.replacement_trace, plan.replacement_trace)
        : false;
    })
      ? 'PASS'
      : 'FAIL';
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const final_verdict =
    errors.length === 0 &&
    loadedPlans.length === SEED_GONEGI_KEYFRAME_PLAN_SPECS.length &&
    registryStatus === 'PASS' &&
    identityLocks === 'PASS' &&
    continuity === 'PASS' &&
    timestamps === 'PASS' &&
    translationTrace === 'PASS' &&
    replacementTrace === 'PASS'
      ? KEYFRAME_COMPILER_PASS_VERDICT
      : KEYFRAME_COMPILER_FAIL_VERDICT;

  return {
    report_id: 'gonegi-video-state-to-keyframe-report-v1',
    phase: KEYFRAME_COMPILER_PHASE,
    timestamp,
    keyframe_plans: loadedPlans.length,
    identity_locks: identityLocks,
    continuity: continuity,
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

function buildMarkdown(report: GonegiVideoStateToKeyframeReport): string {
  const lines = [
    '# Gonegi Video State to Keyframe Plan Summary',
    '',
    `**Phase:** ${KEYFRAME_COMPILER_PHASE}`,
    `**Verdict:** ${report.final_verdict}`,
    `**Timestamp:** ${report.timestamp}`,
    '',
    '## Pass Metrics',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| keyframe_plans | ${report.keyframe_plans} |`,
    `| identity_locks | ${report.identity_locks} |`,
    `| continuity | ${report.continuity} |`,
    `| timestamps | ${report.timestamps} |`,
    `| translation_trace | ${report.translation_trace} |`,
    `| replacement_trace | ${report.replacement_trace} |`,
    `| design_only | ${report.design_only} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    '',
    '## Keyframe Count Rules',
    '',
    '| Duration | Keyframes | Roles |',
    '|----------|-----------|-------|',
    '| 24s | 5 | start → early_transition → midpoint → late_transition → end |',
    '| 25–26s | 6 | start → early_transition ×2 → midpoint → late_transition → end |',
    '| 33s | 7 | start → early_transition ×2 → midpoint → late_transition ×2 → end |',
    '',
    '## Compiled Keyframe Plans',
    '',
    '| gonegi_keyframe_plan_id | source_gonegi_video_state_id |',
    '|-------------------------|------------------------------|',
  ];

  for (const spec of SEED_GONEGI_KEYFRAME_PLAN_SPECS) {
    lines.push(`| ${spec.gonegi_keyframe_plan_id} | ${spec.source_gonegi_video_state_id} |`);
  }

  lines.push('', '## Pipeline Chain', '', '```');
  lines.push('gonegi video state → keyframe plan → motion plan → gpu payload');
  lines.push('```', '');

  if (report.plan_validations.length > 0) {
    lines.push('## Plan Validations', '');
    for (const v of report.plan_validations) {
      lines.push(
        `- **${v.gonegi_keyframe_plan_id}** ← ${v.source_gonegi_video_state_id}: ${v.status}`
      );
    }
    lines.push('');
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(
        `- [${issue.severity}] **${issue.code}**${issue.gonegi_keyframe_plan_id ? ` (${issue.gonegi_keyframe_plan_id})` : ''}: ${issue.message}`
      );
    }
    lines.push('');
  }

  lines.push('## Artifacts', '');
  lines.push(`- Schema: \`${GONEGI_KEYFRAME_PLAN_SCHEMA_PATH}\``);
  lines.push(`- Registry: \`${GONEGI_KEYFRAME_PLAN_REGISTRY_PATH}\``);
  lines.push(`- Plans: \`${GONEGI_KEYFRAME_PLANS_DIR}/\``);
  lines.push(`- Report: \`${KEYFRAME_COMPILER_REPORT_PATH}\``);
  lines.push('');

  return lines.join('\n');
}

export function writeGonegiKeyframePlanReport(
  projectRoot?: string
): GonegiVideoStateToKeyframeReport {
  const root = resolveProjectRoot(projectRoot);
  const report = validateGonegiKeyframePlans(root);

  fs.writeFileSync(
    path.join(root, KEYFRAME_COMPILER_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, KEYFRAME_COMPILER_MD_PATH), buildMarkdown(report), 'utf8');

  return report;
}
