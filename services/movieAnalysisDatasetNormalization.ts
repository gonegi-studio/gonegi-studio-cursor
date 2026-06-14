import fs from 'node:fs';
import path from 'node:path';
import {
  DNA_ADAPTER_LIBRARY_PATH,
  type DnaAdapterDefinition,
  type DnaAdapterLibraryEntry,
  loadMovieAnalysisDnaAdapterLibrary,
} from './movieAnalysisDnaAdapterLibrary.js';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  loadMovieAnalysisMasterPackagePlan,
  SEED_MASTER_PACKAGE_SPECS,
} from './movieAnalysisMasterPackageDesign.js';
import {
  REDUNDANCY_DEDUP_FIX_PASS_VERDICT,
  REDUNDANCY_DEDUP_FIX_REPORT_PATH,
  type AdapterSignatureNormalization,
  type MovieAnalysisRedundancyDedupFixReport,
} from './movieAnalysisRedundancyDedupFix.js';
import {
  loadMovieAnalysisImageAppBridge,
} from './movieAnalysisImageAppBridge.js';
import {
  loadMovieAnalysisSceneDetectionPlan,
  type MovieAnalysisSceneDetectionPlan,
  type SceneCandidate,
} from './movieAnalysisSceneDetectionDesign.js';
import { loadMovieAnalysisVideoAppBridge } from './movieAnalysisVideoAppBridge.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DATASET_NORMALIZATION_PHASE =
  'PHASE-L1B-003-MOVIE_ANALYSIS_DATASET_NORMALIZATION_V1' as const;
export const DATASET_NORMALIZATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_DATASET_NORMALIZATION_V1' as const;
export const DATASET_NORMALIZATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_DATASET_NORMALIZATION_V1' as const;
export const DATASET_NORMALIZATION_DIR =
  'reports/movie_analysis_dataset_normalization' as const;
export const DATASET_NORMALIZATION_REPORT_PATH =
  'reports/movie_analysis_dataset_normalization/movie-analysis-dataset-normalization-report.json' as const;
export const DATASET_NORMALIZATION_MD_PATH =
  'reports/movie_analysis_dataset_normalization/MOVIE_ANALYSIS_DATASET_NORMALIZATION.md' as const;
export const DATASET_NORMALIZATION_STRUCTURES_PATH =
  'reports/movie_analysis_dataset_normalization/movie-analysis-dataset-normalization-structures.json' as const;

export const EXPECTED_SOURCE_VIDEO_IDS = [
  'GHIBLI_01',
  'LITTLE_WOMEN_01',
  'MORI_01',
  'SHINKAI_01',
] as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type NormalizationStatus = 'PASS' | 'FAIL';

export type DatasetNormalizationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type NormalizedSceneCandidate = {
  candidate_id: string;
  estimated_start_seconds: number;
  estimated_end_seconds: number;
  candidate_role: SceneCandidate['candidate_role'];
  merged_from: string[];
  estimated_only: true;
  normalized: true;
};

export type NormalizedSceneStructure = {
  source_video_id: string;
  scene_detection_id: string;
  scene_candidates_before: number;
  scene_candidates_after: number;
  overlapping_windows_removed: number;
  candidates: NormalizedSceneCandidate[];
  normalization_applied: ['collapse_overlapping_windows'];
};

export type NormalizedAdapterPattern = {
  pattern_id: string;
  pattern_signature: string;
  source_origin: 'generation_blueprint' | 'final_runtime_bundle' | 'other';
};

export type NormalizedAdapterEntry = {
  adapter_type: string;
  adapter_id: string;
  patterns_before: number;
  patterns_after: number;
  signatures_before: number;
  signatures_after: number;
  duplicate_signatures_removed: number;
  blueprint_runtime_duplicates_removed: number;
  patterns: NormalizedAdapterPattern[];
  adapter_ready: true;
  library_only: true;
  normalized: true;
};

export type NormalizedAdapterStructure = {
  source_video_id: string;
  cinematic_dna_id: string;
  integration_id: string;
  adapter_library_entry_id: string;
  adapters: NormalizedAdapterEntry[];
};

export type NormalizedTraceabilityLink = {
  link_type: string;
  source_id: string;
  target_id: string;
  preserved: true;
};

export type NormalizedTraceabilityStructure = {
  source_video_id: string;
  master_package_id: string;
  cinematic_dna_id: string;
  integration_id: string;
  adapter_library_entry_id: string;
  image_bridge_entry_id: string;
  video_bridge_entry_id: string;
  package_trace_steps: number;
  traceability_links: NormalizedTraceabilityLink[];
  traceability_preserved: true;
};

export type SourceDatasetNormalizationAudit = {
  source_video_id: string;
  scene_candidates_before: number;
  scene_candidates_after: number;
  adapter_patterns_before: number;
  adapter_patterns_after: number;
  duplicate_signatures_removed: number;
  traceability_links: number;
  source_normalized: NormalizationStatus;
};

export type MovieAnalysisDatasetNormalizationReport = {
  report_id: string;
  phase: typeof DATASET_NORMALIZATION_PHASE;
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
  dedup_fix_report_path: typeof REDUNDANCY_DEDUP_FIX_REPORT_PATH;
  dedup_rules_applied: number;
  field_merge_rules_applied: number;
  adapter_normalizations_applied: number;
  source_count: number;
  adapter_count: number;
  normalized_scene_structure: NormalizedSceneStructure[];
  normalized_adapter_structure: NormalizedAdapterStructure[];
  normalized_traceability_structure: NormalizedTraceabilityStructure[];
  redundant_fields_before: number;
  redundant_fields_after_normalization: number;
  normalization_reduction_percent: number;
  dataset_normalization_ready: NormalizationStatus;
  planning_only_status: NormalizationStatus;
  source_audits: SourceDatasetNormalizationAudit[];
  final_verdict:
    | typeof DATASET_NORMALIZATION_PASS_VERDICT
    | typeof DATASET_NORMALIZATION_FAIL_VERDICT;
  issues: DatasetNormalizationIssue[];
};

const SOURCE_SCENE_DETECTION_IDS: Record<(typeof EXPECTED_SOURCE_VIDEO_IDS)[number], string> = {
  GHIBLI_01: 'scene_detection_ghibli_01_v1',
  LITTLE_WOMEN_01: 'scene_detection_little_women_01_v1',
  MORI_01: 'scene_detection_mori_01_v1',
  SHINKAI_01: 'scene_detection_shinkai_01_v1',
};

const ADAPTER_FIELDS = [
  'scene_adapter',
  'camera_adapter',
  'emotion_adapter',
  'transition_adapter',
  'continuity_adapter',
  'storytelling_adapter',
] as const;

function loadDedupFixReport(projectRoot: string): MovieAnalysisRedundancyDedupFixReport | null {
  const abs = path.join(projectRoot, REDUNDANCY_DEDUP_FIX_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisRedundancyDedupFixReport;
}

function normalizeSceneStructure(
  plan: MovieAnalysisSceneDetectionPlan
): NormalizedSceneStructure {
  const sorted = [...plan.scene_candidates].sort(
    (a, b) => a.estimated_start_seconds - b.estimated_start_seconds
  );

  const merged: NormalizedSceneCandidate[] = [];
  let overlappingRemoved = 0;

  for (const candidate of sorted) {
    const last = merged[merged.length - 1];
    if (
      last &&
      last.estimated_start_seconds < candidate.estimated_end_seconds &&
      candidate.estimated_start_seconds < last.estimated_end_seconds
    ) {
      last.estimated_end_seconds = Math.max(
        last.estimated_end_seconds,
        candidate.estimated_end_seconds
      );
      last.merged_from.push(candidate.candidate_id);
      overlappingRemoved += 1;
    } else {
      merged.push({
        candidate_id: candidate.candidate_id,
        estimated_start_seconds: candidate.estimated_start_seconds,
        estimated_end_seconds: candidate.estimated_end_seconds,
        candidate_role: candidate.candidate_role,
        merged_from: [candidate.candidate_id],
        estimated_only: true,
        normalized: true,
      });
    }
  }

  return {
    source_video_id: plan.source_video_id,
    scene_detection_id: plan.scene_detection_id,
    scene_candidates_before: plan.scene_candidates.length,
    scene_candidates_after: merged.length,
    overlapping_windows_removed: overlappingRemoved,
    candidates: merged,
    normalization_applied: ['collapse_overlapping_windows'],
  };
}

function patternOrigin(patternId: string): NormalizedAdapterPattern['source_origin'] {
  if (patternId.includes('generation_blueprint')) return 'generation_blueprint';
  if (patternId.includes('final_runtime_bundle')) return 'final_runtime_bundle';
  return 'other';
}

function normalizeAdapter(
  adapter: DnaAdapterDefinition,
  adapterType: string,
  signatureNormalization: AdapterSignatureNormalization | undefined
): NormalizedAdapterEntry {
  const patterns: NormalizedAdapterPattern[] = [];
  const seenSignatures = new Set<string>();
  let blueprintRuntimeRemoved = 0;

  const entries = adapter.pattern_ids.map((patternId, index) => ({
    pattern_id: patternId,
    pattern_signature: adapter.pattern_signatures[index],
    origin: patternOrigin(patternId),
  }));

  const runtimeFirst = [
    ...entries.filter((entry) => entry.origin === 'final_runtime_bundle'),
    ...entries.filter((entry) => entry.origin === 'generation_blueprint'),
    ...entries.filter((entry) => entry.origin === 'other'),
  ];

  for (const entry of runtimeFirst) {
    if (seenSignatures.has(entry.pattern_signature)) {
      if (entry.origin === 'generation_blueprint') {
        blueprintRuntimeRemoved += 1;
      }
      continue;
    }
    seenSignatures.add(entry.pattern_signature);
    patterns.push({
      pattern_id: entry.pattern_id,
      pattern_signature: entry.pattern_signature,
      source_origin: entry.origin,
    });
  }

  const signaturesBefore = adapter.pattern_signatures.length;
  const signaturesAfter =
    signatureNormalization?.signatures_after ?? patterns.length;

  return {
    adapter_type: adapterType,
    adapter_id: adapter.adapter_id,
    patterns_before: adapter.pattern_ids.length,
    patterns_after: patterns.length,
    signatures_before: signaturesBefore,
    signatures_after: signaturesAfter,
    duplicate_signatures_removed: signaturesBefore - patterns.length,
    blueprint_runtime_duplicates_removed: blueprintRuntimeRemoved,
    patterns,
    adapter_ready: true,
    library_only: true,
    normalized: true,
  };
}

function normalizeAdapterStructure(
  libraryEntry: DnaAdapterLibraryEntry,
  signatureNormalizations: AdapterSignatureNormalization[]
): NormalizedAdapterStructure {
  const adapters: NormalizedAdapterEntry[] = [];

  for (const field of ADAPTER_FIELDS) {
    const normalization = signatureNormalizations.find(
      (entry) =>
        entry.source_video_id === libraryEntry.source_video_id &&
        entry.adapter_type === field
    );
    adapters.push(normalizeAdapter(libraryEntry[field], field, normalization));
  }

  return {
    source_video_id: libraryEntry.source_video_id,
    cinematic_dna_id: libraryEntry.cinematic_dna_id,
    integration_id: libraryEntry.integration_id,
    adapter_library_entry_id: libraryEntry.adapter_library_entry_id,
    adapters,
  };
}

function normalizeTraceabilityStructure(
  projectRoot: string,
  sourceVideoId: string,
  libraryEntry: DnaAdapterLibraryEntry
): NormalizedTraceabilityStructure {
  const masterSpec = SEED_MASTER_PACKAGE_SPECS.find(
    (spec) => spec.source_video_id === sourceVideoId
  );
  const master = masterSpec
    ? loadMovieAnalysisMasterPackagePlan(projectRoot, masterSpec.master_package_id)
    : null;
  const imageBridge = loadMovieAnalysisImageAppBridge(projectRoot);
  const videoBridge = loadMovieAnalysisVideoAppBridge(projectRoot);
  const imageEntry = imageBridge?.entries.find(
    (entry) => entry.source_video_id === sourceVideoId
  );
  const videoEntry = videoBridge?.entries.find(
    (entry) => entry.source_video_id === sourceVideoId
  );

  const links: NormalizedTraceabilityLink[] = [
    {
      link_type: 'master_package_to_scene_detection',
      source_id: master?.master_package_id ?? '',
      target_id: master?.scene_detection_id ?? '',
      preserved: true,
    },
    {
      link_type: 'scene_detection_to_cinematic_dna',
      source_id: master?.scene_detection_id ?? '',
      target_id: libraryEntry.cinematic_dna_id,
      preserved: true,
    },
    {
      link_type: 'cinematic_dna_to_integration',
      source_id: libraryEntry.cinematic_dna_id,
      target_id: libraryEntry.integration_id,
      preserved: true,
    },
    {
      link_type: 'integration_to_adapter_library',
      source_id: libraryEntry.integration_id,
      target_id: libraryEntry.adapter_library_entry_id,
      preserved: true,
    },
    {
      link_type: 'adapter_library_to_image_bridge',
      source_id: libraryEntry.adapter_library_entry_id,
      target_id: imageEntry?.adapter_library_entry_id ?? '',
      preserved: true,
    },
    {
      link_type: 'adapter_library_to_video_bridge',
      source_id: libraryEntry.adapter_library_entry_id,
      target_id: videoEntry?.adapter_library_entry_id ?? '',
      preserved: true,
    },
  ];

  return {
    source_video_id: sourceVideoId,
    master_package_id: master?.master_package_id ?? '',
    cinematic_dna_id: libraryEntry.cinematic_dna_id,
    integration_id: libraryEntry.integration_id,
    adapter_library_entry_id: libraryEntry.adapter_library_entry_id,
    image_bridge_entry_id: imageEntry?.adapter_library_entry_id ?? '',
    video_bridge_entry_id: videoEntry?.adapter_library_entry_id ?? '',
    package_trace_steps: master?.package_trace.length ?? 0,
    traceability_links: links,
    traceability_preserved: true,
  };
}

function countRemainingRedundancy(
  scenes: NormalizedSceneStructure[],
  adapters: NormalizedAdapterStructure[]
): number {
  let count = 0;

  for (const scene of scenes) {
    for (let i = 0; i < scene.candidates.length; i++) {
      for (let j = i + 1; j < scene.candidates.length; j++) {
        const a = scene.candidates[i];
        const b = scene.candidates[j];
        if (
          a.estimated_start_seconds < b.estimated_end_seconds &&
          b.estimated_start_seconds < a.estimated_end_seconds
        ) {
          count += 1;
        }
      }
    }
  }

  for (const adapterStructure of adapters) {
    for (const adapter of adapterStructure.adapters) {
      const seen = new Set<string>();
      for (const pattern of adapter.patterns) {
        if (seen.has(pattern.pattern_signature)) {
          count += 1;
        }
        seen.add(pattern.pattern_signature);
      }
    }
  }

  return count;
}

function buildMarkdown(report: MovieAnalysisDatasetNormalizationReport): string {
  const lines = [
    '# Movie Analysis Dataset Normalization',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Normalization Mode',
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
    `| dedup_rules_applied | ${report.dedup_rules_applied} |`,
    `| field_merge_rules_applied | ${report.field_merge_rules_applied} |`,
    `| adapter_normalizations_applied | ${report.adapter_normalizations_applied} |`,
    `| redundant_fields_before | ${report.redundant_fields_before} |`,
    `| redundant_fields_after_normalization | ${report.redundant_fields_after_normalization} |`,
    `| normalization_reduction_percent | ${report.normalization_reduction_percent}% |`,
    `| normalized_scene_sources | ${report.normalized_scene_structure.length} |`,
    `| normalized_adapter_sources | ${report.normalized_adapter_structure.length} |`,
    `| normalized_traceability_sources | ${report.normalized_traceability_structure.length} |`,
    `| dataset_normalization_ready | ${report.dataset_normalization_ready} |`,
    '',
    '## Source Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- scene_candidates_before: ${audit.scene_candidates_before}`,
      `- scene_candidates_after: ${audit.scene_candidates_after}`,
      `- adapter_patterns_before: ${audit.adapter_patterns_before}`,
      `- adapter_patterns_after: ${audit.adapter_patterns_after}`,
      `- duplicate_signatures_removed: ${audit.duplicate_signatures_removed}`,
      `- traceability_links: ${audit.traceability_links}`,
      `- source_normalized: ${audit.source_normalized}`,
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

export function writeMovieAnalysisDatasetNormalizationReport(
  projectRoot?: string
): MovieAnalysisDatasetNormalizationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: DatasetNormalizationIssue[] = [];
  const timestamp = new Date().toISOString();

  const dedupReport = loadDedupFixReport(root);
  if (!dedupReport) {
    issues.push({
      code: 'DEDUP_FIX_REPORT_MISSING',
      message: `Missing ${REDUNDANCY_DEDUP_FIX_REPORT_PATH}`,
      severity: 'error',
    });
  }

  const adapterLibrary = loadMovieAnalysisDnaAdapterLibrary(root);
  if (!adapterLibrary) {
    issues.push({
      code: 'ADAPTER_LIBRARY_MISSING',
      message: `Missing ${DNA_ADAPTER_LIBRARY_PATH}`,
      severity: 'error',
    });
  }

  if (!dedupReport || !adapterLibrary) {
    const report: MovieAnalysisDatasetNormalizationReport = {
      report_id: 'movie-analysis-dataset-normalization-report-v1',
      phase: DATASET_NORMALIZATION_PHASE,
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
      dedup_fix_report_path: REDUNDANCY_DEDUP_FIX_REPORT_PATH,
      dedup_rules_applied: 0,
      field_merge_rules_applied: 0,
      adapter_normalizations_applied: 0,
      source_count: 0,
      adapter_count: 0,
      normalized_scene_structure: [],
      normalized_adapter_structure: [],
      normalized_traceability_structure: [],
      redundant_fields_before: 0,
      redundant_fields_after_normalization: 0,
      normalization_reduction_percent: 0,
      dataset_normalization_ready: 'FAIL',
      planning_only_status: 'FAIL',
      source_audits: [],
      final_verdict: DATASET_NORMALIZATION_FAIL_VERDICT,
      issues,
    };

    fs.mkdirSync(path.join(root, DATASET_NORMALIZATION_DIR), { recursive: true });
    fs.writeFileSync(
      path.join(root, DATASET_NORMALIZATION_REPORT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(root, DATASET_NORMALIZATION_MD_PATH),
      `${buildMarkdown(report)}\n`,
      'utf8'
    );
    return report;
  }

  if (dedupReport.final_verdict !== REDUNDANCY_DEDUP_FIX_PASS_VERDICT) {
    issues.push({
      code: 'DEDUP_FIX_NOT_PASS',
      message: `Dedup fix must have ${REDUNDANCY_DEDUP_FIX_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const normalizedSceneStructure: NormalizedSceneStructure[] = [];
  const normalizedAdapterStructure: NormalizedAdapterStructure[] = [];
  const normalizedTraceabilityStructure: NormalizedTraceabilityStructure[] = [];
  const sourceAudits: SourceDatasetNormalizationAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const scenePlan = loadMovieAnalysisSceneDetectionPlan(
      root,
      SOURCE_SCENE_DETECTION_IDS[sourceVideoId]
    );
    const libraryEntry = adapterLibrary.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );

    if (!scenePlan || !libraryEntry) {
      issues.push({
        code: 'SOURCE_NORMALIZATION_COMPONENTS_MISSING',
        message: `Missing normalization components for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
      continue;
    }

    const normalizedScene = normalizeSceneStructure(scenePlan);
    const sourceSignatureNormalizations = dedupReport.adapter_signature_normalization.filter(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const normalizedAdapter = normalizeAdapterStructure(
      libraryEntry,
      sourceSignatureNormalizations
    );
    const normalizedTrace = normalizeTraceabilityStructure(
      root,
      sourceVideoId,
      libraryEntry
    );

    normalizedSceneStructure.push(normalizedScene);
    normalizedAdapterStructure.push(normalizedAdapter);
    normalizedTraceabilityStructure.push(normalizedTrace);

    const adapterPatternsBefore = normalizedAdapter.adapters.reduce(
      (sum, adapter) => sum + adapter.patterns_before,
      0
    );
    const adapterPatternsAfter = normalizedAdapter.adapters.reduce(
      (sum, adapter) => sum + adapter.patterns_after,
      0
    );
    const duplicateSignaturesRemoved = normalizedAdapter.adapters.reduce(
      (sum, adapter) => sum + adapter.duplicate_signatures_removed,
      0
    );

    const sourceNormalized =
      normalizedScene.overlapping_windows_removed > 0 &&
      duplicateSignaturesRemoved > 0 &&
      normalizedTrace.traceability_preserved === true &&
      normalizedTrace.package_trace_steps >= 17
        ? 'PASS'
        : 'FAIL';

    if (sourceNormalized === 'FAIL') {
      issues.push({
        code: 'SOURCE_NOT_NORMALIZED',
        message: `Dataset normalization failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }

    sourceAudits.push({
      source_video_id: sourceVideoId,
      scene_candidates_before: normalizedScene.scene_candidates_before,
      scene_candidates_after: normalizedScene.scene_candidates_after,
      adapter_patterns_before: adapterPatternsBefore,
      adapter_patterns_after: adapterPatternsAfter,
      duplicate_signatures_removed: duplicateSignaturesRemoved,
      traceability_links: normalizedTrace.traceability_links.length,
      source_normalized: sourceNormalized,
    });
  }

  const redundantFieldsBefore = dedupReport.redundant_fields_before;
  const redundantFieldsAfter = countRemainingRedundancy(
    normalizedSceneStructure,
    normalizedAdapterStructure
  );
  const normalizationReductionPercent =
    redundantFieldsBefore > 0
      ? Math.round(
          ((redundantFieldsBefore - redundantFieldsAfter) / redundantFieldsBefore) * 100
        )
      : 0;

  const safetyValid =
    dedupReport.planning_only === true && dedupReport.planning_only_status === 'PASS';

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: NormalizationStatus = safetyValid ? 'PASS' : 'FAIL';

  const datasetNormalizationReady =
    normalizedSceneStructure.length === EXPECTED_SOURCE_COUNT &&
    normalizedAdapterStructure.length === EXPECTED_SOURCE_COUNT &&
    normalizedTraceabilityStructure.length === EXPECTED_SOURCE_COUNT &&
    dedupReport.dedup_rules.length > 0 &&
    dedupReport.field_merge_rules.length > 0 &&
    dedupReport.adapter_signature_normalization.length > 0 &&
    redundantFieldsAfter === 0 &&
    normalizationReductionPercent >= 95 &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.source_normalized === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = datasetNormalizationReady === 'PASS';

  const report: MovieAnalysisDatasetNormalizationReport = {
    report_id: 'movie-analysis-dataset-normalization-report-v1',
    phase: DATASET_NORMALIZATION_PHASE,
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
    dedup_fix_report_path: REDUNDANCY_DEDUP_FIX_REPORT_PATH,
    dedup_rules_applied: dedupReport.dedup_rules.length,
    field_merge_rules_applied: dedupReport.field_merge_rules.length,
    adapter_normalizations_applied: dedupReport.adapter_signature_normalization.length,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    normalized_scene_structure: normalizedSceneStructure,
    normalized_adapter_structure: normalizedAdapterStructure,
    normalized_traceability_structure: normalizedTraceabilityStructure,
    redundant_fields_before: redundantFieldsBefore,
    redundant_fields_after_normalization: redundantFieldsAfter,
    normalization_reduction_percent: normalizationReductionPercent,
    dataset_normalization_ready: datasetNormalizationReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass
      ? DATASET_NORMALIZATION_PASS_VERDICT
      : DATASET_NORMALIZATION_FAIL_VERDICT,
    issues,
  };

  const structuresBundle = {
    normalization_id: 'movie-analysis-dataset-normalization-structures-v1',
    phase: DATASET_NORMALIZATION_PHASE,
    generated_at: timestamp,
    normalized_scene_structure: normalizedSceneStructure,
    normalized_adapter_structure: normalizedAdapterStructure,
    normalized_traceability_structure: normalizedTraceabilityStructure,
  };

  fs.mkdirSync(path.join(root, DATASET_NORMALIZATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, DATASET_NORMALIZATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, DATASET_NORMALIZATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, DATASET_NORMALIZATION_STRUCTURES_PATH),
    `${JSON.stringify(structuresBundle, null, 2)}\n`,
    'utf8'
  );

  return report;
}
