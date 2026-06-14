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
  REAL_WORLD_VALIDATION_PASS_VERDICT,
  REAL_WORLD_VALIDATION_REPORT_PATH,
  type FieldObservation,
  type MovieAnalysisRealWorldValidationReport,
} from './movieAnalysisRealWorldValidation.js';
import {
  loadMovieAnalysisSceneDetectionPlan,
  type MovieAnalysisSceneDetectionPlan,
} from './movieAnalysisSceneDetectionDesign.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REDUNDANCY_DEDUP_FIX_PHASE =
  'PHASE-L1B-002-MOVIE_ANALYSIS_REDUNDANCY_DEDUP_FIX_V1' as const;
export const REDUNDANCY_DEDUP_FIX_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REDUNDANCY_DEDUP_FIX_V1' as const;
export const REDUNDANCY_DEDUP_FIX_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REDUNDANCY_DEDUP_FIX_V1' as const;
export const REDUNDANCY_DEDUP_FIX_DIR =
  'reports/movie_analysis_redundancy_dedup_fix' as const;
export const REDUNDANCY_DEDUP_FIX_REPORT_PATH =
  'reports/movie_analysis_redundancy_dedup_fix/movie-analysis-redundancy-dedup-fix-report.json' as const;
export const REDUNDANCY_DEDUP_FIX_MD_PATH =
  'reports/movie_analysis_redundancy_dedup_fix/MOVIE_ANALYSIS_REDUNDANCY_DEDUP_FIX.md' as const;

export const EXPECTED_SOURCE_VIDEO_IDS = [
  'GHIBLI_01',
  'LITTLE_WOMEN_01',
  'MORI_01',
  'SHINKAI_01',
] as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type FixStatus = 'PASS' | 'FAIL';

export type RedundancyDedupIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type OverlappingSceneWindow = {
  source_video_id: string;
  scene_detection_id: string;
  candidate_a_id: string;
  candidate_b_id: string;
  overlap_seconds: number;
  resolution_strategy: 'merge_adjacent_windows' | 'trim_trailing_boundary';
};

export type DuplicateAdapterSignature = {
  source_video_id: string;
  adapter_type: string;
  adapter_id: string;
  signature: string;
  duplicate_count: number;
  normalization_action: 'collapse_to_canonical_signature';
};

export type BlueprintRuntimeMergeDuplicate = {
  source_video_id: string;
  adapter_type: string;
  adapter_id: string;
  signature: string;
  blueprint_pattern_count: number;
  runtime_pattern_count: number;
  merge_action: 'prefer_runtime_bundle_pattern' | 'prefer_generation_blueprint_pattern';
};

export type DedupRule = {
  rule_id: string;
  target: 'scene_candidates' | 'adapter_signatures' | 'blueprint_runtime_merge';
  priority: 'high' | 'medium' | 'low';
  description: string;
  planning_only: true;
};

export type FieldMergeRule = {
  rule_id: string;
  source_video_id?: string;
  field_path: string;
  merge_strategy: 'deduplicate_signatures' | 'collapse_overlapping_windows' | 'canonicalize_pattern_ids';
  preserve_traceability: true;
};

export type AdapterSignatureNormalization = {
  source_video_id: string;
  adapter_type: string;
  adapter_id: string;
  signatures_before: number;
  signatures_after: number;
  canonical_signatures: string[];
  normalization_method: 'unique_signature_set_with_source_priority';
};

export type SceneOverlapResolutionCandidate = {
  candidate_id: string;
  source_video_id: string;
  scene_detection_id: string;
  overlapping_pairs: number;
  proposed_merged_windows: number;
  resolution_method: 'merge_adjacent_estimated_windows';
  estimated_reduction: number;
};

export type SourceRedundancyDedupAudit = {
  source_video_id: string;
  redundant_field_count: number;
  overlapping_scene_windows: number;
  duplicate_adapter_signatures: number;
  blueprint_runtime_merge_duplicates: number;
  projected_redundant_field_reduction: number;
  source_dedup_ready: FixStatus;
};

export type MovieAnalysisRedundancyDedupFixReport = {
  report_id: string;
  phase: typeof REDUNDANCY_DEDUP_FIX_PHASE;
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
  real_world_validation_report_path: typeof REAL_WORLD_VALIDATION_REPORT_PATH;
  redundant_fields_before: number;
  redundant_fields_after_projection: number;
  redundant_field_reduction_percent: number;
  overlapping_scene_windows: OverlappingSceneWindow[];
  duplicate_adapter_signatures: DuplicateAdapterSignature[];
  blueprint_runtime_merge_duplicates: BlueprintRuntimeMergeDuplicate[];
  dedup_rules: DedupRule[];
  field_merge_rules: FieldMergeRule[];
  adapter_signature_normalization: AdapterSignatureNormalization[];
  scene_overlap_resolution_candidates: SceneOverlapResolutionCandidate[];
  dedup_analysis_complete: FixStatus;
  dedup_fix_ready: FixStatus;
  planning_only_status: FixStatus;
  source_audits: SourceRedundancyDedupAudit[];
  final_verdict:
    | typeof REDUNDANCY_DEDUP_FIX_PASS_VERDICT
    | typeof REDUNDANCY_DEDUP_FIX_FAIL_VERDICT;
  issues: RedundancyDedupIssue[];
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

function loadRealWorldValidationReport(
  projectRoot: string
): MovieAnalysisRealWorldValidationReport | null {
  const abs = path.join(projectRoot, REAL_WORLD_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRealWorldValidationReport;
}

function computeOverlapSeconds(
  a: MovieAnalysisSceneDetectionPlan['scene_candidates'][number],
  b: MovieAnalysisSceneDetectionPlan['scene_candidates'][number]
): number {
  const start = Math.max(a.estimated_start_seconds, b.estimated_start_seconds);
  const end = Math.min(a.estimated_end_seconds, b.estimated_end_seconds);
  return Math.max(0, end - start);
}

function analyzeOverlappingSceneWindows(
  plan: MovieAnalysisSceneDetectionPlan
): OverlappingSceneWindow[] {
  const overlaps: OverlappingSceneWindow[] = [];
  const candidates = plan.scene_candidates;

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i];
      const b = candidates[j];
      const overlapSeconds = computeOverlapSeconds(a, b);
      if (overlapSeconds > 0) {
        overlaps.push({
          source_video_id: plan.source_video_id,
          scene_detection_id: plan.scene_detection_id,
          candidate_a_id: a.candidate_id,
          candidate_b_id: b.candidate_id,
          overlap_seconds: overlapSeconds,
          resolution_strategy:
            i + 1 === j ? 'merge_adjacent_windows' : 'trim_trailing_boundary',
        });
      }
    }
  }

  return overlaps;
}

function countSignatureDuplicates(adapter: DnaAdapterDefinition): Map<string, number> {
  const counts = new Map<string, number>();
  for (const signature of adapter.pattern_signatures) {
    counts.set(signature, (counts.get(signature) ?? 0) + 1);
  }
  return counts;
}

function analyzeDuplicateAdapterSignatures(
  libraryEntry: DnaAdapterLibraryEntry
): DuplicateAdapterSignature[] {
  const duplicates: DuplicateAdapterSignature[] = [];

  for (const field of ADAPTER_FIELDS) {
    const adapter = libraryEntry[field];
    const counts = countSignatureDuplicates(adapter);
    for (const [signature, count] of counts) {
      if (count > 1) {
        duplicates.push({
          source_video_id: libraryEntry.source_video_id,
          adapter_type: field,
          adapter_id: adapter.adapter_id,
          signature,
          duplicate_count: count,
          normalization_action: 'collapse_to_canonical_signature',
        });
      }
    }
  }

  return duplicates;
}

function analyzeBlueprintRuntimeMergeDuplicates(
  libraryEntry: DnaAdapterLibraryEntry
): BlueprintRuntimeMergeDuplicate[] {
  const duplicates: BlueprintRuntimeMergeDuplicate[] = [];

  for (const field of ADAPTER_FIELDS) {
    const adapter = libraryEntry[field];
    const blueprintSignatures = new Map<string, number>();
    const runtimeSignatures = new Map<string, number>();

    for (let i = 0; i < adapter.pattern_ids.length; i++) {
      const patternId = adapter.pattern_ids[i];
      const signature = adapter.pattern_signatures[i];
      if (patternId.includes('generation_blueprint')) {
        blueprintSignatures.set(signature, (blueprintSignatures.get(signature) ?? 0) + 1);
      }
      if (patternId.includes('final_runtime_bundle')) {
        runtimeSignatures.set(signature, (runtimeSignatures.get(signature) ?? 0) + 1);
      }
    }

    for (const [signature, blueprintCount] of blueprintSignatures) {
      const runtimeCount = runtimeSignatures.get(signature) ?? 0;
      if (runtimeCount > 0) {
        duplicates.push({
          source_video_id: libraryEntry.source_video_id,
          adapter_type: field,
          adapter_id: adapter.adapter_id,
          signature,
          blueprint_pattern_count: blueprintCount,
          runtime_pattern_count: runtimeCount,
          merge_action: 'prefer_runtime_bundle_pattern',
        });
      }
    }
  }

  return duplicates;
}

function buildDedupRules(): DedupRule[] {
  return [
    {
      rule_id: 'dedup-scene-adjacent-merge',
      target: 'scene_candidates',
      priority: 'high',
      description:
        'Merge adjacent overlapping estimated scene windows by unioning time ranges and retaining earliest candidate_id.',
      planning_only: true,
    },
    {
      rule_id: 'dedup-adapter-signature-unique',
      target: 'adapter_signatures',
      priority: 'high',
      description:
        'Collapse duplicate adapter pattern_signatures to a unique canonical set per adapter while preserving pattern_ids traceability.',
      planning_only: true,
    },
    {
      rule_id: 'dedup-blueprint-runtime-priority',
      target: 'blueprint_runtime_merge',
      priority: 'medium',
      description:
        'When generation_blueprint and final_runtime_bundle share a signature, prefer runtime bundle pattern and drop blueprint duplicate.',
      planning_only: true,
    },
    {
      rule_id: 'dedup-field-merge-traceability',
      target: 'adapter_signatures',
      priority: 'medium',
      description:
        'Apply field merge rules without altering cinematic_dna_id, integration_id, or adapter_library_entry_id traceability.',
      planning_only: true,
    },
  ];
}

function buildFieldMergeRules(
  overlaps: OverlappingSceneWindow[],
  signatureDuplicates: DuplicateAdapterSignature[],
  mergeDuplicates: BlueprintRuntimeMergeDuplicate[]
): FieldMergeRule[] {
  const rules: FieldMergeRule[] = [];

  for (const overlap of overlaps) {
    rules.push({
      rule_id: `merge-scene-${overlap.candidate_a_id}-${overlap.candidate_b_id}`,
      source_video_id: overlap.source_video_id,
      field_path: 'scene_candidates.estimated_window',
      merge_strategy: 'collapse_overlapping_windows',
      preserve_traceability: true,
    });
  }

  for (const duplicate of signatureDuplicates) {
    rules.push({
      rule_id: `merge-signature-${duplicate.adapter_id}-${duplicate.signature}`,
      source_video_id: duplicate.source_video_id,
      field_path: `${duplicate.adapter_type}.pattern_signatures`,
      merge_strategy: 'deduplicate_signatures',
      preserve_traceability: true,
    });
  }

  for (const merge of mergeDuplicates) {
    rules.push({
      rule_id: `merge-blueprint-runtime-${merge.adapter_id}-${merge.signature}`,
      source_video_id: merge.source_video_id,
      field_path: `${merge.adapter_type}.pattern_ids`,
      merge_strategy: 'canonicalize_pattern_ids',
      preserve_traceability: true,
    });
  }

  return rules;
}

function buildAdapterSignatureNormalization(
  libraryEntry: DnaAdapterLibraryEntry
): AdapterSignatureNormalization[] {
  const normalizations: AdapterSignatureNormalization[] = [];

  for (const field of ADAPTER_FIELDS) {
    const adapter = libraryEntry[field];
    const canonical = [...new Set(adapter.pattern_signatures)];
    normalizations.push({
      source_video_id: libraryEntry.source_video_id,
      adapter_type: field,
      adapter_id: adapter.adapter_id,
      signatures_before: adapter.pattern_signatures.length,
      signatures_after: canonical.length,
      canonical_signatures: canonical,
      normalization_method: 'unique_signature_set_with_source_priority',
    });
  }

  return normalizations;
}

function buildSceneOverlapResolutionCandidates(
  plan: MovieAnalysisSceneDetectionPlan,
  overlaps: OverlappingSceneWindow[]
): SceneOverlapResolutionCandidate {
  const adjacentPairs = overlaps.filter(
    (overlap) => overlap.resolution_strategy === 'merge_adjacent_windows'
  ).length;

  const proposedMerged = Math.max(0, plan.scene_candidate_count - adjacentPairs);

  return {
    candidate_id: `scene_overlap_resolution_${plan.source_video_id.toLowerCase()}_v1`,
    source_video_id: plan.source_video_id,
    scene_detection_id: plan.scene_detection_id,
    overlapping_pairs: overlaps.length,
    proposed_merged_windows: proposedMerged,
    resolution_method: 'merge_adjacent_estimated_windows',
    estimated_reduction: overlaps.length,
  };
}

function buildMarkdown(report: MovieAnalysisRedundancyDedupFixReport): string {
  const lines = [
    '# Movie Analysis Redundancy Dedup Fix',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Dedup Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    '',
    '## Redundancy Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| redundant_fields_before | ${report.redundant_fields_before} |`,
    `| redundant_fields_after_projection | ${report.redundant_fields_after_projection} |`,
    `| redundant_field_reduction_percent | ${report.redundant_field_reduction_percent}% |`,
    `| overlapping_scene_windows | ${report.overlapping_scene_windows.length} |`,
    `| duplicate_adapter_signatures | ${report.duplicate_adapter_signatures.length} |`,
    `| blueprint_runtime_merge_duplicates | ${report.blueprint_runtime_merge_duplicates.length} |`,
    `| dedup_rules | ${report.dedup_rules.length} |`,
    `| field_merge_rules | ${report.field_merge_rules.length} |`,
    `| adapter_signature_normalization | ${report.adapter_signature_normalization.length} |`,
    `| scene_overlap_resolution_candidates | ${report.scene_overlap_resolution_candidates.length} |`,
    '',
    '## Dedup Rules',
    '',
  ];

  for (const rule of report.dedup_rules) {
    lines.push(`- **${rule.rule_id}** [${rule.priority}] ${rule.description}`);
  }

  lines.push('', '## Source Audits', '');
  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- redundant_field_count: ${audit.redundant_field_count}`,
      `- overlapping_scene_windows: ${audit.overlapping_scene_windows}`,
      `- duplicate_adapter_signatures: ${audit.duplicate_adapter_signatures}`,
      `- blueprint_runtime_merge_duplicates: ${audit.blueprint_runtime_merge_duplicates}`,
      `- projected_redundant_field_reduction: ${audit.projected_redundant_field_reduction}`,
      `- source_dedup_ready: ${audit.source_dedup_ready}`,
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

export function writeMovieAnalysisRedundancyDedupFixReport(
  projectRoot?: string
): MovieAnalysisRedundancyDedupFixReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RedundancyDedupIssue[] = [];
  const timestamp = new Date().toISOString();

  const validationReport = loadRealWorldValidationReport(root);
  if (!validationReport) {
    issues.push({
      code: 'REAL_WORLD_VALIDATION_REPORT_MISSING',
      message: `Missing ${REAL_WORLD_VALIDATION_REPORT_PATH}`,
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

  if (!validationReport || !adapterLibrary) {
    const report: MovieAnalysisRedundancyDedupFixReport = {
      report_id: 'movie-analysis-redundancy-dedup-fix-report-v1',
      phase: REDUNDANCY_DEDUP_FIX_PHASE,
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
      real_world_validation_report_path: REAL_WORLD_VALIDATION_REPORT_PATH,
      redundant_fields_before: 0,
      redundant_fields_after_projection: 0,
      redundant_field_reduction_percent: 0,
      overlapping_scene_windows: [],
      duplicate_adapter_signatures: [],
      blueprint_runtime_merge_duplicates: [],
      dedup_rules: [],
      field_merge_rules: [],
      adapter_signature_normalization: [],
      scene_overlap_resolution_candidates: [],
      dedup_analysis_complete: 'FAIL',
      dedup_fix_ready: 'FAIL',
      planning_only_status: 'FAIL',
      source_audits: [],
      final_verdict: REDUNDANCY_DEDUP_FIX_FAIL_VERDICT,
      issues,
    };

    fs.mkdirSync(path.join(root, REDUNDANCY_DEDUP_FIX_DIR), { recursive: true });
    fs.writeFileSync(
      path.join(root, REDUNDANCY_DEDUP_FIX_REPORT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(root, REDUNDANCY_DEDUP_FIX_MD_PATH),
      `${buildMarkdown(report)}\n`,
      'utf8'
    );
    return report;
  }

  if (validationReport.final_verdict !== REAL_WORLD_VALIDATION_PASS_VERDICT) {
    issues.push({
      code: 'REAL_WORLD_VALIDATION_NOT_PASS',
      message: `Real-world validation must have ${REAL_WORLD_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const overlappingSceneWindows: OverlappingSceneWindow[] = [];
  const duplicateAdapterSignatures: DuplicateAdapterSignature[] = [];
  const blueprintRuntimeMergeDuplicates: BlueprintRuntimeMergeDuplicate[] = [];
  const adapterSignatureNormalization: AdapterSignatureNormalization[] = [];
  const sceneOverlapResolutionCandidates: SceneOverlapResolutionCandidate[] = [];
  const sourceAudits: SourceRedundancyDedupAudit[] = [];

  let projectedReductionTotal = 0;

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
        code: 'SOURCE_DEDUP_COMPONENTS_MISSING',
        message: `Missing dedup components for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
      continue;
    }

    const overlaps = analyzeOverlappingSceneWindows(scenePlan);
    overlappingSceneWindows.push(...overlaps);

    const signatureDuplicates = analyzeDuplicateAdapterSignatures(libraryEntry);
    duplicateAdapterSignatures.push(...signatureDuplicates);

    const mergeDuplicates = analyzeBlueprintRuntimeMergeDuplicates(libraryEntry);
    blueprintRuntimeMergeDuplicates.push(...mergeDuplicates);

    adapterSignatureNormalization.push(...buildAdapterSignatureNormalization(libraryEntry));
    sceneOverlapResolutionCandidates.push(
      buildSceneOverlapResolutionCandidates(scenePlan, overlaps)
    );

    const redundantFieldCount = validationReport.redundant_fields.filter(
      (field: FieldObservation) => field.source_video_id === sourceVideoId
    ).length;

    const signatureReduction = adapterSignatureNormalization
      .filter((entry) => entry.source_video_id === sourceVideoId)
      .reduce((sum, entry) => sum + (entry.signatures_before - entry.signatures_after), 0);

    const projectedReduction = overlaps.length + signatureReduction + mergeDuplicates.length;
    projectedReductionTotal += projectedReduction;

    const sourceDedupReady =
      overlaps.length > 0 || signatureDuplicates.length > 0 || mergeDuplicates.length > 0
        ? 'PASS'
        : 'FAIL';

    if (sourceDedupReady === 'FAIL') {
      issues.push({
        code: 'SOURCE_NO_REDUNDANCY_DETECTED',
        message: `No redundancy detected for ${sourceVideoId} — cannot produce dedup fix`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }

    sourceAudits.push({
      source_video_id: sourceVideoId,
      redundant_field_count: redundantFieldCount,
      overlapping_scene_windows: overlaps.length,
      duplicate_adapter_signatures: signatureDuplicates.length,
      blueprint_runtime_merge_duplicates: mergeDuplicates.length,
      projected_redundant_field_reduction: projectedReduction,
      source_dedup_ready: sourceDedupReady,
    });
  }

  const dedupRules = buildDedupRules();
  const fieldMergeRules = buildFieldMergeRules(
    overlappingSceneWindows,
    duplicateAdapterSignatures,
    blueprintRuntimeMergeDuplicates
  );

  const redundantFieldsBefore = validationReport.redundant_fields.length;
  const redundantFieldsAfterProjection = Math.max(
    0,
    redundantFieldsBefore - projectedReductionTotal
  );
  const redundantFieldReductionPercent =
    redundantFieldsBefore > 0
      ? Math.round(
          ((redundantFieldsBefore - redundantFieldsAfterProjection) / redundantFieldsBefore) *
            100
        )
      : 0;

  const safetyValid =
    validationReport.planning_only === true &&
    validationReport.planning_only_status === 'PASS';

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: FixStatus = safetyValid ? 'PASS' : 'FAIL';

  const dedupAnalysisComplete =
    overlappingSceneWindows.length > 0 &&
    duplicateAdapterSignatures.length > 0 &&
    blueprintRuntimeMergeDuplicates.length > 0 &&
    sourceAudits.length === EXPECTED_SOURCE_COUNT
      ? 'PASS'
      : 'FAIL';

  if (dedupAnalysisComplete === 'FAIL') {
    issues.push({
      code: 'DEDUP_ANALYSIS_INCOMPLETE',
      message: 'Redundancy dedup analysis incomplete',
      severity: 'error',
    });
  }

  const dedupFixReady =
    dedupAnalysisComplete === 'PASS' &&
    dedupRules.length >= 4 &&
    fieldMergeRules.length > 0 &&
    adapterSignatureNormalization.length === EXPECTED_SOURCE_COUNT * ADAPTER_FIELDS.length &&
    sceneOverlapResolutionCandidates.length === EXPECTED_SOURCE_COUNT &&
    redundantFieldReductionPercent >= 50 &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.source_dedup_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = dedupFixReady === 'PASS';

  const report: MovieAnalysisRedundancyDedupFixReport = {
    report_id: 'movie-analysis-redundancy-dedup-fix-report-v1',
    phase: REDUNDANCY_DEDUP_FIX_PHASE,
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
    real_world_validation_report_path: REAL_WORLD_VALIDATION_REPORT_PATH,
    redundant_fields_before: redundantFieldsBefore,
    redundant_fields_after_projection: redundantFieldsAfterProjection,
    redundant_field_reduction_percent: redundantFieldReductionPercent,
    overlapping_scene_windows: overlappingSceneWindows,
    duplicate_adapter_signatures: duplicateAdapterSignatures,
    blueprint_runtime_merge_duplicates: blueprintRuntimeMergeDuplicates,
    dedup_rules: dedupRules,
    field_merge_rules: fieldMergeRules,
    adapter_signature_normalization: adapterSignatureNormalization,
    scene_overlap_resolution_candidates: sceneOverlapResolutionCandidates,
    dedup_analysis_complete: dedupAnalysisComplete,
    dedup_fix_ready: dedupFixReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass ? REDUNDANCY_DEDUP_FIX_PASS_VERDICT : REDUNDANCY_DEDUP_FIX_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REDUNDANCY_DEDUP_FIX_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REDUNDANCY_DEDUP_FIX_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REDUNDANCY_DEDUP_FIX_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
