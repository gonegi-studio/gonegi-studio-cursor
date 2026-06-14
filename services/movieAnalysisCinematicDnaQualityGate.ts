import fs from 'node:fs';
import path from 'node:path';
import {
  CINEMATIC_DNA_PATH,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_SOURCE_VIDEO_IDS,
  type CinematicDnaEntry,
  type CinematicDnaPattern,
  type MovieAnalysisCinematicDna,
  loadMovieAnalysisCinematicDna,
} from './movieAnalysisCinematicDnaExtraction.js';
import {
  CINEMATIC_DNA_INTEGRATION_PATH,
  type CinematicDnaIntegrationEntry,
  type DnaAdapterMapping,
  type MovieAnalysisCinematicDnaIntegration,
  loadMovieAnalysisCinematicDnaIntegration,
} from './movieAnalysisCinematicDnaIntegration.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const CINEMATIC_DNA_QUALITY_GATE_PHASE =
  'PHASE-SOURCE-VIDEO-055-MOVIE_ANALYSIS_CINEMATIC_DNA_QUALITY_GATE_V1' as const;
export const CINEMATIC_DNA_QUALITY_GATE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_CINEMATIC_DNA_QUALITY_GATE_V1' as const;
export const CINEMATIC_DNA_QUALITY_GATE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_CINEMATIC_DNA_QUALITY_GATE_V1' as const;
export const CINEMATIC_DNA_QUALITY_GATE_REPORT_PATH =
  'reports/movie-analysis-cinematic-dna-quality-gate-report.json' as const;
export const CINEMATIC_DNA_QUALITY_GATE_MD_PATH =
  'reports/MOVIE_ANALYSIS_CINEMATIC_DNA_QUALITY_GATE.md' as const;
export const DNA_LIBRARY_CERTIFICATION_MESSAGE = 'Certified DNA Library' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type QualityGateIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceDnaQualityGateAudit = {
  source_video_id: string;
  scene_dna_complete: ValidationStatus;
  camera_dna_complete: ValidationStatus;
  emotion_dna_complete: ValidationStatus;
  transition_dna_complete: ValidationStatus;
  continuity_dna_complete: ValidationStatus;
  storytelling_dna_complete: ValidationStatus;
  integration_consistency: ValidationStatus;
  image_app_mapping_valid: ValidationStatus;
  video_app_mapping_valid: ValidationStatus;
  reusability_score_valid: ValidationStatus;
  trace_preserved: ValidationStatus;
  source_pass: ValidationStatus;
};

export type MovieAnalysisCinematicDnaQualityGateReport = {
  report_id: string;
  phase: typeof CINEMATIC_DNA_QUALITY_GATE_PHASE;
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
  cinematic_dna_path: typeof CINEMATIC_DNA_PATH;
  integration_path: typeof CINEMATIC_DNA_INTEGRATION_PATH;
  scene_dna_complete: ValidationStatus;
  camera_dna_complete: ValidationStatus;
  emotion_dna_complete: ValidationStatus;
  transition_dna_complete: ValidationStatus;
  continuity_dna_complete: ValidationStatus;
  storytelling_dna_complete: ValidationStatus;
  integration_consistency: ValidationStatus;
  image_app_mapping_valid: ValidationStatus;
  video_app_mapping_valid: ValidationStatus;
  reusability_score_valid: ValidationStatus;
  dna_library_ready: ValidationStatus;
  planning_only_status: ValidationStatus;
  dna_library_certification_message: typeof DNA_LIBRARY_CERTIFICATION_MESSAGE | null;
  ready_for_image_app_adapter: boolean;
  ready_for_video_app_adapter: boolean;
  source_audits: SourceDnaQualityGateAudit[];
  final_verdict:
    | typeof CINEMATIC_DNA_QUALITY_GATE_PASS_VERDICT
    | typeof CINEMATIC_DNA_QUALITY_GATE_FAIL_VERDICT;
  issues: QualityGateIssue[];
};

function patternIdsMatch(
  patterns: CinematicDnaPattern[],
  mapping: DnaAdapterMapping
): boolean {
  const dnaIds = patterns.map((pattern) => pattern.pattern_id).sort();
  const mapIds = [...mapping.pattern_ids].sort();
  if (dnaIds.length !== mapIds.length) {
    return false;
  }
  return dnaIds.every((id, index) => id === mapIds[index]);
}

function signaturesMatch(
  patterns: CinematicDnaPattern[],
  mapping: DnaAdapterMapping
): boolean {
  const dnaSignatures = patterns.map((pattern) => pattern.pattern_signature).sort();
  const mapSignatures = [...mapping.pattern_signatures].sort();
  if (dnaSignatures.length !== mapSignatures.length) {
    return false;
  }
  return dnaSignatures.every((sig, index) => sig === mapSignatures[index]);
}

function isDnaCategoryComplete(patterns: CinematicDnaPattern[]): boolean {
  return (
    patterns.length > 0 &&
    patterns.every(
      (pattern) =>
        Boolean(pattern.pattern_id) &&
        Boolean(pattern.pattern_signature) &&
        pattern.source_element_ids.length > 0 &&
        pattern.extraction_only === true
    )
  );
}

function isIntegrationConsistent(
  dnaEntry: CinematicDnaEntry,
  integrationEntry: CinematicDnaIntegrationEntry
): boolean {
  if (integrationEntry.cinematic_dna_id !== dnaEntry.cinematic_dna_id) {
    return false;
  }

  const mappings = [
    { patterns: dnaEntry.scene_patterns, mapping: integrationEntry.scene_dna_mapping },
    { patterns: dnaEntry.camera_patterns, mapping: integrationEntry.camera_dna_mapping },
    { patterns: dnaEntry.emotion_patterns, mapping: integrationEntry.emotion_dna_mapping },
    {
      patterns: dnaEntry.transition_patterns,
      mapping: integrationEntry.transition_dna_mapping,
    },
    {
      patterns: dnaEntry.continuity_patterns,
      mapping: integrationEntry.continuity_dna_mapping,
    },
  ];

  return mappings.every(
    ({ patterns, mapping }) =>
      patternIdsMatch(patterns, mapping) &&
      signaturesMatch(patterns, mapping) &&
      mapping.pattern_count === patterns.length &&
      mapping.cinematic_dna_id === dnaEntry.cinematic_dna_id
  );
}

function isImageAppMappingValid(integrationEntry: CinematicDnaIntegrationEntry): boolean {
  const mapping = integrationEntry.image_app_usage_mapping;
  return (
    mapping.consumer_target === 'image_app' &&
    mapping.integration_ready === true &&
    mapping.emotion_generation_adapter === true &&
    integrationEntry.emotion_dna_mapping.pattern_count > 0
  );
}

function isVideoAppMappingValid(integrationEntry: CinematicDnaIntegrationEntry): boolean {
  const mapping = integrationEntry.video_app_usage_mapping;
  return (
    mapping.consumer_target === 'video_app' &&
    mapping.integration_ready === true &&
    mapping.scene_generation_adapter === true &&
    mapping.camera_generation_adapter === true &&
    mapping.transition_generation_adapter === true &&
    mapping.continuity_generation_adapter === true &&
    integrationEntry.scene_dna_mapping.pattern_count > 0 &&
    integrationEntry.camera_dna_mapping.pattern_count > 0 &&
    integrationEntry.transition_dna_mapping.pattern_count > 0 &&
    integrationEntry.continuity_dna_mapping.pattern_count > 0
  );
}

function isReusabilityScoreValid(
  dnaEntry: CinematicDnaEntry,
  integrationEntry: CinematicDnaIntegrationEntry
): boolean {
  return (
    dnaEntry.reusability_score > 0 &&
    dnaEntry.reusability_score <= 1 &&
    integrationEntry.reusability_score === dnaEntry.reusability_score &&
    dnaEntry.strength_score > 0
  );
}

function isDnaSafetyValid(cinematicDna: MovieAnalysisCinematicDna): boolean {
  return (
    cinematicDna.safety_summary.planning_only === true &&
    cinematicDna.safety_summary.dna_extraction_only === true &&
    cinematicDna.safety_summary.runtime_execution === false &&
    cinematicDna.safety_summary.video_generation === false &&
    cinematicDna.safety_summary.image_generation === false &&
    cinematicDna.safety_summary.gpu_execution === false &&
    cinematicDna.safety_summary.external_call_allowed === false &&
    cinematicDna.entries.every(
      (entry) =>
        entry.safety.planning_only === true &&
        entry.safety.dna_extraction_only === true &&
        entry.safety.runtime_execution === false &&
        entry.safety.video_generation === false &&
        entry.safety.image_generation === false &&
        entry.safety.gpu_execution === false &&
        entry.safety.external_call_allowed === false
    )
  );
}

function isIntegrationSafetyValid(integration: MovieAnalysisCinematicDnaIntegration): boolean {
  return (
    integration.safety_summary.planning_only === true &&
    integration.safety_summary.integration_only === true &&
    integration.safety_summary.runtime_execution === false &&
    integration.safety_summary.video_generation === false &&
    integration.safety_summary.image_generation === false &&
    integration.safety_summary.gpu_execution === false &&
    integration.safety_summary.external_call_allowed === false &&
    integration.entries.every(
      (entry) =>
        entry.safety.planning_only === true &&
        entry.safety.integration_only === true &&
        entry.safety.runtime_execution === false &&
        entry.safety.video_generation === false &&
        entry.safety.image_generation === false &&
        entry.safety.gpu_execution === false &&
        entry.safety.external_call_allowed === false
    )
  );
}

function auditSource(
  dnaEntry: CinematicDnaEntry,
  integrationEntry: CinematicDnaIntegrationEntry
): SourceDnaQualityGateAudit {
  const sceneDnaComplete = isDnaCategoryComplete(dnaEntry.scene_patterns) ? 'PASS' : 'FAIL';
  const cameraDnaComplete = isDnaCategoryComplete(dnaEntry.camera_patterns) ? 'PASS' : 'FAIL';
  const emotionDnaComplete = isDnaCategoryComplete(dnaEntry.emotion_patterns) ? 'PASS' : 'FAIL';
  const transitionDnaComplete = isDnaCategoryComplete(dnaEntry.transition_patterns)
    ? 'PASS'
    : 'FAIL';
  const continuityDnaComplete = isDnaCategoryComplete(dnaEntry.continuity_patterns)
    ? 'PASS'
    : 'FAIL';
  const storytellingDnaComplete = isDnaCategoryComplete(dnaEntry.storytelling_patterns)
    ? 'PASS'
    : 'FAIL';
  const integrationConsistency = isIntegrationConsistent(dnaEntry, integrationEntry)
    ? 'PASS'
    : 'FAIL';
  const imageAppMappingValid = isImageAppMappingValid(integrationEntry) ? 'PASS' : 'FAIL';
  const videoAppMappingValid = isVideoAppMappingValid(integrationEntry) ? 'PASS' : 'FAIL';
  const reusabilityScoreValid = isReusabilityScoreValid(dnaEntry, integrationEntry)
    ? 'PASS'
    : 'FAIL';
  const tracePreserved = integrationConsistency;

  const sourcePass =
    sceneDnaComplete === 'PASS' &&
    cameraDnaComplete === 'PASS' &&
    emotionDnaComplete === 'PASS' &&
    transitionDnaComplete === 'PASS' &&
    continuityDnaComplete === 'PASS' &&
    storytellingDnaComplete === 'PASS' &&
    integrationConsistency === 'PASS' &&
    imageAppMappingValid === 'PASS' &&
    videoAppMappingValid === 'PASS' &&
    reusabilityScoreValid === 'PASS' &&
    tracePreserved === 'PASS' &&
    integrationEntry.integration_readiness === 'READY'
      ? 'PASS'
      : 'FAIL';

  return {
    source_video_id: dnaEntry.source_video_id,
    scene_dna_complete: sceneDnaComplete,
    camera_dna_complete: cameraDnaComplete,
    emotion_dna_complete: emotionDnaComplete,
    transition_dna_complete: transitionDnaComplete,
    continuity_dna_complete: continuityDnaComplete,
    storytelling_dna_complete: storytellingDnaComplete,
    integration_consistency: integrationConsistency,
    image_app_mapping_valid: imageAppMappingValid,
    video_app_mapping_valid: videoAppMappingValid,
    reusability_score_valid: reusabilityScoreValid,
    trace_preserved: tracePreserved,
    source_pass: sourcePass,
  };
}

function aggregateStatus(
  audits: SourceDnaQualityGateAudit[],
  field: keyof SourceDnaQualityGateAudit
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisCinematicDnaQualityGateReport): string {
  const lines = [
    '# Movie Analysis Cinematic DNA Quality Gate',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.dna_library_certification_message) {
    lines.push(`## ${report.dna_library_certification_message}`, '');
  }

  lines.push(
    '## Quality Gate Pipeline',
    '',
    '```',
    'Movie Analysis Dataset',
    '→ Cinematic DNA',
    '→ DNA Integration',
    '→ DNA Quality Gate',
    '→ Certified DNA Library',
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
    '## Quality Gate Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| scene_dna_complete | ${report.scene_dna_complete} |`,
    `| camera_dna_complete | ${report.camera_dna_complete} |`,
    `| emotion_dna_complete | ${report.emotion_dna_complete} |`,
    `| transition_dna_complete | ${report.transition_dna_complete} |`,
    `| continuity_dna_complete | ${report.continuity_dna_complete} |`,
    `| storytelling_dna_complete | ${report.storytelling_dna_complete} |`,
    `| integration_consistency | ${report.integration_consistency} |`,
    `| image_app_mapping_valid | ${report.image_app_mapping_valid} |`,
    `| video_app_mapping_valid | ${report.video_app_mapping_valid} |`,
    `| reusability_score_valid | ${report.reusability_score_valid} |`,
    `| dna_library_ready | ${report.dna_library_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Readiness',
    '',
    `- Ready for future Image App adapter generation: ${report.ready_for_image_app_adapter}`,
    `- Ready for future Video App adapter generation: ${report.ready_for_video_app_adapter}`,
    '- No generation performed.',
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- scene_dna_complete: ${audit.scene_dna_complete}`,
      `- camera_dna_complete: ${audit.camera_dna_complete}`,
      `- emotion_dna_complete: ${audit.emotion_dna_complete}`,
      `- transition_dna_complete: ${audit.transition_dna_complete}`,
      `- continuity_dna_complete: ${audit.continuity_dna_complete}`,
      `- storytelling_dna_complete: ${audit.storytelling_dna_complete}`,
      `- integration_consistency: ${audit.integration_consistency}`,
      `- image_app_mapping_valid: ${audit.image_app_mapping_valid}`,
      `- video_app_mapping_valid: ${audit.video_app_mapping_valid}`,
      `- reusability_score_valid: ${audit.reusability_score_valid}`,
      `- trace_preserved: ${audit.trace_preserved}`,
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

export function writeMovieAnalysisCinematicDnaQualityGateReport(
  projectRoot?: string
): MovieAnalysisCinematicDnaQualityGateReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: QualityGateIssue[] = [];
  const timestamp = new Date().toISOString();

  if (!fs.existsSync(path.join(root, CINEMATIC_DNA_PATH))) {
    issues.push({
      code: 'CINEMATIC_DNA_MISSING',
      message: `Missing ${CINEMATIC_DNA_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, CINEMATIC_DNA_INTEGRATION_PATH))) {
    issues.push({
      code: 'INTEGRATION_MISSING',
      message: `Missing ${CINEMATIC_DNA_INTEGRATION_PATH}`,
      severity: 'error',
    });
  }

  const cinematicDna = loadMovieAnalysisCinematicDna(root);
  const integration = loadMovieAnalysisCinematicDnaIntegration(root);

  if (!cinematicDna) {
    issues.push({
      code: 'CINEMATIC_DNA_LOAD_FAIL',
      message: `Unable to load ${CINEMATIC_DNA_PATH}`,
      severity: 'error',
    });
  }

  if (!integration) {
    issues.push({
      code: 'INTEGRATION_LOAD_FAIL',
      message: `Unable to load ${CINEMATIC_DNA_INTEGRATION_PATH}`,
      severity: 'error',
    });
  }

  const sourceAudits: SourceDnaQualityGateAudit[] = [];

  if (cinematicDna && integration) {
    if (cinematicDna.source_count !== EXPECTED_SOURCE_COUNT) {
      issues.push({
        code: 'DNA_SOURCE_COUNT_MISMATCH',
        message: `Cinematic DNA source_count must be ${EXPECTED_SOURCE_COUNT}`,
        severity: 'error',
      });
    }

    if (integration.source_count !== EXPECTED_SOURCE_COUNT) {
      issues.push({
        code: 'INTEGRATION_SOURCE_COUNT_MISMATCH',
        message: `Integration source_count must be ${EXPECTED_SOURCE_COUNT}`,
        severity: 'error',
      });
    }

    if (integration.cinematic_dna_set_id !== cinematicDna.cinematic_dna_set_id) {
      issues.push({
        code: 'DNA_SET_ID_MISMATCH',
        message: 'Integration cinematic_dna_set_id does not match cinematic DNA set',
        severity: 'error',
      });
    }

    for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
      const dnaEntry = cinematicDna.entries.find(
        (entry) => entry.source_video_id === sourceVideoId
      );
      const integrationEntry = integration.entries.find(
        (entry) => entry.source_video_id === sourceVideoId
      );

      if (!dnaEntry || !integrationEntry) {
        issues.push({
          code: 'SOURCE_PAIR_MISSING',
          message: `Missing DNA or integration entry for ${sourceVideoId}`,
          severity: 'error',
          source_video_id: sourceVideoId,
        });
        continue;
      }

      const audit = auditSource(dnaEntry, integrationEntry);
      sourceAudits.push(audit);

      if (audit.source_pass === 'FAIL') {
        const failedChecks = (
          [
            ['scene_dna_complete', audit.scene_dna_complete],
            ['camera_dna_complete', audit.camera_dna_complete],
            ['emotion_dna_complete', audit.emotion_dna_complete],
            ['transition_dna_complete', audit.transition_dna_complete],
            ['continuity_dna_complete', audit.continuity_dna_complete],
            ['storytelling_dna_complete', audit.storytelling_dna_complete],
            ['integration_consistency', audit.integration_consistency],
            ['image_app_mapping_valid', audit.image_app_mapping_valid],
            ['video_app_mapping_valid', audit.video_app_mapping_valid],
            ['reusability_score_valid', audit.reusability_score_valid],
            ['trace_preserved', audit.trace_preserved],
          ] as const
        )
          .filter(([, status]) => status === 'FAIL')
          .map(([name]) => name);

        issues.push({
          code: 'SOURCE_QUALITY_GATE_FAIL',
          message: `Quality gate failed for ${sourceVideoId}: ${failedChecks.join(', ')}`,
          severity: 'error',
          source_video_id: sourceVideoId,
        });
      }
    }
  }

  const planningOnlyValid =
    cinematicDna !== null &&
    integration !== null &&
    isDnaSafetyValid(cinematicDna) &&
    isIntegrationSafetyValid(integration);

  if (cinematicDna && integration && !planningOnlyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Safety planning_only validation failed',
      severity: 'error',
    });
  }

  const sceneDnaComplete = aggregateStatus(sourceAudits, 'scene_dna_complete');
  const cameraDnaComplete = aggregateStatus(sourceAudits, 'camera_dna_complete');
  const emotionDnaComplete = aggregateStatus(sourceAudits, 'emotion_dna_complete');
  const transitionDnaComplete = aggregateStatus(sourceAudits, 'transition_dna_complete');
  const continuityDnaComplete = aggregateStatus(sourceAudits, 'continuity_dna_complete');
  const storytellingDnaComplete = aggregateStatus(sourceAudits, 'storytelling_dna_complete');
  const integrationConsistency = aggregateStatus(sourceAudits, 'integration_consistency');
  const imageAppMappingValid = aggregateStatus(sourceAudits, 'image_app_mapping_valid');
  const videoAppMappingValid = aggregateStatus(sourceAudits, 'video_app_mapping_valid');
  const reusabilityScoreValid = aggregateStatus(sourceAudits, 'reusability_score_valid');
  const planningOnlyStatus: ValidationStatus = planningOnlyValid ? 'PASS' : 'FAIL';

  const dnaLibraryReady =
    cinematicDna !== null &&
    integration !== null &&
    cinematicDna.source_count === EXPECTED_SOURCE_COUNT &&
    integration.source_count === EXPECTED_SOURCE_COUNT &&
    sceneDnaComplete === 'PASS' &&
    cameraDnaComplete === 'PASS' &&
    emotionDnaComplete === 'PASS' &&
    transitionDnaComplete === 'PASS' &&
    continuityDnaComplete === 'PASS' &&
    storytellingDnaComplete === 'PASS' &&
    integrationConsistency === 'PASS' &&
    imageAppMappingValid === 'PASS' &&
    videoAppMappingValid === 'PASS' &&
    reusabilityScoreValid === 'PASS' &&
    sourceAudits.every((audit) => audit.source_pass === 'PASS') &&
    planningOnlyStatus === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const pass =
    dnaLibraryReady === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieAnalysisCinematicDnaQualityGateReport = {
    report_id: 'movie-analysis-cinematic-dna-quality-gate-report-v1',
    phase: CINEMATIC_DNA_QUALITY_GATE_PHASE,
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
    source_count: cinematicDna?.source_count ?? 0,
    cinematic_dna_path: CINEMATIC_DNA_PATH,
    integration_path: CINEMATIC_DNA_INTEGRATION_PATH,
    scene_dna_complete: sceneDnaComplete,
    camera_dna_complete: cameraDnaComplete,
    emotion_dna_complete: emotionDnaComplete,
    transition_dna_complete: transitionDnaComplete,
    continuity_dna_complete: continuityDnaComplete,
    storytelling_dna_complete: storytellingDnaComplete,
    integration_consistency: integrationConsistency,
    image_app_mapping_valid: imageAppMappingValid,
    video_app_mapping_valid: videoAppMappingValid,
    reusability_score_valid: reusabilityScoreValid,
    dna_library_ready: dnaLibraryReady,
    planning_only_status: planningOnlyStatus,
    dna_library_certification_message: pass ? DNA_LIBRARY_CERTIFICATION_MESSAGE : null,
    ready_for_image_app_adapter: pass && imageAppMappingValid === 'PASS',
    ready_for_video_app_adapter: pass && videoAppMappingValid === 'PASS',
    source_audits: sourceAudits,
    final_verdict: pass
      ? CINEMATIC_DNA_QUALITY_GATE_PASS_VERDICT
      : CINEMATIC_DNA_QUALITY_GATE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, CINEMATIC_DNA_QUALITY_GATE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, CINEMATIC_DNA_QUALITY_GATE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
