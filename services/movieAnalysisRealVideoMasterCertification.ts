import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  MODEL_GENERATION_TEST_PACKAGE_PATH,
  REAL_MODEL_GENERATION_PREPARATION_PASS_VERDICT,
  REAL_MODEL_GENERATION_PREPARATION_PHASE,
  REAL_MODEL_GENERATION_PREPARATION_REPORT_PATH,
  REAL_MODEL_GENERATION_PREPARATION_STATUS_MESSAGE,
} from './movieAnalysisRealModelGenerationPreparation.js';
import {
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  REAL_MODEL_TEST_GENERATION_PASS_VERDICT,
  REAL_MODEL_TEST_GENERATION_PHASE,
  REAL_MODEL_TEST_GENERATION_REPORT_PATH,
  REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE,
  type RealModelTestGenerationResult,
} from './movieAnalysisRealModelTestGeneration.js';
import {
  REAL_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_CHARACTER_CONSISTENCY_VALIDATION_PHASE,
  REAL_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisRealCharacterConsistencyValidation.js';
import {
  REAL_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_LOCATION_CONSISTENCY_VALIDATION_PHASE,
  REAL_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisRealLocationConsistencyValidation.js';
import {
  MULTI_FRAME_LOCATION_MANIFEST_PATH,
  REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PHASE,
  REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisRealMultiFrameLocationDriftValidation.js';
import {
  MULTI_FRAME_CHARACTER_MANIFEST_PATH,
  REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_PHASE,
  REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisRealMultiFrameCharacterDriftValidation.js';
import {
  MULTI_FRAME_STYLE_MANIFEST_PATH,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PHASE,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisRealMultiFrameStyleConsistencyValidation.js';
import {
  MULTI_FRAME_MOTION_MANIFEST_PATH,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PHASE,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisRealMultiFrameMotionConsistencyValidation.js';
import {
  REAL_VIDEO_CLIP_MOTION_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_PHASE,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_STATUS_MESSAGE,
  VIDEO_CLIP_MANIFEST_PATH,
} from './movieAnalysisRealVideoClipMotionValidation.js';
import {
  REAL_VIDEO_MODEL_GENERATION_PASS_VERDICT,
  REAL_VIDEO_MODEL_GENERATION_PHASE,
  REAL_VIDEO_MODEL_GENERATION_REPORT_PATH,
  REAL_VIDEO_MODEL_GENERATION_STATUS_MESSAGE,
  VIDEO_MODEL_GENERATION_MANIFEST_PATH,
  VIDEO_MODEL_OUTPUT_DIR,
  type RealVideoModelGenerationResult,
} from './movieAnalysisRealVideoModelGeneration.js';
import {
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PHASE,
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  VIDEO_IDENTITY_MANIFEST_PATH,
} from './movieAnalysisRealVideoIdentityConsistencyValidation.js';
import {
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PHASE,
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  VIDEO_LOCATION_MANIFEST_PATH,
} from './movieAnalysisRealVideoLocationConsistencyValidation.js';
import {
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PHASE,
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  VIDEO_STYLE_MANIFEST_PATH,
} from './movieAnalysisRealVideoStyleConsistencyValidation.js';
import {
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PHASE,
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  VIDEO_MOTION_MANIFEST_PATH,
} from './movieAnalysisRealVideoMotionConsistencyValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_VIDEO_MASTER_CERTIFICATION_PHASE =
  'PHASE-LEVEL2F-015-REAL_VIDEO_MASTER_CERTIFICATION_V1' as const;
export const REAL_VIDEO_MASTER_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_VIDEO_MASTER_CERTIFICATION_V1' as const;
export const REAL_VIDEO_MASTER_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_VIDEO_MASTER_CERTIFICATION_V1' as const;
export const REAL_VIDEO_MASTER_CERTIFICATION_STATUS_MESSAGE =
  'REAL_VIDEO_PIPELINE_CERTIFIED' as const;
export const REAL_VIDEO_MASTER_CERTIFICATION_DIR =
  'reports/movie_analysis_real_video_master_certification' as const;
export const REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_real_video_master_certification/movie-analysis-real-video-master-certification-report.json' as const;
export const REAL_VIDEO_MASTER_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_real_video_master_certification/MOVIE_ANALYSIS_REAL_VIDEO_MASTER_CERTIFICATION.md' as const;
export const VIDEO_MASTER_DIR =
  'exports/movie_analysis_model_generation_test/video_master' as const;
export const VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH =
  'exports/movie_analysis_model_generation_test/video_master/movie-analysis-real-video-master-certification-manifest.json' as const;

export const L2F_TRACK_COUNT = 14 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type CertificationStatus = 'PASS' | 'FAIL';

export type RealVideoMasterCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  track_id?: string;
  source_id?: string;
};

export type L2fTrackEntry = {
  track_id: string;
  phase: string;
  report_path: string;
  pass_verdict: string;
  status_message: string;
  ready_field: string;
};

export type L2fTrackAudit = {
  track_id: string;
  phase: string;
  report_path: string;
  report_exists: boolean;
  track_passed: boolean;
};

export type MovieAnalysisRealVideoMasterCertificationManifest = {
  manifest_id: string;
  phase: typeof REAL_VIDEO_MASTER_CERTIFICATION_PHASE;
  certified_at: string;
  source_count: number;
  adapter_count: number;
  l2f_track_count: typeof L2F_TRACK_COUNT;
  certification_status: typeof REAL_VIDEO_MASTER_CERTIFICATION_STATUS_MESSAGE | null;
  preparation_package_path: typeof MODEL_GENERATION_TEST_PACKAGE_PATH;
  model_test_manifest_path: typeof MODEL_TEST_GENERATION_MANIFEST_PATH;
  video_model_generation_manifest_path: typeof VIDEO_MODEL_GENERATION_MANIFEST_PATH;
  video_identity_manifest_path: typeof VIDEO_IDENTITY_MANIFEST_PATH;
  video_location_manifest_path: typeof VIDEO_LOCATION_MANIFEST_PATH;
  video_style_manifest_path: typeof VIDEO_STYLE_MANIFEST_PATH;
  video_motion_manifest_path: typeof VIDEO_MOTION_MANIFEST_PATH;
  track_audits: L2fTrackAudit[];
};

export type MovieAnalysisRealVideoMasterCertificationReport = {
  report_id: string;
  phase: typeof REAL_VIDEO_MASTER_CERTIFICATION_PHASE;
  timestamp: string;
  planning_only: false;
  generation: false;
  runtime_execution: false;
  video_generation: true;
  image_generation: true;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  preparation_package_path: typeof MODEL_GENERATION_TEST_PACKAGE_PATH;
  video_model_output_dir: typeof VIDEO_MODEL_OUTPUT_DIR;
  video_master_certification_manifest_path: typeof VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  l2f_track_count: typeof L2F_TRACK_COUNT;
  l2f_tracks_complete: CertificationStatus;
  video_generation_complete: CertificationStatus;
  identity_consistency_validated: CertificationStatus;
  location_consistency_validated: CertificationStatus;
  style_consistency_validated: CertificationStatus;
  motion_consistency_validated: CertificationStatus;
  dna_binding_preserved: CertificationStatus;
  adapter_binding_preserved: CertificationStatus;
  traceability_preserved: CertificationStatus;
  certification_failure: boolean;
  pipeline_break: boolean;
  missing_upstream: boolean;
  traceability_loss: boolean;
  real_video_master_certification_ready: CertificationStatus;
  certification_status: typeof REAL_VIDEO_MASTER_CERTIFICATION_STATUS_MESSAGE | null;
  track_audits: L2fTrackAudit[];
  final_verdict:
    | typeof REAL_VIDEO_MASTER_CERTIFICATION_PASS_VERDICT
    | typeof REAL_VIDEO_MASTER_CERTIFICATION_FAIL_VERDICT;
  issues: RealVideoMasterCertificationIssue[];
};

export const L2F_TRACK_ENTRIES: L2fTrackEntry[] = [
  {
    track_id: 'L2F-001',
    phase: REAL_MODEL_GENERATION_PREPARATION_PHASE,
    report_path: REAL_MODEL_GENERATION_PREPARATION_REPORT_PATH,
    pass_verdict: REAL_MODEL_GENERATION_PREPARATION_PASS_VERDICT,
    status_message: REAL_MODEL_GENERATION_PREPARATION_STATUS_MESSAGE,
    ready_field: 'real_model_generation_ready',
  },
  {
    track_id: 'L2F-002',
    phase: REAL_MODEL_TEST_GENERATION_PHASE,
    report_path: REAL_MODEL_TEST_GENERATION_REPORT_PATH,
    pass_verdict: REAL_MODEL_TEST_GENERATION_PASS_VERDICT,
    status_message: REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE,
    ready_field: 'real_model_test_generation_ready',
  },
  {
    track_id: 'L2F-003',
    phase: REAL_CHARACTER_CONSISTENCY_VALIDATION_PHASE,
    report_path: REAL_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH,
    pass_verdict: REAL_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT,
    status_message: REAL_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
    ready_field: 'real_character_consistency_validation_ready',
  },
  {
    track_id: 'L2F-004',
    phase: REAL_LOCATION_CONSISTENCY_VALIDATION_PHASE,
    report_path: REAL_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
    pass_verdict: REAL_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT,
    status_message: REAL_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
    ready_field: 'real_location_consistency_validation_ready',
  },
  {
    track_id: 'L2F-005',
    phase: REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PHASE,
    report_path: REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH,
    pass_verdict: REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PASS_VERDICT,
    status_message: REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_STATUS_MESSAGE,
    ready_field: 'real_multi_frame_location_drift_validation_ready',
  },
  {
    track_id: 'L2F-006',
    phase: REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_PHASE,
    report_path: REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_REPORT_PATH,
    pass_verdict: REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_PASS_VERDICT,
    status_message: REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_STATUS_MESSAGE,
    ready_field: 'real_multi_frame_character_drift_validation_ready',
  },
  {
    track_id: 'L2F-007',
    phase: REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PHASE,
    report_path: REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
    pass_verdict: REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT,
    status_message: REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
    ready_field: 'real_multi_frame_style_consistency_validation_ready',
  },
  {
    track_id: 'L2F-008',
    phase: REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PHASE,
    report_path: REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
    pass_verdict: REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
    status_message: REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
    ready_field: 'real_multi_frame_motion_consistency_validation_ready',
  },
  {
    track_id: 'L2F-009',
    phase: REAL_VIDEO_CLIP_MOTION_VALIDATION_PHASE,
    report_path: REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH,
    pass_verdict: REAL_VIDEO_CLIP_MOTION_VALIDATION_PASS_VERDICT,
    status_message: REAL_VIDEO_CLIP_MOTION_VALIDATION_STATUS_MESSAGE,
    ready_field: 'real_video_clip_motion_validation_ready',
  },
  {
    track_id: 'L2F-010',
    phase: REAL_VIDEO_MODEL_GENERATION_PHASE,
    report_path: REAL_VIDEO_MODEL_GENERATION_REPORT_PATH,
    pass_verdict: REAL_VIDEO_MODEL_GENERATION_PASS_VERDICT,
    status_message: REAL_VIDEO_MODEL_GENERATION_STATUS_MESSAGE,
    ready_field: 'real_video_model_generation_ready',
  },
  {
    track_id: 'L2F-011',
    phase: REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PHASE,
    report_path: REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH,
    pass_verdict: REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT,
    status_message: REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
    ready_field: 'real_video_identity_consistency_validation_ready',
  },
  {
    track_id: 'L2F-012',
    phase: REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PHASE,
    report_path: REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
    pass_verdict: REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT,
    status_message: REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
    ready_field: 'real_video_location_consistency_validation_ready',
  },
  {
    track_id: 'L2F-013',
    phase: REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PHASE,
    report_path: REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
    pass_verdict: REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT,
    status_message: REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
    ready_field: 'real_video_style_consistency_validation_ready',
  },
  {
    track_id: 'L2F-014',
    phase: REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PHASE,
    report_path: REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
    pass_verdict: REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
    status_message: REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
    ready_field: 'real_video_motion_consistency_validation_ready',
  },
];

const REQUIRED_MANIFEST_PATHS = [
  MODEL_GENERATION_TEST_PACKAGE_PATH,
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  MULTI_FRAME_LOCATION_MANIFEST_PATH,
  MULTI_FRAME_CHARACTER_MANIFEST_PATH,
  MULTI_FRAME_STYLE_MANIFEST_PATH,
  MULTI_FRAME_MOTION_MANIFEST_PATH,
  VIDEO_CLIP_MANIFEST_PATH,
  VIDEO_MODEL_GENERATION_MANIFEST_PATH,
  VIDEO_IDENTITY_MANIFEST_PATH,
  VIDEO_LOCATION_MANIFEST_PATH,
  VIDEO_STYLE_MANIFEST_PATH,
  VIDEO_MOTION_MANIFEST_PATH,
] as const;

function loadReport<T>(projectRoot: string, reportPath: string): T | null {
  const abs = path.join(projectRoot, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function toStatus(value: boolean): CertificationStatus {
  return value ? 'PASS' : 'FAIL';
}

function auditTrack(projectRoot: string, entry: L2fTrackEntry): L2fTrackAudit {
  const report = loadReport<{
    final_verdict?: string;
    certification_status?: string | null;
    [key: string]: unknown;
  }>(projectRoot, entry.report_path);
  const reportExists = report !== null;
  const readyValue = report?.[entry.ready_field];
  const trackPassed =
    reportExists &&
    report.final_verdict === entry.pass_verdict &&
    readyValue === 'PASS' &&
    report.certification_status === entry.status_message;

  return {
    track_id: entry.track_id,
    phase: entry.phase,
    report_path: entry.report_path,
    report_exists: reportExists,
    track_passed: trackPassed,
  };
}

function dnaBindingPreservedAcrossChain(
  testResults: RealModelTestGenerationResult[],
  videoResults: RealVideoModelGenerationResult[]
): boolean {
  if (testResults.length !== videoResults.length) return false;
  const videoBySource = Object.fromEntries(videoResults.map((result) => [result.source_id, result]));

  return testResults.every((testResult) => {
    const videoResult = videoBySource[testResult.source_id];
    if (!videoResult) return false;
    return (
      testResult.dna_binding.binding_preserved === true &&
      videoResult.dna_binding.binding_preserved === true &&
      testResult.dna_binding.cinematic_dna_id === videoResult.dna_binding.cinematic_dna_id &&
      testResult.dna_binding.integration_id === videoResult.dna_binding.integration_id &&
      testResult.dna_binding.adapter_library_entry_id ===
        videoResult.dna_binding.adapter_library_entry_id &&
      videoResult.traceability.cinematic_dna_id === testResult.dna_binding.cinematic_dna_id
    );
  });
}

function adapterBindingPreservedAcrossChain(
  testResults: RealModelTestGenerationResult[],
  videoResults: RealVideoModelGenerationResult[]
): boolean {
  if (testResults.length !== videoResults.length) return false;
  const videoBySource = Object.fromEntries(videoResults.map((result) => [result.source_id, result]));

  return testResults.every((testResult) => {
    const videoResult = videoBySource[testResult.source_id];
    if (!videoResult) return false;
    return (
      testResult.adapter_binding.binding_preserved === true &&
      videoResult.adapter_binding.binding_preserved === true &&
      JSON.stringify(testResult.adapter_binding.adapter_ids) ===
        JSON.stringify(videoResult.adapter_binding.adapter_ids) &&
      JSON.stringify(testResult.adapter_binding.runtime_binding_ids) ===
        JSON.stringify(videoResult.adapter_binding.runtime_binding_ids)
    );
  });
}

function traceabilityPreservedAcrossChain(
  testResults: RealModelTestGenerationResult[],
  videoResults: RealVideoModelGenerationResult[]
): boolean {
  if (testResults.length !== videoResults.length) return false;
  const videoBySource = Object.fromEntries(videoResults.map((result) => [result.source_id, result]));

  return testResults.every((testResult) => {
    const videoResult = videoBySource[testResult.source_id];
    if (!videoResult) return false;
    return (
      testResult.traceability.traceability_preserved === true &&
      videoResult.traceability.traceability_preserved === true &&
      testResult.prompt_hash === videoResult.prompt_hash &&
      testResult.traceability.template_id === videoResult.traceability.template_id &&
      testResult.traceability.assembly_id === videoResult.traceability.assembly_id &&
      JSON.stringify(testResult.traceability.adapter_ids) ===
        JSON.stringify(videoResult.traceability.adapter_ids)
    );
  });
}

function buildMarkdown(report: MovieAnalysisRealVideoMasterCertificationReport): string {
  const lines = [
    '# Movie Analysis Real Video Master Certification',
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
    '## L2F Full Chain',
    '',
    'L2F-001 (Preparation) through L2F-014 (Video Motion Consistency) integrated certification.',
    '',
    '## Certification Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| video_generation_complete | ${report.video_generation_complete} |`,
    `| identity_consistency_validated | ${report.identity_consistency_validated} |`,
    `| location_consistency_validated | ${report.location_consistency_validated} |`,
    `| style_consistency_validated | ${report.style_consistency_validated} |`,
    `| motion_consistency_validated | ${report.motion_consistency_validated} |`,
    `| dna_binding_preserved | ${report.dna_binding_preserved} |`,
    `| adapter_binding_preserved | ${report.adapter_binding_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| pipeline_break | ${report.pipeline_break} |`,
    `| certification_failure | ${report.certification_failure} |`,
    `| missing_upstream | ${report.missing_upstream} |`,
    `| traceability_loss | ${report.traceability_loss} |`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| l2f_track_count | ${report.l2f_track_count} |`,
    `| l2f_tracks_complete | ${report.l2f_tracks_complete} |`,
    `| real_video_master_certification_ready | ${report.real_video_master_certification_ready} |`,
    '',
    '## Track Audits',
    ''
  );

  for (const audit of report.track_audits) {
    lines.push(
      `### ${audit.track_id}`,
      '',
      `- phase: ${audit.phase}`,
      `- report_path: ${audit.report_path}`,
      `- report_exists: ${audit.report_exists}`,
      `- track_passed: ${audit.track_passed}`,
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
  issues: RealVideoMasterCertificationIssue[],
  trackAudits: L2fTrackAudit[] = []
): MovieAnalysisRealVideoMasterCertificationReport {
  const missingUpstream = trackAudits.some((audit) => !audit.report_exists);
  const pipelineBreak = trackAudits.some((audit) => !audit.track_passed);
  const report: MovieAnalysisRealVideoMasterCertificationReport = {
    report_id: 'movie-analysis-real-video-master-certification-report-v1',
    phase: REAL_VIDEO_MASTER_CERTIFICATION_PHASE,
    timestamp,
    planning_only: false,
    generation: false,
    runtime_execution: false,
    video_generation: true,
    image_generation: true,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    video_model_output_dir: VIDEO_MODEL_OUTPUT_DIR,
    video_master_certification_manifest_path: VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    l2f_track_count: L2F_TRACK_COUNT,
    l2f_tracks_complete: 'FAIL',
    video_generation_complete: 'FAIL',
    identity_consistency_validated: 'FAIL',
    location_consistency_validated: 'FAIL',
    style_consistency_validated: 'FAIL',
    motion_consistency_validated: 'FAIL',
    dna_binding_preserved: 'FAIL',
    adapter_binding_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    certification_failure: true,
    pipeline_break: pipelineBreak,
    missing_upstream: missingUpstream,
    traceability_loss: true,
    real_video_master_certification_ready: 'FAIL',
    certification_status: null,
    track_audits: trackAudits,
    final_verdict: REAL_VIDEO_MASTER_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VIDEO_MASTER_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_MASTER_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealVideoMasterCertification(
  projectRoot?: string
): MovieAnalysisRealVideoMasterCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealVideoMasterCertificationIssue[] = [];
  const timestamp = new Date().toISOString();
  const trackAudits = L2F_TRACK_ENTRIES.map((entry) => auditTrack(root, entry));

  for (const audit of trackAudits) {
    if (!audit.report_exists) {
      issues.push({
        code: 'MISSING_UPSTREAM',
        message: `Missing ${audit.report_path}`,
        severity: 'error',
        track_id: audit.track_id,
      });
    } else if (!audit.track_passed) {
      issues.push({
        code: 'PIPELINE_BREAK',
        message: `${audit.track_id} must have PASS verdict and expected readiness`,
        severity: 'error',
        track_id: audit.track_id,
      });
    }
  }

  for (const manifestPath of REQUIRED_MANIFEST_PATHS) {
    if (!fs.existsSync(path.join(root, manifestPath))) {
      issues.push({
        code: 'MISSING_UPSTREAM',
        message: `Missing ${manifestPath}`,
        severity: 'error',
      });
    }
  }

  if (!fs.existsSync(path.join(root, VIDEO_MODEL_OUTPUT_DIR))) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${VIDEO_MODEL_OUTPUT_DIR}`,
      severity: 'error',
    });
  }

  const missingUpstream =
    trackAudits.some((audit) => !audit.report_exists) ||
    REQUIRED_MANIFEST_PATHS.some((manifestPath) => !fs.existsSync(path.join(root, manifestPath))) ||
    !fs.existsSync(path.join(root, VIDEO_MODEL_OUTPUT_DIR));

  const l2fTracksComplete = toStatus(
    trackAudits.length === L2F_TRACK_COUNT && trackAudits.every((audit) => audit.track_passed)
  );

  const videoModelReport = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    real_video_model_generation_ready: CertificationStatus;
    mp4_generation: CertificationStatus;
    video_generation_failed: boolean;
    video_traceability: CertificationStatus;
    video_adapter_binding: CertificationStatus;
    adapter_binding_loss: boolean;
    traceability_loss: boolean;
    source_count: number;
    adapter_count: number;
    generation_results: RealVideoModelGenerationResult[];
  }>(root, REAL_VIDEO_MODEL_GENERATION_REPORT_PATH);

  const testGenerationReport = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    real_model_test_generation_ready: CertificationStatus;
    dna_binding_preserved: CertificationStatus;
    adapter_binding_preserved: CertificationStatus;
    traceability_preserved: CertificationStatus;
    test_results: RealModelTestGenerationResult[];
  }>(root, REAL_MODEL_TEST_GENERATION_REPORT_PATH);

  const identityReport = loadReport<{
    real_video_identity_consistency_validation_ready: CertificationStatus;
    video_identity_consistency: CertificationStatus;
    dna_persistence: CertificationStatus;
  }>(root, REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH);

  const locationReport = loadReport<{
    real_video_location_consistency_validation_ready: CertificationStatus;
    video_location_consistency: CertificationStatus;
  }>(root, REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH);

  const styleReport = loadReport<{
    real_video_style_consistency_validation_ready: CertificationStatus;
    video_style_consistency: CertificationStatus;
  }>(root, REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH);

  const motionReport = loadReport<{
    real_video_motion_consistency_validation_ready: CertificationStatus;
    video_motion_consistency: CertificationStatus;
  }>(root, REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH);

  if (
    !videoModelReport ||
    !testGenerationReport ||
    !identityReport ||
    !locationReport ||
    !styleReport ||
    !motionReport
  ) {
    return writeFailReport(root, timestamp, issues, trackAudits);
  }

  const videoGenerationComplete = toStatus(
    videoModelReport.final_verdict === REAL_VIDEO_MODEL_GENERATION_PASS_VERDICT &&
      videoModelReport.certification_status === REAL_VIDEO_MODEL_GENERATION_STATUS_MESSAGE &&
      videoModelReport.real_video_model_generation_ready === 'PASS' &&
      videoModelReport.mp4_generation === 'PASS' &&
      videoModelReport.video_generation_failed === false &&
      videoModelReport.generation_results.length === EXPECTED_SOURCE_COUNT
  );

  if (videoGenerationComplete === 'FAIL') {
    issues.push({
      code: 'VIDEO_GENERATION_INCOMPLETE',
      message: 'L2F-010 video generation is not complete',
      severity: 'error',
      track_id: 'L2F-010',
    });
  }

  const identityConsistencyValidated = toStatus(
    identityReport.real_video_identity_consistency_validation_ready === 'PASS' &&
      identityReport.video_identity_consistency === 'PASS' &&
      identityReport.dna_persistence === 'PASS'
  );

  if (identityConsistencyValidated === 'FAIL') {
    issues.push({
      code: 'IDENTITY_CONSISTENCY_NOT_VALIDATED',
      message: 'L2F-011 identity consistency validation failed',
      severity: 'error',
      track_id: 'L2F-011',
    });
  }

  const locationConsistencyValidated = toStatus(
    locationReport.real_video_location_consistency_validation_ready === 'PASS' &&
      locationReport.video_location_consistency === 'PASS'
  );

  if (locationConsistencyValidated === 'FAIL') {
    issues.push({
      code: 'LOCATION_CONSISTENCY_NOT_VALIDATED',
      message: 'L2F-012 location consistency validation failed',
      severity: 'error',
      track_id: 'L2F-012',
    });
  }

  const styleConsistencyValidated = toStatus(
    styleReport.real_video_style_consistency_validation_ready === 'PASS' &&
      styleReport.video_style_consistency === 'PASS'
  );

  if (styleConsistencyValidated === 'FAIL') {
    issues.push({
      code: 'STYLE_CONSISTENCY_NOT_VALIDATED',
      message: 'L2F-013 style consistency validation failed',
      severity: 'error',
      track_id: 'L2F-013',
    });
  }

  const motionConsistencyValidated = toStatus(
    motionReport.real_video_motion_consistency_validation_ready === 'PASS' &&
      motionReport.video_motion_consistency === 'PASS'
  );

  if (motionConsistencyValidated === 'FAIL') {
    issues.push({
      code: 'MOTION_CONSISTENCY_NOT_VALIDATED',
      message: 'L2F-014 motion consistency validation failed',
      severity: 'error',
      track_id: 'L2F-014',
    });
  }

  const dnaBindingPreserved = toStatus(
    testGenerationReport.dna_binding_preserved === 'PASS' &&
      dnaBindingPreservedAcrossChain(
        testGenerationReport.test_results,
        videoModelReport.generation_results
      )
  );

  if (dnaBindingPreserved === 'FAIL') {
    issues.push({
      code: 'DNA_BINDING_NOT_PRESERVED',
      message: 'DNA binding is not preserved across image and video generation chain',
      severity: 'error',
    });
  }

  const adapterBindingPreserved = toStatus(
    testGenerationReport.adapter_binding_preserved === 'PASS' &&
      videoModelReport.video_adapter_binding === 'PASS' &&
      videoModelReport.adapter_binding_loss === false &&
      adapterBindingPreservedAcrossChain(
        testGenerationReport.test_results,
        videoModelReport.generation_results
      )
  );

  if (adapterBindingPreserved === 'FAIL') {
    issues.push({
      code: 'ADAPTER_BINDING_NOT_PRESERVED',
      message: 'Adapter binding is not preserved across image and video generation chain',
      severity: 'error',
    });
  }

  const traceabilityPreserved = toStatus(
    testGenerationReport.traceability_preserved === 'PASS' &&
      videoModelReport.video_traceability === 'PASS' &&
      videoModelReport.traceability_loss === false &&
      traceabilityPreservedAcrossChain(
        testGenerationReport.test_results,
        videoModelReport.generation_results
      )
  );

  const traceabilityLoss =
    traceabilityPreserved === 'FAIL' ||
    videoModelReport.traceability_loss === true ||
    testGenerationReport.traceability_preserved !== 'PASS';

  if (traceabilityPreserved === 'FAIL') {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability is not preserved across L2F image-to-video chain',
      severity: 'error',
    });
  }

  const pipelineBreak =
    l2fTracksComplete === 'FAIL' ||
    videoGenerationComplete === 'FAIL' ||
    identityConsistencyValidated === 'FAIL' ||
    locationConsistencyValidated === 'FAIL' ||
    styleConsistencyValidated === 'FAIL' ||
    motionConsistencyValidated === 'FAIL';

  const gateChecks: CertificationStatus[] = [
    l2fTracksComplete,
    videoGenerationComplete,
    identityConsistencyValidated,
    locationConsistencyValidated,
    styleConsistencyValidated,
    motionConsistencyValidated,
    dnaBindingPreserved,
    adapterBindingPreserved,
    traceabilityPreserved,
  ];

  const realVideoMasterCertificationReady =
    !missingUpstream &&
    !pipelineBreak &&
    !traceabilityLoss &&
    gateChecks.every((status) => status === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realVideoMasterCertificationReady === 'PASS';
  const certificationFailure = !pass;

  if (certificationFailure && !issues.some((issue) => issue.code === 'CERTIFICATION_FAILURE')) {
    issues.push({
      code: 'CERTIFICATION_FAILURE',
      message: 'Real video master certification is not ready',
      severity: 'error',
    });
  }

  const sourceCount = videoModelReport.source_count ?? EXPECTED_SOURCE_COUNT;
  const adapterCount = videoModelReport.adapter_count ?? EXPECTED_ADAPTER_COUNT;

  const manifest: MovieAnalysisRealVideoMasterCertificationManifest = {
    manifest_id: 'movie-analysis-real-video-master-certification-manifest-v1',
    phase: REAL_VIDEO_MASTER_CERTIFICATION_PHASE,
    certified_at: timestamp,
    source_count: sourceCount,
    adapter_count: adapterCount,
    l2f_track_count: L2F_TRACK_COUNT,
    certification_status: pass ? REAL_VIDEO_MASTER_CERTIFICATION_STATUS_MESSAGE : null,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    model_test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    video_model_generation_manifest_path: VIDEO_MODEL_GENERATION_MANIFEST_PATH,
    video_identity_manifest_path: VIDEO_IDENTITY_MANIFEST_PATH,
    video_location_manifest_path: VIDEO_LOCATION_MANIFEST_PATH,
    video_style_manifest_path: VIDEO_STYLE_MANIFEST_PATH,
    video_motion_manifest_path: VIDEO_MOTION_MANIFEST_PATH,
    track_audits: trackAudits,
  };

  fs.mkdirSync(path.join(root, VIDEO_MASTER_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisRealVideoMasterCertificationReport = {
    report_id: 'movie-analysis-real-video-master-certification-report-v1',
    phase: REAL_VIDEO_MASTER_CERTIFICATION_PHASE,
    timestamp,
    planning_only: false,
    generation: false,
    runtime_execution: false,
    video_generation: true,
    image_generation: true,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    video_model_output_dir: VIDEO_MODEL_OUTPUT_DIR,
    video_master_certification_manifest_path: VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    l2f_track_count: L2F_TRACK_COUNT,
    l2f_tracks_complete: l2fTracksComplete,
    video_generation_complete: videoGenerationComplete,
    identity_consistency_validated: identityConsistencyValidated,
    location_consistency_validated: locationConsistencyValidated,
    style_consistency_validated: styleConsistencyValidated,
    motion_consistency_validated: motionConsistencyValidated,
    dna_binding_preserved: dnaBindingPreserved,
    adapter_binding_preserved: adapterBindingPreserved,
    traceability_preserved: traceabilityPreserved,
    certification_failure: certificationFailure,
    pipeline_break: pipelineBreak,
    missing_upstream: missingUpstream,
    traceability_loss: traceabilityLoss,
    real_video_master_certification_ready: realVideoMasterCertificationReady,
    certification_status: pass ? REAL_VIDEO_MASTER_CERTIFICATION_STATUS_MESSAGE : null,
    track_audits: trackAudits,
    final_verdict: pass
      ? REAL_VIDEO_MASTER_CERTIFICATION_PASS_VERDICT
      : REAL_VIDEO_MASTER_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VIDEO_MASTER_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_MASTER_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
