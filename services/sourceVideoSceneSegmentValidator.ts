import fs from 'node:fs';
import path from 'node:path';
import {
  MOVIE_COORDINATE_REGISTRY_PATH,
} from './movieSceneCoordinateBuilder.js';
import {
  SCENE_STATE_MAP_REGISTRY_PATH,
} from './sourceVideoSceneStateMapper.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import {
  DIRECTOR_GRAMMAR_REGISTRY_PATH,
  EXTRACTABLE_FAMILIES,
  type ExtractableFamily,
} from './directorGrammarExtractor.js';
import {
  VIDEO_STATE_DEFAULTS_ID,
  VIDEO_STATE_DEFAULTS_PATH,
} from './sourceVideoGrammarToVideoStateCompiler.js';
import {
  COMPILER_PASS_VERDICT,
  COMPILER_REPORT_PATH,
} from './sourceVideoGrammarToVideoStateValidator.js';
import {
  SEGMENT_PHASE,
  SEGMENT_REGISTRY_PATH,
  SEGMENT_SCHEMA_PATH,
  SEGMENTS_DIR,
  SEED_SEGMENT_SPECS,
  type SourceVideoSceneSegment,
  loadSceneSegment,
} from './sourceVideoSceneSegmentBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SEGMENT_PASS_VERDICT = 'PASS_SOURCE_VIDEO_SCENE_SEGMENT_SCHEMA_V1' as const;
export const SEGMENT_FAIL_VERDICT = 'FAIL_SOURCE_VIDEO_SCENE_SEGMENT_SCHEMA_V1' as const;
export const SEGMENT_REPORT_PATH = 'reports/source-video-scene-segment-schema-report.json' as const;
export const SEGMENT_MD_PATH = 'reports/SOURCE_VIDEO_SCENE_SEGMENT_SCHEMA.md' as const;

const VALID_DOMINANT_GRAMMARS = [
  'visual_style',
  'camera_grammar',
  'lighting_grammar',
  'blocking_grammar',
  'emotion_grammar',
  'motion_grammar',
  'environment_grammar',
] as const;

export type SegmentValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  segment_id?: string;
};

export type SegmentValidationResult = {
  segment_id: string;
  status: 'PASS' | 'FAIL';
  issues: SegmentValidationIssue[];
};

export type SourceVideoSceneSegmentReport = {
  report_id: string;
  phase: typeof SEGMENT_PHASE;
  timestamp: string;
  segments: number;
  registry: 'PASS' | 'FAIL';
  source_links: 'PASS' | 'FAIL';
  grammar_refs: 'PASS' | 'FAIL';
  video_defaults_ref: 'PASS' | 'FAIL';
  segment_validations: SegmentValidationResult[];
  design_only: true;
  gpu_execution: false;
  final_verdict: typeof SEGMENT_PASS_VERDICT | typeof SEGMENT_FAIL_VERDICT;
  issues: SegmentValidationIssue[];
};

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function loadRegistryIds(projectRoot: string, registryPath: string, idField: string): Set<string> {
  const abs = path.join(projectRoot, registryPath);
  if (!fs.existsSync(abs)) return new Set();
  const registry = JSON.parse(fs.readFileSync(abs, 'utf8')) as Record<string, unknown>;
  const entries = (registry.coordinate_templates ??
    registry.mappings ??
    registry.coordinates ??
    []) as Array<Record<string, string>>;
  return new Set(entries.map((e) => e[idField]).filter(Boolean));
}

function validateExecutionFlags(segment: SourceVideoSceneSegment): SegmentValidationIssue[] {
  const issues: SegmentValidationIssue[] = [];
  const flags = segment.execution_flags;
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
      message: 'Segment execution_flags must be design-only with all execution disabled',
      severity: 'error',
      segment_id: segment.segment_id,
    });
  }
  return issues;
}

function validateSegment(
  segment: SourceVideoSceneSegment,
  activeVideoIds: Set<string>,
  grammarIds: Set<string>,
  coordinateIds: Set<string>,
  mappingIds: Set<string>
): SegmentValidationResult {
  const issues: SegmentValidationIssue[] = [];

  if (!activeVideoIds.has(segment.source_video_id)) {
    issues.push({
      code: 'INVALID_SOURCE_VIDEO_ID',
      message: `source_video_id ${segment.source_video_id} not in active final set`,
      severity: 'error',
      segment_id: segment.segment_id,
      field: 'source_video_id',
    });
  }

  if (segment.timestamp_end <= segment.timestamp_start) {
    issues.push({
      code: 'INVALID_TIMESTAMPS',
      message: 'timestamp_end must be greater than timestamp_start',
      severity: 'error',
      segment_id: segment.segment_id,
    });
  }

  const expectedDuration =
    Math.round((segment.timestamp_end - segment.timestamp_start) * 100) / 100;
  if (segment.duration_seconds <= 0 || segment.duration_seconds !== expectedDuration) {
    issues.push({
      code: 'INVALID_DURATION',
      message: `duration_seconds must be > 0 and match timestamp range (expected ${expectedDuration})`,
      severity: 'error',
      segment_id: segment.segment_id,
      field: 'duration_seconds',
    });
  }

  if (!EXTRACTABLE_FAMILIES.includes(segment.director_family)) {
    issues.push({
      code: 'INVALID_DIRECTOR_FAMILY',
      message: `Invalid director_family: ${segment.director_family}`,
      severity: 'error',
      segment_id: segment.segment_id,
      field: 'director_family',
    });
  }

  if (!VALID_DOMINANT_GRAMMARS.includes(segment.dominant_grammar)) {
    issues.push({
      code: 'INVALID_DOMINANT_GRAMMAR',
      message: `Invalid dominant_grammar: ${segment.dominant_grammar}`,
      severity: 'error',
      segment_id: segment.segment_id,
      field: 'dominant_grammar',
    });
  }

  if (!grammarIds.has(segment.director_grammar_ref)) {
    issues.push({
      code: 'INVALID_GRAMMAR_REF',
      message: `director_grammar_ref ${segment.director_grammar_ref} not in registry`,
      severity: 'error',
      segment_id: segment.segment_id,
      field: 'director_grammar_ref',
    });
  }

  if (segment.video_state_defaults_ref !== VIDEO_STATE_DEFAULTS_ID) {
    issues.push({
      code: 'INVALID_VIDEO_DEFAULTS_REF',
      message: `video_state_defaults_ref must be ${VIDEO_STATE_DEFAULTS_ID}`,
      severity: 'error',
      segment_id: segment.segment_id,
      field: 'video_state_defaults_ref',
    });
  }

  if (segment.coordinate_template_ref !== null) {
    if (!coordinateIds.has(segment.coordinate_template_ref)) {
      issues.push({
        code: 'INVALID_COORDINATE_REF',
        message: `coordinate_template_ref ${segment.coordinate_template_ref} not in movie coordinate registry`,
        severity: 'error',
        segment_id: segment.segment_id,
        field: 'coordinate_template_ref',
      });
    }
  }

  if (segment.scene_state_mapping_ref !== null) {
    if (!mappingIds.has(segment.scene_state_mapping_ref)) {
      issues.push({
        code: 'INVALID_MAPPING_REF',
        message: `scene_state_mapping_ref ${segment.scene_state_mapping_ref} not in scene state map registry`,
        severity: 'error',
        segment_id: segment.segment_id,
        field: 'scene_state_mapping_ref',
      });
    }
  }

  for (const ctx of [
    'location_context',
    'character_context',
    'camera_context',
    'lighting_context',
    'motion_context',
    'emotion_context',
  ] as const) {
    const block = segment[ctx];
    if (!block?.summary?.trim() || !block.tokens?.length) {
      issues.push({
        code: 'INCOMPLETE_CONTEXT',
        message: `${ctx} requires summary and tokens`,
        severity: 'error',
        segment_id: segment.segment_id,
        field: ctx,
      });
    }
  }

  issues.push(...validateExecutionFlags(segment));

  return {
    segment_id: segment.segment_id,
    status: issues.length === 0 ? 'PASS' : 'FAIL',
    issues,
  };
}

export function validateSourceVideoSceneSegments(
  projectRoot?: string
): SourceVideoSceneSegmentReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: SegmentValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  if (!fs.existsSync(path.join(root, SEGMENT_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `Missing ${SEGMENT_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  const compilerReportPath = path.join(root, COMPILER_REPORT_PATH);
  if (!fs.existsSync(compilerReportPath)) {
    issues.push({
      code: 'MISSING_UPSTREAM_COMPILER_REPORT',
      message: `Missing ${COMPILER_REPORT_PATH}. Run npm run verify:source-video-grammar-to-video-state first.`,
      severity: 'error',
    });
  } else {
    const compilerReport = JSON.parse(fs.readFileSync(compilerReportPath, 'utf8')) as {
      final_verdict?: string;
    };
    if (compilerReport.final_verdict !== COMPILER_PASS_VERDICT) {
      issues.push({
        code: 'UPSTREAM_COMPILER_NOT_PASS',
        message: `Video state compiler verdict is not ${COMPILER_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  if (!fs.existsSync(path.join(root, VIDEO_STATE_DEFAULTS_PATH))) {
    issues.push({
      code: 'MISSING_VIDEO_DEFAULTS',
      message: `Missing ${VIDEO_STATE_DEFAULTS_PATH}`,
      severity: 'error',
    });
  }

  let registryStatus: 'PASS' | 'FAIL' = 'FAIL';
  const registryPath = path.join(root, SEGMENT_REGISTRY_PATH);
  if (!fs.existsSync(registryPath)) {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `Missing ${SEGMENT_REGISTRY_PATH}`,
      severity: 'error',
    });
  } else {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as {
      segments?: Array<{ segment_id: string; segment_path: string }>;
    };
    if (registry.segments?.length === SEED_SEGMENT_SPECS.length) {
      const idsMatch = SEED_SEGMENT_SPECS.every((spec) =>
        registry.segments!.some(
          (e) =>
            e.segment_id === spec.segment_id &&
            e.segment_path === `${SEGMENTS_DIR}/${spec.segment_id}.json`
        )
      );
      registryStatus = idsMatch ? 'PASS' : 'FAIL';
      if (!idsMatch) {
        issues.push({
          code: 'REGISTRY_SEGMENT_MISMATCH',
          message: 'Registry segment entries do not match seed specs',
          severity: 'error',
        });
      }
    } else {
      issues.push({
        code: 'REGISTRY_SEGMENT_COUNT',
        message: `Registry must contain ${SEED_SEGMENT_SPECS.length} segments`,
        severity: 'error',
      });
    }
  }

  const finalSet = loadFinalSet(root);
  const activeVideoIds = new Set(
    finalSet?.videos.filter((v) => v.tier === 'active').map((v) => v.source_video_id) ?? []
  );

  const grammarRegistryPath = path.join(root, DIRECTOR_GRAMMAR_REGISTRY_PATH);
  const grammarIds = new Set<string>();
  if (fs.existsSync(grammarRegistryPath)) {
    const grammarRegistry = JSON.parse(fs.readFileSync(grammarRegistryPath, 'utf8')) as {
      grammar_profiles?: Array<{ grammar_id: string; source_family: ExtractableFamily }>;
    };
    for (const p of grammarRegistry.grammar_profiles ?? []) {
      grammarIds.add(p.grammar_id);
    }
  }

  const coordinateIds = loadRegistryIds(root, MOVIE_COORDINATE_REGISTRY_PATH, 'coordinate_id');
  const mappingIds = loadRegistryIds(root, SCENE_STATE_MAP_REGISTRY_PATH, 'mapping_id');

  const segmentValidations: SegmentValidationResult[] = [];
  const loadedSegments: SourceVideoSceneSegment[] = [];

  for (const spec of SEED_SEGMENT_SPECS) {
    const segment = loadSceneSegment(root, spec.segment_id);
    if (!segment) {
      issues.push({
        code: 'MISSING_SEGMENT',
        message: `Missing segment file for ${spec.segment_id}`,
        severity: 'error',
        segment_id: spec.segment_id,
      });
      segmentValidations.push({
        segment_id: spec.segment_id,
        status: 'FAIL',
        issues: [
          {
            code: 'MISSING_SEGMENT',
            message: `Missing segment file for ${spec.segment_id}`,
            severity: 'error',
            segment_id: spec.segment_id,
          },
        ],
      });
      continue;
    }

    loadedSegments.push(segment);
    const result = validateSegment(
      segment,
      activeVideoIds,
      grammarIds,
      coordinateIds,
      mappingIds
    );
    segmentValidations.push(result);
    issues.push(...result.issues);
  }

  let sourceLinks: 'PASS' | 'FAIL' = 'FAIL';
  let grammarRefs: 'PASS' | 'FAIL' = 'FAIL';
  let videoDefaultsRef: 'PASS' | 'FAIL' = 'FAIL';

  if (loadedSegments.length === SEED_SEGMENT_SPECS.length) {
    const allSourceValid = loadedSegments.every((s) => activeVideoIds.has(s.source_video_id));
    sourceLinks = allSourceValid ? 'PASS' : 'FAIL';

    const allGrammarValid = loadedSegments.every((s) => grammarIds.has(s.director_grammar_ref));
    grammarRefs = allGrammarValid ? 'PASS' : 'FAIL';

    const allDefaultsValid = loadedSegments.every(
      (s) => s.video_state_defaults_ref === VIDEO_STATE_DEFAULTS_ID
    );
    videoDefaultsRef = allDefaultsValid ? 'PASS' : 'FAIL';
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const final_verdict =
    errors.length === 0 &&
    loadedSegments.length === SEED_SEGMENT_SPECS.length &&
    registryStatus === 'PASS' &&
    sourceLinks === 'PASS' &&
    grammarRefs === 'PASS' &&
    videoDefaultsRef === 'PASS'
      ? SEGMENT_PASS_VERDICT
      : SEGMENT_FAIL_VERDICT;

  return {
    report_id: 'source-video-scene-segment-schema-report-v1',
    phase: SEGMENT_PHASE,
    timestamp,
    segments: loadedSegments.length,
    registry: registryStatus,
    source_links: sourceLinks,
    grammar_refs: grammarRefs,
    video_defaults_ref: videoDefaultsRef,
    segment_validations: segmentValidations,
    design_only: true,
    gpu_execution: false,
    final_verdict,
    issues,
  };
}

function buildMarkdown(report: SourceVideoSceneSegmentReport): string {
  const lines = [
    '# Source Video Scene Segment Schema Summary',
    '',
    `**Phase:** ${SEGMENT_PHASE}`,
    `**Verdict:** ${report.final_verdict}`,
    `**Timestamp:** ${report.timestamp}`,
    '',
    '## Pass Metrics',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| segments | ${report.segments} |`,
    `| registry | ${report.registry} |`,
    `| source_links | ${report.source_links} |`,
    `| grammar_refs | ${report.grammar_refs} |`,
    `| video_defaults_ref | ${report.video_defaults_ref} |`,
    `| design_only | ${report.design_only} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    '',
    '## Seed Segments',
    '',
    '| segment_id | source_video_id | director_family | coordinate_ref | mapping_ref |',
    '|------------|-----------------|-----------------|----------------|-------------|',
  ];

  for (const spec of SEED_SEGMENT_SPECS) {
    const coord = spec.coordinate_template_ref ?? '—';
    const mapping = spec.scene_state_mapping_ref ?? '—';
    lines.push(
      `| ${spec.segment_id} | ${spec.source_video_id} | ${spec.director_family} | ${coord} | ${mapping} |`
    );
  }

  lines.push('', '## Pipeline Chain', '', '```');
  lines.push(
    'source video → scene segments → movie coordinates → scene state mapping → video state defaults'
  );
  lines.push('```', '');

  if (report.segment_validations.length > 0) {
    lines.push('## Segment Validations', '');
    for (const v of report.segment_validations) {
      lines.push(`- **${v.segment_id}**: ${v.status}`);
    }
    lines.push('');
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(
        `- [${issue.severity}] **${issue.code}**${issue.segment_id ? ` (${issue.segment_id})` : ''}: ${issue.message}`
      );
    }
    lines.push('');
  }

  lines.push('## Artifacts', '');
  lines.push(`- Schema: \`${SEGMENT_SCHEMA_PATH}\``);
  lines.push(`- Registry: \`${SEGMENT_REGISTRY_PATH}\``);
  lines.push(`- Segments: \`${SEGMENTS_DIR}/\``);
  lines.push(`- Report: \`${SEGMENT_REPORT_PATH}\``);
  lines.push('');

  return lines.join('\n');
}

export function writeSourceVideoSceneSegmentReport(projectRoot?: string): SourceVideoSceneSegmentReport {
  const root = resolveProjectRoot(projectRoot);
  const report = validateSourceVideoSceneSegments(root);

  fs.writeFileSync(path.join(root, SEGMENT_REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, SEGMENT_MD_PATH), buildMarkdown(report), 'utf8');

  return report;
}
