import fs from 'node:fs';
import path from 'node:path';
import {
  MOTION_COMPILER_PASS_VERDICT,
  MOTION_COMPILER_REPORT_PATH,
} from './gonegiMotionPlanValidator.js';
import {
  GPU_PAYLOAD_COMPILER_PHASE,
  GONEGI_GPU_PAYLOAD_REGISTRY_PATH,
  GONEGI_GPU_PAYLOAD_SCHEMA_PATH,
  GONEGI_GPU_PAYLOADS_DIR,
  SEED_GONEGI_GPU_PAYLOAD_SPECS,
  type GonegiGpuPayload,
  loadGonegiGpuPayload,
} from './gonegiMotionToGpuPayloadCompiler.js';
import { loadGonegiMotionPlan } from './gonegiKeyframeToMotionCompiler.js';
import { loadGonegiKeyframePlan } from './gonegiVideoStateToKeyframeCompiler.js';
import { loadGonegiVideoState } from './gonegiStateToVideoStateTranslator.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const GPU_PAYLOAD_COMPILER_PASS_VERDICT =
  'PASS_GONEGI_MOTION_TO_GPU_PAYLOAD_COMPILER_V2' as const;
export const GPU_PAYLOAD_COMPILER_FAIL_VERDICT =
  'FAIL_GONEGI_MOTION_TO_GPU_PAYLOAD_COMPILER_V2' as const;
export const GPU_PAYLOAD_COMPILER_REPORT_PATH =
  'reports/gonegi-motion-to-gpu-payload-report.json' as const;
export const GPU_PAYLOAD_COMPILER_MD_PATH = 'reports/GONEGI_MOTION_TO_GPU_PAYLOAD.md' as const;

const VALID_FPS = new Set([12, 24, 25, 30]);

export type GonegiGpuPayloadValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  gonegi_gpu_payload_id?: string;
};

export type GonegiGpuPayloadValidationResult = {
  gonegi_gpu_payload_id: string;
  source_motion_plan_id: string;
  status: 'PASS' | 'FAIL';
  issues: GonegiGpuPayloadValidationIssue[];
};

export type GonegiMotionToGpuPayloadReport = {
  report_id: string;
  phase: typeof GPU_PAYLOAD_COMPILER_PHASE;
  timestamp: string;
  payloads: number;
  motion_alignment: 'PASS' | 'FAIL';
  identity_locks: 'PASS' | 'FAIL';
  continuity: 'PASS' | 'FAIL';
  execution_safety: 'PASS' | 'FAIL';
  provider_activation: false;
  registry: 'PASS' | 'FAIL';
  payload_validations: GonegiGpuPayloadValidationResult[];
  design_only: true;
  gpu_execution: false;
  final_verdict: typeof GPU_PAYLOAD_COMPILER_PASS_VERDICT | typeof GPU_PAYLOAD_COMPILER_FAIL_VERDICT;
  issues: GonegiGpuPayloadValidationIssue[];
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
  source: GonegiGpuPayload['translation_trace'],
  target: GonegiGpuPayload['translation_trace']
): boolean {
  return (
    source.translation_id === target.translation_id &&
    source.source_world_type === target.source_world_type &&
    source.target_world_identity === target.target_world_identity &&
    source.applied_dimensions.every((dim) => target.applied_dimensions.includes(dim)) &&
    Boolean(target.gpu_payload_translation?.compiler_phase)
  );
}

function replacementTracePreserved(
  source: GonegiGpuPayload['replacement_trace'],
  target: GonegiGpuPayload['replacement_trace']
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

function motionSegmentsAligned(payload: GonegiGpuPayload): boolean {
  if (payload.keyframes.length < 2) return false;
  if (payload.motion_segments.length !== payload.keyframes.length - 1) return false;

  for (let i = 0; i < payload.motion_segments.length; i += 1) {
    const segment = payload.motion_segments[i];
    const fromKf = payload.keyframes[segment.from_keyframe];
    const toKf = payload.keyframes[segment.to_keyframe];
    if (!fromKf || !toKf) return false;
    if (segment.from_keyframe !== i || segment.to_keyframe !== i + 1) return false;
    if (segment.from_timestamp !== fromKf.timestamp || segment.to_timestamp !== toKf.timestamp) {
      return false;
    }
    if (Math.abs(segment.duration_seconds - (toKf.timestamp - fromKf.timestamp)) > 0.001) {
      return false;
    }
  }

  const lastKf = payload.keyframes[payload.keyframes.length - 1];
  return lastKf.timestamp === payload.duration_seconds;
}

function executionFlagsSafe(payload: GonegiGpuPayload): boolean {
  const flags = payload.execution_flags;
  return (
    flags.design_only === true &&
    flags.gpu_execution === false &&
    flags.external_call_allowed === false &&
    flags.preparation_only === true &&
    flags.frame_extraction === false &&
    flags.ocr === false &&
    flags.generation === false
  );
}

function validatePayload(
  payload: GonegiGpuPayload,
  projectRoot: string
): GonegiGpuPayloadValidationResult {
  const issues: GonegiGpuPayloadValidationIssue[] = [];

  const motionPlan = loadGonegiMotionPlan(projectRoot, payload.source_motion_plan_id);
  if (!motionPlan) {
    issues.push({
      code: 'SOURCE_MOTION_PLAN_MISSING',
      message: `Gonegi motion plan ${payload.source_motion_plan_id} not found`,
      severity: 'error',
      gonegi_gpu_payload_id: payload.gonegi_gpu_payload_id,
    });
  }

  const keyframePlan = loadGonegiKeyframePlan(projectRoot, payload.source_keyframe_plan_id);
  if (!keyframePlan) {
    issues.push({
      code: 'SOURCE_KEYFRAME_PLAN_MISSING',
      message: `Gonegi keyframe plan ${payload.source_keyframe_plan_id} not found`,
      severity: 'error',
      gonegi_gpu_payload_id: payload.gonegi_gpu_payload_id,
    });
  }

  const videoState = loadGonegiVideoState(projectRoot, payload.source_video_state_id);
  if (!videoState) {
    issues.push({
      code: 'SOURCE_VIDEO_STATE_MISSING',
      message: `Gonegi video state ${payload.source_video_state_id} not found`,
      severity: 'error',
      gonegi_gpu_payload_id: payload.gonegi_gpu_payload_id,
    });
  }

  if (motionPlan && keyframePlan && motionPlan.source_keyframe_plan_id !== keyframePlan.gonegi_keyframe_plan_id) {
    issues.push({
      code: 'SOURCE_CHAIN_MISMATCH',
      message: 'motion plan and keyframe plan source chain mismatch',
      severity: 'error',
      gonegi_gpu_payload_id: payload.gonegi_gpu_payload_id,
    });
  }

  if (keyframePlan && videoState && keyframePlan.source_gonegi_video_state_id !== videoState.gonegi_video_state_id) {
    issues.push({
      code: 'SOURCE_CHAIN_MISMATCH',
      message: 'keyframe plan and video state source chain mismatch',
      severity: 'error',
      gonegi_gpu_payload_id: payload.gonegi_gpu_payload_id,
    });
  }

  if (payload.duration_seconds <= 0 || payload.duration_seconds > 120) {
    issues.push({
      code: 'DURATION_INVALID',
      message: 'duration_seconds must be between 0 and 120',
      severity: 'error',
      gonegi_gpu_payload_id: payload.gonegi_gpu_payload_id,
    });
  }

  if (!VALID_FPS.has(payload.fps_target)) {
    issues.push({
      code: 'FPS_INVALID',
      message: `fps_target must be one of ${[...VALID_FPS].join(', ')}`,
      severity: 'error',
      gonegi_gpu_payload_id: payload.gonegi_gpu_payload_id,
    });
  }

  if (videoState) {
    if (payload.duration_seconds !== videoState.video_parameters.duration_seconds) {
      issues.push({
        code: 'DURATION_MISMATCH',
        message: 'duration_seconds must match source video state',
        severity: 'error',
        gonegi_gpu_payload_id: payload.gonegi_gpu_payload_id,
      });
    }
    if (payload.fps_target !== videoState.video_parameters.fps_target) {
      issues.push({
        code: 'FPS_MISMATCH',
        message: 'fps_target must match source video state',
        severity: 'error',
        gonegi_gpu_payload_id: payload.gonegi_gpu_payload_id,
      });
    }
  }

  if (!payload.keyframes || payload.keyframes.length < 5) {
    issues.push({
      code: 'KEYFRAMES_MISSING',
      message: 'keyframes must be present with at least 5 entries',
      severity: 'error',
      gonegi_gpu_payload_id: payload.gonegi_gpu_payload_id,
    });
  }

  if (!motionSegmentsAligned(payload)) {
    issues.push({
      code: 'MOTION_SEGMENTS_NOT_ALIGNED',
      message: 'motion_segments must align with keyframes (count = keyframes - 1)',
      severity: 'error',
      gonegi_gpu_payload_id: payload.gonegi_gpu_payload_id,
    });
  }

  if (motionPlan) {
    const sourceIdentity = new Set(motionPlan.identity_locks);
    for (const lock of payload.identity_locks) {
      if (!sourceIdentity.has(lock)) {
        issues.push({
          code: 'IDENTITY_LOCK_NOT_PRESERVED',
          message: `identity lock missing from source: ${lock}`,
          severity: 'error',
          gonegi_gpu_payload_id: payload.gonegi_gpu_payload_id,
        });
        break;
      }
    }

    if (!locksPreserved(motionPlan.continuity_locks, payload.continuity_locks)) {
      issues.push({
        code: 'CONTINUITY_LOCKS_NOT_PRESERVED',
        message: 'continuity_locks must preserve all locks from source motion plan',
        severity: 'error',
        gonegi_gpu_payload_id: payload.gonegi_gpu_payload_id,
      });
    }

    if (!translationTracePreserved(motionPlan.translation_trace, payload.translation_trace)) {
      issues.push({
        code: 'TRANSLATION_TRACE_NOT_PRESERVED',
        message: 'translation_trace must preserve source motion plan trace',
        severity: 'error',
        gonegi_gpu_payload_id: payload.gonegi_gpu_payload_id,
      });
    }

    if (!replacementTracePreserved(motionPlan.replacement_trace, payload.replacement_trace)) {
      issues.push({
        code: 'REPLACEMENT_TRACE_NOT_PRESERVED',
        message: 'replacement_trace must preserve source motion plan trace',
        severity: 'error',
        gonegi_gpu_payload_id: payload.gonegi_gpu_payload_id,
      });
    }
  }

  if (!executionFlagsSafe(payload)) {
    issues.push({
      code: 'EXECUTION_FLAGS_UNSAFE',
      message: 'execution_flags must be design-only with gpu_execution=false and preparation_only=true',
      severity: 'error',
      gonegi_gpu_payload_id: payload.gonegi_gpu_payload_id,
    });
  }

  if (payload.provider_hint.provider_activation !== false) {
    issues.push({
      code: 'PROVIDER_ACTIVATION_ENABLED',
      message: 'provider_hint.provider_activation must be false',
      severity: 'error',
      gonegi_gpu_payload_id: payload.gonegi_gpu_payload_id,
    });
  }

  if (payload.production_status.production_registry) {
    issues.push({
      code: 'PRODUCTION_REGISTRY_LEAK',
      message: 'gonegi gpu payloads must not register in production gpu payload registry',
      severity: 'error',
      gonegi_gpu_payload_id: payload.gonegi_gpu_payload_id,
    });
  }

  return {
    gonegi_gpu_payload_id: payload.gonegi_gpu_payload_id,
    source_motion_plan_id: payload.source_motion_plan_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

export function validateGonegiGpuPayloads(projectRoot?: string): GonegiMotionToGpuPayloadReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: GonegiGpuPayloadValidationIssue[] = [];
  const timestamp = new Date().toISOString();
  const payloadValidations: GonegiGpuPayloadValidationResult[] = [];
  const loadedPayloads: GonegiGpuPayload[] = [];

  const upstreamReportPath = path.join(root, MOTION_COMPILER_REPORT_PATH);
  if (!fs.existsSync(upstreamReportPath)) {
    issues.push({
      code: 'UPSTREAM_REPORT_MISSING',
      message: `Missing upstream report: ${MOTION_COMPILER_REPORT_PATH}`,
      severity: 'error',
    });
  } else {
    const upstream = JSON.parse(fs.readFileSync(upstreamReportPath, 'utf8')) as {
      final_verdict?: string;
    };
    if (upstream.final_verdict !== MOTION_COMPILER_PASS_VERDICT) {
      issues.push({
        code: 'UPSTREAM_MOTION_COMPILER_NOT_PASS',
        message: `Upstream motion compiler must pass: ${MOTION_COMPILER_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  let registryStatus: 'PASS' | 'FAIL' = 'FAIL';
  const registryPath = path.join(root, GONEGI_GPU_PAYLOAD_REGISTRY_PATH);
  if (!fs.existsSync(registryPath)) {
    issues.push({
      code: 'REGISTRY_MISSING',
      message: `Missing registry: ${GONEGI_GPU_PAYLOAD_REGISTRY_PATH}`,
      severity: 'error',
    });
  } else {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as {
      gonegi_gpu_payloads?: Array<{ gonegi_gpu_payload_id: string }>;
    };
    const registryIds = new Set(
      (registry.gonegi_gpu_payloads ?? []).map((e) => e.gonegi_gpu_payload_id)
    );
    registryStatus =
      SEED_GONEGI_GPU_PAYLOAD_SPECS.every((s) => registryIds.has(s.gonegi_gpu_payload_id)) &&
      registryIds.size === SEED_GONEGI_GPU_PAYLOAD_SPECS.length
        ? 'PASS'
        : 'FAIL';
    if (registryStatus === 'FAIL') {
      issues.push({
        code: 'REGISTRY_INCOMPLETE',
        message: 'Registry must list exactly 4 gonegi gpu payloads',
        severity: 'error',
      });
    }
  }

  if (!fs.existsSync(path.join(root, GONEGI_GPU_PAYLOAD_SCHEMA_PATH))) {
    issues.push({
      code: 'SCHEMA_MISSING',
      message: `Missing schema: ${GONEGI_GPU_PAYLOAD_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  for (const spec of SEED_GONEGI_GPU_PAYLOAD_SPECS) {
    const payload = loadGonegiGpuPayload(root, spec.gonegi_gpu_payload_id);
    if (!payload) {
      issues.push({
        code: 'MISSING_GPU_PAYLOAD',
        message: `Missing gpu payload ${spec.gonegi_gpu_payload_id}`,
        severity: 'error',
        gonegi_gpu_payload_id: spec.gonegi_gpu_payload_id,
      });
      payloadValidations.push({
        gonegi_gpu_payload_id: spec.gonegi_gpu_payload_id,
        source_motion_plan_id: spec.source_motion_plan_id,
        status: 'FAIL',
        issues: [
          {
            code: 'MISSING_GPU_PAYLOAD',
            message: `Missing gpu payload ${spec.gonegi_gpu_payload_id}`,
            severity: 'error',
            gonegi_gpu_payload_id: spec.gonegi_gpu_payload_id,
          },
        ],
      });
      continue;
    }

    loadedPayloads.push(payload);
    const validation = validatePayload(payload, root);
    payloadValidations.push(validation);
    issues.push(...validation.issues);
  }

  let motionAlignment: 'PASS' | 'FAIL' = 'FAIL';
  let identityLocks: 'PASS' | 'FAIL' = 'FAIL';
  let continuity: 'PASS' | 'FAIL' = 'FAIL';
  let executionSafety: 'PASS' | 'FAIL' = 'FAIL';

  if (loadedPayloads.length === SEED_GONEGI_GPU_PAYLOAD_SPECS.length) {
    motionAlignment = loadedPayloads.every((p) => motionSegmentsAligned(p)) ? 'PASS' : 'FAIL';

    identityLocks = loadedPayloads.every((p) => {
      const motionPlan = loadGonegiMotionPlan(root, p.source_motion_plan_id);
      if (!motionPlan) return false;
      return motionPlan.identity_locks.every((lock) => p.identity_locks.includes(lock));
    })
      ? 'PASS'
      : 'FAIL';

    continuity = loadedPayloads.every((p) => {
      const motionPlan = loadGonegiMotionPlan(root, p.source_motion_plan_id);
      return motionPlan ? locksPreserved(motionPlan.continuity_locks, p.continuity_locks) : false;
    })
      ? 'PASS'
      : 'FAIL';

    executionSafety = loadedPayloads.every(
      (p) => executionFlagsSafe(p) && p.provider_hint.provider_activation === false
    )
      ? 'PASS'
      : 'FAIL';
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const final_verdict =
    errors.length === 0 &&
    loadedPayloads.length === SEED_GONEGI_GPU_PAYLOAD_SPECS.length &&
    registryStatus === 'PASS' &&
    motionAlignment === 'PASS' &&
    identityLocks === 'PASS' &&
    continuity === 'PASS' &&
    executionSafety === 'PASS'
      ? GPU_PAYLOAD_COMPILER_PASS_VERDICT
      : GPU_PAYLOAD_COMPILER_FAIL_VERDICT;

  return {
    report_id: 'gonegi-motion-to-gpu-payload-report-v1',
    phase: GPU_PAYLOAD_COMPILER_PHASE,
    timestamp,
    payloads: loadedPayloads.length,
    motion_alignment: motionAlignment,
    identity_locks: identityLocks,
    continuity: continuity,
    execution_safety: executionSafety,
    provider_activation: false,
    registry: registryStatus,
    payload_validations: payloadValidations,
    design_only: true,
    gpu_execution: false,
    final_verdict,
    issues,
  };
}

function buildMarkdown(report: GonegiMotionToGpuPayloadReport): string {
  const lines = [
    '# Gonegi Motion to GPU Payload Summary',
    '',
    `**Phase:** ${GPU_PAYLOAD_COMPILER_PHASE}`,
    `**Verdict:** ${report.final_verdict}`,
    `**Timestamp:** ${report.timestamp}`,
    '',
    '## Pass Metrics',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| payloads | ${report.payloads} |`,
    `| motion_alignment | ${report.motion_alignment} |`,
    `| identity_locks | ${report.identity_locks} |`,
    `| continuity | ${report.continuity} |`,
    `| execution_safety | ${report.execution_safety} |`,
    `| provider_activation | ${report.provider_activation} |`,
    `| design_only | ${report.design_only} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    '',
    '## Execution Flags',
    '',
    '- `gpu_execution=false`',
    '- `external_call_allowed=false`',
    '- `preparation_only=true`',
    '- `provider_hint.provider_activation=false`',
    '',
    '## Compiled GPU Payloads',
    '',
    '| gonegi_gpu_payload_id | source_motion_plan_id |',
    '|-----------------------|-----------------------|',
  ];

  for (const spec of SEED_GONEGI_GPU_PAYLOAD_SPECS) {
    lines.push(`| ${spec.gonegi_gpu_payload_id} | ${spec.source_motion_plan_id} |`);
  }

  lines.push('', '## Pipeline Chain', '', '```');
  lines.push('gonegi motion plan → gpu payload draft → future provider/runtime → video generation');
  lines.push('```', '');

  if (report.payload_validations.length > 0) {
    lines.push('## Payload Validations', '');
    for (const v of report.payload_validations) {
      lines.push(`- **${v.gonegi_gpu_payload_id}** ← ${v.source_motion_plan_id}: ${v.status}`);
    }
    lines.push('');
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(
        `- [${issue.severity}] **${issue.code}**${issue.gonegi_gpu_payload_id ? ` (${issue.gonegi_gpu_payload_id})` : ''}: ${issue.message}`
      );
    }
    lines.push('');
  }

  lines.push('## Artifacts', '');
  lines.push(`- Schema: \`${GONEGI_GPU_PAYLOAD_SCHEMA_PATH}\``);
  lines.push(`- Registry: \`${GONEGI_GPU_PAYLOAD_REGISTRY_PATH}\``);
  lines.push(`- Payloads: \`${GONEGI_GPU_PAYLOADS_DIR}/\``);
  lines.push(`- Report: \`${GPU_PAYLOAD_COMPILER_REPORT_PATH}\``);
  lines.push('');

  return lines.join('\n');
}

export function writeGonegiGpuPayloadReport(projectRoot?: string): GonegiMotionToGpuPayloadReport {
  const root = resolveProjectRoot(projectRoot);
  const report = validateGonegiGpuPayloads(root);

  fs.writeFileSync(
    path.join(root, GPU_PAYLOAD_COMPILER_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, GPU_PAYLOAD_COMPILER_MD_PATH), buildMarkdown(report), 'utf8');

  return report;
}
