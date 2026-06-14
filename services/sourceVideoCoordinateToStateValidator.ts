import fs from 'node:fs';
import path from 'node:path';
import { BLEND_CONTRACT_PATH } from './directorGrammarBlendBuilder.js';
import {
  COORDINATE_PASS_VERDICT,
  COORDINATE_REPORT_PATH,
} from './sourceVideoCoordinateValidator.js';
import {
  COORDINATE_REGISTRY_PATH,
  loadCoordinateRecord,
  type SourceVideoCoordinateRecord,
} from './sourceVideoSegmentToCoordinateCompiler.js';
import {
  STATE_COMPILER_PHASE,
  STATE_DRAFT_REGISTRY_PATH,
  STATE_DRAFT_SCHEMA_PATH,
  STATE_DRAFTS_DIR,
  SEED_STATE_DRAFT_SPECS,
  type SourceVideoStateDraft,
  loadStateDraft,
} from './sourceVideoCoordinateToStateCompiler.js';
import {
  VIDEO_STATE_DEFAULTS_ID,
  VIDEO_STATE_DEFAULTS_PATH,
} from './sourceVideoGrammarToVideoStateCompiler.js';
import { SCENE_STATE_SCHEMA_PATH } from './sourceVideoSceneStateMapper.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const STATE_COMPILER_PASS_VERDICT = 'PASS_SOURCE_VIDEO_COORDINATE_TO_STATE_COMPILER_V2' as const;
export const STATE_COMPILER_FAIL_VERDICT = 'FAIL_SOURCE_VIDEO_COORDINATE_TO_STATE_COMPILER_V2' as const;
export const STATE_COMPILER_REPORT_PATH = 'reports/source-video-coordinate-to-state-report.json' as const;
export const STATE_COMPILER_MD_PATH = 'reports/SOURCE_VIDEO_COORDINATE_TO_STATE.md' as const;
export const PRODUCTION_SCENE_STATE_REGISTRY_PATH = 'datasets/state/scene-state-registry.json' as const;
export const PRODUCTION_SCENE_STATES_DIR = 'datasets/state/scene-states' as const;

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

const REQUIRED_TRACE_FIELDS = [
  'coordinate_record_id',
  'segment_id',
  'source_video_id',
  'layer_map',
  'scene_state_schema',
] as const;

export type StateDraftValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  state_draft_id?: string;
};

export type StateDraftValidationResult = {
  state_draft_id: string;
  status: 'PASS' | 'FAIL';
  issues: StateDraftValidationIssue[];
};

export type SourceVideoCoordinateToStateReport = {
  report_id: string;
  phase: typeof STATE_COMPILER_PHASE;
  timestamp: string;
  state_drafts: number;
  scene_state_layers: 'PASS' | 'FAIL';
  identity_priority: 'PASS' | 'FAIL';
  director_blend: 'PASS' | 'FAIL';
  video_defaults: 'PASS' | 'FAIL';
  coordinate_trace: 'PASS' | 'FAIL';
  isolated_drafts: 'PASS' | 'FAIL';
  draft_validations: StateDraftValidationResult[];
  design_only: true;
  gpu_execution: false;
  final_verdict: typeof STATE_COMPILER_PASS_VERDICT | typeof STATE_COMPILER_FAIL_VERDICT;
  issues: StateDraftValidationIssue[];
};

function loadProductionSceneStateIds(projectRoot: string): Set<string> {
  const abs = path.join(projectRoot, PRODUCTION_SCENE_STATE_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return new Set();
  const registry = JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    scene_states?: Array<{ scene_state_id: string }>;
  };
  return new Set((registry.scene_states ?? []).map((s) => s.scene_state_id));
}

function validateExecutionFlags(draft: SourceVideoStateDraft): StateDraftValidationIssue[] {
  const flags = draft.execution_flags;
  if (
    flags.design_only !== true ||
    flags.gpu_execution !== false ||
    flags.external_call_allowed !== false ||
    flags.frame_extraction !== false ||
    flags.ocr !== false ||
    flags.generation !== false
  ) {
    return [
      {
        code: 'EXECUTION_FLAGS_INVALID',
        message: 'Draft execution_flags must be design-only with all execution disabled',
        severity: 'error',
        state_draft_id: draft.state_draft_id,
      },
    ];
  }
  return [];
}

function validateSceneStateLayers(draft: SourceVideoStateDraft): StateDraftValidationIssue[] {
  const issues: StateDraftValidationIssue[] = [];
  for (const layer of SCENE_STATE_LAYERS) {
    if (!draft[layer]) {
      issues.push({
        code: 'MISSING_SCENE_STATE_LAYER',
        message: `Missing required layer: ${layer}`,
        severity: 'error',
        state_draft_id: draft.state_draft_id,
        field: layer,
      });
    }
  }
  return issues;
}

function validateIdentityPriority(draft: SourceVideoStateDraft): StateDraftValidationIssue[] {
  const issues: StateDraftValidationIssue[] = [];
  if (draft.identity_state.identity_priority_rank !== 1) {
    issues.push({
      code: 'IDENTITY_PRIORITY_NOT_RANK_1',
      message: 'identity_state.identity_priority_rank must be 1',
      severity: 'error',
      state_draft_id: draft.state_draft_id,
      field: 'identity_state.identity_priority_rank',
    });
  }
  if (!draft.identity_state.identity_lock_tokens?.length) {
    issues.push({
      code: 'IDENTITY_LOCKS_MISSING',
      message: 'identity_state.identity_lock_tokens required',
      severity: 'error',
      state_draft_id: draft.state_draft_id,
    });
  }
  return issues;
}

function validateCharacterPreserved(
  draft: SourceVideoStateDraft,
  coordinate: SourceVideoCoordinateRecord | null
): StateDraftValidationIssue[] {
  const issues: StateDraftValidationIssue[] = [];
  if (!draft.character_state.active_character_ids?.length) {
    issues.push({
      code: 'CHARACTER_STATE_EMPTY',
      message: 'character_state.active_character_ids required',
      severity: 'error',
      state_draft_id: draft.state_draft_id,
    });
    return issues;
  }

  if (coordinate) {
    const coordChars = coordinate.character_coordinate.map((c) => c.character_ref).sort();
    const draftChars = [...draft.character_state.active_character_ids].sort();
    if (coordChars.join(',') !== draftChars.join(',')) {
      issues.push({
        code: 'CHARACTER_STATE_NOT_PRESERVED',
        message: 'character_state.active_character_ids must match coordinate character_coordinate',
        severity: 'error',
        state_draft_id: draft.state_draft_id,
        field: 'character_state.active_character_ids',
      });
    }
  }

  return issues;
}

function validateCoordinateTrace(draft: SourceVideoStateDraft): StateDraftValidationIssue[] {
  const issues: StateDraftValidationIssue[] = [];
  const trace = draft.coordinate_trace;

  if (!trace) {
    issues.push({
      code: 'MISSING_COORDINATE_TRACE',
      message: 'coordinate_trace required',
      severity: 'error',
      state_draft_id: draft.state_draft_id,
    });
    return issues;
  }

  for (const field of REQUIRED_TRACE_FIELDS) {
    if (!trace[field]) {
      issues.push({
        code: 'INCOMPLETE_COORDINATE_TRACE',
        message: `coordinate_trace.${field} required`,
        severity: 'error',
        state_draft_id: draft.state_draft_id,
        field: `coordinate_trace.${field}`,
      });
    }
  }

  if (trace.coordinate_record_id !== draft.source_coordinate_record_id) {
    issues.push({
      code: 'TRACE_COORDINATE_MISMATCH',
      message: 'coordinate_trace.coordinate_record_id must match source_coordinate_record_id',
      severity: 'error',
      state_draft_id: draft.state_draft_id,
    });
  }

  if (trace.segment_id !== draft.source_segment_id) {
    issues.push({
      code: 'TRACE_SEGMENT_MISMATCH',
      message: 'coordinate_trace.segment_id must match source_segment_id',
      severity: 'error',
      state_draft_id: draft.state_draft_id,
    });
  }

  if (trace.scene_state_schema !== SCENE_STATE_SCHEMA_PATH) {
    issues.push({
      code: 'TRACE_SCHEMA_MISMATCH',
      message: `coordinate_trace.scene_state_schema must be ${SCENE_STATE_SCHEMA_PATH}`,
      severity: 'error',
      state_draft_id: draft.state_draft_id,
    });
  }

  return issues;
}

function validateContinuityLocks(draft: SourceVideoStateDraft): StateDraftValidationIssue[] {
  const issues: StateDraftValidationIssue[] = [];
  if (!draft.continuity_locks?.identity_locks?.length) {
    issues.push({
      code: 'CONTINUITY_IDENTITY_LOCKS_MISSING',
      message: 'continuity_locks.identity_locks required',
      severity: 'error',
      state_draft_id: draft.state_draft_id,
    });
  }
  if (!draft.continuity_locks?.location_locks?.length) {
    issues.push({
      code: 'CONTINUITY_LOCATION_LOCKS_MISSING',
      message: 'continuity_locks.location_locks required',
      severity: 'error',
      state_draft_id: draft.state_draft_id,
    });
  }
  return issues;
}

function validateIsolation(
  draft: SourceVideoStateDraft,
  productionIds: Set<string>,
  projectRoot: string
): StateDraftValidationIssue[] {
  const issues: StateDraftValidationIssue[] = [];

  if (draft.production_status.isolated !== true) {
    issues.push({
      code: 'DRAFT_NOT_ISOLATED',
      message: 'production_status.isolated must be true',
      severity: 'error',
      state_draft_id: draft.state_draft_id,
    });
  }

  if (draft.production_status.production_registry !== false) {
    issues.push({
      code: 'DRAFT_IN_PRODUCTION_REGISTRY',
      message: 'production_status.production_registry must be false',
      severity: 'error',
      state_draft_id: draft.state_draft_id,
    });
  }

  if (productionIds.has(draft.state_draft_id)) {
    issues.push({
      code: 'DRAFT_IN_PRODUCTION_REGISTRY_IDS',
      message: `${draft.state_draft_id} must not appear in production scene-state-registry`,
      severity: 'error',
      state_draft_id: draft.state_draft_id,
    });
  }

  const prodPath = path.join(projectRoot, PRODUCTION_SCENE_STATES_DIR, `${draft.state_draft_id}.json`);
  if (fs.existsSync(prodPath)) {
    issues.push({
      code: 'DRAFT_IN_PRODUCTION_STORAGE',
      message: `Draft must not exist in ${PRODUCTION_SCENE_STATES_DIR}`,
      severity: 'error',
      state_draft_id: draft.state_draft_id,
    });
  }

  return issues;
}

function validateDraft(
  draft: SourceVideoStateDraft,
  coordinate: SourceVideoCoordinateRecord | null,
  blendId: string,
  productionIds: Set<string>,
  projectRoot: string
): StateDraftValidationResult {
  const issues: StateDraftValidationIssue[] = [];

  if (!coordinate) {
    issues.push({
      code: 'COORDINATE_RECORD_MISSING',
      message: `Coordinate record ${draft.source_coordinate_record_id} not found`,
      severity: 'error',
      state_draft_id: draft.state_draft_id,
    });
  }

  if (draft.director_blend_ref !== blendId) {
    issues.push({
      code: 'DIRECTOR_BLEND_MISMATCH',
      message: `director_blend_ref must be ${blendId}`,
      severity: 'error',
      state_draft_id: draft.state_draft_id,
    });
  }

  if (draft.video_state_defaults_ref !== VIDEO_STATE_DEFAULTS_ID) {
    issues.push({
      code: 'VIDEO_DEFAULTS_MISMATCH',
      message: `video_state_defaults_ref must be ${VIDEO_STATE_DEFAULTS_ID}`,
      severity: 'error',
      state_draft_id: draft.state_draft_id,
    });
  }

  issues.push(...validateSceneStateLayers(draft));
  issues.push(...validateIdentityPriority(draft));
  issues.push(...validateCharacterPreserved(draft, coordinate));
  issues.push(...validateCoordinateTrace(draft));
  issues.push(...validateContinuityLocks(draft));
  issues.push(...validateIsolation(draft, productionIds, projectRoot));
  issues.push(...validateExecutionFlags(draft));

  return {
    state_draft_id: draft.state_draft_id,
    status: issues.length === 0 ? 'PASS' : 'FAIL',
    issues,
  };
}

export function validateSourceVideoCoordinateToState(
  projectRoot?: string
): SourceVideoCoordinateToStateReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: StateDraftValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const coordinateReportPath = path.join(root, COORDINATE_REPORT_PATH);
  if (!fs.existsSync(coordinateReportPath)) {
    issues.push({
      code: 'MISSING_COORDINATE_REPORT',
      message: `Missing ${COORDINATE_REPORT_PATH}. Run npm run verify:source-video-segment-coordinate first.`,
      severity: 'error',
    });
  } else {
    const coordinateReport = JSON.parse(fs.readFileSync(coordinateReportPath, 'utf8')) as {
      final_verdict?: string;
    };
    if (coordinateReport.final_verdict !== COORDINATE_PASS_VERDICT) {
      issues.push({
        code: 'UPSTREAM_COORDINATE_NOT_PASS',
        message: `Coordinate compiler verdict is not ${COORDINATE_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  if (!fs.existsSync(path.join(root, STATE_DRAFT_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `Missing ${STATE_DRAFT_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, VIDEO_STATE_DEFAULTS_PATH))) {
    issues.push({
      code: 'MISSING_VIDEO_DEFAULTS',
      message: `Missing ${VIDEO_STATE_DEFAULTS_PATH}`,
      severity: 'error',
    });
  }

  let blendId = 'gonegi-master-director-blend-v1';
  const blendContractPath = path.join(root, BLEND_CONTRACT_PATH);
  if (!fs.existsSync(blendContractPath)) {
    issues.push({
      code: 'MISSING_BLEND_CONTRACT',
      message: `Missing ${BLEND_CONTRACT_PATH}`,
      severity: 'error',
    });
  } else {
    const contract = JSON.parse(fs.readFileSync(blendContractPath, 'utf8')) as { blend_id: string };
    blendId = contract.blend_id;
  }

  let registryPass = true;
  const registryPath = path.join(root, STATE_DRAFT_REGISTRY_PATH);
  if (!fs.existsSync(registryPath)) {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `Missing ${STATE_DRAFT_REGISTRY_PATH}`,
      severity: 'error',
    });
    registryPass = false;
  } else {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as {
      state_drafts?: Array<{ state_draft_id: string; draft_path: string }>;
    };
    if (registry.state_drafts?.length !== SEED_STATE_DRAFT_SPECS.length) {
      issues.push({
        code: 'REGISTRY_DRAFT_COUNT',
        message: `Registry must contain ${SEED_STATE_DRAFT_SPECS.length} state drafts`,
        severity: 'error',
      });
      registryPass = false;
    } else {
      const match = SEED_STATE_DRAFT_SPECS.every((spec) =>
        registry.state_drafts!.some(
          (e) =>
            e.state_draft_id === spec.state_draft_id &&
            e.draft_path === `${STATE_DRAFTS_DIR}/${spec.state_draft_id}.json`
        )
      );
      if (!match) {
        issues.push({
          code: 'REGISTRY_DRAFT_MISMATCH',
          message: 'Registry draft entries do not match seed specs',
          severity: 'error',
        });
        registryPass = false;
      }
    }
  }

  if (!fs.existsSync(path.join(root, COORDINATE_REGISTRY_PATH))) {
    issues.push({
      code: 'MISSING_COORDINATE_REGISTRY',
      message: `Missing ${COORDINATE_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const productionIds = loadProductionSceneStateIds(root);
  const draftValidations: StateDraftValidationResult[] = [];
  const loadedDrafts: SourceVideoStateDraft[] = [];

  for (const spec of SEED_STATE_DRAFT_SPECS) {
    const draft = loadStateDraft(root, spec.state_draft_id);
    if (!draft) {
      issues.push({
        code: 'MISSING_STATE_DRAFT',
        message: `Missing state draft ${spec.state_draft_id}`,
        severity: 'error',
        state_draft_id: spec.state_draft_id,
      });
      draftValidations.push({
        state_draft_id: spec.state_draft_id,
        status: 'FAIL',
        issues: [
          {
            code: 'MISSING_STATE_DRAFT',
            message: `Missing state draft ${spec.state_draft_id}`,
            severity: 'error',
            state_draft_id: spec.state_draft_id,
          },
        ],
      });
      continue;
    }

    loadedDrafts.push(draft);
    const coordinate = loadCoordinateRecord(root, spec.coordinate_record_id);
    const validation = validateDraft(draft, coordinate, blendId, productionIds, root);
    draftValidations.push(validation);
    issues.push(...validation.issues);
  }

  let sceneStateLayers: 'PASS' | 'FAIL' = 'FAIL';
  let identityPriority: 'PASS' | 'FAIL' = 'FAIL';
  let directorBlend: 'PASS' | 'FAIL' = 'FAIL';
  let videoDefaults: 'PASS' | 'FAIL' = 'FAIL';
  let coordinateTrace: 'PASS' | 'FAIL' = 'FAIL';
  let isolatedDrafts: 'PASS' | 'FAIL' = 'FAIL';

  if (loadedDrafts.length === SEED_STATE_DRAFT_SPECS.length) {
    sceneStateLayers = loadedDrafts.every((d) =>
      SCENE_STATE_LAYERS.every((layer) => Boolean(d[layer]))
    )
      ? 'PASS'
      : 'FAIL';

    identityPriority = loadedDrafts.every(
      (d) => d.identity_state.identity_priority_rank === 1
    )
      ? 'PASS'
      : 'FAIL';

    directorBlend = loadedDrafts.every((d) => d.director_blend_ref === blendId) ? 'PASS' : 'FAIL';
    videoDefaults = loadedDrafts.every(
      (d) => d.video_state_defaults_ref === VIDEO_STATE_DEFAULTS_ID
    )
      ? 'PASS'
      : 'FAIL';

    coordinateTrace = loadedDrafts.every((d) => validateCoordinateTrace(d).length === 0)
      ? 'PASS'
      : 'FAIL';

    isolatedDrafts = loadedDrafts.every(
      (d) =>
        d.production_status.isolated === true &&
        d.production_status.production_registry === false &&
        !productionIds.has(d.state_draft_id) &&
        !fs.existsSync(
          path.join(root, PRODUCTION_SCENE_STATES_DIR, `${d.state_draft_id}.json`)
        )
    )
      ? 'PASS'
      : 'FAIL';
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const final_verdict =
    errors.length === 0 &&
    loadedDrafts.length === SEED_STATE_DRAFT_SPECS.length &&
    registryPass &&
    sceneStateLayers === 'PASS' &&
    identityPriority === 'PASS' &&
    directorBlend === 'PASS' &&
    videoDefaults === 'PASS' &&
    coordinateTrace === 'PASS' &&
    isolatedDrafts === 'PASS'
      ? STATE_COMPILER_PASS_VERDICT
      : STATE_COMPILER_FAIL_VERDICT;

  return {
    report_id: 'source-video-coordinate-to-state-report-v1',
    phase: STATE_COMPILER_PHASE,
    timestamp,
    state_drafts: loadedDrafts.length,
    scene_state_layers: sceneStateLayers,
    identity_priority: identityPriority,
    director_blend: directorBlend,
    video_defaults: videoDefaults,
    coordinate_trace: coordinateTrace,
    isolated_drafts: isolatedDrafts,
    draft_validations: draftValidations,
    design_only: true,
    gpu_execution: false,
    final_verdict,
    issues,
  };
}

function buildMarkdown(report: SourceVideoCoordinateToStateReport): string {
  const lines = [
    '# Source Video Coordinate to State Summary',
    '',
    `**Phase:** ${STATE_COMPILER_PHASE}`,
    `**Verdict:** ${report.final_verdict}`,
    `**Timestamp:** ${report.timestamp}`,
    '',
    '## Pass Metrics',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| state_drafts | ${report.state_drafts} |`,
    `| scene_state_layers | ${report.scene_state_layers} |`,
    `| identity_priority | ${report.identity_priority} |`,
    `| director_blend | ${report.director_blend} |`,
    `| video_defaults | ${report.video_defaults} |`,
    `| coordinate_trace | ${report.coordinate_trace} |`,
    `| isolated_drafts | ${report.isolated_drafts} |`,
    `| design_only | ${report.design_only} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    '',
    '## Compiled State Drafts',
    '',
    '| state_draft_id | coordinate_record_id |',
    '|----------------|------------------------|',
  ];

  for (const spec of SEED_STATE_DRAFT_SPECS) {
    lines.push(`| ${spec.state_draft_id} | ${spec.coordinate_record_id} |`);
  }

  lines.push('', '## Pipeline Chain', '', '```');
  lines.push(
    'source video coordinate → scene state draft → video shot state → keyframe plan → motion plan → gpu payload'
  );
  lines.push('```', '');

  if (report.draft_validations.length > 0) {
    lines.push('## Draft Validations', '');
    for (const v of report.draft_validations) {
      lines.push(`- **${v.state_draft_id}**: ${v.status}`);
    }
    lines.push('');
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(
        `- [${issue.severity}] **${issue.code}**${issue.state_draft_id ? ` (${issue.state_draft_id})` : ''}: ${issue.message}`
      );
    }
    lines.push('');
  }

  lines.push('## Artifacts', '');
  lines.push(`- Schema: \`${STATE_DRAFT_SCHEMA_PATH}\``);
  lines.push(`- Registry: \`${STATE_DRAFT_REGISTRY_PATH}\``);
  lines.push(`- Drafts: \`${STATE_DRAFTS_DIR}/\``);
  lines.push(`- Report: \`${STATE_COMPILER_REPORT_PATH}\``);
  lines.push('');

  return lines.join('\n');
}

export function writeSourceVideoCoordinateToStateReport(
  projectRoot?: string
): SourceVideoCoordinateToStateReport {
  const root = resolveProjectRoot(projectRoot);
  const report = validateSourceVideoCoordinateToState(root);

  fs.writeFileSync(
    path.join(root, STATE_COMPILER_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, STATE_COMPILER_MD_PATH), buildMarkdown(report), 'utf8');

  return report;
}
