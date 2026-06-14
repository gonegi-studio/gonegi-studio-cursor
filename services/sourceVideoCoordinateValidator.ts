import fs from 'node:fs';
import path from 'node:path';
import {
  DIRECTOR_GRAMMAR_REGISTRY_PATH,
  EXTRACTABLE_FAMILIES,
} from './directorGrammarExtractor.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import {
  SCENE_STATE_MAP_REGISTRY_PATH,
} from './sourceVideoSceneStateMapper.js';
import {
  SEGMENT_PASS_VERDICT,
  SEGMENT_REPORT_PATH,
} from './sourceVideoSceneSegmentValidator.js';
import {
  SEGMENT_REGISTRY_PATH,
  loadSceneSegment,
} from './sourceVideoSceneSegmentBuilder.js';
import {
  COORDINATE_COMPILER_PHASE,
  COORDINATE_REGISTRY_PATH,
  COORDINATE_SCHEMA_PATH,
  COORDINATE_RECORDS_DIR,
  SEED_COORDINATE_SPECS,
  type SourceVideoCoordinateRecord,
  loadCoordinateRecord,
} from './sourceVideoSegmentToCoordinateCompiler.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const COORDINATE_PASS_VERDICT = 'PASS_SOURCE_VIDEO_SEGMENT_TO_COORDINATE_COMPILER_V1' as const;
export const COORDINATE_FAIL_VERDICT = 'FAIL_SOURCE_VIDEO_SEGMENT_TO_COORDINATE_COMPILER_V1' as const;
export const COORDINATE_REPORT_PATH = 'reports/source-video-segment-coordinate-report.json' as const;
export const COORDINATE_MD_PATH = 'reports/SOURCE_VIDEO_SEGMENT_TO_COORDINATE.md' as const;

export type CoordinateValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  coordinate_record_id?: string;
};

export type CoordinateRecordValidation = {
  coordinate_record_id: string;
  segment_id: string;
  status: 'PASS' | 'FAIL';
  issues: CoordinateValidationIssue[];
};

export type SourceVideoCoordinateReport = {
  report_id: string;
  phase: typeof COORDINATE_COMPILER_PHASE;
  timestamp: string;
  coordinate_records: number;
  registry: 'PASS' | 'FAIL';
  segment_links: 'PASS' | 'FAIL';
  grammar_refs: 'PASS' | 'FAIL';
  identity_locks: 'PASS' | 'FAIL';
  record_validations: CoordinateRecordValidation[];
  design_only: true;
  gpu_execution: false;
  final_verdict: typeof COORDINATE_PASS_VERDICT | typeof COORDINATE_FAIL_VERDICT;
  issues: CoordinateValidationIssue[];
};

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function loadGrammarIds(projectRoot: string): Set<string> {
  const abs = path.join(projectRoot, DIRECTOR_GRAMMAR_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return new Set();
  const registry = JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    grammar_profiles?: Array<{ grammar_id: string }>;
  };
  return new Set((registry.grammar_profiles ?? []).map((p) => p.grammar_id));
}

function loadMappingIds(projectRoot: string): Set<string> {
  const abs = path.join(projectRoot, SCENE_STATE_MAP_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return new Set();
  const registry = JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    mappings?: Array<{ mapping_id: string }>;
  };
  return new Set((registry.mappings ?? []).map((m) => m.mapping_id));
}

function validateExecutionFlags(record: SourceVideoCoordinateRecord): CoordinateValidationIssue[] {
  const flags = record.execution_flags;
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
        message: 'Coordinate execution_flags must be design-only with all execution disabled',
        severity: 'error',
        coordinate_record_id: record.coordinate_record_id,
      },
    ];
  }
  return [];
}

function validateCoordinateLayers(record: SourceVideoCoordinateRecord): CoordinateValidationIssue[] {
  const issues: CoordinateValidationIssue[] = [];

  if (!record.camera_coordinate?.position || !record.camera_coordinate.shot_type) {
    issues.push({
      code: 'INCOMPLETE_CAMERA_LAYER',
      message: 'camera_coordinate incomplete',
      severity: 'error',
      coordinate_record_id: record.coordinate_record_id,
      field: 'camera_coordinate',
    });
  }

  if (!record.character_coordinate?.length) {
    issues.push({
      code: 'INCOMPLETE_CHARACTER_LAYER',
      message: 'character_coordinate requires at least one entry',
      severity: 'error',
      coordinate_record_id: record.coordinate_record_id,
      field: 'character_coordinate',
    });
  }

  if (!record.location_coordinate?.space_type || !record.location_coordinate.anchor_point) {
    issues.push({
      code: 'INCOMPLETE_LOCATION_LAYER',
      message: 'location_coordinate incomplete',
      severity: 'error',
      coordinate_record_id: record.coordinate_record_id,
      field: 'location_coordinate',
    });
  }

  if (!record.lighting_coordinate?.key_direction) {
    issues.push({
      code: 'INCOMPLETE_LIGHTING_LAYER',
      message: 'lighting_coordinate incomplete',
      severity: 'error',
      coordinate_record_id: record.coordinate_record_id,
      field: 'lighting_coordinate',
    });
  }

  if (!record.motion_coordinate?.length) {
    issues.push({
      code: 'INCOMPLETE_MOTION_LAYER',
      message: 'motion_coordinate requires at least one entry',
      severity: 'error',
      coordinate_record_id: record.coordinate_record_id,
      field: 'motion_coordinate',
    });
  }

  if (!record.blocking_coordinate?.primary_focus) {
    issues.push({
      code: 'INCOMPLETE_BLOCKING_LAYER',
      message: 'blocking_coordinate incomplete',
      severity: 'error',
      coordinate_record_id: record.coordinate_record_id,
      field: 'blocking_coordinate',
    });
  }

  if (!record.depth_coordinate || record.depth_coordinate.length < 2) {
    issues.push({
      code: 'INCOMPLETE_DEPTH_LAYER',
      message: 'depth_coordinate requires at least two layers',
      severity: 'error',
      coordinate_record_id: record.coordinate_record_id,
      field: 'depth_coordinate',
    });
  }

  return issues;
}

function validateIdentityLocks(record: SourceVideoCoordinateRecord): CoordinateValidationIssue[] {
  const issues: CoordinateValidationIssue[] = [];
  const locks = record.continuity_locks?.identity_locks ?? [];

  if (locks.length === 0) {
    issues.push({
      code: 'MISSING_IDENTITY_LOCKS',
      message: 'continuity_locks.identity_locks required',
      severity: 'error',
      coordinate_record_id: record.coordinate_record_id,
      field: 'continuity_locks.identity_locks',
    });
    return issues;
  }

  const hasAnchor = locks.some(
    (l) => l.includes('identity_anchor') || l.includes('identity_lock')
  );
  if (!hasAnchor) {
    issues.push({
      code: 'IDENTITY_LOCKS_NOT_PRESERVED',
      message: 'identity_locks must include identity_anchor or identity_lock tokens',
      severity: 'error',
      coordinate_record_id: record.coordinate_record_id,
      field: 'continuity_locks.identity_locks',
    });
  }

  for (const character of record.character_coordinate) {
    if (!character.identity_anchor?.trim()) {
      issues.push({
        code: 'CHARACTER_IDENTITY_ANCHOR_MISSING',
        message: `character ${character.character_ref} missing identity_anchor`,
        severity: 'error',
        coordinate_record_id: record.coordinate_record_id,
      });
    }
  }

  return issues;
}

function validateRecord(
  record: SourceVideoCoordinateRecord,
  activeVideoIds: Set<string>,
  grammarIds: Set<string>,
  mappingIds: Set<string>,
  segmentIds: Set<string>
): CoordinateRecordValidation {
  const issues: CoordinateValidationIssue[] = [];

  if (!segmentIds.has(record.segment_id)) {
    issues.push({
      code: 'SEGMENT_NOT_FOUND',
      message: `segment_id ${record.segment_id} not in segment registry`,
      severity: 'error',
      coordinate_record_id: record.coordinate_record_id,
      field: 'segment_id',
    });
  }

  if (!activeVideoIds.has(record.source_video_id)) {
    issues.push({
      code: 'INVALID_SOURCE_VIDEO',
      message: `source_video_id ${record.source_video_id} not in active final set`,
      severity: 'error',
      coordinate_record_id: record.coordinate_record_id,
      field: 'source_video_id',
    });
  }

  if (!EXTRACTABLE_FAMILIES.includes(record.director_family)) {
    issues.push({
      code: 'INVALID_DIRECTOR_FAMILY',
      message: `Invalid director_family: ${record.director_family}`,
      severity: 'error',
      coordinate_record_id: record.coordinate_record_id,
    });
  }

  if (!record.grammar_refs?.length || !record.grammar_refs.every((r) => grammarIds.has(r))) {
    issues.push({
      code: 'INVALID_GRAMMAR_REFS',
      message: 'grammar_refs must reference valid director grammar profiles',
      severity: 'error',
      coordinate_record_id: record.coordinate_record_id,
      field: 'grammar_refs',
    });
  }

  if (record.scene_state_mapping_ref !== null) {
    if (!mappingIds.has(record.scene_state_mapping_ref)) {
      issues.push({
        code: 'INVALID_MAPPING_REF',
        message: `scene_state_mapping_ref ${record.scene_state_mapping_ref} not in mapping registry`,
        severity: 'error',
        coordinate_record_id: record.coordinate_record_id,
        field: 'scene_state_mapping_ref',
      });
    }
  }

  issues.push(...validateCoordinateLayers(record));
  issues.push(...validateIdentityLocks(record));
  issues.push(...validateExecutionFlags(record));

  return {
    coordinate_record_id: record.coordinate_record_id,
    segment_id: record.segment_id,
    status: issues.length === 0 ? 'PASS' : 'FAIL',
    issues,
  };
}

export function validateSourceVideoCoordinates(projectRoot?: string): SourceVideoCoordinateReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: CoordinateValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const segmentReportPath = path.join(root, SEGMENT_REPORT_PATH);
  if (!fs.existsSync(segmentReportPath)) {
    issues.push({
      code: 'MISSING_SEGMENT_REPORT',
      message: `Missing ${SEGMENT_REPORT_PATH}. Run npm run verify:source-video-segment first.`,
      severity: 'error',
    });
  } else {
    const segmentReport = JSON.parse(fs.readFileSync(segmentReportPath, 'utf8')) as {
      final_verdict?: string;
    };
    if (segmentReport.final_verdict !== SEGMENT_PASS_VERDICT) {
      issues.push({
        code: 'UPSTREAM_SEGMENT_NOT_PASS',
        message: `Segment schema verdict is not ${SEGMENT_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  if (!fs.existsSync(path.join(root, COORDINATE_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `Missing ${COORDINATE_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  let registryStatus: 'PASS' | 'FAIL' = 'FAIL';
  const registryPath = path.join(root, COORDINATE_REGISTRY_PATH);
  if (!fs.existsSync(registryPath)) {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `Missing ${COORDINATE_REGISTRY_PATH}`,
      severity: 'error',
    });
  } else {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as {
      coordinate_records?: Array<{
        coordinate_record_id: string;
        segment_id: string;
        record_path: string;
      }>;
    };
    if (registry.coordinate_records?.length === SEED_COORDINATE_SPECS.length) {
      const match = SEED_COORDINATE_SPECS.every((spec) =>
        registry.coordinate_records!.some(
          (e) =>
            e.coordinate_record_id === spec.coordinate_record_id &&
            e.segment_id === spec.segment_id &&
            e.record_path === `${COORDINATE_RECORDS_DIR}/${spec.coordinate_record_id}.json`
        )
      );
      registryStatus = match ? 'PASS' : 'FAIL';
      if (!match) {
        issues.push({
          code: 'REGISTRY_RECORD_MISMATCH',
          message: 'Registry coordinate entries do not match seed specs',
          severity: 'error',
        });
      }
    } else {
      issues.push({
        code: 'REGISTRY_RECORD_COUNT',
        message: `Registry must contain ${SEED_COORDINATE_SPECS.length} coordinate records`,
        severity: 'error',
      });
    }
  }

  const segmentRegistryPath = path.join(root, SEGMENT_REGISTRY_PATH);
  const segmentIds = new Set<string>();
  if (fs.existsSync(segmentRegistryPath)) {
    const segmentRegistry = JSON.parse(fs.readFileSync(segmentRegistryPath, 'utf8')) as {
      segments?: Array<{ segment_id: string }>;
    };
    for (const s of segmentRegistry.segments ?? []) {
      segmentIds.add(s.segment_id);
    }
  }

  const finalSet = loadFinalSet(root);
  const activeVideoIds = new Set(
    finalSet?.videos.filter((v) => v.tier === 'active').map((v) => v.source_video_id) ?? []
  );
  const grammarIds = loadGrammarIds(root);
  const mappingIds = loadMappingIds(root);

  const recordValidations: CoordinateRecordValidation[] = [];
  const loadedRecords: SourceVideoCoordinateRecord[] = [];

  for (const spec of SEED_COORDINATE_SPECS) {
    const record = loadCoordinateRecord(root, spec.coordinate_record_id);
    if (!record) {
      issues.push({
        code: 'MISSING_COORDINATE_RECORD',
        message: `Missing coordinate record ${spec.coordinate_record_id}`,
        severity: 'error',
        coordinate_record_id: spec.coordinate_record_id,
      });
      recordValidations.push({
        coordinate_record_id: spec.coordinate_record_id,
        segment_id: spec.segment_id,
        status: 'FAIL',
        issues: [
          {
            code: 'MISSING_COORDINATE_RECORD',
            message: `Missing coordinate record ${spec.coordinate_record_id}`,
            severity: 'error',
            coordinate_record_id: spec.coordinate_record_id,
          },
        ],
      });
      continue;
    }

    loadedRecords.push(record);
    const segment = loadSceneSegment(root, record.segment_id);
    if (!segment) {
      issues.push({
        code: 'SEGMENT_FILE_MISSING',
        message: `Segment file missing for ${record.segment_id}`,
        severity: 'error',
        coordinate_record_id: record.coordinate_record_id,
      });
    } else if (record.source_video_id !== segment.source_video_id) {
      issues.push({
        code: 'SEGMENT_SOURCE_MISMATCH',
        message: `Record source_video_id does not match segment ${record.segment_id}`,
        severity: 'error',
        coordinate_record_id: record.coordinate_record_id,
      });
    }

    const validation = validateRecord(
      record,
      activeVideoIds,
      grammarIds,
      mappingIds,
      segmentIds
    );
    recordValidations.push(validation);
    issues.push(...validation.issues);
  }

  let segmentLinks: 'PASS' | 'FAIL' = 'FAIL';
  let grammarRefs: 'PASS' | 'FAIL' = 'FAIL';
  let identityLocks: 'PASS' | 'FAIL' = 'FAIL';

  if (loadedRecords.length === SEED_COORDINATE_SPECS.length) {
    segmentLinks = loadedRecords.every((r) => segmentIds.has(r.segment_id)) ? 'PASS' : 'FAIL';
    grammarRefs = loadedRecords.every(
      (r) => r.grammar_refs.length > 0 && r.grammar_refs.every((g) => grammarIds.has(g))
    )
      ? 'PASS'
      : 'FAIL';
    identityLocks = loadedRecords.every((r) => {
      const lockIssues = validateIdentityLocks(r);
      return lockIssues.length === 0;
    })
      ? 'PASS'
      : 'FAIL';
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const final_verdict =
    errors.length === 0 &&
    loadedRecords.length === SEED_COORDINATE_SPECS.length &&
    registryStatus === 'PASS' &&
    segmentLinks === 'PASS' &&
    grammarRefs === 'PASS' &&
    identityLocks === 'PASS'
      ? COORDINATE_PASS_VERDICT
      : COORDINATE_FAIL_VERDICT;

  return {
    report_id: 'source-video-segment-coordinate-report-v1',
    phase: COORDINATE_COMPILER_PHASE,
    timestamp,
    coordinate_records: loadedRecords.length,
    registry: registryStatus,
    segment_links: segmentLinks,
    grammar_refs: grammarRefs,
    identity_locks: identityLocks,
    record_validations: recordValidations,
    design_only: true,
    gpu_execution: false,
    final_verdict,
    issues,
  };
}

function buildMarkdown(report: SourceVideoCoordinateReport): string {
  const lines = [
    '# Source Video Segment to Coordinate Summary',
    '',
    `**Phase:** ${COORDINATE_COMPILER_PHASE}`,
    `**Verdict:** ${report.final_verdict}`,
    `**Timestamp:** ${report.timestamp}`,
    '',
    '## Pass Metrics',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| coordinate_records | ${report.coordinate_records} |`,
    `| registry | ${report.registry} |`,
    `| segment_links | ${report.segment_links} |`,
    `| grammar_refs | ${report.grammar_refs} |`,
    `| identity_locks | ${report.identity_locks} |`,
    `| design_only | ${report.design_only} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    '',
    '## Compiled Records',
    '',
    '| coordinate_record_id | segment_id |',
    '|----------------------|------------|',
  ];

  for (const spec of SEED_COORDINATE_SPECS) {
    lines.push(`| ${spec.coordinate_record_id} | ${spec.segment_id} |`);
  }

  lines.push('', '## Pipeline Chain', '', '```');
  lines.push('source video → scene segment → movie coordinate → scene state mapping → video state');
  lines.push('```', '');

  if (report.record_validations.length > 0) {
    lines.push('## Record Validations', '');
    for (const v of report.record_validations) {
      lines.push(`- **${v.coordinate_record_id}** → ${v.segment_id}: ${v.status}`);
    }
    lines.push('');
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(
        `- [${issue.severity}] **${issue.code}**${issue.coordinate_record_id ? ` (${issue.coordinate_record_id})` : ''}: ${issue.message}`
      );
    }
    lines.push('');
  }

  lines.push('## Artifacts', '');
  lines.push(`- Schema: \`${COORDINATE_SCHEMA_PATH}\``);
  lines.push(`- Registry: \`${COORDINATE_REGISTRY_PATH}\``);
  lines.push(`- Records: \`${COORDINATE_RECORDS_DIR}/\``);
  lines.push(`- Report: \`${COORDINATE_REPORT_PATH}\``);
  lines.push('');

  return lines.join('\n');
}

export function writeSourceVideoCoordinateReport(projectRoot?: string): SourceVideoCoordinateReport {
  const root = resolveProjectRoot(projectRoot);
  const report = validateSourceVideoCoordinates(root);

  fs.writeFileSync(path.join(root, COORDINATE_REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, COORDINATE_MD_PATH), buildMarkdown(report), 'utf8');

  return report;
}
