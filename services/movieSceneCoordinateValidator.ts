import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import {
  DIRECTOR_GRAMMAR_PASS_VERDICT,
  DIRECTOR_GRAMMAR_REPORT_PATH,
} from './directorGrammarValidator.js';
import { FINAL_SET_PATH } from './sourceVideoFinalSetBuilder.js';
import {
  buildSeedCoordinateTemplates,
  MOVIE_COORDINATE_PHASE,
  MOVIE_COORDINATE_REGISTRY_PATH,
  MOVIE_COORDINATE_SCHEMA_PATH,
  SEED_COORDINATE_SPECS,
  type MovieSceneCoordinate,
} from './movieSceneCoordinateBuilder.js';
import { loadSourceVideoFinalSet } from './directorGrammarExtractor.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_COORDINATE_PASS_VERDICT = 'PASS_MOVIE_SCENE_COORDINATE_SYSTEM_V1' as const;
export const MOVIE_COORDINATE_FAIL_VERDICT = 'FAIL_MOVIE_SCENE_COORDINATE_SYSTEM_V1' as const;
export const MOVIE_COORDINATE_REPORT_PATH =
  'reports/movie-scene-coordinate-system-report.json' as const;
export const MOVIE_COORDINATE_MD_PATH = 'reports/MOVIE_SCENE_COORDINATE_SYSTEM.md' as const;

export type ValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
};

export type CoordinateTemplateValidation = {
  coordinate_id: string;
  valid: boolean;
  issues: ValidationIssue[];
};

export type MovieSceneCoordinateSystemReport = {
  system_id: string;
  phase: typeof MOVIE_COORDINATE_PHASE;
  timestamp: string;
  coordinate_templates: number;
  registry_status: 'PASS' | 'FAIL';
  source_links_status: 'PASS' | 'FAIL';
  grammar_refs_status: 'PASS' | 'FAIL';
  template_validations: CoordinateTemplateValidation[];
  design_only: true;
  gpu_execution: false;
  final_verdict: typeof MOVIE_COORDINATE_PASS_VERDICT | typeof MOVIE_COORDINATE_FAIL_VERDICT;
  issues: ValidationIssue[];
};

const REQUIRED_LAYERS = [
  'camera_coordinate',
  'character_coordinates',
  'location_coordinates',
  'lighting_coordinates',
  'blocking_map',
  'depth_layers',
  'continuity_locks',
] as const;

function validateUpstreamDirectorGrammar(projectRoot: string): ValidationIssue[] {
  const root = resolveProjectRoot(projectRoot);
  const issues: ValidationIssue[] = [];
  const reportPath = path.join(root, DIRECTOR_GRAMMAR_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'MISSING_UPSTREAM_REPORT',
      message: `Missing director grammar report: ${DIRECTOR_GRAMMAR_REPORT_PATH}`,
      severity: 'error',
    });
    return issues;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as { final_verdict?: string };
  if (report.final_verdict !== DIRECTOR_GRAMMAR_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_NOT_PASS',
      message: `Director grammar report must be ${DIRECTOR_GRAMMAR_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return issues;
}

function validateRegistry(
  projectRoot: string,
  templates: MovieSceneCoordinate[]
): ValidationIssue[] {
  const root = resolveProjectRoot(projectRoot);
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, MOVIE_COORDINATE_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `Missing ${MOVIE_COORDINATE_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  const registry = readJsonRecord(root, MOVIE_COORDINATE_REGISTRY_PATH) as {
    coordinate_templates?: Array<{
      coordinate_id: string;
      template_path: string;
      source_video_id: string;
      director_grammar_ref: string;
    }>;
  } | null;

  if (!registry?.coordinate_templates?.length) {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `Missing ${MOVIE_COORDINATE_REGISTRY_PATH}`,
      severity: 'error',
    });
    return issues;
  }

  const builtIds = new Set(templates.map((t) => t.coordinate_id));
  for (const entry of registry.coordinate_templates) {
    if (!builtIds.has(entry.coordinate_id)) {
      issues.push({
        code: 'REGISTRY_ORPHAN',
        message: `Registry missing built template: ${entry.coordinate_id}`,
        severity: 'error',
      });
    }
    if (!fs.existsSync(path.join(root, entry.template_path))) {
      issues.push({
        code: 'MISSING_TEMPLATE_FILE',
        message: `Template file missing: ${entry.template_path}`,
        severity: 'error',
      });
    }
    const template = templates.find((t) => t.coordinate_id === entry.coordinate_id);
    if (template && template.source_video_id !== entry.source_video_id) {
      issues.push({
        code: 'REGISTRY_SOURCE_MISMATCH',
        message: `${entry.coordinate_id} source_video_id mismatch`,
        severity: 'error',
      });
    }
    if (
      template &&
      !template.director_grammar_refs.includes(entry.director_grammar_ref)
    ) {
      issues.push({
        code: 'REGISTRY_GRAMMAR_MISMATCH',
        message: `${entry.coordinate_id} director_grammar_ref mismatch`,
        severity: 'error',
      });
    }
  }

  if (registry.coordinate_templates.length !== 3) {
    issues.push({
      code: 'REGISTRY_COUNT',
      message: `Expected 3 coordinate templates in registry, got ${registry.coordinate_templates.length}`,
      severity: 'error',
    });
  }

  return issues;
}

export function validateCoordinateTemplate(
  projectRoot: string,
  template: MovieSceneCoordinate
): CoordinateTemplateValidation {
  const issues: ValidationIssue[] = [];
  const finalSet = loadSourceVideoFinalSet(projectRoot);

  if (!finalSet) {
    issues.push({
      code: 'MISSING_FINAL_SET',
      message: 'Cannot validate without final set',
      severity: 'error',
    });
    return { coordinate_id: template.coordinate_id, valid: false, issues };
  }

  const video = finalSet.videos.find((v) => v.source_video_id === template.source_video_id);
  if (!video) {
    issues.push({
      code: 'SOURCE_LINK_INVALID',
      message: `source_video_id not in final set: ${template.source_video_id}`,
      severity: 'error',
      field: 'source_video_id',
    });
  } else if (!video.file_present || video.tier !== 'active') {
    issues.push({
      code: 'SOURCE_LINK_INVALID',
      message: `${template.source_video_id} must be active and present`,
      severity: 'error',
      field: 'source_video_id',
    });
  }

  if (template.timestamp_end <= template.timestamp_start) {
    issues.push({
      code: 'TIMESTAMP_ORDER_INVALID',
      message: 'timestamp_end must be greater than timestamp_start',
      severity: 'error',
    });
  }

  for (const layer of REQUIRED_LAYERS) {
    const value = template[layer as keyof MovieSceneCoordinate];
    if (value == null || (Array.isArray(value) && value.length === 0)) {
      issues.push({
        code: 'LAYER_MISSING',
        message: `Required coordinate layer missing: ${layer}`,
        severity: 'error',
        field: layer,
      });
    }
  }

  if (!template.continuity_locks.identity_locks.length) {
    issues.push({
      code: 'IDENTITY_SAFE_MISSING',
      message: 'continuity_locks.identity_locks required',
      severity: 'error',
    });
  } else if (
    !template.continuity_locks.identity_locks.some((l) => l.startsWith('identity_anchor:'))
  ) {
    issues.push({
      code: 'IDENTITY_SAFE_MISSING',
      message: 'identity_locks must include identity_anchor tokens',
      severity: 'error',
    });
  }

  if (!template.continuity_locks.location_locks.length) {
    issues.push({
      code: 'IDENTITY_SAFE_MISSING',
      message: 'continuity_locks.location_locks required',
      severity: 'error',
    });
  }

  if (!template.director_grammar_refs.length) {
    issues.push({
      code: 'GRAMMAR_REF_MISSING',
      message: 'director_grammar_refs required',
      severity: 'error',
    });
  }

  const grammarRegistry = readJsonRecord(projectRoot, 'datasets/director_grammar/director-grammar-registry.json') as {
    grammar_profiles?: Array<{ grammar_id: string }>;
  } | null;

  for (const ref of template.director_grammar_refs) {
    if (!grammarRegistry?.grammar_profiles?.some((p) => p.grammar_id === ref)) {
      issues.push({
        code: 'GRAMMAR_REF_INVALID',
        message: `Invalid director_grammar_ref: ${ref}`,
        severity: 'error',
      });
    }
  }

  if (template.execution_flags.design_only !== true) {
    issues.push({
      code: 'EXECUTION_UNSAFE',
      message: 'design_only must be true',
      severity: 'error',
    });
  }
  if (template.execution_flags.gpu_execution !== false) {
    issues.push({
      code: 'EXECUTION_UNSAFE',
      message: 'gpu_execution must be false',
      severity: 'error',
    });
  }
  if (template.execution_flags.frame_extraction !== false) {
    issues.push({
      code: 'EXECUTION_UNSAFE',
      message: 'frame_extraction must be false',
      severity: 'error',
    });
  }
  if (template.execution_flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXECUTION_UNSAFE',
      message: 'external_call_allowed must be false',
      severity: 'error',
    });
  }

  return {
    coordinate_id: template.coordinate_id,
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

export function runMovieSceneCoordinateValidation(
  projectRoot: string,
  templates: MovieSceneCoordinate[]
): MovieSceneCoordinateSystemReport {
  const issues: ValidationIssue[] = [
    ...validateUpstreamDirectorGrammar(projectRoot),
    ...validateRegistry(projectRoot, templates),
  ];

  const template_validations = templates.map((t) =>
    validateCoordinateTemplate(projectRoot, t)
  );
  issues.push(...template_validations.flatMap((v) => v.issues));

  if (templates.length !== SEED_COORDINATE_SPECS.length) {
    issues.push({
      code: 'TEMPLATE_COUNT',
      message: `Expected ${SEED_COORDINATE_SPECS.length} templates, got ${templates.length}`,
      severity: 'error',
    });
  }

  const sourceLinkFail = issues.some((i) => i.code === 'SOURCE_LINK_INVALID');
  const grammarFail = issues.some((i) =>
    ['GRAMMAR_REF_INVALID', 'GRAMMAR_REF_MISSING', 'REGISTRY_GRAMMAR_MISMATCH'].includes(i.code)
  );
  const registryFail = issues.some((i) =>
    ['MISSING_REGISTRY', 'REGISTRY_ORPHAN', 'REGISTRY_COUNT', 'MISSING_TEMPLATE_FILE'].includes(
      i.code
    )
  );

  const errors = issues.filter((i) => i.severity === 'error');
  const pass =
    errors.length === 0 &&
    templates.length === 3 &&
    !sourceLinkFail &&
    !grammarFail &&
    !registryFail;

  return {
    system_id: `movie_coord_sys_${Date.now().toString(36)}`,
    phase: MOVIE_COORDINATE_PHASE,
    timestamp: new Date().toISOString(),
    coordinate_templates: templates.length,
    registry_status: registryFail ? 'FAIL' : 'PASS',
    source_links_status: sourceLinkFail ? 'FAIL' : 'PASS',
    grammar_refs_status: grammarFail ? 'FAIL' : 'PASS',
    template_validations,
    design_only: true,
    gpu_execution: false,
    final_verdict: pass ? MOVIE_COORDINATE_PASS_VERDICT : MOVIE_COORDINATE_FAIL_VERDICT,
    issues,
  };
}

export function renderMovieCoordinateMarkdown(
  templates: MovieSceneCoordinate[],
  report: MovieSceneCoordinateSystemReport
): string {
  const templateLines = templates
    .map(
      (t) =>
        `- **${t.coordinate_id}** · \`${t.source_video_id}\` · scene ${t.scene_index} · ${t.timestamp_start}s–${t.timestamp_end}s · grammar: ${t.director_grammar_refs.join(', ')}`
    )
    .join('\n');

  return [
    '# Movie Scene Coordinate System',
    '',
    '## Verdict',
    '',
    '| Field | Value |',
    '|-------|-------|',
    `| **Verdict** | ${report.final_verdict} |`,
    `| **Coordinate templates** | ${report.coordinate_templates} |`,
    `| **Registry** | ${report.registry_status} |`,
    `| **Source links** | ${report.source_links_status} |`,
    `| **Grammar refs** | ${report.grammar_refs_status} |`,
    `| **Design only** | ${report.design_only} |`,
    `| **GPU execution** | ${report.gpu_execution} |`,
    '',
    '## Pipeline',
    '',
    '```',
    'source video → scene coordinate data → scene state conversion → Gonegi-style reconstruction',
    '```',
    '',
    '## Seed Templates',
    '',
    templateLines,
    '',
    '## Coordinate Layers',
    '',
    'Each template defines design-only spatial data for:',
    '- camera_coordinate',
    '- character_coordinates',
    '- prop_coordinates',
    '- location_coordinates',
    '- lighting_coordinates',
    '- motion_vectors',
    '- blocking_map',
    '- depth_layers',
    '- continuity_locks (identity-safe)',
    '',
    '## Safety',
    '',
    '- Design only — no frame extraction, OCR, GPU, generation, or production asset changes.',
    '- Next phase: Source Video to Scene State Mapping (PHASE-SOURCE-VIDEO-005).',
    '',
    `*Generated ${report.timestamp} · ${report.phase}*`,
    '',
  ].join('\n');
}

export function writeMovieSceneCoordinateSystemReport(projectRoot: string): {
  templates: MovieSceneCoordinate[];
  report: MovieSceneCoordinateSystemReport;
} {
  const root = resolveProjectRoot(projectRoot);
  const templates = buildSeedCoordinateTemplates(root);
  const report = runMovieSceneCoordinateValidation(root, templates);

  const payload = {
    ...report,
    report_type: 'movie_scene_coordinate_system_report',
    report_version: 'v1',
    export_path: MOVIE_COORDINATE_REPORT_PATH,
    markdown_path: MOVIE_COORDINATE_MD_PATH,
    schema_path: MOVIE_COORDINATE_SCHEMA_PATH,
    registry_path: MOVIE_COORDINATE_REGISTRY_PATH,
    final_set_path: FINAL_SET_PATH,
    director_grammar_registry_path: 'datasets/director_grammar/director-grammar-registry.json',
    template_ids: templates.map((t) => t.coordinate_id),
    next_phase: 'PHASE-SOURCE-VIDEO-005 SOURCE_VIDEO_TO_SCENE_STATE_MAPPING_V1',
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, MOVIE_COORDINATE_REPORT_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MOVIE_COORDINATE_MD_PATH),
    `${renderMovieCoordinateMarkdown(templates, report)}\n`,
    'utf8'
  );

  return { templates, report };
}
