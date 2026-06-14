import fs from 'node:fs';
import path from 'node:path';
import {
  REPLACEMENT_PASS_VERDICT,
  REPLACEMENT_REPORT_PATH,
} from './characterReplacementContractValidator.js';
import {
  TRANSLATION_PASS_VERDICT,
  TRANSLATION_REPORT_PATH,
} from './gonegiWorldTranslationValidator.js';
import {
  STATE_COMPILER_PASS_VERDICT,
  STATE_COMPILER_REPORT_PATH,
  PRODUCTION_SCENE_STATE_REGISTRY_PATH,
  PRODUCTION_SCENE_STATES_DIR,
} from './sourceVideoCoordinateToStateValidator.js';
import { loadStateDraft, STATE_DRAFT_REGISTRY_PATH } from './sourceVideoCoordinateToStateCompiler.js';
import {
  GONEGI_COMPILER_PHASE,
  GONEGI_STATE_REGISTRY_PATH,
  GONEGI_STATE_SCHEMA_PATH,
  GONEGI_STATES_DIR,
  SEED_GONEGI_STATE_SPECS,
  type GonegiSceneState,
  loadGonegiSceneState,
} from './sourceStateToGonegiStateCompiler.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const GONEGI_COMPILER_PASS_VERDICT = 'PASS_SOURCE_STATE_TO_GONEGI_STATE_COMPILER_V1' as const;
export const GONEGI_COMPILER_FAIL_VERDICT = 'FAIL_SOURCE_STATE_TO_GONEGI_STATE_COMPILER_V1' as const;
export const GONEGI_COMPILER_REPORT_PATH = 'reports/source-state-to-gonegi-state-report.json' as const;
export const GONEGI_COMPILER_MD_PATH = 'reports/SOURCE_STATE_TO_GONEGI_STATE.md' as const;

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

const CANONICAL_CAST = ['gonegi', 'dana', 'gamja', 'aengdu'] as const;

export type GonegiStateValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  gonegi_state_id?: string;
};

export type GonegiStateValidationResult = {
  gonegi_state_id: string;
  source_state_draft_id: string;
  status: 'PASS' | 'FAIL';
  issues: GonegiStateValidationIssue[];
};

export type SourceStateToGonegiStateReport = {
  report_id: string;
  phase: typeof GONEGI_COMPILER_PHASE;
  timestamp: string;
  gonegi_states: number;
  world_translation: 'PASS' | 'FAIL';
  character_replacement: 'PASS' | 'FAIL';
  identity_priority: 'PASS' | 'FAIL';
  duplicate_guard: 'PASS' | 'FAIL';
  continuity: 'PASS' | 'FAIL';
  registry: 'PASS' | 'FAIL';
  state_validations: GonegiStateValidationResult[];
  design_only: true;
  gpu_execution: false;
  final_verdict: typeof GONEGI_COMPILER_PASS_VERDICT | typeof GONEGI_COMPILER_FAIL_VERDICT;
  issues: GonegiStateValidationIssue[];
};

function loadProductionSceneStateIds(projectRoot: string): Set<string> {
  const abs = path.join(projectRoot, PRODUCTION_SCENE_STATE_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return new Set();
  const registry = JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    scene_states?: Array<{ scene_state_id: string }>;
  };
  return new Set((registry.scene_states ?? []).map((s) => s.scene_state_id));
}

function validateState(
  state: GonegiSceneState,
  productionIds: Set<string>,
  projectRoot: string
): GonegiStateValidationResult {
  const issues: GonegiStateValidationIssue[] = [];

  const sourceDraft = loadStateDraft(projectRoot, state.source_state_draft_id);
  if (!sourceDraft) {
    issues.push({
      code: 'SOURCE_DRAFT_MISSING',
      message: `Source draft ${state.source_state_draft_id} not found`,
      severity: 'error',
      gonegi_state_id: state.gonegi_state_id,
    });
  }

  if (state.world_translation_ref !== 'gonegi-master-world-translation-v1') {
    issues.push({
      code: 'WORLD_TRANSLATION_NOT_LINKED',
      message: 'world_translation_ref must link to gonegi-master-world-translation-v1',
      severity: 'error',
      gonegi_state_id: state.gonegi_state_id,
    });
  }

  if (state.character_replacement_ref !== 'gonegi-master-character-replacement-v1') {
    issues.push({
      code: 'CHARACTER_REPLACEMENT_NOT_LINKED',
      message: 'character_replacement_ref must link to gonegi-master-character-replacement-v1',
      severity: 'error',
      gonegi_state_id: state.gonegi_state_id,
    });
  }

  for (const layer of SCENE_STATE_LAYERS) {
    if (!state[layer]) {
      issues.push({
        code: 'MISSING_STATE_LAYER',
        message: `Missing layer: ${layer}`,
        severity: 'error',
        gonegi_state_id: state.gonegi_state_id,
        field: layer,
      });
    }
  }

  if (state.identity_state.identity_priority_rank !== 1) {
    issues.push({
      code: 'IDENTITY_PRIORITY_NOT_RANK_1',
      message: 'identity_state.identity_priority_rank must be 1',
      severity: 'error',
      gonegi_state_id: state.gonegi_state_id,
    });
  }

  const castCounts = new Map<string, number>();
  for (const id of state.character_state.active_character_ids) {
    castCounts.set(id, (castCounts.get(id) ?? 0) + 1);
  }
  for (const id of CANONICAL_CAST) {
    if ((castCounts.get(id) ?? 0) > 1) {
      issues.push({
        code: 'DUPLICATE_CAST_BLOCKED',
        message: `Duplicate canonical character blocked: ${id}`,
        severity: 'error',
        gonegi_state_id: state.gonegi_state_id,
      });
    }
  }

  const hasGonegiCast = state.character_state.active_character_ids.some((id) =>
    CANONICAL_CAST.includes(id as (typeof CANONICAL_CAST)[number])
  );
  if (!hasGonegiCast) {
    issues.push({
      code: 'GONEGI_CAST_MISSING',
      message: 'At least one Gonegi canonical cast member required',
      severity: 'error',
      gonegi_state_id: state.gonegi_state_id,
    });
  }

  if (
    !state.translation_trace?.translation_id ||
    !state.translation_trace.source_world_type ||
    !state.translation_trace.applied_dimensions?.length
  ) {
    issues.push({
      code: 'TRANSLATION_TRACE_INCOMPLETE',
      message: 'translation_trace incomplete',
      severity: 'error',
      gonegi_state_id: state.gonegi_state_id,
    });
  }

  if (
    !state.replacement_trace?.contract_id ||
    !state.replacement_trace.replacements_applied?.length
  ) {
    issues.push({
      code: 'REPLACEMENT_TRACE_INCOMPLETE',
      message: 'replacement_trace incomplete',
      severity: 'error',
      gonegi_state_id: state.gonegi_state_id,
    });
  }

  if (!state.continuity_locks?.identity_locks?.length) {
    issues.push({
      code: 'CONTINUITY_LOCKS_MISSING',
      message: 'continuity_locks.identity_locks required',
      severity: 'error',
      gonegi_state_id: state.gonegi_state_id,
    });
  }

  if (productionIds.has(state.gonegi_state_id)) {
    issues.push({
      code: 'IN_PRODUCTION_REGISTRY',
      message: 'Gonegi state must not appear in production scene-state-registry',
      severity: 'error',
      gonegi_state_id: state.gonegi_state_id,
    });
  }

  const prodPath = path.join(projectRoot, PRODUCTION_SCENE_STATES_DIR, `${state.gonegi_state_id}.json`);
  if (fs.existsSync(prodPath)) {
    issues.push({
      code: 'IN_PRODUCTION_STORAGE',
      message: 'Gonegi state must not exist in production scene-states',
      severity: 'error',
      gonegi_state_id: state.gonegi_state_id,
    });
  }

  if (state.production_status.isolated !== true || state.production_status.production_registry !== false) {
    issues.push({
      code: 'NOT_ISOLATED',
      message: 'production_status must be isolated from production registry',
      severity: 'error',
      gonegi_state_id: state.gonegi_state_id,
    });
  }

  const flags = state.execution_flags;
  if (
    flags.design_only !== true ||
    flags.gpu_execution !== false ||
    flags.external_call_allowed !== false ||
    flags.frame_extraction !== false ||
    flags.ocr !== false ||
    flags.generation !== false
  ) {
    issues.push({
      code: 'EXECUTION_FLAGS_INVALID',
      message: 'execution_flags must be design-only',
      severity: 'error',
      gonegi_state_id: state.gonegi_state_id,
    });
  }

  return {
    gonegi_state_id: state.gonegi_state_id,
    source_state_draft_id: state.source_state_draft_id,
    status: issues.length === 0 ? 'PASS' : 'FAIL',
    issues,
  };
}

export function validateGonegiSceneStates(projectRoot?: string): SourceStateToGonegiStateReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: GonegiStateValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  for (const [reportPath, verdict, label] of [
    [STATE_COMPILER_REPORT_PATH, STATE_COMPILER_PASS_VERDICT, 'state compiler'],
    [TRANSLATION_REPORT_PATH, TRANSLATION_PASS_VERDICT, 'world translation'],
    [REPLACEMENT_REPORT_PATH, REPLACEMENT_PASS_VERDICT, 'character replacement'],
  ] as const) {
    const abs = path.join(root, reportPath);
    if (!fs.existsSync(abs)) {
      issues.push({
        code: 'MISSING_UPSTREAM_REPORT',
        message: `Missing ${reportPath}`,
        severity: 'error',
      });
    } else {
      const report = JSON.parse(fs.readFileSync(abs, 'utf8')) as { final_verdict?: string };
      if (report.final_verdict !== verdict) {
        issues.push({
          code: 'UPSTREAM_NOT_PASS',
          message: `${label} verdict is not ${verdict}`,
          severity: 'error',
        });
      }
    }
  }

  if (!fs.existsSync(path.join(root, GONEGI_STATE_SCHEMA_PATH))) {
    issues.push({ code: 'MISSING_SCHEMA', message: `Missing ${GONEGI_STATE_SCHEMA_PATH}`, severity: 'error' });
  }

  if (!fs.existsSync(path.join(root, STATE_DRAFT_REGISTRY_PATH))) {
    issues.push({
      code: 'MISSING_DRAFT_REGISTRY',
      message: `Missing ${STATE_DRAFT_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  let registryStatus: 'PASS' | 'FAIL' = 'FAIL';
  const registryPath = path.join(root, GONEGI_STATE_REGISTRY_PATH);
  if (!fs.existsSync(registryPath)) {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `Missing ${GONEGI_STATE_REGISTRY_PATH}`,
      severity: 'error',
    });
  } else {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as {
      gonegi_states?: Array<{ gonegi_state_id: string; state_path: string; source_state_draft_id: string }>;
    };
    if (registry.gonegi_states?.length === SEED_GONEGI_STATE_SPECS.length) {
      const match = SEED_GONEGI_STATE_SPECS.every((spec) =>
        registry.gonegi_states!.some(
          (e) =>
            e.gonegi_state_id === spec.gonegi_state_id &&
            e.source_state_draft_id === spec.source_state_draft_id &&
            e.state_path === `${GONEGI_STATES_DIR}/${spec.gonegi_state_id}.json`
        )
      );
      registryStatus = match ? 'PASS' : 'FAIL';
      if (!match) {
        issues.push({
          code: 'REGISTRY_STATE_MISMATCH',
          message: 'Registry entries do not match seed specs',
          severity: 'error',
        });
      }
    } else {
      issues.push({
        code: 'REGISTRY_STATE_COUNT',
        message: `Registry must contain ${SEED_GONEGI_STATE_SPECS.length} gonegi states`,
        severity: 'error',
      });
    }
  }

  const productionIds = loadProductionSceneStateIds(root);
  const stateValidations: GonegiStateValidationResult[] = [];
  const loadedStates: GonegiSceneState[] = [];

  for (const spec of SEED_GONEGI_STATE_SPECS) {
    const state = loadGonegiSceneState(root, spec.gonegi_state_id);
    if (!state) {
      issues.push({
        code: 'MISSING_GONEGI_STATE',
        message: `Missing gonegi state ${spec.gonegi_state_id}`,
        severity: 'error',
        gonegi_state_id: spec.gonegi_state_id,
      });
      stateValidations.push({
        gonegi_state_id: spec.gonegi_state_id,
        source_state_draft_id: spec.source_state_draft_id,
        status: 'FAIL',
        issues: [
          {
            code: 'MISSING_GONEGI_STATE',
            message: `Missing gonegi state ${spec.gonegi_state_id}`,
            severity: 'error',
            gonegi_state_id: spec.gonegi_state_id,
          },
        ],
      });
      continue;
    }

    loadedStates.push(state);
    const validation = validateState(state, productionIds, root);
    stateValidations.push(validation);
    issues.push(...validation.issues);
  }

  let worldTranslation: 'PASS' | 'FAIL' = 'FAIL';
  let characterReplacement: 'PASS' | 'FAIL' = 'FAIL';
  let identityPriority: 'PASS' | 'FAIL' = 'FAIL';
  let duplicateGuard: 'PASS' | 'FAIL' = 'FAIL';
  let continuity: 'PASS' | 'FAIL' = 'FAIL';

  if (loadedStates.length === SEED_GONEGI_STATE_SPECS.length) {
    worldTranslation = loadedStates.every(
      (s) => s.world_translation_ref === 'gonegi-master-world-translation-v1' && s.translation_trace.translation_id
    )
      ? 'PASS'
      : 'FAIL';

    characterReplacement = loadedStates.every(
      (s) =>
        s.character_replacement_ref === 'gonegi-master-character-replacement-v1' &&
        s.replacement_trace.replacements_applied.length > 0
    )
      ? 'PASS'
      : 'FAIL';

    identityPriority = loadedStates.every((s) => s.identity_state.identity_priority_rank === 1)
      ? 'PASS'
      : 'FAIL';

    duplicateGuard = loadedStates.every((s) => {
      const counts = new Map<string, number>();
      for (const id of s.character_state.active_character_ids) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      return CANONICAL_CAST.every((id) => (counts.get(id) ?? 0) <= 1);
    })
      ? 'PASS'
      : 'FAIL';

    continuity = loadedStates.every(
      (s) => s.continuity_locks.identity_locks.length > 0 && s.continuity_locks.location_locks.length > 0
    )
      ? 'PASS'
      : 'FAIL';
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const final_verdict =
    errors.length === 0 &&
    loadedStates.length === SEED_GONEGI_STATE_SPECS.length &&
    registryStatus === 'PASS' &&
    worldTranslation === 'PASS' &&
    characterReplacement === 'PASS' &&
    identityPriority === 'PASS' &&
    duplicateGuard === 'PASS' &&
    continuity === 'PASS'
      ? GONEGI_COMPILER_PASS_VERDICT
      : GONEGI_COMPILER_FAIL_VERDICT;

  return {
    report_id: 'source-state-to-gonegi-state-report-v1',
    phase: GONEGI_COMPILER_PHASE,
    timestamp,
    gonegi_states: loadedStates.length,
    world_translation: worldTranslation,
    character_replacement: characterReplacement,
    identity_priority: identityPriority,
    duplicate_guard: duplicateGuard,
    continuity: continuity,
    registry: registryStatus,
    state_validations: stateValidations,
    design_only: true,
    gpu_execution: false,
    final_verdict,
    issues,
  };
}

function buildMarkdown(report: SourceStateToGonegiStateReport): string {
  const lines = [
    '# Source State to Gonegi State Summary',
    '',
    `**Phase:** ${GONEGI_COMPILER_PHASE}`,
    `**Verdict:** ${report.final_verdict}`,
    `**Timestamp:** ${report.timestamp}`,
    '',
    '## Pass Metrics',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| gonegi_states | ${report.gonegi_states} |`,
    `| world_translation | ${report.world_translation} |`,
    `| character_replacement | ${report.character_replacement} |`,
    `| identity_priority | ${report.identity_priority} |`,
    `| duplicate_guard | ${report.duplicate_guard} |`,
    `| continuity | ${report.continuity} |`,
    `| design_only | ${report.design_only} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    '',
    '## Compiled States',
    '',
    '| gonegi_state_id | source_state_draft_id |',
    '|-----------------|----------------------|',
  ];

  for (const spec of SEED_GONEGI_STATE_SPECS) {
    lines.push(`| ${spec.gonegi_state_id} | ${spec.source_state_draft_id} |`);
  }

  lines.push('', '## Pipeline Chain', '', '```');
  lines.push(
    'source movie state → world translation → character replacement → gonegi scene state → video shot state → keyframe → motion → gpu payload'
  );
  lines.push('```', '');

  if (report.state_validations.length > 0) {
    lines.push('## State Validations', '');
    for (const v of report.state_validations) {
      lines.push(`- **${v.gonegi_state_id}** ← ${v.source_state_draft_id}: ${v.status}`);
    }
    lines.push('');
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(
        `- [${issue.severity}] **${issue.code}**${issue.gonegi_state_id ? ` (${issue.gonegi_state_id})` : ''}: ${issue.message}`
      );
    }
    lines.push('');
  }

  lines.push('## Artifacts', '');
  lines.push(`- Schema: \`${GONEGI_STATE_SCHEMA_PATH}\``);
  lines.push(`- Registry: \`${GONEGI_STATE_REGISTRY_PATH}\``);
  lines.push(`- States: \`${GONEGI_STATES_DIR}/\``);
  lines.push(`- Report: \`${GONEGI_COMPILER_REPORT_PATH}\``);
  lines.push('');

  return lines.join('\n');
}

export function writeGonegiSceneStateReport(projectRoot?: string): SourceStateToGonegiStateReport {
  const root = resolveProjectRoot(projectRoot);
  const report = validateGonegiSceneStates(root);

  fs.writeFileSync(path.join(root, GONEGI_COMPILER_REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, GONEGI_COMPILER_MD_PATH), buildMarkdown(report), 'utf8');

  return report;
}
