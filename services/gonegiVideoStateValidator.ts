import fs from 'node:fs';
import path from 'node:path';
import {
  GONEGI_COMPILER_PASS_VERDICT,
  GONEGI_COMPILER_REPORT_PATH,
} from './gonegiSceneStateValidator.js';
import {
  TRANSLATOR_PHASE,
  GONEGI_VIDEO_STATE_REGISTRY_PATH,
  GONEGI_VIDEO_STATE_SCHEMA_PATH,
  GONEGI_VIDEO_STATES_DIR,
  SEED_GONEGI_VIDEO_STATE_SPECS,
  type GonegiVideoState,
  loadGonegiVideoState,
} from './gonegiStateToVideoStateTranslator.js';
import { loadGonegiSceneState } from './sourceStateToGonegiStateCompiler.js';
import { VIDEO_STATE_DEFAULTS_ID } from './sourceVideoGrammarToVideoStateCompiler.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const TRANSLATOR_PASS_VERDICT = 'PASS_GONEGI_STATE_TO_VIDEO_STATE_TRANSLATOR_V1' as const;
export const TRANSLATOR_FAIL_VERDICT = 'FAIL_GONEGI_STATE_TO_VIDEO_STATE_TRANSLATOR_V1' as const;
export const TRANSLATOR_REPORT_PATH = 'reports/gonegi-state-to-video-state-report.json' as const;
export const TRANSLATOR_MD_PATH = 'reports/GONEGI_STATE_TO_VIDEO_STATE.md' as const;

const BLEND_ID = 'gonegi-master-director-blend-v1' as const;

const SCENE_STATE_LAYERS = [
  'identity_state',
  'character_state',
  'emotion_state',
  'relationship_state',
  'camera_state',
  'composition_state',
  'location_state',
  'lighting_state',
  'environment_state',
] as const;

const VIDEO_PARAMETER_FIELDS = [
  'duration_seconds',
  'fps_target',
  'keyframe_count',
  'camera_motion',
  'character_motion',
  'emotion_motion',
  'environment_motion',
  'visual_style_tokens',
  'lighting_mood',
  'blocking_geometry',
  'family_provenance',
  'render_intent',
] as const;

export type GonegiVideoStateValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  gonegi_video_state_id?: string;
};

export type GonegiVideoStateValidationResult = {
  gonegi_video_state_id: string;
  gonegi_state_id: string;
  status: 'PASS' | 'FAIL';
  issues: GonegiVideoStateValidationIssue[];
};

export type GonegiStateToVideoStateReport = {
  report_id: string;
  phase: typeof TRANSLATOR_PHASE;
  timestamp: string;
  video_states: number;
  gonegi_states: 'PASS' | 'FAIL';
  director_blend: 'PASS' | 'FAIL';
  video_defaults: 'PASS' | 'FAIL';
  identity_priority: 'PASS' | 'FAIL';
  continuity: 'PASS' | 'FAIL';
  registry: 'PASS' | 'FAIL';
  state_validations: GonegiVideoStateValidationResult[];
  design_only: true;
  gpu_execution: false;
  final_verdict: typeof TRANSLATOR_PASS_VERDICT | typeof TRANSLATOR_FAIL_VERDICT;
  issues: GonegiVideoStateValidationIssue[];
};

function locksPreserved(
  source: { identity_locks: string[]; location_locks: string[]; composition_locks?: string[] },
  target: { identity_locks: string[]; location_locks: string[]; composition_locks?: string[] }
): boolean {
  const sourceIdentity = new Set(source.identity_locks);
  const targetIdentity = new Set(target.identity_locks);
  for (const lock of sourceIdentity) {
    if (!targetIdentity.has(lock)) return false;
  }

  const sourceLocation = new Set(source.location_locks);
  const targetLocation = new Set(target.location_locks);
  for (const lock of sourceLocation) {
    if (!targetLocation.has(lock)) return false;
  }

  const sourceComposition = source.composition_locks ?? [];
  const targetComposition = target.composition_locks ?? [];
  for (const lock of sourceComposition) {
    if (!targetComposition.includes(lock)) return false;
  }

  return true;
}

function translationTracePreserved(
  source: GonegiVideoState['translation_trace'],
  target: GonegiVideoState['translation_trace']
): boolean {
  return (
    source.translation_id === target.translation_id &&
    source.source_world_type === target.source_world_type &&
    source.target_world_identity === target.target_world_identity &&
    source.applied_dimensions.length === target.applied_dimensions.length &&
    source.applied_dimensions.every((dim) => target.applied_dimensions.includes(dim)) &&
    Boolean(target.video_state_translation?.translator_phase)
  );
}

function validateState(
  state: GonegiVideoState,
  projectRoot: string
): GonegiVideoStateValidationResult {
  const issues: GonegiVideoStateValidationIssue[] = [];

  const gonegiState = loadGonegiSceneState(projectRoot, state.gonegi_state_id);
  if (!gonegiState) {
    issues.push({
      code: 'GONEGI_STATE_MISSING',
      message: `Gonegi scene state ${state.gonegi_state_id} not found`,
      severity: 'error',
      gonegi_state_id: state.gonegi_state_id,
      gonegi_video_state_id: state.gonegi_video_state_id,
    } as GonegiVideoStateValidationIssue);
  }

  for (const layer of SCENE_STATE_LAYERS) {
    const value = state[layer];
    if (!value || typeof value !== 'object' || Object.keys(value).length === 0) {
      issues.push({
        code: 'MISSING_STATE_LAYER',
        message: `Missing or empty state layer: ${layer}`,
        severity: 'error',
        field: layer,
        gonegi_video_state_id: state.gonegi_video_state_id,
      });
    }
  }

  if (state.director_blend_ref !== BLEND_ID) {
    issues.push({
      code: 'DIRECTOR_BLEND_NOT_LINKED',
      message: `director_blend_ref must link to ${BLEND_ID}`,
      severity: 'error',
      gonegi_video_state_id: state.gonegi_video_state_id,
    });
  }

  if (state.video_defaults_ref !== VIDEO_STATE_DEFAULTS_ID) {
    issues.push({
      code: 'VIDEO_DEFAULTS_NOT_LINKED',
      message: `video_defaults_ref must link to ${VIDEO_STATE_DEFAULTS_ID}`,
      severity: 'error',
      gonegi_video_state_id: state.gonegi_video_state_id,
    });
  }

  if (state.identity_state.identity_priority_rank !== 1) {
    issues.push({
      code: 'IDENTITY_PRIORITY_NOT_FIRST',
      message: 'identity_state.identity_priority_rank must be 1',
      severity: 'error',
      gonegi_video_state_id: state.gonegi_video_state_id,
    });
  }

  if (!state.video_parameters) {
    issues.push({
      code: 'VIDEO_PARAMETERS_MISSING',
      message: 'video_parameters must be present',
      severity: 'error',
      gonegi_video_state_id: state.gonegi_video_state_id,
    });
  } else {
    for (const field of VIDEO_PARAMETER_FIELDS) {
      const value = state.video_parameters[field as keyof typeof state.video_parameters];
      if (value === undefined || value === null) {
        issues.push({
          code: 'VIDEO_PARAMETER_FIELD_MISSING',
          message: `video_parameters.${field} is required`,
          severity: 'error',
          field: `video_parameters.${field}`,
          gonegi_video_state_id: state.gonegi_video_state_id,
        });
      }
    }

    if (
      state.video_parameters.character_motion.length <
      state.character_state.active_character_ids.length
    ) {
      issues.push({
        code: 'CHARACTER_MOTION_INCOMPLETE',
        message: 'character_motion must cover all active characters',
        severity: 'error',
        gonegi_video_state_id: state.gonegi_video_state_id,
      });
    }

    if (state.video_parameters.render_intent.gpu_execution !== false) {
      issues.push({
        code: 'GPU_EXECUTION_ENABLED',
        message: 'video_parameters.render_intent.gpu_execution must be false',
        severity: 'error',
        gonegi_video_state_id: state.gonegi_video_state_id,
      });
    }
  }

  if (gonegiState) {
    if (!locksPreserved(gonegiState.continuity_locks, state.continuity_locks)) {
      issues.push({
        code: 'CONTINUITY_LOCKS_NOT_PRESERVED',
        message: 'continuity_locks must preserve all locks from gonegi scene state',
        severity: 'error',
        gonegi_video_state_id: state.gonegi_video_state_id,
      });
    }

    if (!translationTracePreserved(gonegiState.translation_trace, state.translation_trace)) {
      issues.push({
        code: 'TRANSLATION_TRACE_NOT_PRESERVED',
        message: 'translation_trace must preserve gonegi scene state trace',
        severity: 'error',
        gonegi_video_state_id: state.gonegi_video_state_id,
      });
    }
  }

  const flags = state.execution_flags;
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
      gonegi_video_state_id: state.gonegi_video_state_id,
    });
  }

  if (state.production_status.production_registry) {
    issues.push({
      code: 'PRODUCTION_REGISTRY_LEAK',
      message: 'gonegi video states must not register in production video registry',
      severity: 'error',
      gonegi_video_state_id: state.gonegi_video_state_id,
    });
  }

  return {
    gonegi_video_state_id: state.gonegi_video_state_id,
    gonegi_state_id: state.gonegi_state_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

export function validateGonegiVideoStates(projectRoot?: string): GonegiStateToVideoStateReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: GonegiVideoStateValidationIssue[] = [];
  const timestamp = new Date().toISOString();
  const stateValidations: GonegiVideoStateValidationResult[] = [];
  const loadedStates: GonegiVideoState[] = [];

  const upstreamReportPath = path.join(root, GONEGI_COMPILER_REPORT_PATH);
  if (!fs.existsSync(upstreamReportPath)) {
    issues.push({
      code: 'UPSTREAM_REPORT_MISSING',
      message: `Missing upstream report: ${GONEGI_COMPILER_REPORT_PATH}`,
      severity: 'error',
    });
  } else {
    const upstream = JSON.parse(fs.readFileSync(upstreamReportPath, 'utf8')) as {
      final_verdict?: string;
    };
    if (upstream.final_verdict !== GONEGI_COMPILER_PASS_VERDICT) {
      issues.push({
        code: 'UPSTREAM_GONEGI_COMPILER_NOT_PASS',
        message: `Upstream gonegi compiler must pass: ${GONEGI_COMPILER_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  let registryStatus: 'PASS' | 'FAIL' = 'FAIL';
  const registryPath = path.join(root, GONEGI_VIDEO_STATE_REGISTRY_PATH);
  if (!fs.existsSync(registryPath)) {
    issues.push({
      code: 'REGISTRY_MISSING',
      message: `Missing registry: ${GONEGI_VIDEO_STATE_REGISTRY_PATH}`,
      severity: 'error',
    });
  } else {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as {
      gonegi_video_states?: Array<{ gonegi_video_state_id: string }>;
    };
    const registryIds = new Set(
      (registry.gonegi_video_states ?? []).map((e) => e.gonegi_video_state_id)
    );
    registryStatus =
      SEED_GONEGI_VIDEO_STATE_SPECS.every((s) => registryIds.has(s.gonegi_video_state_id)) &&
      registryIds.size === SEED_GONEGI_VIDEO_STATE_SPECS.length
        ? 'PASS'
        : 'FAIL';
    if (registryStatus === 'FAIL') {
      issues.push({
        code: 'REGISTRY_INCOMPLETE',
        message: 'Registry must list exactly 4 gonegi video states',
        severity: 'error',
      });
    }
  }

  if (!fs.existsSync(path.join(root, GONEGI_VIDEO_STATE_SCHEMA_PATH))) {
    issues.push({
      code: 'SCHEMA_MISSING',
      message: `Missing schema: ${GONEGI_VIDEO_STATE_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  for (const spec of SEED_GONEGI_VIDEO_STATE_SPECS) {
    const state = loadGonegiVideoState(root, spec.gonegi_video_state_id);
    if (!state) {
      issues.push({
        code: 'MISSING_GONEGI_VIDEO_STATE',
        message: `Missing gonegi video state ${spec.gonegi_video_state_id}`,
        severity: 'error',
        gonegi_video_state_id: spec.gonegi_video_state_id,
      });
      stateValidations.push({
        gonegi_video_state_id: spec.gonegi_video_state_id,
        gonegi_state_id: spec.gonegi_state_id,
        status: 'FAIL',
        issues: [
          {
            code: 'MISSING_GONEGI_VIDEO_STATE',
            message: `Missing gonegi video state ${spec.gonegi_video_state_id}`,
            severity: 'error',
            gonegi_video_state_id: spec.gonegi_video_state_id,
          },
        ],
      });
      continue;
    }

    loadedStates.push(state);
    const validation = validateState(state, root);
    stateValidations.push(validation);
    issues.push(...validation.issues);
  }

  let gonegiStates: 'PASS' | 'FAIL' = 'FAIL';
  let directorBlend: 'PASS' | 'FAIL' = 'FAIL';
  let videoDefaults: 'PASS' | 'FAIL' = 'FAIL';
  let identityPriority: 'PASS' | 'FAIL' = 'FAIL';
  let continuity: 'PASS' | 'FAIL' = 'FAIL';

  if (loadedStates.length === SEED_GONEGI_VIDEO_STATE_SPECS.length) {
    gonegiStates = loadedStates.every((s) => loadGonegiSceneState(root, s.gonegi_state_id))
      ? 'PASS'
      : 'FAIL';

    directorBlend = loadedStates.every((s) => s.director_blend_ref === BLEND_ID) ? 'PASS' : 'FAIL';

    videoDefaults = loadedStates.every((s) => s.video_defaults_ref === VIDEO_STATE_DEFAULTS_ID)
      ? 'PASS'
      : 'FAIL';

    identityPriority = loadedStates.every((s) => s.identity_state.identity_priority_rank === 1)
      ? 'PASS'
      : 'FAIL';

    continuity = loadedStates.every((s) => {
      const source = loadGonegiSceneState(root, s.gonegi_state_id);
      return source ? locksPreserved(source.continuity_locks, s.continuity_locks) : false;
    })
      ? 'PASS'
      : 'FAIL';
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const final_verdict =
    errors.length === 0 &&
    loadedStates.length === SEED_GONEGI_VIDEO_STATE_SPECS.length &&
    registryStatus === 'PASS' &&
    gonegiStates === 'PASS' &&
    directorBlend === 'PASS' &&
    videoDefaults === 'PASS' &&
    identityPriority === 'PASS' &&
    continuity === 'PASS'
      ? TRANSLATOR_PASS_VERDICT
      : TRANSLATOR_FAIL_VERDICT;

  return {
    report_id: 'gonegi-state-to-video-state-report-v1',
    phase: TRANSLATOR_PHASE,
    timestamp,
    video_states: loadedStates.length,
    gonegi_states: gonegiStates,
    director_blend: directorBlend,
    video_defaults: videoDefaults,
    identity_priority: identityPriority,
    continuity: continuity,
    registry: registryStatus,
    state_validations: stateValidations,
    design_only: true,
    gpu_execution: false,
    final_verdict,
    issues,
  };
}

function buildMarkdown(report: GonegiStateToVideoStateReport): string {
  const lines = [
    '# Gonegi State to Video State Summary',
    '',
    `**Phase:** ${TRANSLATOR_PHASE}`,
    `**Verdict:** ${report.final_verdict}`,
    `**Timestamp:** ${report.timestamp}`,
    '',
    '## Pass Metrics',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| video_states | ${report.video_states} |`,
    `| gonegi_states | ${report.gonegi_states} |`,
    `| director_blend | ${report.director_blend} |`,
    `| video_defaults | ${report.video_defaults} |`,
    `| identity_priority | ${report.identity_priority} |`,
    `| continuity | ${report.continuity} |`,
    `| design_only | ${report.design_only} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    '',
    '## Translated Video States',
    '',
    '| gonegi_video_state_id | gonegi_state_id |',
    '|-----------------------|-----------------|',
  ];

  for (const spec of SEED_GONEGI_VIDEO_STATE_SPECS) {
    lines.push(`| ${spec.gonegi_video_state_id} | ${spec.gonegi_state_id} |`);
  }

  lines.push('', '## Pipeline Chain', '', '```');
  lines.push(
    'gonegi scene state → video shot state → keyframe plan → motion plan → gpu payload'
  );
  lines.push('```', '');

  if (report.state_validations.length > 0) {
    lines.push('## State Validations', '');
    for (const v of report.state_validations) {
      lines.push(`- **${v.gonegi_video_state_id}** ← ${v.gonegi_state_id}: ${v.status}`);
    }
    lines.push('');
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(
        `- [${issue.severity}] **${issue.code}**${issue.gonegi_video_state_id ? ` (${issue.gonegi_video_state_id})` : ''}: ${issue.message}`
      );
    }
    lines.push('');
  }

  lines.push('## Artifacts', '');
  lines.push(`- Schema: \`${GONEGI_VIDEO_STATE_SCHEMA_PATH}\``);
  lines.push(`- Registry: \`${GONEGI_VIDEO_STATE_REGISTRY_PATH}\``);
  lines.push(`- States: \`${GONEGI_VIDEO_STATES_DIR}/\``);
  lines.push(`- Report: \`${TRANSLATOR_REPORT_PATH}\``);
  lines.push('');

  return lines.join('\n');
}

export function writeGonegiVideoStateReport(projectRoot?: string): GonegiStateToVideoStateReport {
  const root = resolveProjectRoot(projectRoot);
  const report = validateGonegiVideoStates(root);

  fs.writeFileSync(
    path.join(root, TRANSLATOR_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, TRANSLATOR_MD_PATH), buildMarkdown(report), 'utf8');

  return report;
}
