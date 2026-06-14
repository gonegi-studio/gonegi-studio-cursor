import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import {
  buildSourceVideoFinalSet,
  FINAL_SET_PATH,
  FINAL_SET_PHASE,
  FINAL_SET_REGISTRY_PATH,
  FINAL_SET_SCHEMA_PATH,
  type SourceVideoCategory,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const FINALIZATION_PASS_VERDICT = 'PASS_SOURCE_VIDEO_SET_FINALIZATION_V1' as const;
export const FINALIZATION_FAIL_VERDICT = 'FAIL_SOURCE_VIDEO_SET_FINALIZATION_V1' as const;
export const FINALIZATION_REPORT_PATH =
  'reports/source-video-finalization-report.json' as const;
export const FINALIZATION_MD_PATH = 'reports/SOURCE_VIDEO_FINALIZATION_SUMMARY.md' as const;

export const EXPECTED_PROJECT_ROOT_SUFFIX = 'Gonegi-Studio-Cursor' as const;

export type ValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
};

export type SourceVideoFinalizationReport = {
  finalization_id: string;
  phase: typeof FINAL_SET_PHASE;
  timestamp: string;
  total_videos: number;
  active_count: number;
  category_counts: Record<SourceVideoCategory, number>;
  archive_count: number;
  duplicates: number;
  missing_files: number;
  registry_consistency: 'PASS' | 'FAIL';
  finalization_status: 'PASS' | 'FAIL';
  gpu_execution: false;
  read_only: true;
  issues: ValidationIssue[];
  final_verdict: typeof FINALIZATION_PASS_VERDICT | typeof FINALIZATION_FAIL_VERDICT;
};

export function assertProjectRootPrecheck(): ValidationIssue[] {
  const cwd = process.cwd();
  const normalized = cwd.replace(/\\/g, '/');
  if (!normalized.endsWith(EXPECTED_PROJECT_ROOT_SUFFIX)) {
    return [
      {
        code: 'PRECHECK_FAIL',
        message: `process.cwd() must end with ${EXPECTED_PROJECT_ROOT_SUFFIX}, got: ${cwd}`,
        severity: 'error',
      },
    ];
  }
  return [];
}

function countDuplicates(videoIds: string[]): number {
  const seen = new Set<string>();
  let dupes = 0;
  for (const id of videoIds) {
    if (seen.has(id)) dupes += 1;
    seen.add(id);
  }
  return dupes;
}

export function validateSourceVideoFinalSet(
  projectRoot: string,
  finalSet: SourceVideoFinalSet
): SourceVideoFinalizationReport {
  const issues: ValidationIssue[] = [...assertProjectRootPrecheck()];

  if (!fs.existsSync(path.join(resolveProjectRoot(projectRoot), FINAL_SET_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `Missing ${FINAL_SET_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  const registry = readJsonRecord(projectRoot, FINAL_SET_REGISTRY_PATH) as {
    expected_active_count?: number;
    expected_archive_count?: number;
    expected_category_counts?: Record<string, number>;
    active_categories?: Record<string, { video_ids: string[] }>;
    archive_categories?: Record<string, { video_ids: string[] }>;
  } | null;

  if (!registry) {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `Missing ${FINAL_SET_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const videoIds = finalSet.videos.map((v) => v.source_video_id);
  const duplicates = countDuplicates(videoIds);
  if (duplicates > 0) {
    issues.push({
      code: 'DUPLICATE_IDS',
      message: `Found ${duplicates} duplicate source_video_id entries`,
      severity: 'error',
    });
  }

  const missing_files = finalSet.videos.filter((v) => !v.file_present).length;
  if (missing_files > 0) {
    const missing = finalSet.videos
      .filter((v) => !v.file_present)
      .map((v) => v.import_path)
      .join(', ');
    issues.push({
      code: 'MISSING_FILES',
      message: `Missing ${missing_files} video files: ${missing}`,
      severity: 'error',
    });
  }

  const active_count = finalSet.videos.filter((v) => v.tier === 'active').length;
  if (active_count !== 15) {
    issues.push({
      code: 'ACTIVE_COUNT_MISMATCH',
      message: `Expected active_count=15, got ${active_count}`,
      severity: 'error',
    });
  }

  const expectedCounts = registry?.expected_category_counts ?? {
    GHIBLI: 7,
    SHINKAI: 2,
    LIVE_ACTION: 1,
    MORI: 5,
    ARCHIVE: 1,
  };

  for (const [category, expected] of Object.entries(expectedCounts)) {
    const actual = finalSet.category_counts[category as SourceVideoCategory] ?? 0;
    if (actual !== expected) {
      issues.push({
        code: 'CATEGORY_COUNT_MISMATCH',
        message: `${category} expected ${expected}, got ${actual}`,
        severity: 'error',
      });
    }
  }

  const archiveVideos = finalSet.videos.filter((v) => v.tier === 'archive');
  if (archiveVideos.length !== 1 || archiveVideos[0]?.source_video_id !== 'TEST_KIKI_25S') {
    issues.push({
      code: 'ARCHIVE_INVALID',
      message: 'Archive must contain TEST_KIKI_25S only',
      severity: 'error',
    });
  }

  if (registry) {
    const registryIds = new Set<string>();
    for (const spec of Object.values(registry.active_categories ?? {})) {
      for (const id of spec.video_ids) registryIds.add(id);
    }
    for (const spec of Object.values(registry.archive_categories ?? {})) {
      for (const id of spec.video_ids) registryIds.add(id);
    }
    for (const id of videoIds) {
      if (!registryIds.has(id)) {
        issues.push({
          code: 'REGISTRY_INCONSISTENT',
          message: `${id} not declared in registry`,
          severity: 'error',
        });
      }
    }
    for (const id of registryIds) {
      if (!videoIds.includes(id)) {
        issues.push({
          code: 'REGISTRY_INCONSISTENT',
          message: `Registry declares ${id} but final set missing it`,
          severity: 'error',
        });
      }
    }
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const registry_consistency = errors.some((e) => e.code.startsWith('REGISTRY'))
    ? 'FAIL'
    : 'PASS';
  const pass =
    errors.length === 0 &&
    active_count === 15 &&
    duplicates === 0 &&
    missing_files === 0 &&
    registry_consistency === 'PASS';

  return {
    finalization_id: `finalization_${Date.now().toString(36)}`,
    phase: FINAL_SET_PHASE,
    timestamp: new Date().toISOString(),
    total_videos: active_count,
    active_count,
    category_counts: finalSet.category_counts,
    archive_count: finalSet.archive_count,
    duplicates,
    missing_files,
    registry_consistency,
    finalization_status: pass ? 'PASS' : 'FAIL',
    gpu_execution: false,
    read_only: true,
    issues,
    final_verdict: pass ? FINALIZATION_PASS_VERDICT : FINALIZATION_FAIL_VERDICT,
  };
}

export function renderFinalizationMarkdown(
  finalSet: SourceVideoFinalSet,
  report: SourceVideoFinalizationReport
): string {
  const activeLines = finalSet.videos
    .filter((v) => v.tier === 'active')
    .map(
      (v) =>
        `- **${v.source_video_id}** [${v.category}] \`${v.import_path}\` (${(v.file_size_bytes / 1024 / 1024).toFixed(1)} MB)`
    )
    .join('\n');

  const archiveLines = finalSet.videos
    .filter((v) => v.tier === 'archive')
    .map(
      (v) =>
        `- **${v.source_video_id}** [${v.category}] \`${v.import_path}\` (${(v.file_size_bytes / 1024 / 1024).toFixed(1)} MB)`
    )
    .join('\n');

  const countLines = Object.entries(report.category_counts)
    .map(([cat, n]) => `- **${cat}**: ${n}`)
    .join('\n');

  return [
    '# Source Video Set Finalization Summary',
    '',
    '## Verdict',
    '',
    '| Field | Value |',
    '|-------|-------|',
    `| **Verdict** | ${report.final_verdict} |`,
    `| **Total active videos** | ${report.total_videos} |`,
    `| **Archive count** | ${report.archive_count} |`,
    `| **Duplicates** | ${report.duplicates} |`,
    `| **Missing files** | ${report.missing_files} |`,
    `| **Registry consistency** | ${report.registry_consistency} |`,
    `| **Finalization status** | ${report.finalization_status} |`,
    `| **Read only** | ${report.read_only} |`,
    `| **GPU execution** | ${report.gpu_execution} |`,
    '',
    '## Category Counts',
    '',
    countLines,
    '',
    '## Active Source Library (15)',
    '',
    activeLines,
    '',
    '## Archive (1)',
    '',
    archiveLines,
    '',
    '## Safety',
    '',
    '- Canonical set locked — no video analysis, frame extraction, or GPU execution.',
    '- Next phase: Director Grammar Extraction (PHASE-SOURCE-VIDEO-003).',
    '',
    `*Generated ${report.timestamp} · ${report.phase}*`,
    '',
  ].join('\n');
}

export function writeSourceVideoFinalizationReport(projectRoot: string): {
  finalSet: SourceVideoFinalSet;
  report: SourceVideoFinalizationReport;
} {
  const root = resolveProjectRoot(projectRoot);
  const finalSet = buildSourceVideoFinalSet(root);
  const report = validateSourceVideoFinalSet(root, finalSet);

  const payload = {
    ...report,
    report_type: 'source_video_finalization_report',
    report_version: 'v1',
    export_path: FINALIZATION_REPORT_PATH,
    markdown_path: FINALIZATION_MD_PATH,
    final_set_path: FINAL_SET_PATH,
    schema_path: FINAL_SET_SCHEMA_PATH,
    registry_path: FINAL_SET_REGISTRY_PATH,
    locked_video_ids: finalSet.videos.map((v) => v.source_video_id),
    next_phase: 'PHASE-SOURCE-VIDEO-003 DIRECTOR_GRAMMAR_EXTRACTION_V1',
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, FINAL_SET_PATH),
    `${JSON.stringify(finalSet, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FINALIZATION_REPORT_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FINALIZATION_MD_PATH),
    `${renderFinalizationMarkdown(finalSet, report)}\n`,
    'utf8'
  );

  return { finalSet, report };
}
