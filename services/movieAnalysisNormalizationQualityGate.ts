import fs from 'node:fs';
import path from 'node:path';
import {
  CINEMATIC_DNA_PATH,
  type CinematicDnaEntry,
  loadMovieAnalysisCinematicDna,
} from './movieAnalysisCinematicDnaExtraction.js';
import {
  DATASET_NORMALIZATION_PASS_VERDICT,
  DATASET_NORMALIZATION_REPORT_PATH,
  DATASET_NORMALIZATION_STRUCTURES_PATH,
  type MovieAnalysisDatasetNormalizationReport,
  type NormalizedAdapterStructure,
  type NormalizedSceneStructure,
  type NormalizedTraceabilityStructure,
} from './movieAnalysisDatasetNormalization.js';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const NORMALIZATION_QUALITY_GATE_PHASE =
  'PHASE-L1B-004-MOVIE_ANALYSIS_NORMALIZATION_QUALITY_GATE_V1' as const;
export const NORMALIZATION_QUALITY_GATE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_NORMALIZATION_QUALITY_GATE_V1' as const;
export const NORMALIZATION_QUALITY_GATE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_NORMALIZATION_QUALITY_GATE_V1' as const;
export const NORMALIZATION_QUALITY_GATE_DIR =
  'reports/movie_analysis_normalization_quality_gate' as const;
export const NORMALIZATION_QUALITY_GATE_REPORT_PATH =
  'reports/movie_analysis_normalization_quality_gate/movie-analysis-normalization-quality-gate-report.json' as const;
export const NORMALIZATION_QUALITY_GATE_MD_PATH =
  'reports/movie_analysis_normalization_quality_gate/MOVIE_ANALYSIS_NORMALIZATION_QUALITY_GATE.md' as const;

export const EXPECTED_SOURCE_VIDEO_IDS = [
  'GHIBLI_01',
  'LITTLE_WOMEN_01',
  'MORI_01',
  'SHINKAI_01',
] as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type GateStatus = 'PASS' | 'FAIL';

export type QualityGateIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type QualityRiskDetection = {
  risk_id: string;
  risk_type: 'over_merge_risk' | 'lost_scene_granularity' | 'lost_adapter_detail';
  source_video_id: string;
  severity: 'warning' | 'info';
  detail: string;
};

export type SourceNormalizationQualityAudit = {
  source_video_id: string;
  redundant_fields_after_normalization: number;
  scene_collapse_safety: GateStatus;
  adapter_signature_uniqueness: GateStatus;
  traceability_preserved: GateStatus;
  dna_coverage_preserved: GateStatus;
  adapter_coverage_preserved: GateStatus;
  over_merge_risk_detected: boolean;
  lost_scene_granularity_detected: boolean;
  lost_adapter_detail_detected: boolean;
  source_quality_pass: GateStatus;
};

export type MovieAnalysisNormalizationQualityGateReport = {
  report_id: string;
  phase: typeof NORMALIZATION_QUALITY_GATE_PHASE;
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
  normalization_report_path: typeof DATASET_NORMALIZATION_REPORT_PATH;
  normalization_structures_path: typeof DATASET_NORMALIZATION_STRUCTURES_PATH;
  redundant_fields_after_normalization: number;
  scene_collapse_safety: GateStatus;
  adapter_signature_uniqueness: GateStatus;
  traceability_preserved: GateStatus;
  dna_coverage_preserved: GateStatus;
  adapter_coverage_preserved: GateStatus;
  cross_source_consistency: GateStatus;
  over_merge_risk: QualityRiskDetection[];
  lost_scene_granularity: QualityRiskDetection[];
  lost_adapter_detail: QualityRiskDetection[];
  normalization_quality_gate_ready: GateStatus;
  planning_only_status: GateStatus;
  source_audits: SourceNormalizationQualityAudit[];
  final_verdict:
    | typeof NORMALIZATION_QUALITY_GATE_PASS_VERDICT
    | typeof NORMALIZATION_QUALITY_GATE_FAIL_VERDICT;
  issues: QualityGateIssue[];
};

const DNA_CATEGORIES = [
  'scene_patterns',
  'camera_patterns',
  'emotion_patterns',
  'transition_patterns',
  'continuity_patterns',
  'storytelling_patterns',
] as const;

const ADAPTER_TYPES = [
  'scene_adapter',
  'camera_adapter',
  'emotion_adapter',
  'transition_adapter',
  'continuity_adapter',
  'storytelling_adapter',
] as const;

type NormalizationStructuresBundle = {
  normalized_scene_structure: NormalizedSceneStructure[];
  normalized_adapter_structure: NormalizedAdapterStructure[];
  normalized_traceability_structure: NormalizedTraceabilityStructure[];
};

function loadNormalizationReport(
  projectRoot: string
): MovieAnalysisDatasetNormalizationReport | null {
  const abs = path.join(projectRoot, DATASET_NORMALIZATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisDatasetNormalizationReport;
}

function loadNormalizationStructures(
  projectRoot: string
): NormalizationStructuresBundle | null {
  const abs = path.join(projectRoot, DATASET_NORMALIZATION_STRUCTURES_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as NormalizationStructuresBundle;
}

function countNormalizedRedundancy(
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

function isSceneCollapseSafe(scene: NormalizedSceneStructure): boolean {
  const totalMerged = scene.candidates.reduce(
    (sum, candidate) => sum + candidate.merged_from.length,
    0
  );

  return (
    scene.candidates.every(
      (candidate) =>
        candidate.estimated_only === true &&
        candidate.normalized === true &&
        candidate.merged_from.length > 0
    ) &&
    totalMerged === scene.scene_candidates_before &&
    scene.normalization_applied.includes('collapse_overlapping_windows')
  );
}

function isAdapterSignatureUnique(adapterStructure: NormalizedAdapterStructure): boolean {
  return adapterStructure.adapters.every((adapter) => {
    const signatures = adapter.patterns.map((pattern) => pattern.pattern_signature);
    return signatures.length === new Set(signatures).size;
  });
}

function computeDnaCoverage(dnaEntry: CinematicDnaEntry): number {
  const filled = DNA_CATEGORIES.filter((category) => dnaEntry[category].length > 0).length;
  return filled / DNA_CATEGORIES.length;
}

function computeNormalizedAdapterCoverage(adapterStructure: NormalizedAdapterStructure): number {
  const ready = adapterStructure.adapters.filter(
    (adapter) => adapter.patterns.length > 0 && adapter.adapter_ready === true
  ).length;
  return ready / ADAPTER_TYPES.length;
}

function detectRisks(
  scene: NormalizedSceneStructure,
  adapterStructure: NormalizedAdapterStructure
): {
  over_merge_risk: QualityRiskDetection[];
  lost_scene_granularity: QualityRiskDetection[];
  lost_adapter_detail: QualityRiskDetection[];
} {
  const over_merge_risk: QualityRiskDetection[] = [];
  const lost_scene_granularity: QualityRiskDetection[] = [];
  const lost_adapter_detail: QualityRiskDetection[] = [];
  const sourceVideoId = scene.source_video_id;

  if (
    scene.scene_candidates_after === 1 &&
    scene.scene_candidates_before >= 3
  ) {
    over_merge_risk.push({
      risk_id: `over_merge_${sourceVideoId.toLowerCase()}_v1`,
      risk_type: 'over_merge_risk',
      source_video_id: sourceVideoId,
      severity: 'warning',
      detail: `All ${scene.scene_candidates_before} scene candidates collapsed to 1 merged window`,
    });
  }

  const granularityRatio =
    scene.scene_candidates_before > 0
      ? scene.scene_candidates_after / scene.scene_candidates_before
      : 0;

  if (granularityRatio <= 0.25) {
    lost_scene_granularity.push({
      risk_id: `lost_granularity_${sourceVideoId.toLowerCase()}_v1`,
      risk_type: 'lost_scene_granularity',
      source_video_id: sourceVideoId,
      severity: 'warning',
      detail: `Scene granularity reduced to ${(granularityRatio * 100).toFixed(0)}% (${scene.scene_candidates_after}/${scene.scene_candidates_before})`,
    });
  }

  for (const adapter of adapterStructure.adapters) {
    const reductionRatio =
      adapter.patterns_before > 0
        ? adapter.patterns_after / adapter.patterns_before
        : 0;

    if (reductionRatio < 0.5) {
      lost_adapter_detail.push({
        risk_id: `lost_adapter_${adapter.adapter_id}_v1`,
        risk_type: 'lost_adapter_detail',
        source_video_id: sourceVideoId,
        severity: 'warning',
        detail: `${adapter.adapter_type} patterns reduced ${adapter.patterns_before}->${adapter.patterns_after} (${(reductionRatio * 100).toFixed(0)}% retained)`,
      });
    }
  }

  return { over_merge_risk, lost_scene_granularity, lost_adapter_detail };
}

function aggregateStatus(
  audits: SourceNormalizationQualityAudit[],
  field: keyof SourceNormalizationQualityAudit
): GateStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS' || audit[field] === true)
    ? 'PASS'
    : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisNormalizationQualityGateReport): string {
  const lines = [
    '# Movie Analysis Normalization Quality Gate',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Quality Gate Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    '',
    '## Validation Summary',
    '',
    '| Check | Result |',
    '| --- | --- |',
    `| redundant_fields_after_normalization | ${report.redundant_fields_after_normalization} |`,
    `| scene_collapse_safety | ${report.scene_collapse_safety} |`,
    `| adapter_signature_uniqueness | ${report.adapter_signature_uniqueness} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| dna_coverage_preserved | ${report.dna_coverage_preserved} |`,
    `| adapter_coverage_preserved | ${report.adapter_coverage_preserved} |`,
    `| cross_source_consistency | ${report.cross_source_consistency} |`,
    `| normalization_quality_gate_ready | ${report.normalization_quality_gate_ready} |`,
    '',
    '## Risk Detections',
    '',
    `### Over Merge Risk (${report.over_merge_risk.length})`,
    '',
  ];

  for (const risk of report.over_merge_risk) {
    lines.push(`- ${risk.source_video_id}: ${risk.detail}`);
  }

  lines.push('', `### Lost Scene Granularity (${report.lost_scene_granularity.length})`, '');
  for (const risk of report.lost_scene_granularity) {
    lines.push(`- ${risk.source_video_id}: ${risk.detail}`);
  }

  lines.push('', `### Lost Adapter Detail (${report.lost_adapter_detail.length})`, '');
  for (const risk of report.lost_adapter_detail) {
    lines.push(`- ${risk.source_video_id}: ${risk.detail}`);
  }

  lines.push('', '## Source Audits', '');
  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- scene_collapse_safety: ${audit.scene_collapse_safety}`,
      `- adapter_signature_uniqueness: ${audit.adapter_signature_uniqueness}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- dna_coverage_preserved: ${audit.dna_coverage_preserved}`,
      `- adapter_coverage_preserved: ${audit.adapter_coverage_preserved}`,
      `- over_merge_risk_detected: ${audit.over_merge_risk_detected}`,
      `- lost_scene_granularity_detected: ${audit.lost_scene_granularity_detected}`,
      `- lost_adapter_detail_detected: ${audit.lost_adapter_detail_detected}`,
      `- source_quality_pass: ${audit.source_quality_pass}`,
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

export function writeMovieAnalysisNormalizationQualityGateReport(
  projectRoot?: string
): MovieAnalysisNormalizationQualityGateReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: QualityGateIssue[] = [];
  const timestamp = new Date().toISOString();

  const normalizationReport = loadNormalizationReport(root);
  const structures = loadNormalizationStructures(root);

  if (!normalizationReport) {
    issues.push({
      code: 'NORMALIZATION_REPORT_MISSING',
      message: `Missing ${DATASET_NORMALIZATION_REPORT_PATH}`,
      severity: 'error',
    });
  }

  if (!structures) {
    issues.push({
      code: 'NORMALIZATION_STRUCTURES_MISSING',
      message: `Missing ${DATASET_NORMALIZATION_STRUCTURES_PATH}`,
      severity: 'error',
    });
  }

  const cinematicDna = loadMovieAnalysisCinematicDna(root);
  if (!cinematicDna) {
    issues.push({
      code: 'CINEMATIC_DNA_MISSING',
      message: `Missing ${CINEMATIC_DNA_PATH}`,
      severity: 'error',
    });
  }

  if (!normalizationReport || !structures || !cinematicDna) {
    const report: MovieAnalysisNormalizationQualityGateReport = {
      report_id: 'movie-analysis-normalization-quality-gate-report-v1',
      phase: NORMALIZATION_QUALITY_GATE_PHASE,
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
      normalization_report_path: DATASET_NORMALIZATION_REPORT_PATH,
      normalization_structures_path: DATASET_NORMALIZATION_STRUCTURES_PATH,
      redundant_fields_after_normalization: -1,
      scene_collapse_safety: 'FAIL',
      adapter_signature_uniqueness: 'FAIL',
      traceability_preserved: 'FAIL',
      dna_coverage_preserved: 'FAIL',
      adapter_coverage_preserved: 'FAIL',
      cross_source_consistency: 'FAIL',
      over_merge_risk: [],
      lost_scene_granularity: [],
      lost_adapter_detail: [],
      normalization_quality_gate_ready: 'FAIL',
      planning_only_status: 'FAIL',
      source_audits: [],
      final_verdict: NORMALIZATION_QUALITY_GATE_FAIL_VERDICT,
      issues,
    };

    fs.mkdirSync(path.join(root, NORMALIZATION_QUALITY_GATE_DIR), { recursive: true });
    fs.writeFileSync(
      path.join(root, NORMALIZATION_QUALITY_GATE_REPORT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(root, NORMALIZATION_QUALITY_GATE_MD_PATH),
      `${buildMarkdown(report)}\n`,
      'utf8'
    );
    return report;
  }

  if (normalizationReport.final_verdict !== DATASET_NORMALIZATION_PASS_VERDICT) {
    issues.push({
      code: 'NORMALIZATION_NOT_PASS',
      message: `Dataset normalization must have ${DATASET_NORMALIZATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const redundantAfter = countNormalizedRedundancy(
    structures.normalized_scene_structure,
    structures.normalized_adapter_structure
  );

  if (redundantAfter !== 0) {
    issues.push({
      code: 'REDUNDANT_FIELDS_REMAIN',
      message: `Expected redundant_fields_after_normalization=0, got ${redundantAfter}`,
      severity: 'error',
    });
  }

  const sourceAudits: SourceNormalizationQualityAudit[] = [];
  const overMergeRisk: QualityRiskDetection[] = [];
  const lostSceneGranularity: QualityRiskDetection[] = [];
  const lostAdapterDetail: QualityRiskDetection[] = [];
  const dnaCoverages: number[] = [];
  const adapterCoverages: number[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const scene = structures.normalized_scene_structure.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const adapterStructure = structures.normalized_adapter_structure.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const traceability = structures.normalized_traceability_structure.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const dnaEntry = cinematicDna.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );

    if (!scene || !adapterStructure || !traceability || !dnaEntry) {
      issues.push({
        code: 'SOURCE_QUALITY_COMPONENTS_MISSING',
        message: `Missing quality gate components for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
      continue;
    }

    const sceneCollapseSafety = isSceneCollapseSafe(scene) ? 'PASS' : 'FAIL';
    const adapterSignatureUniqueness = isAdapterSignatureUnique(adapterStructure)
      ? 'PASS'
      : 'FAIL';
    const traceabilityPreserved =
      traceability.traceability_preserved === true &&
      traceability.traceability_links.every((link) => link.preserved === true) &&
      traceability.package_trace_steps >= 17
        ? 'PASS'
        : 'FAIL';

    const dnaCoverage = computeDnaCoverage(dnaEntry);
    const dnaCoveragePreserved = dnaCoverage === 1 ? 'PASS' : 'FAIL';
    dnaCoverages.push(dnaCoverage);

    const adapterCoverage = computeNormalizedAdapterCoverage(adapterStructure);
    const adapterCoveragePreserved =
      adapterCoverage === 1 && adapterStructure.adapters.length === ADAPTER_TYPES.length
        ? 'PASS'
        : 'FAIL';
    adapterCoverages.push(adapterCoverage);

    const risks = detectRisks(scene, adapterStructure);
    overMergeRisk.push(...risks.over_merge_risk);
    lostSceneGranularity.push(...risks.lost_scene_granularity);
    lostAdapterDetail.push(...risks.lost_adapter_detail);

    const sourceQualityPass =
      sceneCollapseSafety === 'PASS' &&
      adapterSignatureUniqueness === 'PASS' &&
      traceabilityPreserved === 'PASS' &&
      dnaCoveragePreserved === 'PASS' &&
      adapterCoveragePreserved === 'PASS'
        ? 'PASS'
        : 'FAIL';

    if (sourceQualityPass === 'FAIL') {
      issues.push({
        code: 'SOURCE_QUALITY_FAIL',
        message: `Normalization quality gate failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }

    sourceAudits.push({
      source_video_id: sourceVideoId,
      redundant_fields_after_normalization: redundantAfter,
      scene_collapse_safety: sceneCollapseSafety,
      adapter_signature_uniqueness: adapterSignatureUniqueness,
      traceability_preserved: traceabilityPreserved,
      dna_coverage_preserved: dnaCoveragePreserved,
      adapter_coverage_preserved: adapterCoveragePreserved,
      over_merge_risk_detected: risks.over_merge_risk.length > 0,
      lost_scene_granularity_detected: risks.lost_scene_granularity.length > 0,
      lost_adapter_detail_detected: risks.lost_adapter_detail.length > 0,
      source_quality_pass: sourceQualityPass,
    });
  }

  const crossSourceConsistency =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    dnaCoverages.every((coverage) => coverage === 1) &&
    adapterCoverages.every((coverage) => coverage === 1) &&
    sourceAudits.every((audit) => audit.adapter_signature_uniqueness === 'PASS')
      ? 'PASS'
      : 'FAIL';

  if (crossSourceConsistency === 'FAIL') {
    issues.push({
      code: 'CROSS_SOURCE_INCONSISTENT',
      message: 'Cross-source consistency validation failed',
      severity: 'error',
    });
  }

  const safetyValid =
    normalizationReport.planning_only === true &&
    normalizationReport.planning_only_status === 'PASS';

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: GateStatus = safetyValid ? 'PASS' : 'FAIL';

  const sceneCollapseSafety = aggregateStatus(sourceAudits, 'scene_collapse_safety');
  const adapterSignatureUniqueness = aggregateStatus(
    sourceAudits,
    'adapter_signature_uniqueness'
  );
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');
  const dnaCoveragePreserved = aggregateStatus(sourceAudits, 'dna_coverage_preserved');
  const adapterCoveragePreserved = aggregateStatus(sourceAudits, 'adapter_coverage_preserved');

  const normalizationQualityGateReady =
    redundantAfter === 0 &&
    sceneCollapseSafety === 'PASS' &&
    adapterSignatureUniqueness === 'PASS' &&
    traceabilityPreserved === 'PASS' &&
    dnaCoveragePreserved === 'PASS' &&
    adapterCoveragePreserved === 'PASS' &&
    crossSourceConsistency === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    overMergeRisk.length > 0 &&
    lostSceneGranularity.length > 0 &&
    sourceAudits.every((audit) => audit.source_quality_pass === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = normalizationQualityGateReady === 'PASS';

  const report: MovieAnalysisNormalizationQualityGateReport = {
    report_id: 'movie-analysis-normalization-quality-gate-report-v1',
    phase: NORMALIZATION_QUALITY_GATE_PHASE,
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
    normalization_report_path: DATASET_NORMALIZATION_REPORT_PATH,
    normalization_structures_path: DATASET_NORMALIZATION_STRUCTURES_PATH,
    redundant_fields_after_normalization: redundantAfter,
    scene_collapse_safety: sceneCollapseSafety,
    adapter_signature_uniqueness: adapterSignatureUniqueness,
    traceability_preserved: traceabilityPreserved,
    dna_coverage_preserved: dnaCoveragePreserved,
    adapter_coverage_preserved: adapterCoveragePreserved,
    cross_source_consistency: crossSourceConsistency,
    over_merge_risk: overMergeRisk,
    lost_scene_granularity: lostSceneGranularity,
    lost_adapter_detail: lostAdapterDetail,
    normalization_quality_gate_ready: normalizationQualityGateReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass
      ? NORMALIZATION_QUALITY_GATE_PASS_VERDICT
      : NORMALIZATION_QUALITY_GATE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, NORMALIZATION_QUALITY_GATE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, NORMALIZATION_QUALITY_GATE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, NORMALIZATION_QUALITY_GATE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
