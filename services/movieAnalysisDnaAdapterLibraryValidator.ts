import fs from 'node:fs';
import path from 'node:path';
import {
  DNA_ADAPTER_LIBRARY_FAIL_VERDICT,
  DNA_ADAPTER_LIBRARY_MD_PATH,
  DNA_ADAPTER_LIBRARY_PASS_VERDICT,
  DNA_ADAPTER_LIBRARY_PATH,
  DNA_ADAPTER_LIBRARY_PHASE,
  DNA_ADAPTER_LIBRARY_REPORT_PATH,
  DNA_ADAPTER_LIBRARY_SCHEMA_PATH,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_SOURCE_VIDEO_IDS,
  type DnaAdapterDefinition,
  type DnaAdapterLibraryEntry,
  type MovieAnalysisDnaAdapterLibrary,
  loadMovieAnalysisDnaAdapterLibrary,
} from './movieAnalysisDnaAdapterLibrary.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export type ValidationStatus = 'PASS' | 'FAIL';

export type AdapterLibraryValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceAdapterLibraryAudit = {
  source_video_id: string;
  scene_adapter_complete: ValidationStatus;
  camera_adapter_complete: ValidationStatus;
  emotion_adapter_complete: ValidationStatus;
  transition_adapter_complete: ValidationStatus;
  continuity_adapter_complete: ValidationStatus;
  storytelling_adapter_complete: ValidationStatus;
  image_mapping_valid: ValidationStatus;
  video_mapping_valid: ValidationStatus;
  entry_complete: ValidationStatus;
};

export type MovieAnalysisDnaAdapterLibraryReport = {
  report_id: string;
  phase: typeof DNA_ADAPTER_LIBRARY_PHASE;
  timestamp: string;
  planning_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  no_generation: true;
  source_count: number;
  adapter_library_path: typeof DNA_ADAPTER_LIBRARY_PATH;
  schema_path: typeof DNA_ADAPTER_LIBRARY_SCHEMA_PATH;
  scene_adapter_complete: ValidationStatus;
  camera_adapter_complete: ValidationStatus;
  emotion_adapter_complete: ValidationStatus;
  transition_adapter_complete: ValidationStatus;
  continuity_adapter_complete: ValidationStatus;
  storytelling_adapter_complete: ValidationStatus;
  image_mapping_valid: ValidationStatus;
  video_mapping_valid: ValidationStatus;
  adapter_library_ready: ValidationStatus;
  planning_only_status: ValidationStatus;
  ready_for_image_app_integration: boolean;
  ready_for_video_app_integration: boolean;
  source_audits: SourceAdapterLibraryAudit[];
  final_verdict: typeof DNA_ADAPTER_LIBRARY_PASS_VERDICT | typeof DNA_ADAPTER_LIBRARY_FAIL_VERDICT;
  issues: AdapterLibraryValidationIssue[];
};

function isAdapterComplete(
  adapter: DnaAdapterDefinition,
  expectedType: DnaAdapterDefinition['adapter_type']
): boolean {
  return (
    adapter.adapter_type === expectedType &&
    adapter.adapter_ready === true &&
    adapter.library_only === true &&
    adapter.pattern_count > 0 &&
    adapter.pattern_ids.length > 0 &&
    adapter.pattern_signatures.length > 0 &&
    Boolean(adapter.cinematic_dna_id) &&
    Boolean(adapter.adapter_id)
  );
}

function isEntrySafetyValid(entry: DnaAdapterLibraryEntry): boolean {
  return (
    entry.safety.planning_only === true &&
    entry.safety.runtime_execution === false &&
    entry.safety.video_generation === false &&
    entry.safety.image_generation === false &&
    entry.safety.gpu_execution === false &&
    entry.safety.external_call_allowed === false
  );
}

function auditEntry(entry: DnaAdapterLibraryEntry): SourceAdapterLibraryAudit {
  const sceneAdapterComplete = isAdapterComplete(entry.scene_adapter, 'scene_adapter')
    ? 'PASS'
    : 'FAIL';
  const cameraAdapterComplete = isAdapterComplete(entry.camera_adapter, 'camera_adapter')
    ? 'PASS'
    : 'FAIL';
  const emotionAdapterComplete = isAdapterComplete(entry.emotion_adapter, 'emotion_adapter')
    ? 'PASS'
    : 'FAIL';
  const transitionAdapterComplete = isAdapterComplete(
    entry.transition_adapter,
    'transition_adapter'
  )
    ? 'PASS'
    : 'FAIL';
  const continuityAdapterComplete = isAdapterComplete(
    entry.continuity_adapter,
    'continuity_adapter'
  )
    ? 'PASS'
    : 'FAIL';
  const storytellingAdapterComplete = isAdapterComplete(
    entry.storytelling_adapter,
    'storytelling_adapter'
  )
    ? 'PASS'
    : 'FAIL';

  const imageMappingValid =
    entry.image_adapter_mapping.consumer_target === 'image_app' &&
    entry.image_adapter_mapping.adapter_ready === true &&
    entry.image_adapter_mapping.emotion_adapter === true
      ? 'PASS'
      : 'FAIL';

  const videoMappingValid =
    entry.video_adapter_mapping.consumer_target === 'video_app' &&
    entry.video_adapter_mapping.adapter_ready === true &&
    entry.video_adapter_mapping.scene_adapter === true &&
    entry.video_adapter_mapping.camera_adapter === true &&
    entry.video_adapter_mapping.transition_adapter === true &&
    entry.video_adapter_mapping.continuity_adapter === true &&
    entry.video_adapter_mapping.storytelling_adapter === true
      ? 'PASS'
      : 'FAIL';

  const entryComplete =
    sceneAdapterComplete === 'PASS' &&
    cameraAdapterComplete === 'PASS' &&
    emotionAdapterComplete === 'PASS' &&
    transitionAdapterComplete === 'PASS' &&
    continuityAdapterComplete === 'PASS' &&
    storytellingAdapterComplete === 'PASS' &&
    imageMappingValid === 'PASS' &&
    videoMappingValid === 'PASS' &&
    entry.library_readiness === 'READY' &&
    entry.reusability_score > 0 &&
    isEntrySafetyValid(entry)
      ? 'PASS'
      : 'FAIL';

  return {
    source_video_id: entry.source_video_id,
    scene_adapter_complete: sceneAdapterComplete,
    camera_adapter_complete: cameraAdapterComplete,
    emotion_adapter_complete: emotionAdapterComplete,
    transition_adapter_complete: transitionAdapterComplete,
    continuity_adapter_complete: continuityAdapterComplete,
    storytelling_adapter_complete: storytellingAdapterComplete,
    image_mapping_valid: imageMappingValid,
    video_mapping_valid: videoMappingValid,
    entry_complete: entryComplete,
  };
}

function aggregateStatus(
  audits: SourceAdapterLibraryAudit[],
  field: keyof SourceAdapterLibraryAudit
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisDnaAdapterLibraryReport): string {
  const lines = [
    '# Movie Analysis DNA Adapter Library',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Adapter Library Pipeline',
    '',
    '```',
    'Movie Analysis Dataset',
    '→ Cinematic DNA',
    '→ DNA Integration',
    '→ DNA Quality Gate',
    '→ Certified DNA Library',
    '→ DNA Adapter Library',
    '```',
    '',
    '## Safety Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| runtime_execution | ${report.runtime_execution} |`,
    `| image_generation | ${report.image_generation} |`,
    `| video_generation | ${report.video_generation} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    `| no_generation | ${report.no_generation} |`,
    '',
    '## Validation Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| scene_adapter_complete | ${report.scene_adapter_complete} |`,
    `| camera_adapter_complete | ${report.camera_adapter_complete} |`,
    `| emotion_adapter_complete | ${report.emotion_adapter_complete} |`,
    `| transition_adapter_complete | ${report.transition_adapter_complete} |`,
    `| continuity_adapter_complete | ${report.continuity_adapter_complete} |`,
    `| storytelling_adapter_complete | ${report.storytelling_adapter_complete} |`,
    `| image_mapping_valid | ${report.image_mapping_valid} |`,
    `| video_mapping_valid | ${report.video_mapping_valid} |`,
    `| adapter_library_ready | ${report.adapter_library_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Readiness',
    '',
    `- Ready for future Image App integration: ${report.ready_for_image_app_integration}`,
    `- Ready for future Video App integration: ${report.ready_for_video_app_integration}`,
    '- No generation performed.',
    '',
    '## Source Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- scene_adapter_complete: ${audit.scene_adapter_complete}`,
      `- camera_adapter_complete: ${audit.camera_adapter_complete}`,
      `- emotion_adapter_complete: ${audit.emotion_adapter_complete}`,
      `- transition_adapter_complete: ${audit.transition_adapter_complete}`,
      `- continuity_adapter_complete: ${audit.continuity_adapter_complete}`,
      `- storytelling_adapter_complete: ${audit.storytelling_adapter_complete}`,
      `- image_mapping_valid: ${audit.image_mapping_valid}`,
      `- video_mapping_valid: ${audit.video_mapping_valid}`,
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

export function writeMovieAnalysisDnaAdapterLibraryValidationReport(
  projectRoot?: string
): MovieAnalysisDnaAdapterLibraryReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: AdapterLibraryValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  if (!fs.existsSync(path.join(root, DNA_ADAPTER_LIBRARY_SCHEMA_PATH))) {
    issues.push({
      code: 'SCHEMA_MISSING',
      message: `Missing ${DNA_ADAPTER_LIBRARY_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  const library = loadMovieAnalysisDnaAdapterLibrary(root);
  if (!library) {
    issues.push({
      code: 'ADAPTER_LIBRARY_MISSING',
      message: `Missing ${DNA_ADAPTER_LIBRARY_PATH}`,
      severity: 'error',
    });
  }

  if (library && library.source_count !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  const sourceAudits: SourceAdapterLibraryAudit[] = [];
  if (library) {
    const entryIds = library.entries.map((entry) => entry.source_video_id).sort();
    const expectedIds = [...EXPECTED_SOURCE_VIDEO_IDS].sort();
    if (entryIds.join(',') !== expectedIds.join(',')) {
      issues.push({
        code: 'SOURCE_VIDEO_IDS_MISMATCH',
        message: `Expected sources: ${expectedIds.join(', ')}`,
        severity: 'error',
      });
    }

    for (const entry of library.entries) {
      const audit = auditEntry(entry);
      sourceAudits.push(audit);

      if (audit.entry_complete === 'FAIL') {
        issues.push({
          code: 'ENTRY_INCOMPLETE',
          message: `Adapter library entry incomplete for ${entry.source_video_id}`,
          severity: 'error',
          source_video_id: entry.source_video_id,
        });
      }
    }
  }

  const safetySummaryValid =
    library?.safety_summary.planning_only === true &&
    library.safety_summary.runtime_execution === false &&
    library.safety_summary.video_generation === false &&
    library.safety_summary.image_generation === false &&
    library.safety_summary.gpu_execution === false &&
    library.safety_summary.external_call_allowed === false;

  if (library && !safetySummaryValid) {
    issues.push({
      code: 'SAFETY_SUMMARY_INVALID',
      message: 'Adapter library safety_summary validation failed',
      severity: 'error',
    });
  }

  const sceneAdapterComplete = aggregateStatus(sourceAudits, 'scene_adapter_complete');
  const cameraAdapterComplete = aggregateStatus(sourceAudits, 'camera_adapter_complete');
  const emotionAdapterComplete = aggregateStatus(sourceAudits, 'emotion_adapter_complete');
  const transitionAdapterComplete = aggregateStatus(sourceAudits, 'transition_adapter_complete');
  const continuityAdapterComplete = aggregateStatus(sourceAudits, 'continuity_adapter_complete');
  const storytellingAdapterComplete = aggregateStatus(
    sourceAudits,
    'storytelling_adapter_complete'
  );
  const imageMappingValid = aggregateStatus(sourceAudits, 'image_mapping_valid');
  const videoMappingValid = aggregateStatus(sourceAudits, 'video_mapping_valid');
  const planningOnlyStatus: ValidationStatus = safetySummaryValid ? 'PASS' : 'FAIL';

  const adapterLibraryReady =
    sceneAdapterComplete === 'PASS' &&
    cameraAdapterComplete === 'PASS' &&
    emotionAdapterComplete === 'PASS' &&
    transitionAdapterComplete === 'PASS' &&
    continuityAdapterComplete === 'PASS' &&
    storytellingAdapterComplete === 'PASS' &&
    imageMappingValid === 'PASS' &&
    videoMappingValid === 'PASS' &&
    sourceAudits.every((audit) => audit.entry_complete === 'PASS') &&
    planningOnlyStatus === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const pass =
    library !== null &&
    library.source_count === EXPECTED_SOURCE_COUNT &&
    adapterLibraryReady === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieAnalysisDnaAdapterLibraryReport = {
    report_id: 'movie-analysis-dna-adapter-library-report-v1',
    phase: DNA_ADAPTER_LIBRARY_PHASE,
    timestamp,
    planning_only: true,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    no_generation: true,
    source_count: library?.source_count ?? 0,
    adapter_library_path: DNA_ADAPTER_LIBRARY_PATH,
    schema_path: DNA_ADAPTER_LIBRARY_SCHEMA_PATH,
    scene_adapter_complete: sceneAdapterComplete,
    camera_adapter_complete: cameraAdapterComplete,
    emotion_adapter_complete: emotionAdapterComplete,
    transition_adapter_complete: transitionAdapterComplete,
    continuity_adapter_complete: continuityAdapterComplete,
    storytelling_adapter_complete: storytellingAdapterComplete,
    image_mapping_valid: imageMappingValid,
    video_mapping_valid: videoMappingValid,
    adapter_library_ready: adapterLibraryReady,
    planning_only_status: planningOnlyStatus,
    ready_for_image_app_integration: pass && imageMappingValid === 'PASS',
    ready_for_video_app_integration: pass && videoMappingValid === 'PASS',
    source_audits: sourceAudits,
    final_verdict: pass ? DNA_ADAPTER_LIBRARY_PASS_VERDICT : DNA_ADAPTER_LIBRARY_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, DNA_ADAPTER_LIBRARY_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, DNA_ADAPTER_LIBRARY_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
