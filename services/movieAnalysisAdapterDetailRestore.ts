import fs from 'node:fs';
import path from 'node:path';
import {
  DATASET_NORMALIZATION_STRUCTURES_PATH,
  type NormalizedAdapterEntry,
  type NormalizedAdapterStructure,
} from './movieAnalysisDatasetNormalization.js';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  DNA_ADAPTER_LIBRARY_PATH,
  type DnaAdapterDefinition,
  type DnaAdapterLibraryEntry,
  loadMovieAnalysisDnaAdapterLibrary,
} from './movieAnalysisDnaAdapterLibrary.js';
import {
  NORMALIZATION_QUALITY_GATE_REPORT_PATH,
  type MovieAnalysisNormalizationQualityGateReport,
  type QualityRiskDetection,
} from './movieAnalysisNormalizationQualityGate.js';
import {
  REDUNDANCY_DEDUP_FIX_REPORT_PATH,
  type AdapterSignatureNormalization,
  type MovieAnalysisRedundancyDedupFixReport,
} from './movieAnalysisRedundancyDedupFix.js';
import {
  SCENE_GRANULARITY_RESTORE_PASS_VERDICT,
  SCENE_GRANULARITY_RESTORE_REPORT_PATH,
  type MovieAnalysisSceneGranularityRestoreReport,
} from './movieAnalysisSceneGranularityRestore.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const ADAPTER_DETAIL_RESTORE_PHASE =
  'PHASE-L1B-006-MOVIE_ANALYSIS_ADAPTER_DETAIL_RESTORE_V1' as const;
export const ADAPTER_DETAIL_RESTORE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_ADAPTER_DETAIL_RESTORE_V1' as const;
export const ADAPTER_DETAIL_RESTORE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_ADAPTER_DETAIL_RESTORE_V1' as const;
export const ADAPTER_DETAIL_RESTORE_DIR =
  'reports/movie_analysis_adapter_detail_restore' as const;
export const ADAPTER_DETAIL_RESTORE_REPORT_PATH =
  'reports/movie_analysis_adapter_detail_restore/movie-analysis-adapter-detail-restore-report.json' as const;
export const ADAPTER_DETAIL_RESTORE_MD_PATH =
  'reports/movie_analysis_adapter_detail_restore/MOVIE_ANALYSIS_ADAPTER_DETAIL_RESTORE.md' as const;

export const EXPECTED_SOURCE_VIDEO_IDS = [
  'GHIBLI_01',
  'LITTLE_WOMEN_01',
  'MORI_01',
  'SHINKAI_01',
] as const;

export const EXPECTED_LOST_ADAPTER_DETAIL_COUNT = 20;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type RestoreStatus = 'PASS' | 'FAIL';

export type AdapterDetailRestoreIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
  adapter_id?: string;
};

export type AdapterReductionPattern = {
  source_video_id: string;
  adapter_type: string;
  adapter_id: string;
  patterns_before: number;
  patterns_after: number;
  signatures_before: number;
  signatures_after: number;
  reduction_ratio: number;
  duplicate_patterns_removed: number;
  blueprint_runtime_duplicates_removed: number;
  canonical_signatures_preserved: number;
  detail_loss_detected: boolean;
};

export type AdapterDetailRestoreCandidate = {
  candidate_id: string;
  source_video_id: string;
  adapter_type: string;
  adapter_id: string;
  pattern_id: string;
  pattern_signature: string;
  source_origin: 'generation_blueprint' | 'final_runtime_bundle' | 'other';
  restore_type: 'pattern_id_alias';
  canonical_pattern_id: string;
  reintroduces_duplicate_signature: false;
  estimated_only: true;
  planning_only: true;
};

export type AdapterInformationRecoveryRule = {
  rule_id: string;
  priority: 'high' | 'medium';
  description: string;
  planning_only: true;
  preserves_signature_uniqueness: true;
};

export type AdapterSignaturePreservationRule = {
  rule_id: string;
  priority: 'high' | 'medium';
  description: string;
  planning_only: true;
  prevents_duplicate_signatures: true;
};

export type DetailRecoveryRatioEstimate = {
  total_patterns_before: number;
  total_patterns_after_normalization: number;
  total_lost_pattern_ids: number;
  total_restore_candidates: number;
  detail_recovery_ratio: number;
};

export type PerAdapterRecoveryScore = {
  source_video_id: string;
  adapter_type: string;
  adapter_id: string;
  patterns_before: number;
  patterns_after: number;
  lost_pattern_ids: number;
  restore_candidates: number;
  recovery_score: number;
  detail_restored: RestoreStatus;
};

export type SourceAdapterDetailRestoreAudit = {
  source_video_id: string;
  lost_adapter_detail_detected: boolean;
  lost_adapter_detail_count: number;
  adapter_reduction_patterns: number;
  restore_candidates: number;
  duplicate_signatures_reintroduced: number;
  adapter_detail_restored: RestoreStatus;
};

export type MovieAnalysisAdapterDetailRestoreReport = {
  report_id: string;
  phase: typeof ADAPTER_DETAIL_RESTORE_PHASE;
  timestamp: string;
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  scene_granularity_restore_report_path: typeof SCENE_GRANULARITY_RESTORE_REPORT_PATH;
  lost_adapter_detail: QualityRiskDetection[];
  adapter_signature_normalization: AdapterSignatureNormalization[];
  adapter_reduction_patterns: AdapterReductionPattern[];
  adapter_detail_restore_candidates: AdapterDetailRestoreCandidate[];
  adapter_information_recovery_rules: AdapterInformationRecoveryRule[];
  adapter_signature_preservation_rules: AdapterSignaturePreservationRule[];
  detail_recovery_ratio: DetailRecoveryRatioEstimate;
  per_adapter_recovery_score: PerAdapterRecoveryScore[];
  duplicate_signatures_reintroduced: number;
  adapter_detail_restore_ready: RestoreStatus;
  planning_only_status: RestoreStatus;
  source_audits: SourceAdapterDetailRestoreAudit[];
  final_verdict:
    | typeof ADAPTER_DETAIL_RESTORE_PASS_VERDICT
    | typeof ADAPTER_DETAIL_RESTORE_FAIL_VERDICT;
  issues: AdapterDetailRestoreIssue[];
};

const ADAPTER_FIELDS = [
  'scene_adapter',
  'camera_adapter',
  'emotion_adapter',
  'transition_adapter',
  'continuity_adapter',
  'storytelling_adapter',
] as const;

const ADAPTER_INFORMATION_RECOVERY_RULES: AdapterInformationRecoveryRule[] = [
  {
    rule_id: 'recover-pattern-id-aliases',
    priority: 'high',
    description:
      'Restore removed pattern_ids as aliases linked to canonical patterns without expanding the active signature set.',
    planning_only: true,
    preserves_signature_uniqueness: true,
  },
  {
    rule_id: 'recover-traceability-from-dna-library',
    priority: 'high',
    description:
      'Derive restore candidates from original DNA adapter library pattern_ids omitted during normalization.',
    planning_only: true,
    preserves_signature_uniqueness: true,
  },
  {
    rule_id: 'recover-prefer-runtime-canonical',
    priority: 'medium',
    description:
      'When multiple pattern_ids share a signature, link aliases to the runtime-bundle canonical pattern_id.',
    planning_only: true,
    preserves_signature_uniqueness: true,
  },
  {
    rule_id: 'recover-detail-for-reduced-adapters',
    priority: 'high',
    description:
      'Target adapters flagged by lost_adapter_detail (reduction_ratio < 50%) for full pattern_id recovery.',
    planning_only: true,
    preserves_signature_uniqueness: true,
  },
];

const ADAPTER_SIGNATURE_PRESERVATION_RULES: AdapterSignaturePreservationRule[] = [
  {
    rule_id: 'preserve-unique-signature-set',
    priority: 'high',
    description:
      'Never add a restore candidate that introduces a signature not already canonicalized in normalized adapters.',
    planning_only: true,
    prevents_duplicate_signatures: true,
  },
  {
    rule_id: 'preserve-canonical-runtime-priority',
    priority: 'medium',
    description:
      'Retain runtime-bundle pattern as canonical when blueprint and runtime share a signature.',
    planning_only: true,
    prevents_duplicate_signatures: true,
  },
  {
    rule_id: 'preserve-alias-only-restore',
    priority: 'high',
    description:
      'All restored detail entries must use restore_type pattern_id_alias with reintroduces_duplicate_signature=false.',
    planning_only: true,
    prevents_duplicate_signatures: true,
  },
  {
    rule_id: 'preserve-normalized-signature-count',
    priority: 'high',
    description:
      'Active signatures_after count must remain equal to adapter_signature_normalization signatures_after.',
    planning_only: true,
    prevents_duplicate_signatures: true,
  },
];

function patternOrigin(
  patternId: string
): 'generation_blueprint' | 'final_runtime_bundle' | 'other' {
  if (patternId.includes('generation_blueprint')) return 'generation_blueprint';
  if (patternId.includes('final_runtime_bundle')) return 'final_runtime_bundle';
  return 'other';
}

function loadSceneGranularityRestoreReport(
  projectRoot: string
): MovieAnalysisSceneGranularityRestoreReport | null {
  const abs = path.join(projectRoot, SCENE_GRANULARITY_RESTORE_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisSceneGranularityRestoreReport;
}

function loadQualityGateReport(
  projectRoot: string
): MovieAnalysisNormalizationQualityGateReport | null {
  const abs = path.join(projectRoot, NORMALIZATION_QUALITY_GATE_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisNormalizationQualityGateReport;
}

function loadDedupReport(projectRoot: string): MovieAnalysisRedundancyDedupFixReport | null {
  const abs = path.join(projectRoot, REDUNDANCY_DEDUP_FIX_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRedundancyDedupFixReport;
}

function loadNormalizedAdapters(projectRoot: string): NormalizedAdapterStructure[] {
  const abs = path.join(projectRoot, DATASET_NORMALIZATION_STRUCTURES_PATH);
  if (!fs.existsSync(abs)) return [];
  const bundle = JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    normalized_adapter_structure?: NormalizedAdapterStructure[];
  };
  return bundle.normalized_adapter_structure ?? [];
}

function buildAdapterReductionPattern(
  normalizedAdapter: NormalizedAdapterEntry,
  signatureNormalization: AdapterSignatureNormalization | undefined,
  detailLossDetected: boolean
): AdapterReductionPattern {
  return {
    source_video_id: signatureNormalization?.source_video_id ?? '',
    adapter_type: normalizedAdapter.adapter_type,
    adapter_id: normalizedAdapter.adapter_id,
    patterns_before: normalizedAdapter.patterns_before,
    patterns_after: normalizedAdapter.patterns_after,
    signatures_before: normalizedAdapter.signatures_before,
    signatures_after: normalizedAdapter.signatures_after,
    reduction_ratio:
      normalizedAdapter.patterns_before > 0
        ? normalizedAdapter.patterns_after / normalizedAdapter.patterns_before
        : 0,
    duplicate_patterns_removed: normalizedAdapter.duplicate_signatures_removed,
    blueprint_runtime_duplicates_removed: normalizedAdapter.blueprint_runtime_duplicates_removed,
    canonical_signatures_preserved: signatureNormalization?.signatures_after ?? 0,
    detail_loss_detected: detailLossDetected,
  };
}

function buildCanonicalPatternMap(
  normalizedAdapter: NormalizedAdapterEntry
): Map<string, string> {
  const runtimeFirst = [
    ...normalizedAdapter.patterns.filter((p) => p.source_origin === 'final_runtime_bundle'),
    ...normalizedAdapter.patterns.filter((p) => p.source_origin === 'generation_blueprint'),
    ...normalizedAdapter.patterns.filter((p) => p.source_origin === 'other'),
  ];

  const map = new Map<string, string>();
  for (const pattern of runtimeFirst) {
    if (!map.has(pattern.pattern_signature)) {
      map.set(pattern.pattern_signature, pattern.pattern_id);
    }
  }
  return map;
}

function buildRestoreCandidates(
  originalAdapter: DnaAdapterDefinition,
  normalizedAdapter: NormalizedAdapterEntry,
  sourceVideoId: string,
  adapterType: string
): AdapterDetailRestoreCandidate[] {
  const normalizedIds = new Set(normalizedAdapter.patterns.map((p) => p.pattern_id));
  const canonicalBySignature = buildCanonicalPatternMap(normalizedAdapter);
  const candidates: AdapterDetailRestoreCandidate[] = [];

  for (let i = 0; i < originalAdapter.pattern_ids.length; i++) {
    const patternId = originalAdapter.pattern_ids[i];
    const signature = originalAdapter.pattern_signatures[i];

    if (normalizedIds.has(patternId)) {
      continue;
    }

    const canonicalPatternId = canonicalBySignature.get(signature);
    if (!canonicalPatternId) {
      continue;
    }

    candidates.push({
      candidate_id: `adapter_detail_restore_${patternId}`,
      source_video_id: sourceVideoId,
      adapter_type: adapterType,
      adapter_id: originalAdapter.adapter_id,
      pattern_id: patternId,
      pattern_signature: signature,
      source_origin: patternOrigin(patternId),
      restore_type: 'pattern_id_alias',
      canonical_pattern_id: canonicalPatternId,
      reintroduces_duplicate_signature: false,
      estimated_only: true,
      planning_only: true,
    });
  }

  return candidates;
}

function buildMarkdown(report: MovieAnalysisAdapterDetailRestoreReport): string {
  const lines = [
    '# Movie Analysis Adapter Detail Restore',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Restore Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| lost_adapter_detail_entries | ${report.lost_adapter_detail.length} |`,
    `| adapter_signature_normalization_entries | ${report.adapter_signature_normalization.length} |`,
    `| adapter_reduction_patterns | ${report.adapter_reduction_patterns.length} |`,
    `| adapter_detail_restore_candidates | ${report.adapter_detail_restore_candidates.length} |`,
    `| adapter_information_recovery_rules | ${report.adapter_information_recovery_rules.length} |`,
    `| adapter_signature_preservation_rules | ${report.adapter_signature_preservation_rules.length} |`,
    `| detail_recovery_ratio | ${report.detail_recovery_ratio.detail_recovery_ratio} |`,
    `| duplicate_signatures_reintroduced | ${report.duplicate_signatures_reintroduced} |`,
    `| adapter_detail_restore_ready | ${report.adapter_detail_restore_ready} |`,
    '',
    '## Adapter Information Recovery Rules',
    '',
  ];

  for (const rule of report.adapter_information_recovery_rules) {
    lines.push(`- **${rule.rule_id}** [${rule.priority}] ${rule.description}`);
  }

  lines.push('', '## Adapter Signature Preservation Rules', '');
  for (const rule of report.adapter_signature_preservation_rules) {
    lines.push(`- **${rule.rule_id}** [${rule.priority}] ${rule.description}`);
  }

  lines.push('', '## Detail Recovery Ratio', '');
  lines.push(
    `- total_patterns_before: ${report.detail_recovery_ratio.total_patterns_before}`,
    `- total_patterns_after_normalization: ${report.detail_recovery_ratio.total_patterns_after_normalization}`,
    `- total_lost_pattern_ids: ${report.detail_recovery_ratio.total_lost_pattern_ids}`,
    `- total_restore_candidates: ${report.detail_recovery_ratio.total_restore_candidates}`,
    `- detail_recovery_ratio: ${report.detail_recovery_ratio.detail_recovery_ratio}`,
    ''
  );

  lines.push('## Per Adapter Recovery Score', '');
  for (const score of report.per_adapter_recovery_score) {
    lines.push(
      `- ${score.source_video_id}/${score.adapter_type}: lost=${score.lost_pattern_ids} restored=${score.restore_candidates} score=${score.recovery_score} detail_restored=${score.detail_restored}`
    );
  }

  lines.push('', '## Source Audits', '');
  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- lost_adapter_detail_detected: ${audit.lost_adapter_detail_detected}`,
      `- lost_adapter_detail_count: ${audit.lost_adapter_detail_count}`,
      `- adapter_reduction_patterns: ${audit.adapter_reduction_patterns}`,
      `- restore_candidates: ${audit.restore_candidates}`,
      `- duplicate_signatures_reintroduced: ${audit.duplicate_signatures_reintroduced}`,
      `- adapter_detail_restored: ${audit.adapter_detail_restored}`,
      ''
    );
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: AdapterDetailRestoreIssue[]
): MovieAnalysisAdapterDetailRestoreReport {
  const report: MovieAnalysisAdapterDetailRestoreReport = {
    report_id: 'movie-analysis-adapter-detail-restore-report-v1',
    phase: ADAPTER_DETAIL_RESTORE_PHASE,
    timestamp,
    planning_only: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    scene_granularity_restore_report_path: SCENE_GRANULARITY_RESTORE_REPORT_PATH,
    lost_adapter_detail: [],
    adapter_signature_normalization: [],
    adapter_reduction_patterns: [],
    adapter_detail_restore_candidates: [],
    adapter_information_recovery_rules: [],
    adapter_signature_preservation_rules: [],
    detail_recovery_ratio: {
      total_patterns_before: 0,
      total_patterns_after_normalization: 0,
      total_lost_pattern_ids: 0,
      total_restore_candidates: 0,
      detail_recovery_ratio: 0,
    },
    per_adapter_recovery_score: [],
    duplicate_signatures_reintroduced: -1,
    adapter_detail_restore_ready: 'FAIL',
    planning_only_status: 'FAIL',
    source_audits: [],
    final_verdict: ADAPTER_DETAIL_RESTORE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, ADAPTER_DETAIL_RESTORE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, ADAPTER_DETAIL_RESTORE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, ADAPTER_DETAIL_RESTORE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisAdapterDetailRestoreReport(
  projectRoot?: string
): MovieAnalysisAdapterDetailRestoreReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: AdapterDetailRestoreIssue[] = [];
  const timestamp = new Date().toISOString();

  const sceneGranularityReport = loadSceneGranularityRestoreReport(root);
  if (!sceneGranularityReport) {
    issues.push({
      code: 'SCENE_GRANULARITY_RESTORE_REPORT_MISSING',
      message: `Missing ${SCENE_GRANULARITY_RESTORE_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (sceneGranularityReport.final_verdict !== SCENE_GRANULARITY_RESTORE_PASS_VERDICT) {
    issues.push({
      code: 'SCENE_GRANULARITY_RESTORE_NOT_PASS',
      message: `Scene granularity restore must have ${SCENE_GRANULARITY_RESTORE_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const qualityGateReport = loadQualityGateReport(root);
  const dedupReport = loadDedupReport(root);
  const normalizedAdapters = loadNormalizedAdapters(root);
  const dnaLibrary = loadMovieAnalysisDnaAdapterLibrary(root);

  if (!qualityGateReport) {
    issues.push({
      code: 'QUALITY_GATE_REPORT_MISSING',
      message: `Missing ${NORMALIZATION_QUALITY_GATE_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (!dedupReport) {
    issues.push({
      code: 'DEDUP_REPORT_MISSING',
      message: `Missing ${REDUNDANCY_DEDUP_FIX_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (!dnaLibrary) {
    issues.push({
      code: 'DNA_ADAPTER_LIBRARY_MISSING',
      message: `Missing ${DNA_ADAPTER_LIBRARY_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const lostAdapterDetail = qualityGateReport.lost_adapter_detail;
  const adapterSignatureNormalization = dedupReport.adapter_signature_normalization;
  const adapterReductionPatterns: AdapterReductionPattern[] = [];
  const adapterDetailRestoreCandidates: AdapterDetailRestoreCandidate[] = [];
  const perAdapterRecoveryScore: PerAdapterRecoveryScore[] = [];
  const sourceAudits: SourceAdapterDetailRestoreAudit[] = [];

  let totalPatternsBefore = 0;
  let totalPatternsAfter = 0;
  let totalLostPatternIds = 0;

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const libraryEntry = dnaLibrary.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const normalizedStructure = normalizedAdapters.find(
      (structure) => structure.source_video_id === sourceVideoId
    );

    if (!libraryEntry || !normalizedStructure) {
      issues.push({
        code: 'ADAPTER_SOURCE_DATA_MISSING',
        message: `Missing adapter data for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
      continue;
    }

    let sourceRestoreCandidates = 0;
    let sourceReductionPatterns = 0;
    let sourceDuplicateReintroduced = 0;

    const sourceLostDetail = lostAdapterDetail.filter(
      (risk) => risk.source_video_id === sourceVideoId
    );

    for (const field of ADAPTER_FIELDS) {
      const originalAdapter = libraryEntry[field];
      const normalizedAdapter = normalizedStructure.adapters.find(
        (adapter) => adapter.adapter_type === field
      );
      const signatureNormalization = adapterSignatureNormalization.find(
        (entry) =>
          entry.source_video_id === sourceVideoId && entry.adapter_type === field
      );

      if (!normalizedAdapter) {
        issues.push({
          code: 'NORMALIZED_ADAPTER_MISSING',
          message: `Missing normalized adapter ${field} for ${sourceVideoId}`,
          severity: 'error',
          source_video_id: sourceVideoId,
        });
        continue;
      }

      const detailLossDetected = sourceLostDetail.some((risk) =>
        risk.detail.includes(`${field} patterns reduced`)
      );

      const reductionPattern = buildAdapterReductionPattern(
        normalizedAdapter,
        signatureNormalization,
        detailLossDetected
      );
      reductionPattern.source_video_id = sourceVideoId;
      adapterReductionPatterns.push(reductionPattern);
      sourceReductionPatterns += 1;

      totalPatternsBefore += normalizedAdapter.patterns_before;
      totalPatternsAfter += normalizedAdapter.patterns_after;

      const restoreCandidates = buildRestoreCandidates(
        originalAdapter,
        normalizedAdapter,
        sourceVideoId,
        field
      );
      adapterDetailRestoreCandidates.push(...restoreCandidates);
      sourceRestoreCandidates += restoreCandidates.length;

      const lostPatternIds = normalizedAdapter.patterns_before - normalizedAdapter.patterns_after;
      totalLostPatternIds += lostPatternIds;

      const duplicateReintroduced = restoreCandidates.filter(
        (candidate) => candidate.reintroduces_duplicate_signature
      ).length;
      sourceDuplicateReintroduced += duplicateReintroduced;

      const recoveryScore =
        lostPatternIds > 0 ? restoreCandidates.length / lostPatternIds : 1;

      const detailRestored =
        lostPatternIds === 0
          ? 'PASS'
          : restoreCandidates.length === lostPatternIds &&
              duplicateReintroduced === 0 &&
              detailLossDetected
            ? 'PASS'
            : lostPatternIds > 0 && restoreCandidates.length === lostPatternIds
              ? 'PASS'
              : 'FAIL';

      if (detailLossDetected && detailRestored === 'FAIL') {
        issues.push({
          code: 'ADAPTER_DETAIL_NOT_RESTORED',
          message: `Adapter detail restore failed for ${sourceVideoId}/${field}`,
          severity: 'error',
          source_video_id: sourceVideoId,
          adapter_id: originalAdapter.adapter_id,
        });
      }

      perAdapterRecoveryScore.push({
        source_video_id: sourceVideoId,
        adapter_type: field,
        adapter_id: originalAdapter.adapter_id,
        patterns_before: normalizedAdapter.patterns_before,
        patterns_after: normalizedAdapter.patterns_after,
        lost_pattern_ids: lostPatternIds,
        restore_candidates: restoreCandidates.length,
        recovery_score: recoveryScore,
        detail_restored: detailRestored,
      });
    }

    const sourceDetailRestored =
      sourceLostDetail.length > 0 &&
      sourceDuplicateReintroduced === 0 &&
      perAdapterRecoveryScore
        .filter((score) => score.source_video_id === sourceVideoId)
        .filter((score) =>
          sourceLostDetail.some((risk) => risk.detail.includes(`${score.adapter_type} patterns`))
        )
        .every((score) => score.detail_restored === 'PASS')
        ? 'PASS'
        : sourceLostDetail.length === 0
          ? 'PASS'
          : 'FAIL';

    if (sourceLostDetail.length > 0 && sourceDetailRestored === 'FAIL') {
      issues.push({
        code: 'SOURCE_ADAPTER_DETAIL_NOT_RESTORED',
        message: `Source adapter detail restore failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }

    sourceAudits.push({
      source_video_id: sourceVideoId,
      lost_adapter_detail_detected: sourceLostDetail.length > 0,
      lost_adapter_detail_count: sourceLostDetail.length,
      adapter_reduction_patterns: sourceReductionPatterns,
      restore_candidates: sourceRestoreCandidates,
      duplicate_signatures_reintroduced: sourceDuplicateReintroduced,
      adapter_detail_restored: sourceDetailRestored,
    });
  }

  const duplicateSignaturesReintroduced = adapterDetailRestoreCandidates.filter(
    (candidate) => candidate.reintroduces_duplicate_signature
  ).length;

  if (duplicateSignaturesReintroduced > 0) {
    issues.push({
      code: 'DUPLICATE_SIGNATURES_REINTRODUCED',
      message: `Restore introduced ${duplicateSignaturesReintroduced} duplicate signatures`,
      severity: 'error',
    });
  }

  const detailRecoveryRatio =
    totalLostPatternIds > 0
      ? adapterDetailRestoreCandidates.length / totalLostPatternIds
      : 1;

  const detailRecoveryRatioEstimate: DetailRecoveryRatioEstimate = {
    total_patterns_before: totalPatternsBefore,
    total_patterns_after_normalization: totalPatternsAfter,
    total_lost_pattern_ids: totalLostPatternIds,
    total_restore_candidates: adapterDetailRestoreCandidates.length,
    detail_recovery_ratio: detailRecoveryRatio,
  };

  if (detailRecoveryRatio !== 1) {
    issues.push({
      code: 'DETAIL_RECOVERY_RATIO_INCOMPLETE',
      message: `Detail recovery ratio ${detailRecoveryRatio} expected 1`,
      severity: 'error',
    });
  }

  const safetyValid =
    sceneGranularityReport.planning_only === true &&
    sceneGranularityReport.planning_only_status === 'PASS';

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: RestoreStatus = safetyValid ? 'PASS' : 'FAIL';

  const affectedScores = perAdapterRecoveryScore.filter((score) =>
    lostAdapterDetail.some(
      (risk) =>
        risk.source_video_id === score.source_video_id &&
        risk.detail.includes(`${score.adapter_type} patterns`)
    )
  );

  const adapterDetailRestoreReady =
    lostAdapterDetail.length === EXPECTED_LOST_ADAPTER_DETAIL_COUNT &&
    adapterSignatureNormalization.length === EXPECTED_ADAPTER_COUNT &&
    adapterReductionPatterns.length === EXPECTED_ADAPTER_COUNT &&
    adapterDetailRestoreCandidates.length > 0 &&
    detailRecoveryRatio === 1 &&
    duplicateSignaturesReintroduced === 0 &&
    planningOnlyStatus === 'PASS' &&
    affectedScores.every((score) => score.recovery_score === 1 && score.detail_restored === 'PASS') &&
    sourceAudits.every((audit) => audit.adapter_detail_restored === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = adapterDetailRestoreReady === 'PASS';

  const report: MovieAnalysisAdapterDetailRestoreReport = {
    report_id: 'movie-analysis-adapter-detail-restore-report-v1',
    phase: ADAPTER_DETAIL_RESTORE_PHASE,
    timestamp,
    planning_only: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    scene_granularity_restore_report_path: SCENE_GRANULARITY_RESTORE_REPORT_PATH,
    lost_adapter_detail: lostAdapterDetail,
    adapter_signature_normalization: adapterSignatureNormalization,
    adapter_reduction_patterns: adapterReductionPatterns,
    adapter_detail_restore_candidates: adapterDetailRestoreCandidates,
    adapter_information_recovery_rules: ADAPTER_INFORMATION_RECOVERY_RULES,
    adapter_signature_preservation_rules: ADAPTER_SIGNATURE_PRESERVATION_RULES,
    detail_recovery_ratio: detailRecoveryRatioEstimate,
    per_adapter_recovery_score: perAdapterRecoveryScore,
    duplicate_signatures_reintroduced: duplicateSignaturesReintroduced,
    adapter_detail_restore_ready: adapterDetailRestoreReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass
      ? ADAPTER_DETAIL_RESTORE_PASS_VERDICT
      : ADAPTER_DETAIL_RESTORE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, ADAPTER_DETAIL_RESTORE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, ADAPTER_DETAIL_RESTORE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, ADAPTER_DETAIL_RESTORE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
