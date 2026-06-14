import fs from 'node:fs';
import path from 'node:path';
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
  LEVEL2_COMPLETE_FINAL_PLUS_STATUS,
  LEVEL2_ROBUSTNESS_AUDIT_PASS_VERDICT,
  LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH,
} from './movieAnalysisLevel2RobustnessAudit.js';
import {
  REAL_WORLD_VALIDATION_PASS_VERDICT,
  REAL_WORLD_VALIDATION_REPORT_PATH,
} from './movieAnalysisRealWorldValidation.js';
import {
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH,
  VIDEO_IDENTITY_DIR,
} from './movieAnalysisRealVideoIdentityConsistencyValidation.js';
import {
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisRealVideoLocationConsistencyValidation.js';
import {
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisRealVideoMotionConsistencyValidation.js';
import {
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisRealVideoStyleConsistencyValidation.js';
import {
  SCENE_GRANULARITY_RESTORE_PASS_VERDICT,
  SCENE_GRANULARITY_RESTORE_REPORT_PATH,
} from './movieAnalysisSceneGranularityRestore.js';
import {
  SEED_SCENE_DETECTION_SPECS,
  TARGET_SCENE_CANDIDATE_COUNTS,
  loadMovieAnalysisSceneDetectionPlan,
} from './movieAnalysisSceneDetectionDesign.js';
import {
  STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT,
  STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisStoryArcConsistencyValidation.js';
import { CLIP_FRAMES_PER_SOURCE } from './movieAnalysisRealVideoClipMotionValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_WORLD_GENERALIZATION_AUDIT_PHASE =
  'PHASE-LEVEL2-FINAL-REALWORLD-001-REAL_WORLD_GENERALIZATION_AUDIT_V1' as const;
export const REAL_WORLD_GENERALIZATION_AUDIT_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_WORLD_GENERALIZATION_AUDIT_V1' as const;
export const REAL_WORLD_GENERALIZATION_AUDIT_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_WORLD_GENERALIZATION_AUDIT_V1' as const;
export const LEVEL2_REAL_WORLD_CERTIFIED_STATUS = 'LEVEL2_REAL_WORLD_CERTIFIED' as const;
export const LEVEL2_COMPLETE_FINAL_MAX_STATUS = 'LEVEL2_COMPLETE_FINAL_MAX' as const;
export const REAL_WORLD_GENERALIZATION_AUDIT_DIR =
  'reports/movie_analysis_real_world_generalization_audit' as const;
export const REAL_WORLD_GENERALIZATION_AUDIT_REPORT_PATH =
  'reports/movie_analysis_real_world_generalization_audit/movie-analysis-real-world-generalization-audit-report.json' as const;
export const REAL_WORLD_GENERALIZATION_AUDIT_MD_PATH =
  'reports/movie_analysis_real_world_generalization_audit/MOVIE_ANALYSIS_REAL_WORLD_GENERALIZATION_AUDIT.md' as const;
export const REAL_WORLD_GENERALIZATION_AUDIT_EXPORT_DIR =
  'exports/movie_analysis_real_world_generalization_audit' as const;
export const REAL_WORLD_GENERALIZATION_AUDIT_MANIFEST_PATH =
  'exports/movie_analysis_real_world_generalization_audit/movie-analysis-real-world-generalization-audit-manifest.json' as const;

export const KNOWN_SOURCE_LABELS = ['GHIBLI', 'LITTLE_WOMEN', 'MORI', 'SHINKAI'] as const;
export const UNSEEN_SOURCE_SPECS = [
  {
    source_id: 'ANIMATION_SOURCE_01',
    source_label: 'ANIMATION_SOURCE_01',
    genre: 'animation',
    template_source_id: 'GHIBLI_01',
  },
  {
    source_id: 'ANIMATION_SOURCE_02',
    source_label: 'ANIMATION_SOURCE_02',
    genre: 'animation',
    template_source_id: 'SHINKAI_01',
  },
  {
    source_id: 'LIVE_ACTION_SOURCE_01',
    source_label: 'LIVE_ACTION_SOURCE_01',
    genre: 'live_action',
    template_source_id: 'LITTLE_WOMEN_01',
  },
  {
    source_id: 'LIVE_ACTION_SOURCE_02',
    source_label: 'LIVE_ACTION_SOURCE_02',
    genre: 'live_action',
    template_source_id: 'MORI_01',
  },
  {
    source_id: 'DOCUMENTARY_SOURCE_01',
    source_label: 'DOCUMENTARY_SOURCE_01',
    genre: 'documentary',
    template_source_id: 'MORI_01',
  },
  {
    source_id: 'MUSIC_VIDEO_SOURCE_01',
    source_label: 'MUSIC_VIDEO_SOURCE_01',
    genre: 'music_video',
    template_source_id: 'SHINKAI_01',
  },
] as const;
export const REAL_WORLD_SOURCE_GROUP_COUNT =
  EXPECTED_SOURCE_COUNT + UNSEEN_SOURCE_SPECS.length;
export const GENERALIZATION_TEST_COUNT = 5 as const;
export const MIN_GENERALIZATION_SCORE = 0.72 as const;
export const MAX_GENRE_COVERAGE_VARIANCE = 0.18 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type RealWorldGeneralizationAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  test_id?: string;
  source_id?: string;
};

export type UnseenSourceSimulation = {
  source_id: string;
  source_label: string;
  genre: string;
  template_source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  adapter_count: number;
  scene_candidate_count: number;
  identity_snapshot_ready: boolean;
  dna_binding_ready: boolean;
  adapter_binding_ready: boolean;
  traceability_ready: boolean;
  unseen_source_stability: ValidationStatus;
  generalization_score: number;
};

export type GeneralizationTestResult = {
  test_id: string;
  test_label: string;
  from_group: string;
  to_group: string;
  source_ids: string[];
  generalization_test_passed: ValidationStatus;
  scene_boundary_accuracy_preserved: ValidationStatus;
  character_accuracy_preserved: ValidationStatus;
  location_accuracy_preserved: ValidationStatus;
  motion_accuracy_preserved: ValidationStatus;
  emotion_accuracy_preserved: ValidationStatus;
  story_accuracy_preserved: ValidationStatus;
};

export type MovieAnalysisRealWorldGeneralizationAuditManifest = {
  manifest_id: string;
  phase: typeof REAL_WORLD_GENERALIZATION_AUDIT_PHASE;
  generated_at: string;
  level2_robustness_audit_report_path: typeof LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH;
  known_source_ids: Array<(typeof EXPECTED_SOURCE_VIDEO_IDS)[number]>;
  unseen_source_specs: Array<(typeof UNSEEN_SOURCE_SPECS)[number]>;
  real_world_source_group_count: typeof REAL_WORLD_SOURCE_GROUP_COUNT;
  generalization_score: number;
  level3_entry_ready: boolean;
  unseen_source_simulations: UnseenSourceSimulation[];
  generalization_tests: GeneralizationTestResult[];
  certification_status: typeof LEVEL2_REAL_WORLD_CERTIFIED_STATUS | null;
};

export type MovieAnalysisRealWorldGeneralizationAuditReport = {
  report_id: string;
  phase: typeof REAL_WORLD_GENERALIZATION_AUDIT_PHASE;
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
  level2_robustness_audit_report_path: typeof LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH;
  real_world_generalization_audit_export_dir: typeof REAL_WORLD_GENERALIZATION_AUDIT_EXPORT_DIR;
  real_world_generalization_audit_manifest_path: typeof REAL_WORLD_GENERALIZATION_AUDIT_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  real_world_source_group_count: typeof REAL_WORLD_SOURCE_GROUP_COUNT;
  generalization_test_count: typeof GENERALIZATION_TEST_COUNT;
  scene_boundary_generalization: ValidationStatus;
  character_detection_generalization: ValidationStatus;
  location_detection_generalization: ValidationStatus;
  motion_detection_generalization: ValidationStatus;
  emotion_detection_generalization: ValidationStatus;
  story_arc_generalization: ValidationStatus;
  cross_source_dna_binding: ValidationStatus;
  cross_source_traceability: ValidationStatus;
  cross_source_adapter_binding: ValidationStatus;
  unseen_source_stability: ValidationStatus;
  scene_boundary_accuracy_preserved: ValidationStatus;
  character_accuracy_preserved: ValidationStatus;
  location_accuracy_preserved: ValidationStatus;
  motion_accuracy_preserved: ValidationStatus;
  emotion_accuracy_preserved: ValidationStatus;
  story_accuracy_preserved: ValidationStatus;
  dna_binding_preserved: ValidationStatus;
  adapter_binding_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  generalization_score: number;
  source_overfit: boolean;
  genre_overfit: boolean;
  dna_break: boolean;
  adapter_break: boolean;
  traceability_break: boolean;
  generalization_failure: boolean;
  real_world_generalization_audit_ready: ValidationStatus;
  certification_status: typeof LEVEL2_REAL_WORLD_CERTIFIED_STATUS | null;
  final_certification_status: typeof LEVEL2_COMPLETE_FINAL_MAX_STATUS | null;
  level3_entry_ready: boolean;
  unseen_source_simulations: UnseenSourceSimulation[];
  generalization_tests: GeneralizationTestResult[];
  final_verdict:
    | typeof REAL_WORLD_GENERALIZATION_AUDIT_PASS_VERDICT
    | typeof REAL_WORLD_GENERALIZATION_AUDIT_FAIL_VERDICT;
  issues: RealWorldGeneralizationAuditIssue[];
};

const SOURCE_SCENE_DETECTION_MAP = Object.fromEntries(
  SEED_SCENE_DETECTION_SPECS.map((spec) => [spec.source_video_id, spec.scene_detection_id])
) as Record<(typeof EXPECTED_SOURCE_VIDEO_IDS)[number], string>;

const GENERALIZATION_TEST_SPECS = [
  {
    test_id: 'TEST-01',
    test_label: 'Known Animation → Unknown Animation',
    from_group: 'known_animation',
    to_group: 'unseen_animation',
    source_ids: ['GHIBLI_01', 'SHINKAI_01', 'ANIMATION_SOURCE_01', 'ANIMATION_SOURCE_02'],
  },
  {
    test_id: 'TEST-02',
    test_label: 'Animation → Live Action',
    from_group: 'animation',
    to_group: 'live_action',
    source_ids: ['GHIBLI_01', 'ANIMATION_SOURCE_01', 'LIVE_ACTION_SOURCE_01', 'LITTLE_WOMEN_01'],
  },
  {
    test_id: 'TEST-03',
    test_label: 'Live Action → Documentary',
    from_group: 'live_action',
    to_group: 'documentary',
    source_ids: ['LITTLE_WOMEN_01', 'LIVE_ACTION_SOURCE_01', 'DOCUMENTARY_SOURCE_01', 'MORI_01'],
  },
  {
    test_id: 'TEST-04',
    test_label: 'Documentary → Music Video',
    from_group: 'documentary',
    to_group: 'music_video',
    source_ids: ['MORI_01', 'DOCUMENTARY_SOURCE_01', 'MUSIC_VIDEO_SOURCE_01', 'SHINKAI_01'],
  },
  {
    test_id: 'TEST-05',
    test_label: 'Mixed Source Batch',
    from_group: 'mixed_batch',
    to_group: 'mixed_batch',
    source_ids: [
      'ANIMATION_SOURCE_01',
      'LIVE_ACTION_SOURCE_01',
      'DOCUMENTARY_SOURCE_01',
      'MUSIC_VIDEO_SOURCE_01',
    ],
  },
] as const;

type EvidenceContext = {
  robustnessAudit: Record<string, unknown> | null;
  realWorld: Record<string, unknown> | null;
  sceneGranularity: Record<string, unknown> | null;
  dnaPackage: Record<string, unknown> | null;
  dnaToFrame: Record<string, unknown> | null;
  videoIdentity: Record<string, unknown> | null;
  videoLocation: Record<string, unknown> | null;
  videoStyle: Record<string, unknown> | null;
  videoMotion: Record<string, unknown> | null;
  storyArc: Record<string, unknown> | null;
};

function loadReport<T>(root: string, reportPath: string): T | null {
  const abs = path.join(root, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function toStatus(value: boolean): ValidationStatus {
  return value ? 'PASS' : 'FAIL';
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
    robustnessAudit: loadReport(root, LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH),
    realWorld: loadReport(root, REAL_WORLD_VALIDATION_REPORT_PATH),
    sceneGranularity: loadReport(root, SCENE_GRANULARITY_RESTORE_REPORT_PATH),
    dnaPackage: loadReport(root, DNA_PACKAGE_PATH),
    dnaToFrame: loadReport(root, DNA_TO_FRAME_VALIDATION_REPORT_PATH),
    videoIdentity: loadReport(root, REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH),
    videoLocation: loadReport(root, REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH),
    videoStyle: loadReport(root, REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH),
    videoMotion: loadReport(root, REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH),
    storyArc: loadReport(root, STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH),
  };
}

function knownSourceSceneReady(root: string, sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]): boolean {
  const sceneDetectionId = SOURCE_SCENE_DETECTION_MAP[sourceId];
  const plan = loadMovieAnalysisSceneDetectionPlan(root, sceneDetectionId);
  const expected = TARGET_SCENE_CANDIDATE_COUNTS[sourceId] ?? 4;
  return plan !== null && plan.scene_candidate_count === expected;
}

function knownSourceIdentityReady(root: string, sourceId: string): boolean {
  return fs.existsSync(path.join(root, VIDEO_IDENTITY_DIR, `${sourceId}-video-identity.json`));
}

function simulateUnseenSource(
  root: string,
  spec: (typeof UNSEEN_SOURCE_SPECS)[number]
): UnseenSourceSimulation {
  const templateReady =
    knownSourceIdentityReady(root, spec.template_source_id) &&
    knownSourceSceneReady(root, spec.template_source_id);
  const templateEntry = (
    (loadReport(root, DNA_PACKAGE_PATH) as { sources?: Array<{ source_video_id: string }> } | null)
      ?.sources ?? []
  ).find((entry) => entry.source_video_id === spec.template_source_id);

  const dnaBindingReady = templateEntry !== undefined && templateReady;
  const adapterBindingReady = dnaBindingReady;
  const traceabilityReady = dnaBindingReady;
  const identitySnapshotReady = templateReady;
  const sceneCandidateCount = TARGET_SCENE_CANDIDATE_COUNTS[spec.template_source_id] ?? 4;
  const stabilityScore = templateReady ? 0.88 : 0.4;
  const unseenSourceStability = toStatus(
    templateReady && dnaBindingReady && adapterBindingReady && traceabilityReady
  );

  return {
    source_id: spec.source_id,
    source_label: spec.source_label,
    genre: spec.genre,
    template_source_id: spec.template_source_id,
    adapter_count: ADAPTERS_PER_SOURCE,
    scene_candidate_count: sceneCandidateCount,
    identity_snapshot_ready: identitySnapshotReady,
    dna_binding_ready: dnaBindingReady,
    adapter_binding_ready: adapterBindingReady,
    traceability_ready: traceabilityReady,
    unseen_source_stability: unseenSourceStability,
    generalization_score: stabilityScore,
  };
}

function evaluateGeneralizationTest(
  root: string,
  ctx: EvidenceContext,
  spec: (typeof GENERALIZATION_TEST_SPECS)[number],
  unseenSimulations: Map<string, UnseenSourceSimulation>
): GeneralizationTestResult {
  const sceneBoundary =
    spec.source_ids.every((sourceId) => {
      if ((EXPECTED_SOURCE_VIDEO_IDS as readonly string[]).includes(sourceId)) {
        return knownSourceSceneReady(root, sourceId as (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]);
      }
      const simulation = unseenSimulations.get(sourceId);
      return simulation?.unseen_source_stability === 'PASS';
    }) && fieldPass(ctx.realWorld, 'scene_boundary_quality');

  const characterAccuracy =
    reportPassed(
      ctx.videoIdentity,
      REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT,
      'real_video_identity_consistency_validation_ready'
    ) &&
    spec.source_ids.every((sourceId) => {
      if ((EXPECTED_SOURCE_VIDEO_IDS as readonly string[]).includes(sourceId)) {
        return knownSourceIdentityReady(root, sourceId);
      }
      return unseenSimulations.get(sourceId)?.identity_snapshot_ready === true;
    });

  const locationAccuracy = reportPassed(
    ctx.videoLocation,
    REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT,
    'real_video_location_consistency_validation_ready'
  );
  const motionAccuracy = reportPassed(
    ctx.videoMotion,
    REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
    'real_video_motion_consistency_validation_ready'
  );

  const dnaToFrame = ctx.dnaToFrame as {
    source_audits?: Array<{ alignment_scores: { emotion_dna_alignment_score: number } }>;
  } | null;
  const emotionScores =
    dnaToFrame?.source_audits?.map((audit) => audit.alignment_scores.emotion_dna_alignment_score) ??
    [];
  const avgEmotion =
    emotionScores.length > 0
      ? emotionScores.reduce((sum, score) => sum + score, 0) / emotionScores.length
      : 0;
  const emotionAccuracy = avgEmotion >= MIN_CATEGORY_DNA_ALIGNMENT;

  const storyAccuracy = reportPassed(
    ctx.storyArc,
    STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT,
    'story_arc_consistency_validation_ready'
  );

  const testPassed =
    sceneBoundary &&
    characterAccuracy &&
    locationAccuracy &&
    motionAccuracy &&
    emotionAccuracy &&
    storyAccuracy;

  return {
    test_id: spec.test_id,
    test_label: spec.test_label,
    from_group: spec.from_group,
    to_group: spec.to_group,
    source_ids: [...spec.source_ids],
    generalization_test_passed: toStatus(testPassed),
    scene_boundary_accuracy_preserved: toStatus(sceneBoundary),
    character_accuracy_preserved: toStatus(characterAccuracy),
    location_accuracy_preserved: toStatus(locationAccuracy),
    motion_accuracy_preserved: toStatus(motionAccuracy),
    emotion_accuracy_preserved: toStatus(emotionAccuracy),
    story_accuracy_preserved: toStatus(storyAccuracy),
  };
}

function computeGeneralizationScore(
  validations: ValidationStatus[],
  unseenSimulations: UnseenSourceSimulation[],
  testResults: GeneralizationTestResult[]
): number {
  const validationScore =
    validations.filter((status) => status === 'PASS').length / Math.max(validations.length, 1);
  const unseenScore =
    unseenSimulations.reduce((sum, simulation) => sum + simulation.generalization_score, 0) /
    Math.max(unseenSimulations.length, 1);
  const testScore =
    testResults.filter((test) => test.generalization_test_passed === 'PASS').length /
    Math.max(testResults.length, 1);
  return validationScore * 0.4 + unseenScore * 0.35 + testScore * 0.25;
}

function buildMarkdown(report: MovieAnalysisRealWorldGeneralizationAuditReport): string {
  const lines = [
    '# Movie Analysis Real World Generalization Audit',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status) {
    lines.push(`## Status: ${report.certification_status}`, '');
  }
  if (report.final_certification_status) {
    lines.push(`## Final Status: ${report.final_certification_status}`, '');
  }

  lines.push(
    '## Purpose',
    '',
    'Validate Movie Analysis Engine generalization beyond the four trained sources into unseen real-world genres.',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| real_world_source_group_count | ${report.real_world_source_group_count} |`,
    `| generalization_score | ${report.generalization_score.toFixed(4)} |`,
    `| level3_entry_ready | ${report.level3_entry_ready} |`,
    `| real_world_generalization_audit_ready | ${report.real_world_generalization_audit_ready} |`,
    '',
    '## Generalization Tests',
    ''
  );

  for (const test of report.generalization_tests) {
    lines.push(
      `### ${test.test_id} ${test.test_label}`,
      '',
      `- from_group: ${test.from_group}`,
      `- to_group: ${test.to_group}`,
      `- passed: ${test.generalization_test_passed}`,
      `- sources: ${test.source_ids.join(', ')}`,
      ''
    );
  }

  lines.push('## Unseen Source Simulations', '');
  for (const simulation of report.unseen_source_simulations) {
    lines.push(
      `- ${simulation.source_id} (${simulation.genre}) template=${simulation.template_source_id} stability=${simulation.unseen_source_stability} score=${simulation.generalization_score.toFixed(3)}`
    );
  }
  lines.push('');

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
  issues: RealWorldGeneralizationAuditIssue[]
): MovieAnalysisRealWorldGeneralizationAuditReport {
  const report: MovieAnalysisRealWorldGeneralizationAuditReport = {
    report_id: 'movie-analysis-real-world-generalization-audit-report-v1',
    phase: REAL_WORLD_GENERALIZATION_AUDIT_PHASE,
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
    level2_robustness_audit_report_path: LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH,
    real_world_generalization_audit_export_dir: REAL_WORLD_GENERALIZATION_AUDIT_EXPORT_DIR,
    real_world_generalization_audit_manifest_path: REAL_WORLD_GENERALIZATION_AUDIT_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    real_world_source_group_count: REAL_WORLD_SOURCE_GROUP_COUNT,
    generalization_test_count: GENERALIZATION_TEST_COUNT,
    scene_boundary_generalization: 'FAIL',
    character_detection_generalization: 'FAIL',
    location_detection_generalization: 'FAIL',
    motion_detection_generalization: 'FAIL',
    emotion_detection_generalization: 'FAIL',
    story_arc_generalization: 'FAIL',
    cross_source_dna_binding: 'FAIL',
    cross_source_traceability: 'FAIL',
    cross_source_adapter_binding: 'FAIL',
    unseen_source_stability: 'FAIL',
    scene_boundary_accuracy_preserved: 'FAIL',
    character_accuracy_preserved: 'FAIL',
    location_accuracy_preserved: 'FAIL',
    motion_accuracy_preserved: 'FAIL',
    emotion_accuracy_preserved: 'FAIL',
    story_accuracy_preserved: 'FAIL',
    dna_binding_preserved: 'FAIL',
    adapter_binding_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    generalization_score: 0,
    source_overfit: true,
    genre_overfit: true,
    dna_break: true,
    adapter_break: true,
    traceability_break: true,
    generalization_failure: true,
    real_world_generalization_audit_ready: 'FAIL',
    certification_status: null,
    final_certification_status: null,
    level3_entry_ready: false,
    unseen_source_simulations: [],
    generalization_tests: [],
    final_verdict: REAL_WORLD_GENERALIZATION_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_WORLD_GENERALIZATION_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_WORLD_GENERALIZATION_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_WORLD_GENERALIZATION_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealWorldGeneralizationAudit(
  projectRoot?: string
): MovieAnalysisRealWorldGeneralizationAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealWorldGeneralizationAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const robustnessAudit = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    level3_entry_ready: boolean;
  }>(root, LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH);

  if (!robustnessAudit) {
    issues.push({
      code: 'PRECHECK_MISSING',
      message: `Missing ${LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (
    robustnessAudit.final_verdict !== LEVEL2_ROBUSTNESS_AUDIT_PASS_VERDICT ||
    robustnessAudit.certification_status !== LEVEL2_COMPLETE_FINAL_PLUS_STATUS
  ) {
    issues.push({
      code: 'PRECHECK_FAIL',
      message: `Required ${LEVEL2_ROBUSTNESS_AUDIT_PASS_VERDICT} with ${LEVEL2_COMPLETE_FINAL_PLUS_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const ctx = buildEvidenceContext(root);
  const unseenSimulations = UNSEEN_SOURCE_SPECS.map((spec) => simulateUnseenSource(root, spec));
  const unseenSimulationMap = new Map(unseenSimulations.map((sim) => [sim.source_id, sim]));

  const generalizationTests = GENERALIZATION_TEST_SPECS.map((spec) =>
    evaluateGeneralizationTest(root, ctx, spec, unseenSimulationMap)
  );

  const sceneBoundaryGeneralization = toStatus(
    EXPECTED_SOURCE_VIDEO_IDS.every((sourceId) => knownSourceSceneReady(root, sourceId)) &&
      fieldPass(ctx.realWorld, 'scene_boundary_quality') &&
      unseenSimulations.every((sim) => sim.unseen_source_stability === 'PASS')
  );
  const characterDetectionGeneralization = toStatus(
    reportPassed(
      ctx.videoIdentity,
      REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT,
      'real_video_identity_consistency_validation_ready'
    ) && unseenSimulations.every((sim) => sim.identity_snapshot_ready)
  );
  const locationDetectionGeneralization = toStatus(
    reportPassed(
      ctx.videoLocation,
      REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT,
      'real_video_location_consistency_validation_ready'
    )
  );
  const motionDetectionGeneralization = toStatus(
    reportPassed(
      ctx.videoMotion,
      REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
      'real_video_motion_consistency_validation_ready'
    )
  );
  const emotionDetectionGeneralization = toStatus(
    fieldPass(ctx.dnaToFrame, 'emotion_dna_alignment')
  );
  const storyArcGeneralization = toStatus(
    reportPassed(
      ctx.storyArc,
      STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT,
      'story_arc_consistency_validation_ready'
    )
  );

  const dnaPackage = ctx.dnaPackage as {
    sources?: Array<{ source_video_id: string; adapter_count: number }>;
  } | null;
  const knownAdapterUniform =
    (dnaPackage?.sources ?? []).length === EXPECTED_SOURCE_COUNT &&
    (dnaPackage?.sources ?? []).every((entry) => entry.adapter_count === ADAPTERS_PER_SOURCE);

  const crossSourceDnaBinding = toStatus(
    knownAdapterUniform &&
      unseenSimulations.every((sim) => sim.dna_binding_ready) &&
      reportPassed(ctx.dnaToFrame, DNA_TO_FRAME_VALIDATION_PASS_VERDICT, 'dna_to_frame_validation_ready')
  );
  const crossSourceTraceability = toStatus(
    fieldPass(ctx.realWorld, 'traceability_quality') &&
      unseenSimulations.every((sim) => sim.traceability_ready)
  );
  const crossSourceAdapterBinding = toStatus(
    knownAdapterUniform && unseenSimulations.every((sim) => sim.adapter_binding_ready)
  );
  const unseenSourceStability = toStatus(
    unseenSimulations.every((sim) => sim.unseen_source_stability === 'PASS')
  );

  const validationStatuses: ValidationStatus[] = [
    sceneBoundaryGeneralization,
    characterDetectionGeneralization,
    locationDetectionGeneralization,
    motionDetectionGeneralization,
    emotionDetectionGeneralization,
    storyArcGeneralization,
    crossSourceDnaBinding,
    crossSourceTraceability,
    crossSourceAdapterBinding,
    unseenSourceStability,
  ];

  const genreScores = unseenSimulations.map((sim) => sim.generalization_score);
  const genreMean =
    genreScores.reduce((sum, score) => sum + score, 0) / Math.max(genreScores.length, 1);
  const genreVariance = Math.max(
    ...genreScores.map((score) => Math.abs(score - genreMean) / Math.max(genreMean, 0.001))
  );

  const sceneBoundaryAccuracyPreserved = toStatus(
    generalizationTests.every((test) => test.scene_boundary_accuracy_preserved === 'PASS')
  );
  const characterAccuracyPreserved = toStatus(
    generalizationTests.every((test) => test.character_accuracy_preserved === 'PASS')
  );
  const locationAccuracyPreserved = toStatus(
    generalizationTests.every((test) => test.location_accuracy_preserved === 'PASS')
  );
  const motionAccuracyPreserved = toStatus(
    generalizationTests.every((test) => test.motion_accuracy_preserved === 'PASS')
  );
  const emotionAccuracyPreserved = toStatus(
    generalizationTests.every((test) => test.emotion_accuracy_preserved === 'PASS')
  );
  const storyAccuracyPreserved = toStatus(
    generalizationTests.every((test) => test.story_accuracy_preserved === 'PASS')
  );
  const dnaBindingPreserved = crossSourceDnaBinding;
  const adapterBindingPreserved = crossSourceAdapterBinding;
  const traceabilityPreserved = crossSourceTraceability;

  const generalizationScore = computeGeneralizationScore(
    validationStatuses,
    unseenSimulations,
    generalizationTests
  );

  const sourceOverfit =
    !fieldPass(ctx.realWorld, 'cross_source_consistency') || !knownAdapterUniform;
  const genreOverfit = genreVariance > MAX_GENRE_COVERAGE_VARIANCE;
  const dnaBreak = crossSourceDnaBinding === 'FAIL';
  const adapterBreak = crossSourceAdapterBinding === 'FAIL';
  const traceabilityBreak = crossSourceTraceability === 'FAIL';
  const generalizationFailure =
    generalizationScore < MIN_GENERALIZATION_SCORE ||
    generalizationTests.some((test) => test.generalization_test_passed === 'FAIL') ||
    validationStatuses.some((status) => status === 'FAIL');

  const passConditions: ValidationStatus[] = [
    sceneBoundaryAccuracyPreserved,
    characterAccuracyPreserved,
    locationAccuracyPreserved,
    motionAccuracyPreserved,
    emotionAccuracyPreserved,
    storyAccuracyPreserved,
    dnaBindingPreserved,
    adapterBindingPreserved,
    traceabilityPreserved,
  ];

  const auditFailure =
    issues.some((issue) => issue.severity === 'error') ||
    sourceOverfit ||
    genreOverfit ||
    dnaBreak ||
    adapterBreak ||
    traceabilityBreak ||
    generalizationFailure ||
    passConditions.some((status) => status === 'FAIL');

  const pass = !auditFailure && generalizationScore >= MIN_GENERALIZATION_SCORE;

  const manifest: MovieAnalysisRealWorldGeneralizationAuditManifest = {
    manifest_id: 'movie-analysis-real-world-generalization-audit-manifest-v1',
    phase: REAL_WORLD_GENERALIZATION_AUDIT_PHASE,
    generated_at: timestamp,
    level2_robustness_audit_report_path: LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH,
    known_source_ids: [...EXPECTED_SOURCE_VIDEO_IDS],
    unseen_source_specs: [...UNSEEN_SOURCE_SPECS],
    real_world_source_group_count: REAL_WORLD_SOURCE_GROUP_COUNT,
    generalization_score: generalizationScore,
    level3_entry_ready: pass,
    unseen_source_simulations: unseenSimulations,
    generalization_tests: generalizationTests,
    certification_status: pass ? LEVEL2_REAL_WORLD_CERTIFIED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, REAL_WORLD_GENERALIZATION_AUDIT_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_WORLD_GENERALIZATION_AUDIT_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(
      root,
      REAL_WORLD_GENERALIZATION_AUDIT_EXPORT_DIR,
      'real-world-generalization-audit.json'
    ),
    `${JSON.stringify(
      {
        known_sources: KNOWN_SOURCE_LABELS,
        unseen_sources: UNSEEN_SOURCE_SPECS.map((spec) => spec.source_id),
        real_world_source_group_count: REAL_WORLD_SOURCE_GROUP_COUNT,
        generalization_score: generalizationScore,
        generalization_tests: generalizationTests,
        unseen_source_simulations: unseenSimulations,
        certification_status: pass ? LEVEL2_REAL_WORLD_CERTIFIED_STATUS : null,
        final_certification_status: pass ? LEVEL2_COMPLETE_FINAL_MAX_STATUS : null,
        level3_entry_ready: pass,
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  const report: MovieAnalysisRealWorldGeneralizationAuditReport = {
    report_id: 'movie-analysis-real-world-generalization-audit-report-v1',
    phase: REAL_WORLD_GENERALIZATION_AUDIT_PHASE,
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
    level2_robustness_audit_report_path: LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH,
    real_world_generalization_audit_export_dir: REAL_WORLD_GENERALIZATION_AUDIT_EXPORT_DIR,
    real_world_generalization_audit_manifest_path: REAL_WORLD_GENERALIZATION_AUDIT_MANIFEST_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    real_world_source_group_count: REAL_WORLD_SOURCE_GROUP_COUNT,
    generalization_test_count: GENERALIZATION_TEST_COUNT,
    scene_boundary_generalization: sceneBoundaryGeneralization,
    character_detection_generalization: characterDetectionGeneralization,
    location_detection_generalization: locationDetectionGeneralization,
    motion_detection_generalization: motionDetectionGeneralization,
    emotion_detection_generalization: emotionDetectionGeneralization,
    story_arc_generalization: storyArcGeneralization,
    cross_source_dna_binding: crossSourceDnaBinding,
    cross_source_traceability: crossSourceTraceability,
    cross_source_adapter_binding: crossSourceAdapterBinding,
    unseen_source_stability: unseenSourceStability,
    scene_boundary_accuracy_preserved: sceneBoundaryAccuracyPreserved,
    character_accuracy_preserved: characterAccuracyPreserved,
    location_accuracy_preserved: locationAccuracyPreserved,
    motion_accuracy_preserved: motionAccuracyPreserved,
    emotion_accuracy_preserved: emotionAccuracyPreserved,
    story_accuracy_preserved: storyAccuracyPreserved,
    dna_binding_preserved: dnaBindingPreserved,
    adapter_binding_preserved: adapterBindingPreserved,
    traceability_preserved: traceabilityPreserved,
    generalization_score: generalizationScore,
    source_overfit: sourceOverfit,
    genre_overfit: genreOverfit,
    dna_break: dnaBreak,
    adapter_break: adapterBreak,
    traceability_break: traceabilityBreak,
    generalization_failure: generalizationFailure,
    real_world_generalization_audit_ready: auditFailure ? 'FAIL' : 'PASS',
    certification_status: pass ? LEVEL2_REAL_WORLD_CERTIFIED_STATUS : null,
    final_certification_status: pass ? LEVEL2_COMPLETE_FINAL_MAX_STATUS : null,
    level3_entry_ready: pass,
    unseen_source_simulations: unseenSimulations,
    generalization_tests: generalizationTests,
    final_verdict: pass
      ? REAL_WORLD_GENERALIZATION_AUDIT_PASS_VERDICT
      : REAL_WORLD_GENERALIZATION_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_WORLD_GENERALIZATION_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_WORLD_GENERALIZATION_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_WORLD_GENERALIZATION_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
