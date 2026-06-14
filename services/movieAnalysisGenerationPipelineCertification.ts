import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  DNA_TO_FRAME_VALIDATED_STATUS,
  DNA_TO_FRAME_VALIDATION_PASS_VERDICT,
  DNA_TO_FRAME_VALIDATION_PHASE,
  DNA_TO_FRAME_VALIDATION_REPORT_PATH,
} from './movieAnalysisDnaToFrameValidation.js';
import {
  FRAME_CONSISTENCY_VALIDATED_STATUS,
  FRAME_CONSISTENCY_VALIDATION_PASS_VERDICT,
  FRAME_CONSISTENCY_VALIDATION_PHASE,
  FRAME_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisFrameConsistencyValidation.js';
import {
  REAL_IMAGE_GENERATION_VALIDATION_PASS_VERDICT,
  REAL_IMAGE_GENERATION_VALIDATION_PHASE,
  REAL_IMAGE_GENERATION_VALIDATION_REPORT_PATH,
  REAL_IMAGE_GENERATION_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisRealImageGenerationValidation.js';
import {
  BLOCKED_REAL_IMAGE_REQUIRED_STATUS,
  REAL_IMAGE_REQUIRED_GATE_PASS_VERDICT,
  REAL_IMAGE_REQUIRED_GATE_PHASE,
  REAL_IMAGE_REQUIRED_GATE_REPORT_PATH,
} from './movieAnalysisRealImageRequiredGate.js';
import {
  REAL_IMAGE_OUTPUT_AUDIT_PASS_VERDICT,
  REAL_IMAGE_OUTPUT_AUDIT_PHASE,
  REAL_IMAGE_OUTPUT_AUDIT_REPORT_PATH,
  REAL_IMAGE_OUTPUT_AUDIT_STATUS_MESSAGE,
} from './movieAnalysisRealImageOutputAudit.js';
import {
  REAL_IMAGE_ARTIFACT_INGESTION_PASS_VERDICT,
  REAL_IMAGE_ARTIFACT_INGESTION_PHASE,
  REAL_IMAGE_ARTIFACT_INGESTION_REPORT_PATH,
  REAL_IMAGE_ARTIFACT_INGESTION_STATUS_MESSAGE,
} from './movieAnalysisRealImageArtifactIngestion.js';
import {
  BLOCKED_REAL_VISUAL_CONTENT_REQUIRED_STATUS,
  REAL_IMAGE_QUALITY_GATE_PASS_VERDICT,
  REAL_IMAGE_QUALITY_GATE_PHASE,
  REAL_IMAGE_QUALITY_GATE_REPORT_PATH,
} from './movieAnalysisRealImageQualityGate.js';
import {
  REAL_VISUAL_CONTENT_INGESTION_PASS_VERDICT,
  REAL_VISUAL_CONTENT_INGESTION_PHASE,
  REAL_VISUAL_CONTENT_INGESTION_REPORT_PATH,
  REAL_VISUAL_CONTENT_INGESTION_STATUS_MESSAGE,
} from './movieAnalysisRealVisualContentIngestion.js';
import {
  BLOCKED_REAL_SCENE_CONTENT_REQUIRED_STATUS,
  REAL_VISUAL_CONTENT_AUDIT_PASS_VERDICT,
  REAL_VISUAL_CONTENT_AUDIT_PHASE,
  REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH,
} from './movieAnalysisRealVisualContentAudit.js';
import {
  REAL_SCENE_CONTENT_INGESTION_PASS_VERDICT,
  REAL_SCENE_CONTENT_INGESTION_PHASE,
  REAL_SCENE_CONTENT_INGESTION_REPORT_PATH,
  REAL_SCENE_CONTENT_INGESTION_STATUS_MESSAGE,
} from './movieAnalysisRealSceneContentIngestion.js';
import {
  BLOCKED_REAL_SCENE_QUALITY_REQUIRED_STATUS,
  REAL_SCENE_QUALITY_AUDIT_PASS_VERDICT,
  REAL_SCENE_QUALITY_AUDIT_PHASE,
  REAL_SCENE_QUALITY_AUDIT_REPORT_PATH,
} from './movieAnalysisRealSceneQualityAudit.js';
import {
  REAL_MOVIE_FRAME_INGESTED_STATUS,
  REAL_MOVIE_FRAME_INGESTION_PASS_VERDICT,
  REAL_MOVIE_FRAME_INGESTION_PHASE,
  REAL_MOVIE_FRAME_INGESTION_REPORT_PATH,
  REAL_MOVIE_FRAMES_MANIFEST_PATH,
  type RealMovieFramesManifest,
} from './movieAnalysisRealMovieFrameIngestion.js';
import {
  REAL_EXECUTION_GATE_CERTIFICATION_PASS_VERDICT,
  REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH,
  REAL_EXECUTION_GATE_CERTIFICATION_STATUS_MESSAGE,
} from './movieAnalysisRealExecutionGateCertification.js';
import {
  SEQUENCE_COHERENCE_VALIDATED_STATUS,
  SEQUENCE_COHERENCE_VALIDATION_PASS_VERDICT,
  SEQUENCE_COHERENCE_VALIDATION_PHASE,
  SEQUENCE_COHERENCE_VALIDATION_REPORT_PATH,
} from './movieAnalysisSequenceCoherenceValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const GENERATION_PIPELINE_CERTIFICATION_PHASE =
  'PHASE-LEVEL2E-014-MOVIE_ANALYSIS_GENERATION_PIPELINE_CERTIFICATION_V1' as const;
export const GENERATION_PIPELINE_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_GENERATION_PIPELINE_CERTIFICATION_V1' as const;
export const GENERATION_PIPELINE_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_GENERATION_PIPELINE_CERTIFICATION_V1' as const;
export const GENERATION_PIPELINE_CERTIFICATION_DIR =
  'reports/movie_analysis_generation_pipeline_certification' as const;
export const GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_generation_pipeline_certification/movie-analysis-generation-pipeline-certification-report.json' as const;
export const GENERATION_PIPELINE_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_generation_pipeline_certification/MOVIE_ANALYSIS_GENERATION_PIPELINE_CERTIFICATION.md' as const;
export const GENERATION_PIPELINE_CERTIFIED_STATUS = 'GENERATION_PIPELINE_CERTIFIED' as const;

export const LEVEL2E_TRACK_COUNT = 13 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type CertificationStatus = 'PASS' | 'FAIL';

export type GenerationPipelineCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  track_id?: string;
};

export type Level2ETrackEntry = {
  track_id: string;
  phase: string;
  report_path: string;
  pass_verdict: string;
  status_message: string;
};

export type Level2ETrackAudit = {
  track_id: string;
  phase: string;
  report_path: string;
  report_exists: boolean;
  track_passed: boolean;
};

export type MovieAnalysisGenerationPipelineCertificationReport = {
  report_id: string;
  phase: typeof GENERATION_PIPELINE_CERTIFICATION_PHASE;
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
  source_count: number;
  adapter_count: number;
  level2e_track_count: typeof LEVEL2E_TRACK_COUNT;
  level2e_tracks_complete: CertificationStatus;
  dna_to_frame_validated: CertificationStatus;
  frame_consistency_validated: CertificationStatus;
  sequence_coherence_validated: CertificationStatus;
  generation_readiness: CertificationStatus;
  traceability_preserved: CertificationStatus;
  cross_source_consistency: CertificationStatus;
  pipeline_break: boolean;
  certification_failure: boolean;
  generation_pipeline_certification_ready: CertificationStatus;
  planning_only_status: CertificationStatus;
  certification_status: typeof GENERATION_PIPELINE_CERTIFIED_STATUS | null;
  sequence_coherence_validation_report_path: typeof SEQUENCE_COHERENCE_VALIDATION_REPORT_PATH;
  real_movie_frames_manifest_path: typeof REAL_MOVIE_FRAMES_MANIFEST_PATH;
  real_execution_gate_certification_report_path: typeof REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH;
  track_audits: Level2ETrackAudit[];
  final_verdict:
    | typeof GENERATION_PIPELINE_CERTIFICATION_PASS_VERDICT
    | typeof GENERATION_PIPELINE_CERTIFICATION_FAIL_VERDICT;
  issues: GenerationPipelineCertificationIssue[];
};

export const LEVEL2E_TRACK_ENTRIES: Level2ETrackEntry[] = [
  {
    track_id: 'L2E-001',
    phase: REAL_IMAGE_GENERATION_VALIDATION_PHASE,
    report_path: REAL_IMAGE_GENERATION_VALIDATION_REPORT_PATH,
    pass_verdict: REAL_IMAGE_GENERATION_VALIDATION_PASS_VERDICT,
    status_message: REAL_IMAGE_GENERATION_VALIDATION_STATUS_MESSAGE,
  },
  {
    track_id: 'L2E-002',
    phase: REAL_IMAGE_OUTPUT_AUDIT_PHASE,
    report_path: REAL_IMAGE_OUTPUT_AUDIT_REPORT_PATH,
    pass_verdict: REAL_IMAGE_OUTPUT_AUDIT_PASS_VERDICT,
    status_message: REAL_IMAGE_OUTPUT_AUDIT_STATUS_MESSAGE,
  },
  {
    track_id: 'L2E-003',
    phase: REAL_IMAGE_REQUIRED_GATE_PHASE,
    report_path: REAL_IMAGE_REQUIRED_GATE_REPORT_PATH,
    pass_verdict: REAL_IMAGE_REQUIRED_GATE_PASS_VERDICT,
    status_message: BLOCKED_REAL_IMAGE_REQUIRED_STATUS,
  },
  {
    track_id: 'L2E-004',
    phase: REAL_IMAGE_ARTIFACT_INGESTION_PHASE,
    report_path: REAL_IMAGE_ARTIFACT_INGESTION_REPORT_PATH,
    pass_verdict: REAL_IMAGE_ARTIFACT_INGESTION_PASS_VERDICT,
    status_message: REAL_IMAGE_ARTIFACT_INGESTION_STATUS_MESSAGE,
  },
  {
    track_id: 'L2E-005',
    phase: REAL_IMAGE_QUALITY_GATE_PHASE,
    report_path: REAL_IMAGE_QUALITY_GATE_REPORT_PATH,
    pass_verdict: REAL_IMAGE_QUALITY_GATE_PASS_VERDICT,
    status_message: BLOCKED_REAL_VISUAL_CONTENT_REQUIRED_STATUS,
  },
  {
    track_id: 'L2E-006',
    phase: REAL_VISUAL_CONTENT_INGESTION_PHASE,
    report_path: REAL_VISUAL_CONTENT_INGESTION_REPORT_PATH,
    pass_verdict: REAL_VISUAL_CONTENT_INGESTION_PASS_VERDICT,
    status_message: REAL_VISUAL_CONTENT_INGESTION_STATUS_MESSAGE,
  },
  {
    track_id: 'L2E-007',
    phase: REAL_VISUAL_CONTENT_AUDIT_PHASE,
    report_path: REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH,
    pass_verdict: REAL_VISUAL_CONTENT_AUDIT_PASS_VERDICT,
    status_message: BLOCKED_REAL_SCENE_CONTENT_REQUIRED_STATUS,
  },
  {
    track_id: 'L2E-008',
    phase: REAL_SCENE_CONTENT_INGESTION_PHASE,
    report_path: REAL_SCENE_CONTENT_INGESTION_REPORT_PATH,
    pass_verdict: REAL_SCENE_CONTENT_INGESTION_PASS_VERDICT,
    status_message: REAL_SCENE_CONTENT_INGESTION_STATUS_MESSAGE,
  },
  {
    track_id: 'L2E-009',
    phase: REAL_SCENE_QUALITY_AUDIT_PHASE,
    report_path: REAL_SCENE_QUALITY_AUDIT_REPORT_PATH,
    pass_verdict: REAL_SCENE_QUALITY_AUDIT_PASS_VERDICT,
    status_message: BLOCKED_REAL_SCENE_QUALITY_REQUIRED_STATUS,
  },
  {
    track_id: 'L2E-010',
    phase: REAL_MOVIE_FRAME_INGESTION_PHASE,
    report_path: REAL_MOVIE_FRAME_INGESTION_REPORT_PATH,
    pass_verdict: REAL_MOVIE_FRAME_INGESTION_PASS_VERDICT,
    status_message: REAL_MOVIE_FRAME_INGESTED_STATUS,
  },
  {
    track_id: 'L2E-011',
    phase: DNA_TO_FRAME_VALIDATION_PHASE,
    report_path: DNA_TO_FRAME_VALIDATION_REPORT_PATH,
    pass_verdict: DNA_TO_FRAME_VALIDATION_PASS_VERDICT,
    status_message: DNA_TO_FRAME_VALIDATED_STATUS,
  },
  {
    track_id: 'L2E-012',
    phase: FRAME_CONSISTENCY_VALIDATION_PHASE,
    report_path: FRAME_CONSISTENCY_VALIDATION_REPORT_PATH,
    pass_verdict: FRAME_CONSISTENCY_VALIDATION_PASS_VERDICT,
    status_message: FRAME_CONSISTENCY_VALIDATED_STATUS,
  },
  {
    track_id: 'L2E-013',
    phase: SEQUENCE_COHERENCE_VALIDATION_PHASE,
    report_path: SEQUENCE_COHERENCE_VALIDATION_REPORT_PATH,
    pass_verdict: SEQUENCE_COHERENCE_VALIDATION_PASS_VERDICT,
    status_message: SEQUENCE_COHERENCE_VALIDATED_STATUS,
  },
];

function loadReport<T>(projectRoot: string, reportPath: string): T | null {
  const abs = path.join(projectRoot, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function toStatus(value: boolean): CertificationStatus {
  return value ? 'PASS' : 'FAIL';
}

function auditTrack(projectRoot: string, entry: Level2ETrackEntry): Level2ETrackAudit {
  const report = loadReport<{
    final_verdict?: string;
    certification_status?: string | null;
  }>(projectRoot, entry.report_path);
  const reportExists = report !== null;
  const trackPassed =
    reportExists &&
    report.final_verdict === entry.pass_verdict &&
    report.certification_status === entry.status_message;

  return {
    track_id: entry.track_id,
    phase: entry.phase,
    report_path: entry.report_path,
    report_exists: reportExists,
    track_passed: trackPassed,
  };
}

function buildMarkdown(report: MovieAnalysisGenerationPipelineCertificationReport): string {
  const lines = [
    '# Movie Analysis Generation Pipeline Certification',
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
    '## Certification Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Level 2E Pipeline Chain',
    '',
    'L2E-001 through L2E-013 real image and frame validation tracks',
    '',
    '## Certification Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| dna_to_frame_validated | ${report.dna_to_frame_validated} |`,
    `| frame_consistency_validated | ${report.frame_consistency_validated} |`,
    `| sequence_coherence_validated | ${report.sequence_coherence_validated} |`,
    `| generation_readiness | ${report.generation_readiness} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| cross_source_consistency | ${report.cross_source_consistency} |`,
    `| pipeline_break | ${report.pipeline_break} |`,
    `| certification_failure | ${report.certification_failure} |`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| level2e_track_count | ${report.level2e_track_count} |`,
    `| level2e_tracks_complete | ${report.level2e_tracks_complete} |`,
    `| generation_pipeline_certification_ready | ${report.generation_pipeline_certification_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
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
  issues: GenerationPipelineCertificationIssue[],
  trackAudits: Level2ETrackAudit[] = []
): MovieAnalysisGenerationPipelineCertificationReport {
  const pipelineBreak = trackAudits.some((audit) => !audit.track_passed);
  const report: MovieAnalysisGenerationPipelineCertificationReport = {
    report_id: 'movie-analysis-generation-pipeline-certification-report-v1',
    phase: GENERATION_PIPELINE_CERTIFICATION_PHASE,
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
    source_count: 0,
    adapter_count: 0,
    level2e_track_count: LEVEL2E_TRACK_COUNT,
    level2e_tracks_complete: 'FAIL',
    dna_to_frame_validated: 'FAIL',
    frame_consistency_validated: 'FAIL',
    sequence_coherence_validated: 'FAIL',
    generation_readiness: 'FAIL',
    traceability_preserved: 'FAIL',
    cross_source_consistency: 'FAIL',
    pipeline_break: pipelineBreak,
    certification_failure: true,
    generation_pipeline_certification_ready: 'FAIL',
    planning_only_status: 'FAIL',
    certification_status: null,
    sequence_coherence_validation_report_path: SEQUENCE_COHERENCE_VALIDATION_REPORT_PATH,
    real_movie_frames_manifest_path: REAL_MOVIE_FRAMES_MANIFEST_PATH,
    real_execution_gate_certification_report_path: REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH,
    track_audits: trackAudits,
    final_verdict: GENERATION_PIPELINE_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, GENERATION_PIPELINE_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, GENERATION_PIPELINE_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisGenerationPipelineCertification(
  projectRoot?: string
): MovieAnalysisGenerationPipelineCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: GenerationPipelineCertificationIssue[] = [];
  const timestamp = new Date().toISOString();
  const trackAudits = LEVEL2E_TRACK_ENTRIES.map((entry) => auditTrack(root, entry));

  for (const audit of trackAudits) {
    if (!audit.report_exists) {
      issues.push({
        code: 'LEVEL2E_TRACK_REPORT_MISSING',
        message: `Missing ${audit.report_path}`,
        severity: 'error',
        track_id: audit.track_id,
      });
    } else if (!audit.track_passed) {
      issues.push({
        code: 'PIPELINE_BREAK',
        message: `${audit.track_id} must have PASS verdict and expected status`,
        severity: 'error',
        track_id: audit.track_id,
      });
    }
  }

  const sequenceReport = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    sequence_coherence_validation_ready: CertificationStatus;
    adapter_traceability: CertificationStatus;
    source_count: number;
    adapter_count: number;
  }>(root, SEQUENCE_COHERENCE_VALIDATION_REPORT_PATH);

  const frameConsistencyReport = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    frame_consistency_validation_ready: CertificationStatus;
    adapter_traceability: CertificationStatus;
    dna_consistency: CertificationStatus;
  }>(root, FRAME_CONSISTENCY_VALIDATION_REPORT_PATH);

  const dnaToFrameReport = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    dna_to_frame_validation_ready: CertificationStatus;
    adapter_traceability: CertificationStatus;
  }>(root, DNA_TO_FRAME_VALIDATION_REPORT_PATH);

  const movieFrameReport = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    real_movie_frame_ingestion_ready: CertificationStatus;
    traceability_preserved: CertificationStatus;
    source_count: number;
    adapter_count: number;
  }>(root, REAL_MOVIE_FRAME_INGESTION_REPORT_PATH);

  const executionGateReport = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    real_execution_gate_certification_ready: CertificationStatus;
    traceability_preserved: CertificationStatus;
  }>(root, REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH);

  const manifest = loadReport<RealMovieFramesManifest>(root, REAL_MOVIE_FRAMES_MANIFEST_PATH);

  if (
    !sequenceReport ||
    !frameConsistencyReport ||
    !dnaToFrameReport ||
    !movieFrameReport ||
    !executionGateReport ||
    !manifest
  ) {
    if (!sequenceReport) {
      issues.push({
        code: 'SEQUENCE_COHERENCE_REPORT_MISSING',
        message: `Missing ${SEQUENCE_COHERENCE_VALIDATION_REPORT_PATH}`,
        severity: 'error',
      });
    }
    if (!frameConsistencyReport) {
      issues.push({
        code: 'FRAME_CONSISTENCY_REPORT_MISSING',
        message: `Missing ${FRAME_CONSISTENCY_VALIDATION_REPORT_PATH}`,
        severity: 'error',
      });
    }
    if (!dnaToFrameReport) {
      issues.push({
        code: 'DNA_TO_FRAME_REPORT_MISSING',
        message: `Missing ${DNA_TO_FRAME_VALIDATION_REPORT_PATH}`,
        severity: 'error',
      });
    }
    if (!movieFrameReport) {
      issues.push({
        code: 'MOVIE_FRAME_INGESTION_REPORT_MISSING',
        message: `Missing ${REAL_MOVIE_FRAME_INGESTION_REPORT_PATH}`,
        severity: 'error',
      });
    }
    if (!executionGateReport) {
      issues.push({
        code: 'EXECUTION_GATE_REPORT_MISSING',
        message: `Missing ${REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH}`,
        severity: 'error',
      });
    }
    if (!manifest) {
      issues.push({
        code: 'MOVIE_FRAMES_MANIFEST_MISSING',
        message: `Missing ${REAL_MOVIE_FRAMES_MANIFEST_PATH}`,
        severity: 'error',
      });
    }
    return writeFailReport(root, timestamp, issues, trackAudits);
  }

  const level2eTracksComplete = toStatus(
    trackAudits.length === LEVEL2E_TRACK_COUNT && trackAudits.every((audit) => audit.track_passed)
  );

  const dnaToFrameValidated = toStatus(
    dnaToFrameReport.final_verdict === DNA_TO_FRAME_VALIDATION_PASS_VERDICT &&
      dnaToFrameReport.certification_status === DNA_TO_FRAME_VALIDATED_STATUS &&
      dnaToFrameReport.dna_to_frame_validation_ready === 'PASS' &&
      dnaToFrameReport.adapter_traceability === 'PASS'
  );

  const frameConsistencyValidated = toStatus(
    frameConsistencyReport.final_verdict === FRAME_CONSISTENCY_VALIDATION_PASS_VERDICT &&
      frameConsistencyReport.certification_status === FRAME_CONSISTENCY_VALIDATED_STATUS &&
      frameConsistencyReport.frame_consistency_validation_ready === 'PASS' &&
      frameConsistencyReport.adapter_traceability === 'PASS' &&
      frameConsistencyReport.dna_consistency === 'PASS'
  );

  const sequenceCoherenceValidated = toStatus(
    sequenceReport.final_verdict === SEQUENCE_COHERENCE_VALIDATION_PASS_VERDICT &&
      sequenceReport.certification_status === SEQUENCE_COHERENCE_VALIDATED_STATUS &&
      sequenceReport.sequence_coherence_validation_ready === 'PASS' &&
      sequenceReport.adapter_traceability === 'PASS'
  );

  const uniqueSourceIds = new Set(manifest.entries.map((entry) => entry.source_video_id));
  const uniqueDnaIds = new Set(manifest.entries.map((entry) => entry.cinematic_dna_id));
  const uniqueAdapterSets = new Set(
    manifest.entries.map((entry) => JSON.stringify([...entry.adapter_ids].sort()))
  );

  const manifestTraceable = manifest.entries.every(
    (entry) =>
      entry.real_movie_frame === true &&
      entry.procedural_stub === false &&
      entry.adapter_ids.length === 6 &&
      Boolean(entry.cinematic_dna_id) &&
      Boolean(entry.prompt_hash)
  );

  const crossSourceConsistency = toStatus(
    manifest.source_count === EXPECTED_SOURCE_COUNT &&
      manifest.adapter_count === EXPECTED_ADAPTER_COUNT &&
      manifest.entries.length === EXPECTED_SOURCE_COUNT &&
      uniqueSourceIds.size === EXPECTED_SOURCE_COUNT &&
      uniqueDnaIds.size === EXPECTED_SOURCE_COUNT &&
      uniqueAdapterSets.size === EXPECTED_SOURCE_COUNT &&
      EXPECTED_SOURCE_VIDEO_IDS.every((sourceId) => uniqueSourceIds.has(sourceId)) &&
      manifestTraceable
  );

  const traceabilityPreserved = toStatus(
    movieFrameReport.traceability_preserved === 'PASS' &&
      dnaToFrameReport.adapter_traceability === 'PASS' &&
      frameConsistencyReport.adapter_traceability === 'PASS' &&
      sequenceReport.adapter_traceability === 'PASS' &&
      executionGateReport.traceability_preserved === 'PASS' &&
      manifestTraceable
  );

  const generationReadiness = toStatus(
    movieFrameReport.final_verdict === REAL_MOVIE_FRAME_INGESTION_PASS_VERDICT &&
      movieFrameReport.certification_status === REAL_MOVIE_FRAME_INGESTED_STATUS &&
      movieFrameReport.real_movie_frame_ingestion_ready === 'PASS' &&
      executionGateReport.final_verdict === REAL_EXECUTION_GATE_CERTIFICATION_PASS_VERDICT &&
      executionGateReport.certification_status === REAL_EXECUTION_GATE_CERTIFICATION_STATUS_MESSAGE &&
      executionGateReport.real_execution_gate_certification_ready === 'PASS' &&
      level2eTracksComplete === 'PASS'
  );

  const pipelineBreak = level2eTracksComplete === 'FAIL';

  const gateChecks: CertificationStatus[] = [
    dnaToFrameValidated,
    frameConsistencyValidated,
    sequenceCoherenceValidated,
    generationReadiness,
    traceabilityPreserved,
    crossSourceConsistency,
  ];

  const generationPipelineCertificationReady =
    level2eTracksComplete === 'PASS' &&
    gateChecks.every((status) => status === 'PASS') &&
    !pipelineBreak &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = generationPipelineCertificationReady === 'PASS';
  const certificationFailure = !pass;

  if (certificationFailure && !issues.some((issue) => issue.code === 'CERTIFICATION_FAILURE')) {
    issues.push({
      code: 'CERTIFICATION_FAILURE',
      message: 'Generation pipeline certification is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisGenerationPipelineCertificationReport = {
    report_id: 'movie-analysis-generation-pipeline-certification-report-v1',
    phase: GENERATION_PIPELINE_CERTIFICATION_PHASE,
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
    source_count: manifest.source_count,
    adapter_count: manifest.adapter_count,
    level2e_track_count: LEVEL2E_TRACK_COUNT,
    level2e_tracks_complete: level2eTracksComplete,
    dna_to_frame_validated: dnaToFrameValidated,
    frame_consistency_validated: frameConsistencyValidated,
    sequence_coherence_validated: sequenceCoherenceValidated,
    generation_readiness: generationReadiness,
    traceability_preserved: traceabilityPreserved,
    cross_source_consistency: crossSourceConsistency,
    pipeline_break: pipelineBreak,
    certification_failure: certificationFailure,
    generation_pipeline_certification_ready: generationPipelineCertificationReady,
    planning_only_status: 'PASS',
    certification_status: pass ? GENERATION_PIPELINE_CERTIFIED_STATUS : null,
    sequence_coherence_validation_report_path: SEQUENCE_COHERENCE_VALIDATION_REPORT_PATH,
    real_movie_frames_manifest_path: REAL_MOVIE_FRAMES_MANIFEST_PATH,
    real_execution_gate_certification_report_path: REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH,
    track_audits: trackAudits,
    final_verdict: pass
      ? GENERATION_PIPELINE_CERTIFICATION_PASS_VERDICT
      : GENERATION_PIPELINE_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, GENERATION_PIPELINE_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, GENERATION_PIPELINE_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
