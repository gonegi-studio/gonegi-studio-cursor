import fs from 'node:fs';
import path from 'node:path';
import {
  CINEMATIC_DNA_INTEGRATION_FAIL_VERDICT,
  CINEMATIC_DNA_INTEGRATION_MD_PATH,
  CINEMATIC_DNA_INTEGRATION_PASS_VERDICT,
  CINEMATIC_DNA_INTEGRATION_PATH,
  CINEMATIC_DNA_INTEGRATION_PHASE,
  CINEMATIC_DNA_INTEGRATION_REPORT_PATH,
  CINEMATIC_DNA_INTEGRATION_SCHEMA_PATH,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_SOURCE_VIDEO_IDS,
  type CinematicDnaIntegrationEntry,
  type MovieAnalysisCinematicDnaIntegration,
  loadMovieAnalysisCinematicDnaIntegration,
} from './movieAnalysisCinematicDnaIntegration.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export type ValidationStatus = 'PASS' | 'FAIL';

export type CinematicDnaIntegrationValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceIntegrationAudit = {
  source_video_id: string;
  scene_mapping: ValidationStatus;
  camera_mapping: ValidationStatus;
  emotion_mapping: ValidationStatus;
  transition_mapping: ValidationStatus;
  continuity_mapping: ValidationStatus;
  image_app_mapping: ValidationStatus;
  video_app_mapping: ValidationStatus;
  entry_complete: ValidationStatus;
};

export type MovieAnalysisCinematicDnaIntegrationReport = {
  report_id: string;
  phase: typeof CINEMATIC_DNA_INTEGRATION_PHASE;
  timestamp: string;
  planning_only: true;
  integration_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  no_generation: true;
  source_count: number;
  integration_path: typeof CINEMATIC_DNA_INTEGRATION_PATH;
  schema_path: typeof CINEMATIC_DNA_INTEGRATION_SCHEMA_PATH;
  scene_mapping: ValidationStatus;
  camera_mapping: ValidationStatus;
  emotion_mapping: ValidationStatus;
  transition_mapping: ValidationStatus;
  continuity_mapping: ValidationStatus;
  image_app_mapping: ValidationStatus;
  video_app_mapping: ValidationStatus;
  integration_complete: ValidationStatus;
  planning_only_status: ValidationStatus;
  source_audits: SourceIntegrationAudit[];
  final_verdict:
    | typeof CINEMATIC_DNA_INTEGRATION_PASS_VERDICT
    | typeof CINEMATIC_DNA_INTEGRATION_FAIL_VERDICT;
  issues: CinematicDnaIntegrationValidationIssue[];
};

function isEntrySafetyValid(entry: CinematicDnaIntegrationEntry): boolean {
  return (
    entry.safety.planning_only === true &&
    entry.safety.integration_only === true &&
    entry.safety.runtime_execution === false &&
    entry.safety.video_generation === false &&
    entry.safety.image_generation === false &&
    entry.safety.gpu_execution === false &&
    entry.safety.external_call_allowed === false
  );
}

function isMappingValid(
  mapping: CinematicDnaIntegrationEntry['scene_dna_mapping'],
  expectedAdapter: string
): boolean {
  return (
    mapping.adapter_target === expectedAdapter &&
    mapping.mapping_ready === true &&
    mapping.integration_only === true &&
    mapping.pattern_count > 0 &&
    mapping.pattern_ids.length > 0 &&
    mapping.pattern_signatures.length > 0 &&
    Boolean(mapping.cinematic_dna_id)
  );
}

function auditEntry(entry: CinematicDnaIntegrationEntry): SourceIntegrationAudit {
  const sceneMapping = isMappingValid(entry.scene_dna_mapping, 'scene_generation_adapter')
    ? 'PASS'
    : 'FAIL';
  const cameraMapping = isMappingValid(entry.camera_dna_mapping, 'camera_generation_adapter')
    ? 'PASS'
    : 'FAIL';
  const emotionMapping = isMappingValid(entry.emotion_dna_mapping, 'emotion_generation_adapter')
    ? 'PASS'
    : 'FAIL';
  const transitionMapping = isMappingValid(
    entry.transition_dna_mapping,
    'transition_generation_adapter'
  )
    ? 'PASS'
    : 'FAIL';
  const continuityMapping = isMappingValid(
    entry.continuity_dna_mapping,
    'continuity_generation_adapter'
  )
    ? 'PASS'
    : 'FAIL';

  const imageAppMapping =
    entry.image_app_usage_mapping.consumer_target === 'image_app' &&
    entry.image_app_usage_mapping.integration_ready === true &&
    entry.image_app_usage_mapping.emotion_generation_adapter === true
      ? 'PASS'
      : 'FAIL';

  const videoAppMapping =
    entry.video_app_usage_mapping.consumer_target === 'video_app' &&
    entry.video_app_usage_mapping.integration_ready === true &&
    entry.video_app_usage_mapping.scene_generation_adapter === true &&
    entry.video_app_usage_mapping.camera_generation_adapter === true &&
    entry.video_app_usage_mapping.transition_generation_adapter === true &&
    entry.video_app_usage_mapping.continuity_generation_adapter === true
      ? 'PASS'
      : 'FAIL';

  const entryComplete =
    sceneMapping === 'PASS' &&
    cameraMapping === 'PASS' &&
    emotionMapping === 'PASS' &&
    transitionMapping === 'PASS' &&
    continuityMapping === 'PASS' &&
    imageAppMapping === 'PASS' &&
    videoAppMapping === 'PASS' &&
    entry.integration_readiness === 'READY' &&
    entry.reusability_score > 0 &&
    isEntrySafetyValid(entry)
      ? 'PASS'
      : 'FAIL';

  return {
    source_video_id: entry.source_video_id,
    scene_mapping: sceneMapping,
    camera_mapping: cameraMapping,
    emotion_mapping: emotionMapping,
    transition_mapping: transitionMapping,
    continuity_mapping: continuityMapping,
    image_app_mapping: imageAppMapping,
    video_app_mapping: videoAppMapping,
    entry_complete: entryComplete,
  };
}

function buildMarkdown(report: MovieAnalysisCinematicDnaIntegrationReport): string {
  const lines = [
    '# Movie Analysis Cinematic DNA Integration',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Integration Pipeline',
    '',
    '```',
    'Movie Analysis Dataset',
    '↓',
    'Cinematic DNA',
    '↓',
    'Integration Layer',
    '↓',
    'Future Image App Adapter',
    '↓',
    'Future Video App Adapter',
    '```',
    '',
    '## Integration Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| integration_only | ${report.integration_only} |`,
    `| runtime_execution | ${report.runtime_execution} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    `| no_generation | ${report.no_generation} |`,
    '',
    '## Integration Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| scene_mapping | ${report.scene_mapping} |`,
    `| camera_mapping | ${report.camera_mapping} |`,
    `| emotion_mapping | ${report.emotion_mapping} |`,
    `| transition_mapping | ${report.transition_mapping} |`,
    `| continuity_mapping | ${report.continuity_mapping} |`,
    `| image_app_mapping | ${report.image_app_mapping} |`,
    `| video_app_mapping | ${report.video_app_mapping} |`,
    `| integration_complete | ${report.integration_complete} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- scene_mapping: ${audit.scene_mapping}`,
      `- camera_mapping: ${audit.camera_mapping}`,
      `- emotion_mapping: ${audit.emotion_mapping}`,
      `- transition_mapping: ${audit.transition_mapping}`,
      `- continuity_mapping: ${audit.continuity_mapping}`,
      `- image_app_mapping: ${audit.image_app_mapping}`,
      `- video_app_mapping: ${audit.video_app_mapping}`,
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

export function writeMovieAnalysisCinematicDnaIntegrationValidationReport(
  projectRoot?: string
): MovieAnalysisCinematicDnaIntegrationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: CinematicDnaIntegrationValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  if (!fs.existsSync(path.join(root, CINEMATIC_DNA_INTEGRATION_SCHEMA_PATH))) {
    issues.push({
      code: 'SCHEMA_MISSING',
      message: `Missing ${CINEMATIC_DNA_INTEGRATION_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  const integration = loadMovieAnalysisCinematicDnaIntegration(root);
  if (!integration) {
    issues.push({
      code: 'INTEGRATION_MISSING',
      message: `Missing ${CINEMATIC_DNA_INTEGRATION_PATH}`,
      severity: 'error',
    });
  }

  if (integration && integration.source_count !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  const sourceAudits: SourceIntegrationAudit[] = [];
  if (integration) {
    const entryIds = integration.entries.map((entry) => entry.source_video_id).sort();
    const expectedIds = [...EXPECTED_SOURCE_VIDEO_IDS].sort();
    if (entryIds.join(',') !== expectedIds.join(',')) {
      issues.push({
        code: 'SOURCE_VIDEO_IDS_MISMATCH',
        message: `Expected sources: ${expectedIds.join(', ')}`,
        severity: 'error',
      });
    }

    for (const entry of integration.entries) {
      const audit = auditEntry(entry);
      sourceAudits.push(audit);

      if (audit.scene_mapping === 'FAIL') {
        issues.push({
          code: 'SCENE_MAPPING_FAIL',
          message: `scene_mapping failed for ${entry.source_video_id}`,
          severity: 'error',
          source_video_id: entry.source_video_id,
        });
      }
      if (audit.camera_mapping === 'FAIL') {
        issues.push({
          code: 'CAMERA_MAPPING_FAIL',
          message: `camera_mapping failed for ${entry.source_video_id}`,
          severity: 'error',
          source_video_id: entry.source_video_id,
        });
      }
      if (audit.emotion_mapping === 'FAIL') {
        issues.push({
          code: 'EMOTION_MAPPING_FAIL',
          message: `emotion_mapping failed for ${entry.source_video_id}`,
          severity: 'error',
          source_video_id: entry.source_video_id,
        });
      }
      if (audit.transition_mapping === 'FAIL') {
        issues.push({
          code: 'TRANSITION_MAPPING_FAIL',
          message: `transition_mapping failed for ${entry.source_video_id}`,
          severity: 'error',
          source_video_id: entry.source_video_id,
        });
      }
      if (audit.continuity_mapping === 'FAIL') {
        issues.push({
          code: 'CONTINUITY_MAPPING_FAIL',
          message: `continuity_mapping failed for ${entry.source_video_id}`,
          severity: 'error',
          source_video_id: entry.source_video_id,
        });
      }
      if (audit.image_app_mapping === 'FAIL') {
        issues.push({
          code: 'IMAGE_APP_MAPPING_FAIL',
          message: `image_app_mapping failed for ${entry.source_video_id}`,
          severity: 'error',
          source_video_id: entry.source_video_id,
        });
      }
      if (audit.video_app_mapping === 'FAIL') {
        issues.push({
          code: 'VIDEO_APP_MAPPING_FAIL',
          message: `video_app_mapping failed for ${entry.source_video_id}`,
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

  const sceneMapping =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.scene_mapping === 'PASS')
      ? 'PASS'
      : 'FAIL';
  const cameraMapping =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.camera_mapping === 'PASS')
      ? 'PASS'
      : 'FAIL';
  const emotionMapping =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.emotion_mapping === 'PASS')
      ? 'PASS'
      : 'FAIL';
  const transitionMapping =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.transition_mapping === 'PASS')
      ? 'PASS'
      : 'FAIL';
  const continuityMapping =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.continuity_mapping === 'PASS')
      ? 'PASS'
      : 'FAIL';
  const imageAppMapping =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.image_app_mapping === 'PASS')
      ? 'PASS'
      : 'FAIL';
  const videoAppMapping =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.video_app_mapping === 'PASS')
      ? 'PASS'
      : 'FAIL';

  const safetySummaryValid =
    integration?.safety_summary.planning_only === true &&
    integration.safety_summary.integration_only === true &&
    integration.safety_summary.runtime_execution === false &&
    integration.safety_summary.video_generation === false &&
    integration.safety_summary.image_generation === false &&
    integration.safety_summary.gpu_execution === false &&
    integration.safety_summary.external_call_allowed === false;

  if (integration && !safetySummaryValid) {
    issues.push({
      code: 'SAFETY_SUMMARY_INVALID',
      message: 'Integration safety_summary validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: ValidationStatus = safetySummaryValid ? 'PASS' : 'FAIL';

  const integrationComplete =
    sceneMapping === 'PASS' &&
    cameraMapping === 'PASS' &&
    emotionMapping === 'PASS' &&
    transitionMapping === 'PASS' &&
    continuityMapping === 'PASS' &&
    imageAppMapping === 'PASS' &&
    videoAppMapping === 'PASS' &&
    sourceAudits.every((audit) => audit.entry_complete === 'PASS') &&
    planningOnlyStatus === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const pass =
    integration !== null &&
    integration.source_count === EXPECTED_SOURCE_COUNT &&
    sceneMapping === 'PASS' &&
    cameraMapping === 'PASS' &&
    emotionMapping === 'PASS' &&
    transitionMapping === 'PASS' &&
    continuityMapping === 'PASS' &&
    imageAppMapping === 'PASS' &&
    videoAppMapping === 'PASS' &&
    integrationComplete === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieAnalysisCinematicDnaIntegrationReport = {
    report_id: 'movie-analysis-cinematic-dna-integration-report-v1',
    phase: CINEMATIC_DNA_INTEGRATION_PHASE,
    timestamp,
    planning_only: true,
    integration_only: true,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    no_generation: true,
    source_count: integration?.source_count ?? 0,
    integration_path: CINEMATIC_DNA_INTEGRATION_PATH,
    schema_path: CINEMATIC_DNA_INTEGRATION_SCHEMA_PATH,
    scene_mapping: sceneMapping,
    camera_mapping: cameraMapping,
    emotion_mapping: emotionMapping,
    transition_mapping: transitionMapping,
    continuity_mapping: continuityMapping,
    image_app_mapping: imageAppMapping,
    video_app_mapping: videoAppMapping,
    integration_complete: integrationComplete,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass
      ? CINEMATIC_DNA_INTEGRATION_PASS_VERDICT
      : CINEMATIC_DNA_INTEGRATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, CINEMATIC_DNA_INTEGRATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, CINEMATIC_DNA_INTEGRATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
