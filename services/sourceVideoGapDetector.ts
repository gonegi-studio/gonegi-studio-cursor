import fs from 'node:fs';
import path from 'node:path';
import {
  COVERAGE_CATEGORIES,
  SOURCE_VIDEO_AUDIT_PHASE,
  SOURCE_VIDEO_REGISTRY_PATH,
  SOURCE_VIDEO_SCHEMA_PATH,
  type CategoryCoverageMap,
  type CoverageCategory,
  type SourceVideoCoverageRecord,
} from './sourceVideoCoverageAuditor.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const GAP_REPORT_PATH = 'reports/source-video-gap-report.json' as const;
export const GAP_SUMMARY_MD_PATH = 'reports/SOURCE_VIDEO_AUDIT_SUMMARY.md' as const;
export const GAP_PASS_VERDICT = 'PASS_SOURCE_VIDEO_COVERAGE_AUDIT_V1' as const;
export const GAP_FAIL_VERDICT = 'FAIL_SOURCE_VIDEO_COVERAGE_AUDIT_V1' as const;

export const READINESS_TIERS = Object.freeze([
  'NOT_READY',
  'LIMITED_READY',
  'READY',
  'FULL_READY',
] as const);

export type ReadinessTier = (typeof READINESS_TIERS)[number];

export const CATEGORY_TARGETS: Record<CoverageCategory, string[]> = {
  indoor: ['domestic-interior', 'kitchen-hearth', 'workroom', 'tatami-room', 'porch-seat'],
  outdoor: ['harbor', 'forest-path', 'village-walk', 'wooden-bridge', 'river-dock', 'field-row'],
  emotion: ['joy', 'warmth', 'longing', 'hope', 'calm', 'wonder', 'reunion-hint'],
  relationship: ['solo', 'pair', 'family', 'group', 'stranger-exchange', 'companion-walk'],
  camera: ['wide', 'close', 'tracking', 'static', 'aerial', 'establishing-wide'],
  lighting: ['daylight', 'golden-hour', 'lantern', 'interior-warm', 'overcast-soft'],
  weather: ['clear', 'rain', 'overcast', 'humid-mist'],
  crowd: ['empty', 'sparse', 'market-crowd', 'festival-group'],
  animal: ['wildlife', 'companion', 'working-animal', 'foraging-companion'],
  motion: ['slow-contemplative', 'walking', 'task-motion', 'foraging', 'festival-carry'],
  environment: ['mediterranean', 'woodland', 'village', 'domestic', 'water-edge', 'harbor'],
};

export type CategoryGapResult = {
  category: CoverageCategory;
  covered_tags: string[];
  missing_tags: string[];
  coverage_ratio: number;
  status: 'strong' | 'weak' | 'missing';
};

export type SourceVideoGapReport = {
  gap_report_id: string;
  phase: typeof SOURCE_VIDEO_AUDIT_PHASE;
  timestamp: string;
  video_count: number;
  audited_video_count: number;
  missing_file_count: number;
  coverage_score: number;
  readiness_tier: ReadinessTier;
  category_results: CategoryGapResult[];
  missing_categories: CoverageCategory[];
  weak_categories: CoverageCategory[];
  recommended_additions: string[];
  gpu_execution: false;
  audit_only: true;
  final_verdict: typeof GAP_PASS_VERDICT | typeof GAP_FAIL_VERDICT;
};

function unionCategoryTags(
  records: SourceVideoCoverageRecord[],
  category: CoverageCategory
): Set<string> {
  const tags = new Set<string>();
  for (const record of records) {
    if (record.audit_status !== 'audited') continue;
    for (const tag of record.category_coverage[category]) {
      tags.add(tag);
    }
  }
  return tags;
}

export function detectCategoryGaps(
  records: SourceVideoCoverageRecord[]
): CategoryGapResult[] {
  const audited = records.filter((r) => r.audit_status === 'audited');

  return COVERAGE_CATEGORIES.map((category) => {
    const coveredSet = unionCategoryTags(audited, category);
    const targets = CATEGORY_TARGETS[category];
    const covered_tags = targets.filter((tag) => coveredSet.has(tag));
    const missing_tags = targets.filter((tag) => !coveredSet.has(tag));
    const coverage_ratio =
      targets.length === 0 ? 1 : Number((covered_tags.length / targets.length).toFixed(4));

    let status: CategoryGapResult['status'] = 'strong';
    if (coverage_ratio < 0.3) status = 'missing';
    else if (coverage_ratio < 0.7) status = 'weak';

    return {
      category,
      covered_tags,
      missing_tags,
      coverage_ratio,
      status,
    };
  });
}

export function assignReadinessTier(coverageScore: number): ReadinessTier {
  if (coverageScore >= 90) return 'FULL_READY';
  if (coverageScore >= 70) return 'READY';
  if (coverageScore >= 50) return 'LIMITED_READY';
  return 'NOT_READY';
}

function buildRecommendations(
  categoryResults: CategoryGapResult[],
  records: SourceVideoCoverageRecord[]
): string[] {
  const recommendations: string[] = [];

  for (const result of categoryResults) {
    if (result.status === 'missing') {
      recommendations.push(
        `Add source video covering ${result.category}: missing ${result.missing_tags.slice(0, 3).join(', ')}`
      );
    } else if (result.status === 'weak') {
      recommendations.push(
        `Strengthen ${result.category} coverage: add ${result.missing_tags.slice(0, 2).join(', ')}`
      );
    }
  }

  const missingFiles = records.filter((r) => r.audit_status === 'missing_file');
  if (missingFiles.length > 0) {
    recommendations.push(
      `Restore missing import files: ${missingFiles.map((r) => r.filename).join(', ')}`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Coverage is strong — proceed to Movie Analysis Engine intake planning.');
  }

  return [...new Set(recommendations)];
}

export function computeCoverageScore(categoryResults: CategoryGapResult[]): number {
  if (categoryResults.length === 0) return 0;
  const avg =
    categoryResults.reduce((sum, r) => sum + r.coverage_ratio, 0) / categoryResults.length;
  return Math.round(avg * 100);
}

export function buildSourceVideoGapReport(
  records: SourceVideoCoverageRecord[]
): SourceVideoGapReport {
  const category_results = detectCategoryGaps(records);
  const coverage_score = computeCoverageScore(category_results);
  const readiness_tier = assignReadinessTier(coverage_score);
  const missing_categories = category_results
    .filter((r) => r.status === 'missing')
    .map((r) => r.category);
  const weak_categories = category_results
    .filter((r) => r.status === 'weak')
    .map((r) => r.category);
  const recommended_additions = buildRecommendations(category_results, records);

  const registered = records.filter((r) => r.audit_status !== 'unregistered');
  const audited = registered.filter((r) => r.audit_status === 'audited');
  const missing_file_count = registered.filter((r) => r.audit_status === 'missing_file').length;

  const pass =
    registered.length === 5 &&
    audited.length === 5 &&
    missing_file_count === 0 &&
    readiness_tier !== undefined;

  return {
    gap_report_id: `source_video_gap_${Date.now().toString(36)}`,
    phase: SOURCE_VIDEO_AUDIT_PHASE,
    timestamp: new Date().toISOString(),
    video_count: registered.length,
    audited_video_count: audited.length,
    missing_file_count,
    coverage_score,
    readiness_tier,
    category_results,
    missing_categories,
    weak_categories,
    recommended_additions,
    gpu_execution: false,
    audit_only: true,
    final_verdict: pass ? GAP_PASS_VERDICT : GAP_FAIL_VERDICT,
  };
}

export function renderGapSummaryMarkdown(
  records: SourceVideoCoverageRecord[],
  report: SourceVideoGapReport
): string {
  const videoLines = records
    .filter((r) => r.audit_status !== 'unregistered')
    .map(
      (r) =>
        `- **${r.source_video_id}** (\`${r.filename}\`): ${r.audit_status} · ${(r.file_size_bytes / 1024 / 1024).toFixed(1)} MB`
    )
    .join('\n');

  const categoryLines = report.category_results
    .map(
      (r) =>
        `- **${r.category}**: ${(r.coverage_ratio * 100).toFixed(0)}% (${r.status}) — covered: ${r.covered_tags.length}/${CATEGORY_TARGETS[r.category].length}`
    )
    .join('\n');

  const recLines = report.recommended_additions.map((r) => `- ${r}`).join('\n');

  return [
    '# Source Video Coverage Audit Summary',
    '',
    '## Verdict',
    '',
    '| Field | Value |',
    '|-------|-------|',
    `| **Verdict** | ${report.final_verdict} |`,
    `| **Coverage score** | ${report.coverage_score}/100 |`,
    `| **Readiness tier** | ${report.readiness_tier} |`,
    `| **Videos audited** | ${report.audited_video_count}/${report.video_count} |`,
    `| **Audit only** | ${report.audit_only} |`,
    `| **GPU execution** | ${report.gpu_execution} |`,
    '',
    '## Registered Source Videos',
    '',
    videoLines,
    '',
    '## Category Coverage',
    '',
    categoryLines,
    '',
    '## Missing Categories',
    '',
    report.missing_categories.length > 0
      ? report.missing_categories.map((c) => `- ${c}`).join('\n')
      : '- None',
    '',
    '## Weak Categories',
    '',
    report.weak_categories.length > 0
      ? report.weak_categories.map((c) => `- ${c}`).join('\n')
      : '- None',
    '',
    '## Recommended Additions',
    '',
    recLines,
    '',
    '## Readiness Tier Guide',
    '',
    '- **NOT_READY**: score < 50',
    '- **LIMITED_READY**: score 50–69',
    '- **READY**: score 70–89',
    '- **FULL_READY**: score 90+',
    '',
    '## Safety',
    '',
    '- Audit only — no production asset changes, no GPU execution, no generation.',
    '- Prepares coverage baseline before Movie Analysis Engine.',
    '',
    `*Generated ${report.timestamp} · ${report.phase}*`,
    '',
  ].join('\n');
}

export function writeSourceVideoGapReports(
  projectRoot: string,
  records: SourceVideoCoverageRecord[]
): SourceVideoGapReport {
  const root = resolveProjectRoot(projectRoot);
  const report = buildSourceVideoGapReport(records);

  const payload = {
    ...report,
    report_type: 'source_video_gap_report',
    report_version: 'v1',
    export_path: GAP_REPORT_PATH,
    markdown_path: GAP_SUMMARY_MD_PATH,
    schema_path: SOURCE_VIDEO_SCHEMA_PATH,
    registry_path: SOURCE_VIDEO_REGISTRY_PATH,
    import_dir: 'imports/source_videos',
    audited_videos: records
      .filter((r) => r.audit_status === 'audited')
      .map((r) => r.source_video_id),
    next_phase: 'PHASE-SOURCE-VIDEO-002 SOURCE_VIDEO_SET_FINALIZATION_V1',
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(path.join(root, GAP_REPORT_PATH), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.writeFileSync(
    path.join(root, GAP_SUMMARY_MD_PATH),
    `${renderGapSummaryMarkdown(records, report)}\n`,
    'utf8'
  );

  return report;
}
