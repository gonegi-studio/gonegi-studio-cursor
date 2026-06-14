import fs from 'node:fs';
import path from 'node:path';
import {
  CINEMATIC_DNA_FAIL_VERDICT,
  CINEMATIC_DNA_MD_PATH,
  CINEMATIC_DNA_PASS_VERDICT,
  CINEMATIC_DNA_PATH,
  CINEMATIC_DNA_PHASE,
  CINEMATIC_DNA_REPORT_PATH,
  CINEMATIC_DNA_SCHEMA_PATH,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_SOURCE_VIDEO_IDS,
  type CinematicDnaEntry,
  type MovieAnalysisCinematicDna,
  loadMovieAnalysisCinematicDna,
} from './movieAnalysisCinematicDnaExtraction.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export type ValidationStatus = 'PASS' | 'FAIL';

export type CinematicDnaValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceCinematicDnaAudit = {
  source_video_id: string;
  scene_dna: ValidationStatus;
  camera_dna: ValidationStatus;
  emotion_dna: ValidationStatus;
  transition_dna: ValidationStatus;
  continuity_dna: ValidationStatus;
  storytelling_dna: ValidationStatus;
  entry_complete: ValidationStatus;
};

export type MovieAnalysisCinematicDnaReport = {
  report_id: string;
  phase: typeof CINEMATIC_DNA_PHASE;
  timestamp: string;
  planning_only: true;
  dna_extraction_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  no_generation: true;
  source_count: number;
  cinematic_dna_path: typeof CINEMATIC_DNA_PATH;
  schema_path: typeof CINEMATIC_DNA_SCHEMA_PATH;
  scene_dna: ValidationStatus;
  camera_dna: ValidationStatus;
  emotion_dna: ValidationStatus;
  transition_dna: ValidationStatus;
  continuity_dna: ValidationStatus;
  storytelling_dna: ValidationStatus;
  cinematic_dna_complete: ValidationStatus;
  planning_only_status: ValidationStatus;
  source_audits: SourceCinematicDnaAudit[];
  final_verdict: typeof CINEMATIC_DNA_PASS_VERDICT | typeof CINEMATIC_DNA_FAIL_VERDICT;
  issues: CinematicDnaValidationIssue[];
};

function isEntrySafetyValid(entry: CinematicDnaEntry): boolean {
  return (
    entry.safety.planning_only === true &&
    entry.safety.dna_extraction_only === true &&
    entry.safety.runtime_execution === false &&
    entry.safety.video_generation === false &&
    entry.safety.image_generation === false &&
    entry.safety.gpu_execution === false &&
    entry.safety.external_call_allowed === false
  );
}

function auditEntry(entry: CinematicDnaEntry): SourceCinematicDnaAudit {
  const sceneDna = entry.scene_patterns.length > 0 ? 'PASS' : 'FAIL';
  const cameraDna = entry.camera_patterns.length > 0 ? 'PASS' : 'FAIL';
  const emotionDna = entry.emotion_patterns.length > 0 ? 'PASS' : 'FAIL';
  const transitionDna = entry.transition_patterns.length > 0 ? 'PASS' : 'FAIL';
  const continuityDna = entry.continuity_patterns.length > 0 ? 'PASS' : 'FAIL';
  const storytellingDna = entry.storytelling_patterns.length > 0 ? 'PASS' : 'FAIL';

  const entryComplete =
    sceneDna === 'PASS' &&
    cameraDna === 'PASS' &&
    emotionDna === 'PASS' &&
    transitionDna === 'PASS' &&
    continuityDna === 'PASS' &&
    storytellingDna === 'PASS' &&
    Boolean(entry.cinematic_dna_id) &&
    entry.strength_score > 0 &&
    entry.reusability_score > 0 &&
    entry.image_app_usage.emotion_dna_enabled &&
    entry.video_app_usage.scene_dna_enabled &&
    entry.video_app_usage.storytelling_dna_enabled &&
    isEntrySafetyValid(entry)
      ? 'PASS'
      : 'FAIL';

  return {
    source_video_id: entry.source_video_id,
    scene_dna: sceneDna,
    camera_dna: cameraDna,
    emotion_dna: emotionDna,
    transition_dna: transitionDna,
    continuity_dna: continuityDna,
    storytelling_dna: storytellingDna,
    entry_complete: entryComplete,
  };
}

function buildMarkdown(report: MovieAnalysisCinematicDnaReport): string {
  const lines = [
    '# Movie Analysis Cinematic DNA Extraction',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Pipeline Bridge',
    '',
    'Movie Analysis Dataset → Cinematic DNA Extraction → Reusable Production Knowledge Layer',
    '',
    'This becomes the first direct bridge from source-video analysis into future Image App and Video App generation quality improvements.',
    '',
    '## Extraction Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| dna_extraction_only | ${report.dna_extraction_only} |`,
    `| runtime_execution | ${report.runtime_execution} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    `| no_generation | ${report.no_generation} |`,
    '',
    '## DNA Validation Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| scene_dna | ${report.scene_dna} |`,
    `| camera_dna | ${report.camera_dna} |`,
    `| emotion_dna | ${report.emotion_dna} |`,
    `| transition_dna | ${report.transition_dna} |`,
    `| continuity_dna | ${report.continuity_dna} |`,
    `| storytelling_dna | ${report.storytelling_dna} |`,
    `| cinematic_dna_complete | ${report.cinematic_dna_complete} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- scene_dna: ${audit.scene_dna}`,
      `- camera_dna: ${audit.camera_dna}`,
      `- emotion_dna: ${audit.emotion_dna}`,
      `- transition_dna: ${audit.transition_dna}`,
      `- continuity_dna: ${audit.continuity_dna}`,
      `- storytelling_dna: ${audit.storytelling_dna}`,
      `- entry_complete: ${audit.entry_complete}`,
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

export function writeMovieAnalysisCinematicDnaValidationReport(
  projectRoot?: string
): MovieAnalysisCinematicDnaReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: CinematicDnaValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  if (!fs.existsSync(path.join(root, CINEMATIC_DNA_SCHEMA_PATH))) {
    issues.push({
      code: 'SCHEMA_MISSING',
      message: `Missing ${CINEMATIC_DNA_SCHEMA_PATH}`,
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

  if (cinematicDna && cinematicDna.source_count !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  const sourceAudits: SourceCinematicDnaAudit[] = [];
  if (cinematicDna) {
    const entryIds = cinematicDna.entries.map((entry) => entry.source_video_id).sort();
    const expectedIds = [...EXPECTED_SOURCE_VIDEO_IDS].sort();
    if (entryIds.join(',') !== expectedIds.join(',')) {
      issues.push({
        code: 'SOURCE_VIDEO_IDS_MISMATCH',
        message: `Expected sources: ${expectedIds.join(', ')}`,
        severity: 'error',
      });
    }

    for (const entry of cinematicDna.entries) {
      const audit = auditEntry(entry);
      sourceAudits.push(audit);

      if (audit.scene_dna === 'FAIL') {
        issues.push({
          code: 'SCENE_DNA_MISSING',
          message: `scene_dna missing for ${entry.source_video_id}`,
          severity: 'error',
          source_video_id: entry.source_video_id,
        });
      }
      if (audit.camera_dna === 'FAIL') {
        issues.push({
          code: 'CAMERA_DNA_MISSING',
          message: `camera_dna missing for ${entry.source_video_id}`,
          severity: 'error',
          source_video_id: entry.source_video_id,
        });
      }
      if (audit.emotion_dna === 'FAIL') {
        issues.push({
          code: 'EMOTION_DNA_MISSING',
          message: `emotion_dna missing for ${entry.source_video_id}`,
          severity: 'error',
          source_video_id: entry.source_video_id,
        });
      }
      if (audit.transition_dna === 'FAIL') {
        issues.push({
          code: 'TRANSITION_DNA_MISSING',
          message: `transition_dna missing for ${entry.source_video_id}`,
          severity: 'error',
          source_video_id: entry.source_video_id,
        });
      }
      if (audit.continuity_dna === 'FAIL') {
        issues.push({
          code: 'CONTINUITY_DNA_MISSING',
          message: `continuity_dna missing for ${entry.source_video_id}`,
          severity: 'error',
          source_video_id: entry.source_video_id,
        });
      }
      if (audit.storytelling_dna === 'FAIL') {
        issues.push({
          code: 'STORYTELLING_DNA_MISSING',
          message: `storytelling_dna missing for ${entry.source_video_id}`,
          severity: 'error',
          source_video_id: entry.source_video_id,
        });
      }
      if (!isEntrySafetyValid(entry)) {
        issues.push({
          code: 'ENTRY_SAFETY_INVALID',
          message: `Safety flags invalid for ${entry.source_video_id}`,
          severity: 'error',
          source_video_id: entry.source_video_id,
        });
      }
    }
  }

  const sceneDna =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.scene_dna === 'PASS')
      ? 'PASS'
      : 'FAIL';
  const cameraDna =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.camera_dna === 'PASS')
      ? 'PASS'
      : 'FAIL';
  const emotionDna =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.emotion_dna === 'PASS')
      ? 'PASS'
      : 'FAIL';
  const transitionDna =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.transition_dna === 'PASS')
      ? 'PASS'
      : 'FAIL';
  const continuityDna =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.continuity_dna === 'PASS')
      ? 'PASS'
      : 'FAIL';
  const storytellingDna =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.storytelling_dna === 'PASS')
      ? 'PASS'
      : 'FAIL';

  const safetySummaryValid =
    cinematicDna?.safety_summary.planning_only === true &&
    cinematicDna.safety_summary.dna_extraction_only === true &&
    cinematicDna.safety_summary.runtime_execution === false &&
    cinematicDna.safety_summary.video_generation === false &&
    cinematicDna.safety_summary.image_generation === false &&
    cinematicDna.safety_summary.gpu_execution === false &&
    cinematicDna.safety_summary.external_call_allowed === false;

  if (cinematicDna && !safetySummaryValid) {
    issues.push({
      code: 'SAFETY_SUMMARY_INVALID',
      message: 'Cinematic DNA safety_summary validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: ValidationStatus = safetySummaryValid ? 'PASS' : 'FAIL';

  const cinematicDnaComplete =
    sceneDna === 'PASS' &&
    cameraDna === 'PASS' &&
    emotionDna === 'PASS' &&
    transitionDna === 'PASS' &&
    continuityDna === 'PASS' &&
    storytellingDna === 'PASS' &&
    sourceAudits.every((audit) => audit.entry_complete === 'PASS') &&
    planningOnlyStatus === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const pass =
    cinematicDna !== null &&
    cinematicDna.source_count === EXPECTED_SOURCE_COUNT &&
    sceneDna === 'PASS' &&
    cameraDna === 'PASS' &&
    emotionDna === 'PASS' &&
    transitionDna === 'PASS' &&
    continuityDna === 'PASS' &&
    storytellingDna === 'PASS' &&
    cinematicDnaComplete === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieAnalysisCinematicDnaReport = {
    report_id: 'movie-analysis-cinematic-dna-report-v1',
    phase: CINEMATIC_DNA_PHASE,
    timestamp,
    planning_only: true,
    dna_extraction_only: true,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    no_generation: true,
    source_count: cinematicDna?.source_count ?? 0,
    cinematic_dna_path: CINEMATIC_DNA_PATH,
    schema_path: CINEMATIC_DNA_SCHEMA_PATH,
    scene_dna: sceneDna,
    camera_dna: cameraDna,
    emotion_dna: emotionDna,
    transition_dna: transitionDna,
    continuity_dna: continuityDna,
    storytelling_dna: storytellingDna,
    cinematic_dna_complete: cinematicDnaComplete,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass ? CINEMATIC_DNA_PASS_VERDICT : CINEMATIC_DNA_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, CINEMATIC_DNA_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, CINEMATIC_DNA_MD_PATH), `${buildMarkdown(report)}\n`, 'utf8');

  return report;
}
