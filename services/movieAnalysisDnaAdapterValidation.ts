import fs from 'node:fs';
import path from 'node:path';
import {
  CINEMATIC_DNA_PATH,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_SOURCE_VIDEO_IDS,
  type CinematicDnaEntry,
  type CinematicDnaPattern,
  loadMovieAnalysisCinematicDna,
} from './movieAnalysisCinematicDnaExtraction.js';
import {
  CINEMATIC_DNA_INTEGRATION_PATH,
  type CinematicDnaIntegrationEntry,
  loadMovieAnalysisCinematicDnaIntegration,
} from './movieAnalysisCinematicDnaIntegration.js';
import {
  DNA_ADAPTER_LIBRARY_PASS_VERDICT,
  DNA_ADAPTER_LIBRARY_PATH,
  DNA_ADAPTER_LIBRARY_REPORT_PATH,
  type DnaAdapterDefinition,
  type DnaAdapterLibraryEntry,
  loadMovieAnalysisDnaAdapterLibrary,
} from './movieAnalysisDnaAdapterLibrary.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DNA_ADAPTER_VALIDATION_PHASE =
  'PHASE-SOURCE-VIDEO-057-MOVIE_ANALYSIS_DNA_ADAPTER_VALIDATION_V1' as const;
export const DNA_ADAPTER_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_DNA_ADAPTER_VALIDATION_V1' as const;
export const DNA_ADAPTER_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_DNA_ADAPTER_VALIDATION_V1' as const;
export const DNA_ADAPTER_VALIDATION_REPORT_PATH =
  'reports/movie-analysis-dna-adapter-validation-report.json' as const;
export const DNA_ADAPTER_VALIDATION_MD_PATH =
  'reports/MOVIE_ANALYSIS_DNA_ADAPTER_VALIDATION.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type AdapterValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceAdapterValidationAudit = {
  source_video_id: string;
  scene_adapter_valid: ValidationStatus;
  camera_adapter_valid: ValidationStatus;
  emotion_adapter_valid: ValidationStatus;
  transition_adapter_valid: ValidationStatus;
  continuity_adapter_valid: ValidationStatus;
  storytelling_adapter_valid: ValidationStatus;
  image_mapping_valid: ValidationStatus;
  video_mapping_valid: ValidationStatus;
  adapter_trace_integrity: ValidationStatus;
  adapter_consistency: ValidationStatus;
  source_pass: ValidationStatus;
};

export type MovieAnalysisDnaAdapterValidationReport = {
  report_id: string;
  phase: typeof DNA_ADAPTER_VALIDATION_PHASE;
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
  scene_adapter_valid: ValidationStatus;
  camera_adapter_valid: ValidationStatus;
  emotion_adapter_valid: ValidationStatus;
  transition_adapter_valid: ValidationStatus;
  continuity_adapter_valid: ValidationStatus;
  storytelling_adapter_valid: ValidationStatus;
  image_mapping_valid: ValidationStatus;
  video_mapping_valid: ValidationStatus;
  adapter_trace_integrity: ValidationStatus;
  adapter_consistency: ValidationStatus;
  adapter_validation_ready: ValidationStatus;
  planning_only_status: ValidationStatus;
  ready_for_adapter_certification: boolean;
  source_audits: SourceAdapterValidationAudit[];
  final_verdict:
    | typeof DNA_ADAPTER_VALIDATION_PASS_VERDICT
    | typeof DNA_ADAPTER_VALIDATION_FAIL_VERDICT;
  issues: AdapterValidationIssue[];
};

function patternIdsMatch(idsA: string[], idsB: string[]): boolean {
  const sortedA = [...idsA].sort();
  const sortedB = [...idsB].sort();
  if (sortedA.length !== sortedB.length) {
    return false;
  }
  return sortedA.every((id, index) => id === sortedB[index]);
}

function signaturesMatch(signaturesA: string[], signaturesB: string[]): boolean {
  const sortedA = [...signaturesA].sort();
  const sortedB = [...signaturesB].sort();
  if (sortedA.length !== sortedB.length) {
    return false;
  }
  return sortedA.every((sig, index) => sig === sortedB[index]);
}

function patternIdsMatchDna(
  patterns: CinematicDnaPattern[],
  adapter: DnaAdapterDefinition
): boolean {
  return (
    patternIdsMatch(
      patterns.map((pattern) => pattern.pattern_id),
      adapter.pattern_ids
    ) &&
    signaturesMatch(
      patterns.map((pattern) => pattern.pattern_signature),
      adapter.pattern_signatures
    ) &&
    adapter.pattern_count === patterns.length
  );
}

function isAdapterUsable(adapter: DnaAdapterDefinition): boolean {
  return (
    adapter.adapter_ready === true &&
    adapter.library_only === true &&
    adapter.pattern_count > 0 &&
    adapter.pattern_ids.length > 0 &&
    adapter.pattern_signatures.length > 0 &&
    Boolean(adapter.adapter_id) &&
    Boolean(adapter.cinematic_dna_id)
  );
}

function isAdapterTraceIntegrity(
  libraryEntry: DnaAdapterLibraryEntry,
  dnaEntry: CinematicDnaEntry,
  integrationEntry: CinematicDnaIntegrationEntry
): boolean {
  const checks = [
    patternIdsMatchDna(dnaEntry.scene_patterns, libraryEntry.scene_adapter),
    patternIdsMatch(integrationEntry.scene_dna_mapping.pattern_ids, libraryEntry.scene_adapter.pattern_ids),
    patternIdsMatchDna(dnaEntry.camera_patterns, libraryEntry.camera_adapter),
    patternIdsMatch(integrationEntry.camera_dna_mapping.pattern_ids, libraryEntry.camera_adapter.pattern_ids),
    patternIdsMatchDna(dnaEntry.emotion_patterns, libraryEntry.emotion_adapter),
    patternIdsMatch(integrationEntry.emotion_dna_mapping.pattern_ids, libraryEntry.emotion_adapter.pattern_ids),
    patternIdsMatchDna(dnaEntry.transition_patterns, libraryEntry.transition_adapter),
    patternIdsMatch(
      integrationEntry.transition_dna_mapping.pattern_ids,
      libraryEntry.transition_adapter.pattern_ids
    ),
    patternIdsMatchDna(dnaEntry.continuity_patterns, libraryEntry.continuity_adapter),
    patternIdsMatch(
      integrationEntry.continuity_dna_mapping.pattern_ids,
      libraryEntry.continuity_adapter.pattern_ids
    ),
    patternIdsMatchDna(dnaEntry.storytelling_patterns, libraryEntry.storytelling_adapter),
  ];

  return checks.every(Boolean);
}

function isAdapterConsistent(
  libraryEntry: DnaAdapterLibraryEntry,
  dnaEntry: CinematicDnaEntry,
  integrationEntry: CinematicDnaIntegrationEntry
): boolean {
  return (
    libraryEntry.cinematic_dna_id === dnaEntry.cinematic_dna_id &&
    libraryEntry.cinematic_dna_id === integrationEntry.cinematic_dna_id &&
    libraryEntry.integration_id === integrationEntry.integration_id &&
    libraryEntry.library_readiness === 'READY' &&
    integrationEntry.integration_readiness === 'READY' &&
    libraryEntry.reusability_score === integrationEntry.reusability_score
  );
}

function isImageMappingValid(
  libraryEntry: DnaAdapterLibraryEntry,
  integrationEntry: CinematicDnaIntegrationEntry
): boolean {
  const libraryMapping = libraryEntry.image_adapter_mapping;
  const integrationMapping = integrationEntry.image_app_usage_mapping;

  return (
    libraryMapping.consumer_target === 'image_app' &&
    libraryMapping.adapter_ready === true &&
    libraryMapping.emotion_adapter === true &&
    integrationMapping.consumer_target === 'image_app' &&
    integrationMapping.integration_ready === true &&
    integrationMapping.emotion_generation_adapter === true &&
    patternIdsMatch(
      integrationMapping.character_pattern_refs.sort(),
      libraryMapping.character_pattern_refs.sort()
    )
  );
}

function isVideoMappingValid(
  libraryEntry: DnaAdapterLibraryEntry,
  integrationEntry: CinematicDnaIntegrationEntry
): boolean {
  const libraryMapping = libraryEntry.video_adapter_mapping;
  const integrationMapping = integrationEntry.video_app_usage_mapping;

  return (
    libraryMapping.consumer_target === 'video_app' &&
    libraryMapping.adapter_ready === true &&
    libraryMapping.scene_adapter === true &&
    libraryMapping.camera_adapter === true &&
    libraryMapping.transition_adapter === true &&
    libraryMapping.continuity_adapter === true &&
    libraryMapping.storytelling_adapter === true &&
    integrationMapping.consumer_target === 'video_app' &&
    integrationMapping.integration_ready === true &&
    integrationMapping.scene_generation_adapter === true &&
    integrationMapping.camera_generation_adapter === true &&
    integrationMapping.transition_generation_adapter === true &&
    integrationMapping.continuity_generation_adapter === true
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

function auditSource(
  libraryEntry: DnaAdapterLibraryEntry,
  dnaEntry: CinematicDnaEntry,
  integrationEntry: CinematicDnaIntegrationEntry
): SourceAdapterValidationAudit {
  const sceneAdapterValid =
    isAdapterUsable(libraryEntry.scene_adapter) &&
    libraryEntry.scene_adapter.adapter_type === 'scene_adapter' &&
    patternIdsMatch(integrationEntry.scene_dna_mapping.pattern_ids, libraryEntry.scene_adapter.pattern_ids)
      ? 'PASS'
      : 'FAIL';
  const cameraAdapterValid =
    isAdapterUsable(libraryEntry.camera_adapter) &&
    libraryEntry.camera_adapter.adapter_type === 'camera_adapter' &&
    patternIdsMatch(
      integrationEntry.camera_dna_mapping.pattern_ids,
      libraryEntry.camera_adapter.pattern_ids
    )
      ? 'PASS'
      : 'FAIL';
  const emotionAdapterValid =
    isAdapterUsable(libraryEntry.emotion_adapter) &&
    libraryEntry.emotion_adapter.adapter_type === 'emotion_adapter' &&
    patternIdsMatch(
      integrationEntry.emotion_dna_mapping.pattern_ids,
      libraryEntry.emotion_adapter.pattern_ids
    )
      ? 'PASS'
      : 'FAIL';
  const transitionAdapterValid =
    isAdapterUsable(libraryEntry.transition_adapter) &&
    libraryEntry.transition_adapter.adapter_type === 'transition_adapter' &&
    patternIdsMatch(
      integrationEntry.transition_dna_mapping.pattern_ids,
      libraryEntry.transition_adapter.pattern_ids
    )
      ? 'PASS'
      : 'FAIL';
  const continuityAdapterValid =
    isAdapterUsable(libraryEntry.continuity_adapter) &&
    libraryEntry.continuity_adapter.adapter_type === 'continuity_adapter' &&
    patternIdsMatch(
      integrationEntry.continuity_dna_mapping.pattern_ids,
      libraryEntry.continuity_adapter.pattern_ids
    )
      ? 'PASS'
      : 'FAIL';
  const storytellingAdapterValid =
    isAdapterUsable(libraryEntry.storytelling_adapter) &&
    libraryEntry.storytelling_adapter.adapter_type === 'storytelling_adapter' &&
    patternIdsMatchDna(dnaEntry.storytelling_patterns, libraryEntry.storytelling_adapter)
      ? 'PASS'
      : 'FAIL';

  const imageMappingValid = isImageMappingValid(libraryEntry, integrationEntry) ? 'PASS' : 'FAIL';
  const videoMappingValid = isVideoMappingValid(libraryEntry, integrationEntry) ? 'PASS' : 'FAIL';
  const traceIntegrity = isAdapterTraceIntegrity(libraryEntry, dnaEntry, integrationEntry)
    ? 'PASS'
    : 'FAIL';
  const consistency = isAdapterConsistent(libraryEntry, dnaEntry, integrationEntry)
    ? 'PASS'
    : 'FAIL';

  const sourcePass =
    sceneAdapterValid === 'PASS' &&
    cameraAdapterValid === 'PASS' &&
    emotionAdapterValid === 'PASS' &&
    transitionAdapterValid === 'PASS' &&
    continuityAdapterValid === 'PASS' &&
    storytellingAdapterValid === 'PASS' &&
    imageMappingValid === 'PASS' &&
    videoMappingValid === 'PASS' &&
    traceIntegrity === 'PASS' &&
    consistency === 'PASS' &&
    isEntrySafetyValid(libraryEntry)
      ? 'PASS'
      : 'FAIL';

  return {
    source_video_id: libraryEntry.source_video_id,
    scene_adapter_valid: sceneAdapterValid,
    camera_adapter_valid: cameraAdapterValid,
    emotion_adapter_valid: emotionAdapterValid,
    transition_adapter_valid: transitionAdapterValid,
    continuity_adapter_valid: continuityAdapterValid,
    storytelling_adapter_valid: storytellingAdapterValid,
    image_mapping_valid: imageMappingValid,
    video_mapping_valid: videoMappingValid,
    adapter_trace_integrity: traceIntegrity,
    adapter_consistency: consistency,
    source_pass: sourcePass,
  };
}

function aggregateStatus(
  audits: SourceAdapterValidationAudit[],
  field: keyof SourceAdapterValidationAudit
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisDnaAdapterValidationReport): string {
  const lines = [
    '# Movie Analysis DNA Adapter Validation',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Validation Pipeline',
    '',
    '```',
    'Movie Analysis Dataset',
    '→ Cinematic DNA',
    '→ DNA Integration',
    '→ DNA Quality Gate',
    '→ Certified DNA Library',
    '→ DNA Adapter Library',
    '→ DNA Adapter Validation',
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
    `| scene_adapter_valid | ${report.scene_adapter_valid} |`,
    `| camera_adapter_valid | ${report.camera_adapter_valid} |`,
    `| emotion_adapter_valid | ${report.emotion_adapter_valid} |`,
    `| transition_adapter_valid | ${report.transition_adapter_valid} |`,
    `| continuity_adapter_valid | ${report.continuity_adapter_valid} |`,
    `| storytelling_adapter_valid | ${report.storytelling_adapter_valid} |`,
    `| image_mapping_valid | ${report.image_mapping_valid} |`,
    `| video_mapping_valid | ${report.video_mapping_valid} |`,
    `| adapter_trace_integrity | ${report.adapter_trace_integrity} |`,
    `| adapter_consistency | ${report.adapter_consistency} |`,
    `| adapter_validation_ready | ${report.adapter_validation_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Readiness',
    '',
    `- Ready for adapter certification phase: ${report.ready_for_adapter_certification}`,
    '- No generation performed.',
    '',
    '## Source Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- scene_adapter_valid: ${audit.scene_adapter_valid}`,
      `- camera_adapter_valid: ${audit.camera_adapter_valid}`,
      `- emotion_adapter_valid: ${audit.emotion_adapter_valid}`,
      `- transition_adapter_valid: ${audit.transition_adapter_valid}`,
      `- continuity_adapter_valid: ${audit.continuity_adapter_valid}`,
      `- storytelling_adapter_valid: ${audit.storytelling_adapter_valid}`,
      `- image_mapping_valid: ${audit.image_mapping_valid}`,
      `- video_mapping_valid: ${audit.video_mapping_valid}`,
      `- adapter_trace_integrity: ${audit.adapter_trace_integrity}`,
      `- adapter_consistency: ${audit.adapter_consistency}`,
      `- source_pass: ${audit.source_pass}`,
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

export function writeMovieAnalysisDnaAdapterValidationReport(
  projectRoot?: string
): MovieAnalysisDnaAdapterValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: AdapterValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  if (!fs.existsSync(path.join(root, DNA_ADAPTER_LIBRARY_PATH))) {
    issues.push({
      code: 'ADAPTER_LIBRARY_MISSING',
      message: `Missing ${DNA_ADAPTER_LIBRARY_PATH}`,
      severity: 'error',
    });
  }

  const libraryReportPath = path.join(root, DNA_ADAPTER_LIBRARY_REPORT_PATH);
  if (!fs.existsSync(libraryReportPath)) {
    issues.push({
      code: 'ADAPTER_LIBRARY_REPORT_MISSING',
      message: `Missing ${DNA_ADAPTER_LIBRARY_REPORT_PATH}`,
      severity: 'error',
    });
  } else {
    const libraryReport = JSON.parse(fs.readFileSync(libraryReportPath, 'utf8')) as {
      final_verdict?: string;
      adapter_library_ready?: string;
    };
    if (libraryReport.final_verdict !== DNA_ADAPTER_LIBRARY_PASS_VERDICT) {
      issues.push({
        code: 'ADAPTER_LIBRARY_NOT_PASS',
        message: `Adapter library must have ${DNA_ADAPTER_LIBRARY_PASS_VERDICT}`,
        severity: 'error',
      });
    }
    if (libraryReport.adapter_library_ready !== 'PASS') {
      issues.push({
        code: 'ADAPTER_LIBRARY_NOT_READY',
        message: 'Adapter library adapter_library_ready must be PASS',
        severity: 'error',
      });
    }
  }

  const library = loadMovieAnalysisDnaAdapterLibrary(root);
  const cinematicDna = loadMovieAnalysisCinematicDna(root);
  const integration = loadMovieAnalysisCinematicDnaIntegration(root);

  if (!library) {
    issues.push({
      code: 'ADAPTER_LIBRARY_LOAD_FAIL',
      message: `Unable to load ${DNA_ADAPTER_LIBRARY_PATH}`,
      severity: 'error',
    });
  }

  if (!cinematicDna) {
    issues.push({
      code: 'CINEMATIC_DNA_MISSING',
      message: `Missing ${CINEMATIC_DNA_PATH}`,
      severity: 'error',
    });
  }

  if (!integration) {
    issues.push({
      code: 'INTEGRATION_MISSING',
      message: `Missing ${CINEMATIC_DNA_INTEGRATION_PATH}`,
      severity: 'error',
    });
  }

  const sourceAudits: SourceAdapterValidationAudit[] = [];

  if (library && cinematicDna && integration) {
    if (library.source_count !== EXPECTED_SOURCE_COUNT) {
      issues.push({
        code: 'SOURCE_COUNT_MISMATCH',
        message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
        severity: 'error',
      });
    }

    if (library.cinematic_dna_set_id !== cinematicDna.cinematic_dna_set_id) {
      issues.push({
        code: 'DNA_SET_ID_MISMATCH',
        message: 'Adapter library cinematic_dna_set_id mismatch',
        severity: 'error',
      });
    }

    if (library.integration_set_id !== integration.integration_set_id) {
      issues.push({
        code: 'INTEGRATION_SET_ID_MISMATCH',
        message: 'Adapter library integration_set_id mismatch',
        severity: 'error',
      });
    }

    for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
      const libraryEntry = library.entries.find(
        (entry) => entry.source_video_id === sourceVideoId
      );
      const dnaEntry = cinematicDna.entries.find(
        (entry) => entry.source_video_id === sourceVideoId
      );
      const integrationEntry = integration.entries.find(
        (entry) => entry.source_video_id === sourceVideoId
      );

      if (!libraryEntry || !dnaEntry || !integrationEntry) {
        issues.push({
          code: 'SOURCE_TRIPLE_MISSING',
          message: `Missing library, DNA, or integration entry for ${sourceVideoId}`,
          severity: 'error',
          source_video_id: sourceVideoId,
        });
        continue;
      }

      const audit = auditSource(libraryEntry, dnaEntry, integrationEntry);
      sourceAudits.push(audit);

      if (audit.source_pass === 'FAIL') {
        issues.push({
          code: 'SOURCE_ADAPTER_VALIDATION_FAIL',
          message: `Adapter validation failed for ${sourceVideoId}`,
          severity: 'error',
          source_video_id: sourceVideoId,
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
      code: 'PLANNING_ONLY_FAIL',
      message: 'Safety planning_only validation failed',
      severity: 'error',
    });
  }

  const sceneAdapterValid = aggregateStatus(sourceAudits, 'scene_adapter_valid');
  const cameraAdapterValid = aggregateStatus(sourceAudits, 'camera_adapter_valid');
  const emotionAdapterValid = aggregateStatus(sourceAudits, 'emotion_adapter_valid');
  const transitionAdapterValid = aggregateStatus(sourceAudits, 'transition_adapter_valid');
  const continuityAdapterValid = aggregateStatus(sourceAudits, 'continuity_adapter_valid');
  const storytellingAdapterValid = aggregateStatus(sourceAudits, 'storytelling_adapter_valid');
  const imageMappingValid = aggregateStatus(sourceAudits, 'image_mapping_valid');
  const videoMappingValid = aggregateStatus(sourceAudits, 'video_mapping_valid');
  const adapterTraceIntegrity = aggregateStatus(sourceAudits, 'adapter_trace_integrity');
  const adapterConsistency = aggregateStatus(sourceAudits, 'adapter_consistency');
  const planningOnlyStatus: ValidationStatus = safetySummaryValid ? 'PASS' : 'FAIL';

  const adapterValidationReady =
    sceneAdapterValid === 'PASS' &&
    cameraAdapterValid === 'PASS' &&
    emotionAdapterValid === 'PASS' &&
    transitionAdapterValid === 'PASS' &&
    continuityAdapterValid === 'PASS' &&
    storytellingAdapterValid === 'PASS' &&
    imageMappingValid === 'PASS' &&
    videoMappingValid === 'PASS' &&
    adapterTraceIntegrity === 'PASS' &&
    adapterConsistency === 'PASS' &&
    sourceAudits.every((audit) => audit.source_pass === 'PASS') &&
    planningOnlyStatus === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const pass =
    library !== null &&
    cinematicDna !== null &&
    integration !== null &&
    library.source_count === EXPECTED_SOURCE_COUNT &&
    adapterValidationReady === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieAnalysisDnaAdapterValidationReport = {
    report_id: 'movie-analysis-dna-adapter-validation-report-v1',
    phase: DNA_ADAPTER_VALIDATION_PHASE,
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
    scene_adapter_valid: sceneAdapterValid,
    camera_adapter_valid: cameraAdapterValid,
    emotion_adapter_valid: emotionAdapterValid,
    transition_adapter_valid: transitionAdapterValid,
    continuity_adapter_valid: continuityAdapterValid,
    storytelling_adapter_valid: storytellingAdapterValid,
    image_mapping_valid: imageMappingValid,
    video_mapping_valid: videoMappingValid,
    adapter_trace_integrity: adapterTraceIntegrity,
    adapter_consistency: adapterConsistency,
    adapter_validation_ready: adapterValidationReady,
    planning_only_status: planningOnlyStatus,
    ready_for_adapter_certification: pass,
    source_audits: sourceAudits,
    final_verdict: pass
      ? DNA_ADAPTER_VALIDATION_PASS_VERDICT
      : DNA_ADAPTER_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, DNA_ADAPTER_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, DNA_ADAPTER_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
