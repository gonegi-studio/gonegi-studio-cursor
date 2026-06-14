import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import { MOVIE_COORDINATE_PASS_VERDICT, MOVIE_COORDINATE_REPORT_PATH } from './movieSceneCoordinateValidator.js';
import {
  buildSeedSceneStateMappings,
  SCENE_STATE_MAP_PHASE,
  SCENE_STATE_MAP_REGISTRY_PATH,
  SCENE_STATE_MAP_SCHEMA_PATH,
  SCENE_STATE_SCHEMA_PATH,
  STANDARD_COORDINATE_TO_STATE_MAP,
  type MappedSceneStateDraft,
  type SourceVideoSceneStateMap,
} from './sourceVideoSceneStateMapper.js';
import { IDENTITY_CONTRACT_SOURCE } from './sceneStateBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SCENE_STATE_MAP_PASS_VERDICT = 'PASS_SOURCE_VIDEO_SCENE_STATE_MAPPING_V1' as const;
export const SCENE_STATE_MAP_FAIL_VERDICT = 'FAIL_SOURCE_VIDEO_SCENE_STATE_MAPPING_V1' as const;
export const SCENE_STATE_MAP_REPORT_PATH =
  'reports/source-video-scene-state-mapping-report.json' as const;
export const SCENE_STATE_MAP_MD_PATH = 'reports/SOURCE_VIDEO_SCENE_STATE_MAPPING.md' as const;

const REQUIRED_SCENE_STATE_LAYERS = [
  'character_state',
  'location_state',
  'lighting_state',
  'emotion_state',
  'relationship_state',
  'camera_state',
  'composition_state',
  'environment_state',
  'identity_state',
] as const;

const FORBIDDEN_IDENTITY_TOKENS = [
  'identity_override',
  'no_identity_lock',
  'identity_reset',
] as const;

export type ValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
};

export type MappingValidationResult = {
  mapping_id: string;
  valid: boolean;
  issues: ValidationIssue[];
};

export type SceneStateMappingReport = {
  mapping_id: string;
  phase: typeof SCENE_STATE_MAP_PHASE;
  timestamp: string;
  mappings: number;
  mapped_scene_states: number;
  identity_priority: 'PASS' | 'FAIL';
  scene_state_layers: 'PASS' | 'FAIL';
  grammar_refs: 'PASS' | 'FAIL';
  registry_status: 'PASS' | 'FAIL';
  mapping_validations: MappingValidationResult[];
  design_only: true;
  gpu_execution: false;
  final_verdict: typeof SCENE_STATE_MAP_PASS_VERDICT | typeof SCENE_STATE_MAP_FAIL_VERDICT;
  issues: ValidationIssue[];
};

function validateUpstreamMovieCoordinate(projectRoot: string): ValidationIssue[] {
  const root = resolveProjectRoot(projectRoot);
  const issues: ValidationIssue[] = [];
  const reportPath = path.join(root, MOVIE_COORDINATE_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'MISSING_UPSTREAM_REPORT',
      message: `Missing movie coordinate report: ${MOVIE_COORDINATE_REPORT_PATH}`,
      severity: 'error',
    });
    return issues;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as { final_verdict?: string };
  if (report.final_verdict !== MOVIE_COORDINATE_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_NOT_PASS',
      message: `Movie coordinate report must be ${MOVIE_COORDINATE_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return issues;
}

function validateRegistry(
  projectRoot: string,
  pairs: Array<{ mapping: SourceVideoSceneStateMap; draft: MappedSceneStateDraft }>
): ValidationIssue[] {
  const root = resolveProjectRoot(projectRoot);
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, SCENE_STATE_MAP_SCHEMA_PATH))) {
    issues.push({ code: 'MISSING_SCHEMA', message: `Missing ${SCENE_STATE_MAP_SCHEMA_PATH}`, severity: 'error' });
  }
  if (!fs.existsSync(path.join(root, SCENE_STATE_SCHEMA_PATH))) {
    issues.push({ code: 'MISSING_SCHEMA', message: `Missing ${SCENE_STATE_SCHEMA_PATH}`, severity: 'error' });
  }

  const registry = readJsonRecord(root, SCENE_STATE_MAP_REGISTRY_PATH) as {
    mappings?: Array<{
      mapping_id: string;
      mapping_path: string;
      draft_path: string;
      target_scene_state_id: string;
    }>;
  } | null;

  if (!registry?.mappings?.length) {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `Missing ${SCENE_STATE_MAP_REGISTRY_PATH}`,
      severity: 'error',
    });
    return issues;
  }

  const builtIds = new Set(pairs.map((p) => p.mapping.mapping_id));
  for (const entry of registry.mappings) {
    if (!builtIds.has(entry.mapping_id)) {
      issues.push({
        code: 'REGISTRY_ORPHAN',
        message: `Registry missing built mapping: ${entry.mapping_id}`,
        severity: 'error',
      });
    }
    if (!fs.existsSync(path.join(root, entry.mapping_path))) {
      issues.push({
        code: 'MISSING_MAPPING_FILE',
        message: `Mapping file missing: ${entry.mapping_path}`,
        severity: 'error',
      });
    }
    if (!fs.existsSync(path.join(root, entry.draft_path))) {
      issues.push({
        code: 'MISSING_DRAFT_FILE',
        message: `Draft file missing: ${entry.draft_path}`,
        severity: 'error',
      });
    }
  }

  if (registry.mappings.length !== 3) {
    issues.push({
      code: 'REGISTRY_COUNT',
      message: `Expected 3 mappings in registry, got ${registry.mappings.length}`,
      severity: 'error',
    });
  }

  return issues;
}

export function validateSceneStateMappingPair(
  projectRoot: string,
  mapping: SourceVideoSceneStateMap,
  draft: MappedSceneStateDraft
): MappingValidationResult {
  const issues: ValidationIssue[] = [];
  const root = resolveProjectRoot(projectRoot);

  const coordPath = readJsonRecord(root, 'datasets/movie_coordinate/movie-scene-coordinate-registry.json') as {
    coordinate_templates?: Array<{ coordinate_id: string; template_path: string }>;
  } | null;

  const coordEntry = coordPath?.coordinate_templates?.find(
    (t) => t.coordinate_id === mapping.source_coordinate_id
  );
  if (!coordEntry || !fs.existsSync(path.join(root, coordEntry.template_path))) {
    issues.push({
      code: 'COORDINATE_SOURCE_MISSING',
      message: `Coordinate source missing: ${mapping.source_coordinate_id}`,
      severity: 'error',
    });
  }

  if (mapping.target_scene_state_id !== draft.scene_state_id) {
    issues.push({
      code: 'TARGET_MISMATCH',
      message: 'mapping target_scene_state_id must match draft scene_state_id',
      severity: 'error',
    });
  }

  if (
    JSON.stringify(mapping.coordinate_to_state_map) !==
    JSON.stringify(STANDARD_COORDINATE_TO_STATE_MAP)
  ) {
    issues.push({
      code: 'MAP_CONTRACT_INVALID',
      message: 'coordinate_to_state_map must match standard contract',
      severity: 'error',
    });
  }

  for (const layer of REQUIRED_SCENE_STATE_LAYERS) {
    const value = draft[layer as keyof MappedSceneStateDraft];
    if (value == null || (typeof value === 'object' && Object.keys(value as object).length === 0)) {
      issues.push({
        code: 'LAYER_MISSING',
        message: `Required scene state layer missing: ${layer}`,
        severity: 'error',
        field: layer,
      });
    }
  }

  if (draft.identity_state.identity_priority_rank !== 1) {
    issues.push({
      code: 'IDENTITY_PRIORITY_FAIL',
      message: 'identity_priority_rank must be 1 (character-first preserved)',
      severity: 'error',
    });
  }

  if (draft.identity_state.character_first_contract !== IDENTITY_CONTRACT_SOURCE) {
    issues.push({
      code: 'IDENTITY_PRIORITY_FAIL',
      message: 'character_first_contract must reference identity contract',
      severity: 'error',
    });
  }

  for (const token of draft.identity_state.identity_lock_tokens) {
    for (const forbidden of FORBIDDEN_IDENTITY_TOKENS) {
      if (token.includes(forbidden)) {
        issues.push({
          code: 'IDENTITY_OVERRIDE',
          message: `Forbidden identity token: ${token}`,
          severity: 'error',
        });
      }
    }
  }

  if (!draft.character_state.primary_character_id) {
    issues.push({
      code: 'CHARACTER_PRIORITY_FAIL',
      message: 'primary_character_id required',
      severity: 'error',
    });
  }

  if (
    !draft.character_state.active_character_ids.includes(draft.character_state.primary_character_id)
  ) {
    issues.push({
      code: 'CHARACTER_PRIORITY_FAIL',
      message: 'primary_character_id must be in active_character_ids',
      severity: 'error',
    });
  }

  const grammarRegistry = readJsonRecord(
    root,
    'datasets/director_grammar/director-grammar-registry.json'
  ) as { grammar_profiles?: Array<{ grammar_id: string }> } | null;

  for (const ref of mapping.director_grammar_refs) {
    if (!grammarRegistry?.grammar_profiles?.some((p) => p.grammar_id === ref)) {
      issues.push({
        code: 'GRAMMAR_REF_INVALID',
        message: `Invalid director_grammar_ref: ${ref}`,
        severity: 'error',
      });
    }
  }

  if (mapping.execution_flags.gpu_execution !== false) {
    issues.push({ code: 'EXECUTION_UNSAFE', message: 'gpu_execution must be false', severity: 'error' });
  }
  if (mapping.execution_flags.design_only !== true) {
    issues.push({ code: 'EXECUTION_UNSAFE', message: 'design_only must be true', severity: 'error' });
  }
  if (draft.gpu_execution !== false || draft.design_only !== true) {
    issues.push({ code: 'EXECUTION_UNSAFE', message: 'draft execution flags must be safe', severity: 'error' });
  }

  const productionSceneDir = path.join(root, 'datasets/state/scene-states');
  const productionFiles = fs.existsSync(productionSceneDir)
    ? fs.readdirSync(productionSceneDir)
    : [];
  if (productionFiles.includes(`${draft.scene_state_id}.json`)) {
    issues.push({
      code: 'PRODUCTION_MUTATION',
      message: `Draft must not overwrite production scene state: ${draft.scene_state_id}`,
      severity: 'error',
    });
  }

  return {
    mapping_id: mapping.mapping_id,
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

export function runSceneStateMappingValidation(
  projectRoot: string,
  pairs: Array<{ mapping: SourceVideoSceneStateMap; draft: MappedSceneStateDraft }>
): SceneStateMappingReport {
  const issues: ValidationIssue[] = [
    ...validateUpstreamMovieCoordinate(projectRoot),
    ...validateRegistry(projectRoot, pairs),
  ];

  const mapping_validations = pairs.map((p) =>
    validateSceneStateMappingPair(projectRoot, p.mapping, p.draft)
  );
  issues.push(...mapping_validations.flatMap((v) => v.issues));

  const identityFail = issues.some((i) =>
    ['IDENTITY_OVERRIDE', 'IDENTITY_PRIORITY_FAIL'].includes(i.code)
  );
  const layerFail = issues.some((i) => i.code === 'LAYER_MISSING');
  const grammarFail = issues.some((i) => i.code === 'GRAMMAR_REF_INVALID');
  const registryFail = issues.some((i) =>
    ['MISSING_REGISTRY', 'REGISTRY_ORPHAN', 'MISSING_MAPPING_FILE', 'MISSING_DRAFT_FILE'].includes(
      i.code
    )
  );

  const errors = issues.filter((i) => i.severity === 'error');
  const pass =
    errors.length === 0 &&
    pairs.length === 3 &&
    !identityFail &&
    !layerFail &&
    !grammarFail &&
    !registryFail;

  return {
    mapping_id: `scene_state_map_${Date.now().toString(36)}`,
    phase: SCENE_STATE_MAP_PHASE,
    timestamp: new Date().toISOString(),
    mappings: pairs.length,
    mapped_scene_states: pairs.length,
    identity_priority: identityFail ? 'FAIL' : 'PASS',
    scene_state_layers: layerFail ? 'FAIL' : 'PASS',
    grammar_refs: grammarFail ? 'FAIL' : 'PASS',
    registry_status: registryFail ? 'FAIL' : 'PASS',
    mapping_validations,
    design_only: true,
    gpu_execution: false,
    final_verdict: pass ? SCENE_STATE_MAP_PASS_VERDICT : SCENE_STATE_MAP_FAIL_VERDICT,
    issues,
  };
}

export function renderSceneStateMappingMarkdown(
  pairs: Array<{ mapping: SourceVideoSceneStateMap; draft: MappedSceneStateDraft }>,
  report: SceneStateMappingReport
): string {
  const lines = pairs
    .map(
      (p) =>
        `- **${p.mapping.mapping_id}** → \`${p.draft.scene_state_id}\` (source: ${p.mapping.source_coordinate_id})`
    )
    .join('\n');

  return [
    '# Source Video to Scene State Mapping',
    '',
    '## Verdict',
    '',
    '| Field | Value |',
    '|-------|-------|',
    `| **Verdict** | ${report.final_verdict} |`,
    `| **Mappings** | ${report.mappings} |`,
    `| **Mapped scene states** | ${report.mapped_scene_states} |`,
    `| **Identity priority** | ${report.identity_priority} |`,
    `| **Scene state layers** | ${report.scene_state_layers} |`,
    `| **Grammar refs** | ${report.grammar_refs} |`,
    `| **Registry** | ${report.registry_status} |`,
    `| **Design only** | ${report.design_only} |`,
    `| **GPU execution** | ${report.gpu_execution} |`,
    '',
    '## Pipeline',
    '',
    '```',
    'movie coordinate → scene state → video shot state → keyframe plan → motion plan → GPU payload',
    '```',
    '',
    '## Coordinate → State Map',
    '',
    '- camera_coordinate → camera_state',
    '- character_coordinates → character_state',
    '- prop_coordinates → composition_state',
    '- location_coordinates → location_state',
    '- lighting_coordinates → lighting_state',
    '- motion_vectors → camera_state / environment_state',
    '- blocking_map → relationship_state / composition_state',
    '- depth_layers → composition_state',
    '- continuity_locks → identity_state',
    '',
    '## Seed Mappings',
    '',
    lines,
    '',
    '## Safety',
    '',
    '- Mapping only — no frame extraction, OCR, GPU, generation, or production asset changes.',
    '- Identity priority rank 1 preserved; no identity override tokens.',
    '- Next phase: Director Grammar Blend Contract (PHASE-SOURCE-VIDEO-006).',
    '',
    `*Generated ${report.timestamp} · ${report.phase}*`,
    '',
  ].join('\n');
}

export function writeSceneStateMappingReport(projectRoot: string): {
  pairs: Array<{ mapping: SourceVideoSceneStateMap; draft: MappedSceneStateDraft }>;
  report: SceneStateMappingReport;
} {
  const root = resolveProjectRoot(projectRoot);
  const pairs = buildSeedSceneStateMappings(root);
  const report = runSceneStateMappingValidation(root, pairs);

  const payload = {
    ...report,
    report_type: 'source_video_scene_state_mapping_report',
    report_version: 'v1',
    export_path: SCENE_STATE_MAP_REPORT_PATH,
    markdown_path: SCENE_STATE_MAP_MD_PATH,
    schema_path: SCENE_STATE_MAP_SCHEMA_PATH,
    registry_path: SCENE_STATE_MAP_REGISTRY_PATH,
    scene_state_schema_path: SCENE_STATE_SCHEMA_PATH,
    mapped_scene_state_ids: pairs.map((p) => p.draft.scene_state_id),
    next_phase: 'PHASE-SOURCE-VIDEO-006 DIRECTOR_GRAMMAR_BLEND_CONTRACT_V1',
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, SCENE_STATE_MAP_REPORT_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SCENE_STATE_MAP_MD_PATH),
    `${renderSceneStateMappingMarkdown(pairs, report)}\n`,
    'utf8'
  );

  return { pairs, report };
}
