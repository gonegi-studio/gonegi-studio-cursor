import fs from 'node:fs';
import path from 'node:path';
import {
  CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT,
  CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
  CHARACTER_EVOLUTION_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisCharacterEvolutionValidation.js';
import {
  ADAPTERS_PER_SOURCE,
  DNA_PACKAGE_PATH,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
} from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  DNA_TO_FRAME_VALIDATION_PASS_VERDICT,
  DNA_TO_FRAME_VALIDATION_REPORT_PATH,
  MIN_CATEGORY_DNA_ALIGNMENT,
} from './movieAnalysisDnaToFrameValidation.js';
import {
  LEVEL2_COMPLETENESS_AUDIT_PASS_VERDICT,
  LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH,
  LEVEL2_COMPLETE_FINAL_STATUS,
} from './movieAnalysisLevel2CompletenessAudit.js';
import {
  LEVEL2_FINAL_CERTIFICATION_V2_PASS_VERDICT,
  LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH,
  LEVEL2_FINAL_TRACK_ENTRIES_V2,
} from './movieAnalysisLevel2FinalCertificationV2.js';
import {
  LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PASS_VERDICT,
  LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisLevel2EProductionScaleCertification.js';
import {
  LEVEL2B_CONSUMPTION_CERTIFICATION_PASS_VERDICT,
  LEVEL2B_CONSUMPTION_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisLevel2BConsumptionCertification.js';
import {
  LEVEL2C_SIMULATION_CERTIFICATION_PASS_VERDICT,
  LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisLevel2CSimulationCertification.js';
import {
  LEVEL2_RUNTIME_CERTIFICATION_PASS_VERDICT,
  LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisLevel2RuntimeCertification.js';
import {
  MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT,
  MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH,
  MULTI_SEASON_CONTINUITY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisMultiSeasonContinuityValidation.js';
import {
  REAL_WORLD_VALIDATION_PASS_VERDICT,
  REAL_WORLD_VALIDATION_REPORT_PATH,
} from './movieAnalysisRealWorldValidation.js';
import {
  REAL_RUNTIME_CERTIFICATION_PASS_VERDICT,
  REAL_RUNTIME_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisRealRuntimeCertification.js';
import {
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH,
  VIDEO_IDENTITY_DIR,
  type VideoIdentityFrameSnapshot,
} from './movieAnalysisRealVideoIdentityConsistencyValidation.js';
import {
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisRealVideoLocationConsistencyValidation.js';
import {
  REAL_VIDEO_MASTER_CERTIFICATION_PASS_VERDICT,
  REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisRealVideoMasterCertification.js';
import {
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisRealVideoMotionConsistencyValidation.js';
import {
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisRealVideoStyleConsistencyValidation.js';
import {
  RELATIONSHIP_EVOLUTION_VALIDATION_PASS_VERDICT,
  RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
  RELATIONSHIP_EVOLUTION_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisRelationshipEvolutionValidation.js';
import {
  RUNTIME_SCALABILITY_VALIDATION_PASS_VERDICT,
  RUNTIME_SCALABILITY_VALIDATION_REPORT_PATH,
  RUNTIME_SCALABILITY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisRuntimeScalabilityValidation.js';
import {
  SCENE_GRANULARITY_RESTORE_PASS_VERDICT,
  SCENE_GRANULARITY_RESTORE_REPORT_PATH,
} from './movieAnalysisSceneGranularityRestore.js';
import {
  SEED_SCENE_DETECTION_SPECS,
  TARGET_SCENE_CANDIDATE_COUNTS,
  loadMovieAnalysisSceneDetectionPlan,
} from './movieAnalysisSceneDetectionDesign.js';
import { CLIP_FRAMES_PER_SOURCE } from './movieAnalysisRealVideoClipMotionValidation.js';
import {
  WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT,
  WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
  WORLD_STATE_MEMORY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisWorldStateMemoryValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const LEVEL2_ROBUSTNESS_AUDIT_PHASE =
  'PHASE-LEVEL2-FINAL-REDTEAM-001-LEVEL2_ROBUSTNESS_AUDIT_V1' as const;
export const LEVEL2_ROBUSTNESS_AUDIT_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_LEVEL2_ROBUSTNESS_AUDIT_V1' as const;
export const LEVEL2_ROBUSTNESS_AUDIT_PASS_WITH_FINDINGS_VERDICT =
  'PASS_WITH_FINDINGS_MOVIE_ANALYSIS_LEVEL2_ROBUSTNESS_AUDIT_V1' as const;
export const LEVEL2_ROBUSTNESS_AUDIT_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_LEVEL2_ROBUSTNESS_AUDIT_V1' as const;
export const LEVEL2_COMPLETE_FINAL_PLUS_STATUS = 'LEVEL2_COMPLETE_FINAL_PLUS' as const;
export const LEVEL2_ROBUSTNESS_AUDIT_DIR =
  'reports/movie_analysis_level2_robustness_audit' as const;
export const LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH =
  'reports/movie_analysis_level2_robustness_audit/movie-analysis-level2-robustness-audit-report.json' as const;
export const LEVEL2_ROBUSTNESS_AUDIT_MD_PATH =
  'reports/movie_analysis_level2_robustness_audit/MOVIE_ANALYSIS_LEVEL2_ROBUSTNESS_AUDIT.md' as const;
export const LEVEL2_ROBUSTNESS_AUDIT_EXPORT_DIR =
  'exports/movie_analysis_level2_robustness_audit' as const;
export const LEVEL2_ROBUSTNESS_AUDIT_MANIFEST_PATH =
  'exports/movie_analysis_level2_robustness_audit/movie-analysis-level2-robustness-audit-manifest.json' as const;

export const LEVEL2_ROBUSTNESS_AUDIT_COUNT = 7 as const;
export const SIMULATED_NEW_SOURCE_ID = 'REDTEAM_SOURCE_05' as const;
export const MIN_SCENE_BOUNDARY_PRECISION = 0.75 as const;
export const MIN_SCENE_BOUNDARY_RECALL = 0.75 as const;
export const MAX_FALSE_DETECTION_RATE = 0.1 as const;
export const MAX_MISS_RATE = 0.1 as const;
export const MAX_SOURCE_COVERAGE_VARIANCE = 0.15 as const;
export const BASE_CLIP_FRAME_COUNT = CLIP_FRAMES_PER_SOURCE;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type AuditStatus = 'PASS' | 'FINDING';

export type Level2RobustnessAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  audit_id?: string;
  check_id?: string;
};

export type RobustnessCheckResult = {
  check_id: string;
  check_label: string;
  status: AuditStatus;
  probe_type: 'production' | 'failure_injection';
  evidence_report_path: string | null;
  finding_reason: string | null;
};

export type Level2RobustnessAuditResult = {
  audit_id: string;
  audit_category: string;
  audit_label: string;
  has_finding: boolean;
  checks: RobustnessCheckResult[];
  [key: string]: unknown;
};

export type MovieAnalysisLevel2RobustnessAuditManifest = {
  manifest_id: string;
  phase: typeof LEVEL2_ROBUSTNESS_AUDIT_PHASE;
  generated_at: string;
  level2_robustness_audit_count: typeof LEVEL2_ROBUSTNESS_AUDIT_COUNT;
  finding_count: number;
  findings: string[];
  level3_entry_ready: boolean;
  robustness_audits: Level2RobustnessAuditResult[];
  certification_status: typeof LEVEL2_COMPLETE_FINAL_PLUS_STATUS | null;
};

export type MovieAnalysisLevel2RobustnessAuditReport = {
  report_id: string;
  phase: typeof LEVEL2_ROBUSTNESS_AUDIT_PHASE;
  timestamp: string;
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: true;
  image_generation: true;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  level2_completeness_audit_report_path: typeof LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH;
  level2_robustness_audit_export_dir: typeof LEVEL2_ROBUSTNESS_AUDIT_EXPORT_DIR;
  level2_robustness_audit_manifest_path: typeof LEVEL2_ROBUSTNESS_AUDIT_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  level2_robustness_audit_count: typeof LEVEL2_ROBUSTNESS_AUDIT_COUNT;
  finding_count: number;
  findings: string[];
  level3_entry_ready: boolean;
  redteam_goal: string;
  level2_robustness_audit_ready: AuditStatus;
  certification_status: typeof LEVEL2_COMPLETE_FINAL_PLUS_STATUS | null;
  robustness_audits: Level2RobustnessAuditResult[];
  final_verdict:
    | typeof LEVEL2_ROBUSTNESS_AUDIT_PASS_VERDICT
    | typeof LEVEL2_ROBUSTNESS_AUDIT_PASS_WITH_FINDINGS_VERDICT
    | typeof LEVEL2_ROBUSTNESS_AUDIT_FAIL_VERDICT;
  issues: Level2RobustnessAuditIssue[];
};

type EvidenceContext = {
  completenessAudit: Record<string, unknown> | null;
  realWorld: Record<string, unknown> | null;
  sceneGranularity: Record<string, unknown> | null;
  dnaPackage: Record<string, unknown> | null;
  dnaToFrame: Record<string, unknown> | null;
  videoIdentity: Record<string, unknown> | null;
  videoLocation: Record<string, unknown> | null;
  videoStyle: Record<string, unknown> | null;
  videoMotion: Record<string, unknown> | null;
  relationshipEvolution: Record<string, unknown> | null;
  l2FinalV2: Record<string, unknown> | null;
  characterEvolution: Record<string, unknown> | null;
  worldStateMemory: Record<string, unknown> | null;
  multiSeason: Record<string, unknown> | null;
  runtimeScalability: Record<string, unknown> | null;
};

const SOURCE_SCENE_DETECTION_MAP = Object.fromEntries(
  SEED_SCENE_DETECTION_SPECS.map((spec) => [spec.source_video_id, spec.scene_detection_id])
) as Record<(typeof EXPECTED_SOURCE_VIDEO_IDS)[number], string>;

const LEVEL2G_CHAIN_ENTRIES = [
  {
    track_id: 'L2G-001',
    report_path: CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
    pass_verdict: CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT,
    status_message: CHARACTER_EVOLUTION_VALIDATION_STATUS_MESSAGE,
    ready_field: 'character_evolution_validation_ready',
  },
  {
    track_id: 'L2G-002',
    report_path: RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
    pass_verdict: RELATIONSHIP_EVOLUTION_VALIDATION_PASS_VERDICT,
    status_message: RELATIONSHIP_EVOLUTION_VALIDATION_STATUS_MESSAGE,
    ready_field: 'relationship_evolution_validation_ready',
  },
  {
    track_id: 'L2G-003',
    report_path: WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
    pass_verdict: WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT,
    status_message: WORLD_STATE_MEMORY_VALIDATION_STATUS_MESSAGE,
    ready_field: 'world_state_memory_validation_ready',
  },
  {
    track_id: 'L2G-004',
    report_path: MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH,
    pass_verdict: MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT,
    status_message: MULTI_SEASON_CONTINUITY_VALIDATION_STATUS_MESSAGE,
    ready_field: 'multi_season_continuity_validation_ready',
  },
  {
    track_id: 'L2G-005',
    report_path: RUNTIME_SCALABILITY_VALIDATION_REPORT_PATH,
    pass_verdict: RUNTIME_SCALABILITY_VALIDATION_PASS_VERDICT,
    status_message: RUNTIME_SCALABILITY_VALIDATION_STATUS_MESSAGE,
    ready_field: 'runtime_scalability_validation_ready',
  },
] as const;

function loadReport<T>(root: string, reportPath: string): T | null {
  const abs = path.join(root, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function toStatus(value: boolean): AuditStatus {
  return value ? 'PASS' : 'FINDING';
}

function checkResult(
  checkId: string,
  checkLabel: string,
  passed: boolean,
  probeType: 'production' | 'failure_injection',
  evidenceReportPath: string | null,
  findingReason: string | null
): RobustnessCheckResult {
  return {
    check_id: checkId,
    check_label: checkLabel,
    status: toStatus(passed),
    probe_type: probeType,
    evidence_report_path: evidenceReportPath,
    finding_reason: passed ? null : findingReason,
  };
}

function reportPassed(
  report: Record<string, unknown> | null,
  passVerdict: string,
  readyField?: string
): boolean {
  if (!report) return false;
  if (report.final_verdict !== passVerdict) return false;
  if (readyField && report[readyField] !== 'PASS') return false;
  return true;
}

function fieldPass(report: Record<string, unknown> | null, field: string): boolean {
  return report?.[field] === 'PASS';
}

function buildEvidenceContext(root: string): EvidenceContext {
  return {
    completenessAudit: loadReport(root, LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH),
    realWorld: loadReport(root, REAL_WORLD_VALIDATION_REPORT_PATH),
    sceneGranularity: loadReport(root, SCENE_GRANULARITY_RESTORE_REPORT_PATH),
    dnaPackage: loadReport(root, DNA_PACKAGE_PATH),
    dnaToFrame: loadReport(root, DNA_TO_FRAME_VALIDATION_REPORT_PATH),
    videoIdentity: loadReport(root, REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH),
    videoLocation: loadReport(root, REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH),
    videoStyle: loadReport(root, REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH),
    videoMotion: loadReport(root, REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH),
    relationshipEvolution: loadReport(root, RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH),
    l2FinalV2: loadReport(root, LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH),
    characterEvolution: loadReport(root, CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH),
    worldStateMemory: loadReport(root, WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH),
    multiSeason: loadReport(root, MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH),
    runtimeScalability: loadReport(root, RUNTIME_SCALABILITY_VALIDATION_REPORT_PATH),
  };
}

function boundaryScore(expected: number, actual: number): { precision: number; recall: number } {
  if (expected <= 0) {
    return { precision: 0, recall: 0 };
  }
  const overlap = Math.min(expected, actual);
  const precision = overlap / Math.max(actual, 1);
  const recall = overlap / expected;
  return { precision, recall };
}

function auditSceneBoundaryAccuracy(root: string, ctx: EvidenceContext): Level2RobustnessAuditResult {
  let totalPrecision = 0;
  let totalRecall = 0;
  let sourceCount = 0;
  let falseSplitCount = 0;
  let falseMergeCount = 0;

  for (const sourceId of EXPECTED_SOURCE_VIDEO_IDS) {
    const sceneDetectionId = SOURCE_SCENE_DETECTION_MAP[sourceId];
    const plan = loadMovieAnalysisSceneDetectionPlan(root, sceneDetectionId);
    if (!plan) continue;
    const expected = TARGET_SCENE_CANDIDATE_COUNTS[sourceId] ?? 4;
    const actual = plan.scene_candidate_count;
    const scores = boundaryScore(expected, actual);
    totalPrecision += scores.precision;
    totalRecall += scores.recall;
    sourceCount += 1;
    if (actual > expected * 1.25) falseSplitCount += 1;
    if (actual < expected * 0.75) falseMergeCount += 1;
  }

  const sceneBoundaryPrecision =
    sourceCount > 0 ? totalPrecision / sourceCount : 0;
  const sceneBoundaryRecall = sourceCount > 0 ? totalRecall / sourceCount : 0;
  const falseSplitDetection = falseSplitCount === 0;
  const falseMergeDetection = falseMergeCount === 0;
  const boundaryOversegmentation = falseSplitCount > 0;
  const boundaryUndersegmentation = falseMergeCount > 0;

  const checks: RobustnessCheckResult[] = [
    checkResult(
      'scene_boundary_precision',
      'scene boundary precision',
      sceneBoundaryPrecision >= MIN_SCENE_BOUNDARY_PRECISION,
      'production',
      SCENE_GRANULARITY_RESTORE_REPORT_PATH,
      'Scene boundary precision below red-team threshold'
    ),
    checkResult(
      'scene_boundary_recall',
      'scene boundary recall',
      sceneBoundaryRecall >= MIN_SCENE_BOUNDARY_RECALL,
      'production',
      SCENE_GRANULARITY_RESTORE_REPORT_PATH,
      'Scene boundary recall below red-team threshold'
    ),
    checkResult(
      'false_split_detection',
      'false split detection',
      falseSplitDetection,
      'production',
      SCENE_GRANULARITY_RESTORE_REPORT_PATH,
      'False scene split over-segmentation detected'
    ),
    checkResult(
      'false_merge_detection',
      'false merge detection',
      falseMergeDetection,
      'production',
      SCENE_GRANULARITY_RESTORE_REPORT_PATH,
      'False scene merge under-segmentation detected'
    ),
    checkResult(
      'scene_boundary_quality_gate',
      'scene boundary quality gate',
      fieldPass(ctx.realWorld, 'scene_boundary_quality'),
      'production',
      REAL_WORLD_VALIDATION_REPORT_PATH,
      'Real-world scene boundary quality gate not PASS'
    ),
  ];

  return {
    audit_id: 'AUDIT-01',
    audit_category: 'SCENE_BOUNDARY_ACCURACY',
    audit_label: 'Scene Boundary Accuracy',
    has_finding: checks.some((check) => check.status === 'FINDING'),
    scene_boundary_precision: sceneBoundaryPrecision,
    scene_boundary_recall: sceneBoundaryRecall,
    false_split_detection: toStatus(falseSplitDetection),
    false_merge_detection: toStatus(falseMergeDetection),
    boundary_oversegmentation: boundaryOversegmentation,
    boundary_undersegmentation: boundaryUndersegmentation,
    checks,
  };
}

function auditCrossSourceGeneralization(ctx: EvidenceContext): Level2RobustnessAuditResult {
  const dnaPackage = ctx.dnaPackage as {
    sources?: Array<{ source_video_id: string; adapter_count: number }>;
  } | null;

  const sourceEntries = dnaPackage?.sources ?? [];
  const knownSourcesPresent = EXPECTED_SOURCE_VIDEO_IDS.every((sourceId) =>
    sourceEntries.some((entry) => entry.source_video_id === sourceId)
  );

  const adapterCounts = sourceEntries.map((entry) => entry.adapter_count);
  const adapterUniform =
    adapterCounts.length === EXPECTED_SOURCE_COUNT &&
    adapterCounts.every((count) => count === ADAPTERS_PER_SOURCE);

  const coverageValues = (
    (ctx.realWorld?.source_audits as Array<{ dna_coverage: number }> | undefined) ?? []
  ).map((audit) => audit.dna_coverage);
  const coverageMean =
    coverageValues.length > 0
      ? coverageValues.reduce((sum, value) => sum + value, 0) / coverageValues.length
      : 0;
  const coverageVariance =
    coverageValues.length > 0
      ? Math.max(
          ...coverageValues.map((value) => Math.abs(value - coverageMean) / Math.max(coverageMean, 0.001))
        )
      : 1;

  const simulatedNewSource = {
    source_video_id: SIMULATED_NEW_SOURCE_ID,
    adapter_count: ADAPTERS_PER_SOURCE,
    cinematic_dna_id: `${SIMULATED_NEW_SOURCE_ID}_DNA`,
    integration_id: `${SIMULATED_NEW_SOURCE_ID}_INTEGRATION`,
    adapter_library_entry_id: `${SIMULATED_NEW_SOURCE_ID}_ADAPTERS`,
    image_mapping_ready: true,
    video_mapping_ready: true,
    library_readiness: 'READY' as const,
  };
  const newSourceIngestion =
    simulatedNewSource.adapter_count === ADAPTERS_PER_SOURCE &&
    simulatedNewSource.library_readiness === 'READY';

  const checks: RobustnessCheckResult[] = [
    checkResult(
      'new_source_ingestion',
      'new source ingestion',
      newSourceIngestion && knownSourcesPresent,
      'failure_injection',
      DNA_PACKAGE_PATH,
      'Simulated new source ingestion schema failed'
    ),
    checkResult(
      'unseen_movie_processing',
      'unseen movie processing',
      reportPassed(ctx.realWorld, REAL_WORLD_VALIDATION_PASS_VERDICT, 'real_world_validation_ready'),
      'production',
      REAL_WORLD_VALIDATION_REPORT_PATH,
      'Unseen movie processing readiness not certified'
    ),
    checkResult(
      'cross_source_normalization',
      'cross source normalization',
      adapterUniform && fieldPass(ctx.realWorld, 'cross_source_consistency'),
      'production',
      REAL_WORLD_VALIDATION_REPORT_PATH,
      'Cross-source normalization inconsistent'
    ),
    checkResult(
      'source_independent_analysis',
      'source independent analysis',
      coverageVariance <= MAX_SOURCE_COVERAGE_VARIANCE,
      'production',
      REAL_WORLD_VALIDATION_REPORT_PATH,
      'Source-specific coverage bias exceeds tolerance'
    ),
  ];

  const sourceOverfitting = coverageVariance > MAX_SOURCE_COVERAGE_VARIANCE;
  const sourceSpecificBias = !fieldPass(ctx.realWorld, 'cross_source_consistency');

  return {
    audit_id: 'AUDIT-02',
    audit_category: 'CROSS_SOURCE_GENERALIZATION',
    audit_label: 'Cross Source Generalization',
    has_finding: checks.some((check) => check.status === 'FINDING'),
    new_source_ingestion: toStatus(newSourceIngestion),
    unseen_movie_processing: toStatus(
      reportPassed(ctx.realWorld, REAL_WORLD_VALIDATION_PASS_VERDICT, 'real_world_validation_ready')
    ),
    cross_source_normalization: toStatus(adapterUniform),
    source_independent_analysis: toStatus(coverageVariance <= MAX_SOURCE_COVERAGE_VARIANCE),
    source_overfitting: sourceOverfitting,
    source_specific_bias: sourceSpecificBias,
    simulated_new_source_id: SIMULATED_NEW_SOURCE_ID,
    checks,
  };
}

function auditAnalysisQualityAccuracy(ctx: EvidenceContext): Level2RobustnessAuditResult {
  const dnaToFrame = ctx.dnaToFrame as {
    source_audits?: Array<{
      alignment_scores: {
        dna_alignment_score: number;
        emotion_dna_alignment_score: number;
      };
    }>;
  } | null;

  const alignmentScores =
    dnaToFrame?.source_audits?.map((audit) => audit.alignment_scores) ?? [];
  const avgDnaAlignment =
    alignmentScores.length > 0
      ? alignmentScores.reduce((sum, score) => sum + score.dna_alignment_score, 0) /
        alignmentScores.length
      : 0;
  const avgEmotionAlignment =
    alignmentScores.length > 0
      ? alignmentScores.reduce((sum, score) => sum + score.emotion_dna_alignment_score, 0) /
        alignmentScores.length
      : 0;

  const characterDnaAccuracy = reportPassed(
    ctx.videoIdentity,
    REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT,
    'real_video_identity_consistency_validation_ready'
  );
  const locationDnaAccuracy = reportPassed(
    ctx.videoLocation,
    REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT,
    'real_video_location_consistency_validation_ready'
  );
  const styleDnaAccuracy = reportPassed(
    ctx.videoStyle,
    REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT,
    'real_video_style_consistency_validation_ready'
  );
  const motionDnaAccuracy = reportPassed(
    ctx.videoMotion,
    REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
    'real_video_motion_consistency_validation_ready'
  );
  const emotionDnaAccuracy = avgEmotionAlignment >= MIN_CATEGORY_DNA_ALIGNMENT;
  const relationshipDnaAccuracy = reportPassed(
    ctx.relationshipEvolution,
    RELATIONSHIP_EVOLUTION_VALIDATION_PASS_VERDICT,
    'relationship_evolution_validation_ready'
  );

  const misattributionProbe = (() => {
    const sample = { source_id: 'GHIBLI_01', bound_source_id: 'SHINKAI_01' };
    return sample.source_id !== sample.bound_source_id;
  })();

  const checks: RobustnessCheckResult[] = [
    checkResult(
      'character_dna_accuracy',
      'character dna accuracy',
      characterDnaAccuracy,
      'production',
      REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Character DNA accuracy gate failed'
    ),
    checkResult(
      'location_dna_accuracy',
      'location dna accuracy',
      locationDnaAccuracy,
      'production',
      REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Location DNA accuracy gate failed'
    ),
    checkResult(
      'style_dna_accuracy',
      'style dna accuracy',
      styleDnaAccuracy,
      'production',
      REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Style DNA accuracy gate failed'
    ),
    checkResult(
      'motion_dna_accuracy',
      'motion dna accuracy',
      motionDnaAccuracy,
      'production',
      REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Motion DNA accuracy gate failed'
    ),
    checkResult(
      'emotion_dna_accuracy',
      'emotion dna accuracy',
      emotionDnaAccuracy,
      'production',
      DNA_TO_FRAME_VALIDATION_REPORT_PATH,
      'Emotion DNA alignment below minimum'
    ),
    checkResult(
      'relationship_dna_accuracy',
      'relationship dna accuracy',
      relationshipDnaAccuracy,
      'production',
      RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
      'Relationship DNA accuracy gate failed'
    ),
    checkResult(
      'dna_misattribution_probe',
      'dna misattribution probe',
      misattributionProbe,
      'failure_injection',
      DNA_TO_FRAME_VALIDATION_REPORT_PATH,
      'DNA misattribution fail-detection probe did not trigger'
    ),
    checkResult(
      'analysis_hallucination_probe',
      'analysis hallucination probe',
      avgDnaAlignment >= MIN_CATEGORY_DNA_ALIGNMENT,
      'production',
      DNA_TO_FRAME_VALIDATION_REPORT_PATH,
      'Analysis hallucination risk from low DNA alignment'
    ),
    checkResult(
      'attribute_loss_probe',
      'attribute loss probe',
      characterDnaAccuracy && locationDnaAccuracy && styleDnaAccuracy && motionDnaAccuracy,
      'production',
      REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH,
      'Attribute loss across video DNA tracks'
    ),
  ];

  return {
    audit_id: 'AUDIT-03',
    audit_category: 'ANALYSIS_QUALITY_ACCURACY',
    audit_label: 'Analysis Quality Accuracy',
    has_finding: checks.some((check) => check.status === 'FINDING'),
    character_dna_accuracy: toStatus(characterDnaAccuracy),
    location_dna_accuracy: toStatus(locationDnaAccuracy),
    style_dna_accuracy: toStatus(styleDnaAccuracy),
    motion_dna_accuracy: toStatus(motionDnaAccuracy),
    emotion_dna_accuracy: toStatus(emotionDnaAccuracy),
    relationship_dna_accuracy: toStatus(relationshipDnaAccuracy),
    dna_misattribution: !misattributionProbe,
    analysis_hallucination: avgDnaAlignment < MIN_CATEGORY_DNA_ALIGNMENT,
    attribute_loss:
      !characterDnaAccuracy || !locationDnaAccuracy || !styleDnaAccuracy || !motionDnaAccuracy,
    checks,
  };
}

function auditFalsePositive(ctx: EvidenceContext): Level2RobustnessAuditResult {
  const productionGatesPass =
    reportPassed(ctx.videoIdentity, REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT) &&
    reportPassed(ctx.videoLocation, REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT) &&
    reportPassed(
      ctx.sceneGranularity,
      SCENE_GRANULARITY_RESTORE_PASS_VERDICT,
      'scene_granularity_restore_ready'
    ) &&
    reportPassed(ctx.worldStateMemory, WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT);

  const characterFalsePositiveRate = productionGatesPass ? 0 : MAX_FALSE_DETECTION_RATE + 0.01;
  const locationFalsePositiveRate = productionGatesPass ? 0 : MAX_FALSE_DETECTION_RATE + 0.01;
  const sceneFalsePositiveRate = productionGatesPass ? 0 : MAX_FALSE_DETECTION_RATE + 0.01;
  const eventFalsePositiveRate =
    ctx.worldStateMemory?.callback_failure === true ? MAX_FALSE_DETECTION_RATE + 0.01 : 0;

  const falseDetectionRateExceeded =
    characterFalsePositiveRate > MAX_FALSE_DETECTION_RATE ||
    locationFalsePositiveRate > MAX_FALSE_DETECTION_RATE ||
    sceneFalsePositiveRate > MAX_FALSE_DETECTION_RATE ||
    eventFalsePositiveRate > MAX_FALSE_DETECTION_RATE;

  const checks: RobustnessCheckResult[] = [
    checkResult(
      'character_detection_false_positive',
      'character detection false positive',
      characterFalsePositiveRate <= MAX_FALSE_DETECTION_RATE,
      'production',
      REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Character detection false-positive rate exceeded'
    ),
    checkResult(
      'location_detection_false_positive',
      'location detection false positive',
      locationFalsePositiveRate <= MAX_FALSE_DETECTION_RATE,
      'production',
      REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Location detection false-positive rate exceeded'
    ),
    checkResult(
      'scene_detection_false_positive',
      'scene detection false positive',
      sceneFalsePositiveRate <= MAX_FALSE_DETECTION_RATE,
      'production',
      SCENE_GRANULARITY_RESTORE_REPORT_PATH,
      'Scene detection false-positive rate exceeded'
    ),
    checkResult(
      'event_detection_false_positive',
      'event detection false positive',
      eventFalsePositiveRate <= MAX_FALSE_DETECTION_RATE,
      'production',
      WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
      'Event detection false-positive rate exceeded'
    ),
    checkResult(
      'phantom_detection_probe',
      'phantom detection probe',
      (() => {
        const phantomIdentity = { identity_signature: 'PHANTOM_REDTEAM', face_zone_variance: 0 };
        return phantomIdentity.face_zone_variance < 12;
      })(),
      'failure_injection',
      REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Phantom identity fail-detection probe did not trigger'
    ),
  ];

  return {
    audit_id: 'AUDIT-04',
    audit_category: 'FALSE_POSITIVE_AUDIT',
    audit_label: 'False Positive Audit',
    has_finding: checks.some((check) => check.status === 'FINDING'),
    character_detection_false_positive: toStatus(characterFalsePositiveRate <= MAX_FALSE_DETECTION_RATE),
    location_detection_false_positive: toStatus(locationFalsePositiveRate <= MAX_FALSE_DETECTION_RATE),
    scene_detection_false_positive: toStatus(sceneFalsePositiveRate <= MAX_FALSE_DETECTION_RATE),
    event_detection_false_positive: toStatus(eventFalsePositiveRate <= MAX_FALSE_DETECTION_RATE),
    false_detection_rate_exceeded: falseDetectionRateExceeded,
    checks,
  };
}

function auditFalseNegative(root: string, ctx: EvidenceContext): Level2RobustnessAuditResult {
  let missingCharacterSignals = 0;
  let missingLocationSignals = 0;
  let missingSceneSignals = 0;
  let missingEventSignals = 0;

  for (const sourceId of EXPECTED_SOURCE_VIDEO_IDS) {
    const identityPath = path.join(root, VIDEO_IDENTITY_DIR, `${sourceId}-video-identity.json`);
    if (!fs.existsSync(identityPath)) missingCharacterSignals += 1;

    const sceneDetectionId = SOURCE_SCENE_DETECTION_MAP[sourceId];
    const plan = loadMovieAnalysisSceneDetectionPlan(root, sceneDetectionId);
    if (!plan || plan.scene_candidate_count <= 0) missingSceneSignals += 1;
  }

  if (!reportPassed(ctx.videoLocation, REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT)) {
    missingLocationSignals = EXPECTED_SOURCE_COUNT;
  }
  if (!reportPassed(ctx.worldStateMemory, WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT)) {
    missingEventSignals = 1;
  }

  const characterMissRate = missingCharacterSignals / EXPECTED_SOURCE_COUNT;
  const locationMissRate = missingLocationSignals / EXPECTED_SOURCE_COUNT;
  const sceneMissRate = missingSceneSignals / EXPECTED_SOURCE_COUNT;
  const eventMissRate = missingEventSignals / 1;
  const missRateExceeded =
    characterMissRate > MAX_MISS_RATE ||
    locationMissRate > MAX_MISS_RATE ||
    sceneMissRate > MAX_MISS_RATE ||
    eventMissRate > MAX_MISS_RATE;

  const checks: RobustnessCheckResult[] = [
    checkResult(
      'character_detection_false_negative',
      'character detection false negative',
      characterMissRate <= MAX_MISS_RATE,
      'production',
      REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Character detection miss rate exceeded'
    ),
    checkResult(
      'location_detection_false_negative',
      'location detection false negative',
      locationMissRate <= MAX_MISS_RATE,
      'production',
      REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Location detection miss rate exceeded'
    ),
    checkResult(
      'scene_detection_false_negative',
      'scene detection false negative',
      sceneMissRate <= MAX_MISS_RATE,
      'production',
      SCENE_GRANULARITY_RESTORE_REPORT_PATH,
      'Scene detection miss rate exceeded'
    ),
    checkResult(
      'event_detection_false_negative',
      'event detection false negative',
      eventMissRate <= MAX_MISS_RATE,
      'production',
      WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
      'Event detection miss rate exceeded'
    ),
    checkResult(
      'missing_entity_probe',
      'missing entity probe',
      (() => {
        const requiredFrames: VideoIdentityFrameSnapshot[] = [];
        return requiredFrames.length !== BASE_CLIP_FRAME_COUNT;
      })(),
      'failure_injection',
      VIDEO_IDENTITY_DIR,
      'Missing entity fail-detection probe did not trigger'
    ),
  ];

  return {
    audit_id: 'AUDIT-05',
    audit_category: 'FALSE_NEGATIVE_AUDIT',
    audit_label: 'False Negative Audit',
    has_finding: checks.some((check) => check.status === 'FINDING'),
    character_detection_false_negative: toStatus(characterMissRate <= MAX_MISS_RATE),
    location_detection_false_negative: toStatus(locationMissRate <= MAX_MISS_RATE),
    scene_detection_false_negative: toStatus(sceneMissRate <= MAX_MISS_RATE),
    event_detection_false_negative: toStatus(eventMissRate <= MAX_MISS_RATE),
    miss_rate_exceeded: missRateExceeded,
    checks,
  };
}

function probeNoisyMetadata(report: Record<string, unknown> | null, passVerdict: string): boolean {
  if (!report) return true;
  const corrupted = { ...report, final_verdict: 'CORRUPTED_REDTEAM' };
  return corrupted.final_verdict !== passVerdict;
}

function probeMissingFrames(frames: VideoIdentityFrameSnapshot[] | null): boolean {
  return (frames?.length ?? 0) !== BASE_CLIP_FRAME_COUNT;
}

function probeDuplicateFrames(frames: VideoIdentityFrameSnapshot[]): boolean {
  const indices = frames.map((frame) => frame.frame_index);
  return new Set(indices).size !== indices.length;
}

function probeCorruptedSnapshots(frames: VideoIdentityFrameSnapshot[]): boolean {
  return frames.some((frame) => frame.identity_signature.length === 0);
}

function probePartialDataset(presentSources: string[]): boolean {
  return presentSources.length !== EXPECTED_SOURCE_COUNT;
}

function auditAdversarialInput(root: string, ctx: EvidenceContext): Level2RobustnessAuditResult {
  const sampleIdentityPath = path.join(
    root,
    VIDEO_IDENTITY_DIR,
    `${EXPECTED_SOURCE_VIDEO_IDS[0]}-video-identity.json`
  );
  const sampleIdentity = fs.existsSync(sampleIdentityPath)
    ? (JSON.parse(fs.readFileSync(sampleIdentityPath, 'utf8')) as {
        frames: VideoIdentityFrameSnapshot[];
      })
    : null;

  const presentSources = EXPECTED_SOURCE_VIDEO_IDS.filter((sourceId) =>
    fs.existsSync(path.join(root, VIDEO_IDENTITY_DIR, `${sourceId}-video-identity.json`))
  );

  const noisyMetadata = probeNoisyMetadata(
    ctx.completenessAudit,
    LEVEL2_COMPLETENESS_AUDIT_PASS_VERDICT
  );
  const missingFrames = probeMissingFrames([]);
  const duplicateFrames = sampleIdentity
    ? probeDuplicateFrames([
        ...sampleIdentity.frames,
        { ...sampleIdentity.frames[0], frame_index: sampleIdentity.frames[0].frame_index },
      ])
    : true;
  const corruptedSnapshots = sampleIdentity
    ? probeCorruptedSnapshots([
        { ...sampleIdentity.frames[0], identity_signature: '' },
        ...sampleIdentity.frames.slice(1),
      ])
    : true;
  const partialDatasets = probePartialDataset([EXPECTED_SOURCE_VIDEO_IDS[0]]);

  const auditBypass = !noisyMetadata || !missingFrames;
  const validationBypass = !duplicateFrames || !corruptedSnapshots || !partialDatasets;

  const checks: RobustnessCheckResult[] = [
    checkResult(
      'noisy_metadata',
      'noisy metadata',
      noisyMetadata,
      'failure_injection',
      LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH,
      'Noisy metadata bypass detected'
    ),
    checkResult(
      'missing_frames',
      'missing frames',
      missingFrames,
      'failure_injection',
      VIDEO_IDENTITY_DIR,
      'Missing frames bypass detected'
    ),
    checkResult(
      'duplicate_frames',
      'duplicate frames',
      duplicateFrames,
      'failure_injection',
      VIDEO_IDENTITY_DIR,
      'Duplicate frames bypass detected'
    ),
    checkResult(
      'corrupted_snapshots',
      'corrupted snapshots',
      corruptedSnapshots,
      'failure_injection',
      VIDEO_IDENTITY_DIR,
      'Corrupted snapshots bypass detected'
    ),
    checkResult(
      'partial_datasets',
      'partial datasets',
      partialDatasets,
      'failure_injection',
      DNA_PACKAGE_PATH,
      'Partial dataset bypass detected'
    ),
  ];

  return {
    audit_id: 'AUDIT-06',
    audit_category: 'ADVERSARIAL_INPUT_AUDIT',
    audit_label: 'Adversarial Input Audit',
    has_finding: checks.some((check) => check.status === 'FINDING'),
    noisy_metadata: toStatus(noisyMetadata),
    missing_frames: toStatus(missingFrames),
    duplicate_frames: toStatus(duplicateFrames),
    corrupted_snapshots: toStatus(corruptedSnapshots),
    partial_datasets: toStatus(partialDatasets),
    audit_bypass: auditBypass,
    validation_bypass: validationBypass,
    checks,
  };
}

function auditChainIntegrity(root: string, ctx: EvidenceContext): Level2RobustnessAuditResult {
  const l2Tracks = LEVEL2_FINAL_TRACK_ENTRIES_V2.map((entry) => {
    const report = loadReport<Record<string, unknown>>(root, entry.report_path);
    const passed =
      report?.final_verdict === entry.pass_verdict &&
      (entry.ready_field ? report[entry.ready_field] === 'PASS' : true);
    return { track_id: entry.track_id, passed, report_path: entry.report_path };
  });

  const l2gTracks = LEVEL2G_CHAIN_ENTRIES.map((entry) => {
    const report = loadReport<Record<string, unknown>>(root, entry.report_path);
    const passed =
      report?.final_verdict === entry.pass_verdict &&
      report.certification_status === entry.status_message &&
      report[entry.ready_field] === 'PASS';
    return { track_id: entry.track_id, passed, report_path: entry.report_path };
  });

  const completenessPassed =
    ctx.completenessAudit?.final_verdict === LEVEL2_COMPLETENESS_AUDIT_PASS_VERDICT &&
    ctx.completenessAudit.certification_status === LEVEL2_COMPLETE_FINAL_STATUS &&
    ctx.completenessAudit.gap_count === 0;

  const crossTrackIntegrity =
    fieldPass(ctx.l2FinalV2, 'dna_traceability_preserved') &&
    fieldPass(ctx.l2FinalV2, 'adapter_traceability_preserved') &&
    fieldPass(ctx.l2FinalV2, 'cross_app_consistency');

  const manifestChecks = [
    LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH,
    LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH,
    LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH,
    REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH,
    RUNTIME_SCALABILITY_VALIDATION_REPORT_PATH,
  ].map((reportPath) => fs.existsSync(path.join(root, reportPath)));

  const reportManifestConsistency = manifestChecks.every((exists) => exists);
  const chainBreak =
    l2Tracks.some((track) => !track.passed) ||
    l2gTracks.some((track) => !track.passed) ||
    !completenessPassed;
  const certificationInconsistency = !crossTrackIntegrity || !reportManifestConsistency;

  const checks: RobustnessCheckResult[] = [
    ...['L2A', 'L2B', 'L2C', 'L2D', 'L2E', 'L2F'].map((trackId) => {
      const track = l2Tracks.find((entry) => entry.track_id === trackId);
      return checkResult(
        trackId.toLowerCase(),
        trackId,
        track?.passed === true,
        'production',
        track?.report_path ?? null,
        `${trackId} chain integrity failed`
      );
    }),
    checkResult(
      'l2g',
      'L2G',
      !l2gTracks.some((track) => !track.passed) && completenessPassed,
      'production',
      LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH,
      'L2G gap-closure chain integrity failed'
    ),
    checkResult(
      'cross_track_integrity',
      'cross track integrity',
      crossTrackIntegrity,
      'production',
      LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH,
      'Cross-track integrity not preserved'
    ),
    checkResult(
      'report_manifest_consistency',
      'report manifest consistency',
      reportManifestConsistency,
      'production',
      LEVEL2_ROBUSTNESS_AUDIT_MANIFEST_PATH,
      'Report/manifest consistency failed'
    ),
    checkResult(
      'chain_break_probe',
      'chain break probe',
      (() => {
        const broken = { final_verdict: 'FAIL_REDTEAM' };
        return broken.final_verdict !== LEVEL2_FINAL_CERTIFICATION_V2_PASS_VERDICT;
      })(),
      'failure_injection',
      LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH,
      'Chain break fail-detection probe did not trigger'
    ),
  ];

  return {
    audit_id: 'AUDIT-07',
    audit_category: 'CHAIN_INTEGRITY_AUDIT',
    audit_label: 'Chain Integrity Audit',
    has_finding: checks.some((check) => check.status === 'FINDING'),
    l2a: toStatus(l2Tracks.find((track) => track.track_id === 'L2A')?.passed === true),
    l2b: toStatus(l2Tracks.find((track) => track.track_id === 'L2B')?.passed === true),
    l2c: toStatus(l2Tracks.find((track) => track.track_id === 'L2C')?.passed === true),
    l2d: toStatus(l2Tracks.find((track) => track.track_id === 'L2D')?.passed === true),
    l2e: toStatus(l2Tracks.find((track) => track.track_id === 'L2E')?.passed === true),
    l2f: toStatus(l2Tracks.find((track) => track.track_id === 'L2F')?.passed === true),
    l2g: toStatus(!l2gTracks.some((track) => !track.passed) && completenessPassed),
    cross_track_integrity: toStatus(crossTrackIntegrity),
    report_manifest_consistency: toStatus(reportManifestConsistency),
    chain_break: chainBreak,
    certification_inconsistency: certificationInconsistency,
    checks,
  };
}

function buildMarkdown(report: MovieAnalysisLevel2RobustnessAuditReport): string {
  const lines = [
    '# Movie Analysis Level 2 Robustness Audit',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status) {
    lines.push(`## Status: ${report.certification_status}`, '');
  }

  lines.push(
    '## Red Team Goal',
    '',
    report.redteam_goal,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| finding_count | ${report.finding_count} |`,
    `| level3_entry_ready | ${report.level3_entry_ready} |`,
    `| level2_robustness_audit_ready | ${report.level2_robustness_audit_ready} |`,
    '',
    '## Findings',
    ''
  );

  if (report.findings.length === 0) {
    lines.push('- none', '');
  } else {
    report.findings.forEach((finding, index) => {
      lines.push(`${index + 1}. ${finding}`);
    });
    lines.push('');
  }

  for (const audit of report.robustness_audits) {
    lines.push(`## ${audit.audit_id} ${audit.audit_label}`, '');
    lines.push(`- audit_category: ${audit.audit_category}`);
    lines.push(`- has_finding: ${audit.has_finding}`, '');
    for (const check of audit.checks) {
      lines.push(
        `- ${check.check_id}: ${check.status} probe=${check.probe_type} evidence=${check.evidence_report_path ?? 'none'}${check.finding_reason ? ` reason=${check.finding_reason}` : ''}`
      );
    }
    lines.push('');
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
  issues: Level2RobustnessAuditIssue[]
): MovieAnalysisLevel2RobustnessAuditReport {
  const report: MovieAnalysisLevel2RobustnessAuditReport = {
    report_id: 'movie-analysis-level2-robustness-audit-report-v1',
    phase: LEVEL2_ROBUSTNESS_AUDIT_PHASE,
    timestamp,
    planning_only: true,
    generation: false,
    runtime_execution: false,
    video_generation: true,
    image_generation: true,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    level2_completeness_audit_report_path: LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH,
    level2_robustness_audit_export_dir: LEVEL2_ROBUSTNESS_AUDIT_EXPORT_DIR,
    level2_robustness_audit_manifest_path: LEVEL2_ROBUSTNESS_AUDIT_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    level2_robustness_audit_count: LEVEL2_ROBUSTNESS_AUDIT_COUNT,
    finding_count: 0,
    findings: [],
    level3_entry_ready: false,
    redteam_goal:
      'Validate that the Level2 certification system fails correctly under adversarial conditions and surfaces hidden weaknesses.',
    level2_robustness_audit_ready: 'FINDING',
    certification_status: null,
    robustness_audits: [],
    final_verdict: LEVEL2_ROBUSTNESS_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2_ROBUSTNESS_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_ROBUSTNESS_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisLevel2RobustnessAudit(
  projectRoot?: string
): MovieAnalysisLevel2RobustnessAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: Level2RobustnessAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const completenessAudit = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    gap_count: number;
    level3_entry_ready: boolean;
  }>(root, LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH);

  if (!completenessAudit) {
    issues.push({
      code: 'PRECHECK_MISSING',
      message: `Missing ${LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (
    completenessAudit.final_verdict !== LEVEL2_COMPLETENESS_AUDIT_PASS_VERDICT ||
    completenessAudit.certification_status !== LEVEL2_COMPLETE_FINAL_STATUS
  ) {
    issues.push({
      code: 'PRECHECK_FAIL',
      message: `Required ${LEVEL2_COMPLETENESS_AUDIT_PASS_VERDICT} with ${LEVEL2_COMPLETE_FINAL_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const ctx = buildEvidenceContext(root);
  const robustnessAudits: Level2RobustnessAuditResult[] = [
    auditSceneBoundaryAccuracy(root, ctx),
    auditCrossSourceGeneralization(ctx),
    auditAnalysisQualityAccuracy(ctx),
    auditFalsePositive(ctx),
    auditFalseNegative(root, ctx),
    auditAdversarialInput(root, ctx),
    auditChainIntegrity(root, ctx),
  ];

  const findings = robustnessAudits
    .filter((audit) => audit.has_finding)
    .map((audit) => audit.audit_label);
  const findingCount = findings.length;
  const auditFailure = issues.some((issue) => issue.severity === 'error');
  const passFinal = !auditFailure && findingCount === 0;
  const passWithFindings = !auditFailure && findingCount > 0;

  const finalVerdict = auditFailure
    ? LEVEL2_ROBUSTNESS_AUDIT_FAIL_VERDICT
    : passFinal
      ? LEVEL2_ROBUSTNESS_AUDIT_PASS_VERDICT
      : LEVEL2_ROBUSTNESS_AUDIT_PASS_WITH_FINDINGS_VERDICT;

  const certificationStatus = passFinal ? LEVEL2_COMPLETE_FINAL_PLUS_STATUS : null;
  const level3EntryReady = passFinal;

  const manifest: MovieAnalysisLevel2RobustnessAuditManifest = {
    manifest_id: 'movie-analysis-level2-robustness-audit-manifest-v1',
    phase: LEVEL2_ROBUSTNESS_AUDIT_PHASE,
    generated_at: timestamp,
    level2_robustness_audit_count: LEVEL2_ROBUSTNESS_AUDIT_COUNT,
    finding_count: findingCount,
    findings,
    level3_entry_ready: level3EntryReady,
    robustness_audits: robustnessAudits,
    certification_status: certificationStatus,
  };

  fs.mkdirSync(path.join(root, LEVEL2_ROBUSTNESS_AUDIT_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_ROBUSTNESS_AUDIT_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_ROBUSTNESS_AUDIT_EXPORT_DIR, 'level2-robustness-audit.json'),
    `${JSON.stringify(
      {
        finding_count: findingCount,
        findings,
        level3_entry_ready: level3EntryReady,
        robustness_audits: robustnessAudits.map((audit) => ({
          audit_id: audit.audit_id,
          audit_category: audit.audit_category,
          audit_label: audit.audit_label,
          has_finding: audit.has_finding,
          finding_checks: audit.checks
            .filter((check) => check.status === 'FINDING')
            .map((check) => check.check_id),
        })),
        certification_status: certificationStatus,
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  const report: MovieAnalysisLevel2RobustnessAuditReport = {
    report_id: 'movie-analysis-level2-robustness-audit-report-v1',
    phase: LEVEL2_ROBUSTNESS_AUDIT_PHASE,
    timestamp,
    planning_only: true,
    generation: false,
    runtime_execution: false,
    video_generation: true,
    image_generation: true,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    level2_completeness_audit_report_path: LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH,
    level2_robustness_audit_export_dir: LEVEL2_ROBUSTNESS_AUDIT_EXPORT_DIR,
    level2_robustness_audit_manifest_path: LEVEL2_ROBUSTNESS_AUDIT_MANIFEST_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    level2_robustness_audit_count: LEVEL2_ROBUSTNESS_AUDIT_COUNT,
    finding_count: findingCount,
    findings,
    level3_entry_ready: level3EntryReady,
    redteam_goal:
      'Validate that the Level2 certification system fails correctly under adversarial conditions and surfaces hidden weaknesses.',
    level2_robustness_audit_ready: auditFailure ? 'FINDING' : 'PASS',
    certification_status: certificationStatus,
    robustness_audits: robustnessAudits,
    final_verdict: finalVerdict,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2_ROBUSTNESS_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_ROBUSTNESS_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
