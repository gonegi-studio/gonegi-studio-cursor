import fs from 'node:fs';
import path from 'node:path';
import { CINEMATIC_DNA_PATH, loadMovieAnalysisCinematicDna } from './movieAnalysisCinematicDnaExtraction.js';
import {
  CINEMATIC_DNA_INTEGRATION_PATH,
  loadMovieAnalysisCinematicDnaIntegration,
} from './movieAnalysisCinematicDnaIntegration.js';
import {
  DNA_ADAPTER_LIBRARY_PASS_VERDICT,
  DNA_ADAPTER_LIBRARY_PATH,
  DNA_ADAPTER_LIBRARY_REPORT_PATH,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_SOURCE_VIDEO_IDS,
  type DnaAdapterLibraryEntry,
  type MovieAnalysisDnaAdapterLibrary,
  loadMovieAnalysisDnaAdapterLibrary,
} from './movieAnalysisDnaAdapterLibrary.js';
import {
  DNA_ADAPTER_VALIDATION_PASS_VERDICT,
  DNA_ADAPTER_VALIDATION_REPORT_PATH,
  type MovieAnalysisDnaAdapterValidationReport,
  type SourceAdapterValidationAudit,
} from './movieAnalysisDnaAdapterValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DNA_ADAPTER_CERTIFICATION_PHASE =
  'PHASE-SOURCE-VIDEO-058-MOVIE_ANALYSIS_DNA_ADAPTER_CERTIFICATION_V1' as const;
export const DNA_ADAPTER_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_DNA_ADAPTER_CERTIFICATION_V1' as const;
export const DNA_ADAPTER_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_DNA_ADAPTER_CERTIFICATION_V1' as const;
export const DNA_ADAPTER_CERTIFICATION_REPORT_PATH =
  'reports/movie-analysis-dna-adapter-certification-report.json' as const;
export const DNA_ADAPTER_CERTIFICATION_MD_PATH =
  'reports/MOVIE_ANALYSIS_DNA_ADAPTER_CERTIFICATION.md' as const;
export const ADAPTER_CERTIFICATION_STATUS_MESSAGE =
  'DNA Adapter Library Production Ready' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type CertificationStatus = 'PASS' | 'FAIL';

export type AdapterCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceAdapterCertificationAudit = {
  source_video_id: string;
  scene_adapter_certified: CertificationStatus;
  camera_adapter_certified: CertificationStatus;
  emotion_adapter_certified: CertificationStatus;
  transition_adapter_certified: CertificationStatus;
  continuity_adapter_certified: CertificationStatus;
  storytelling_adapter_certified: CertificationStatus;
  image_mapping_certified: CertificationStatus;
  video_mapping_certified: CertificationStatus;
  traceability_certified: CertificationStatus;
  source_certified: CertificationStatus;
};

export type MovieAnalysisDnaAdapterCertificationReport = {
  report_id: string;
  phase: typeof DNA_ADAPTER_CERTIFICATION_PHASE;
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
  validation_report_path: typeof DNA_ADAPTER_VALIDATION_REPORT_PATH;
  adapter_library_ready: CertificationStatus;
  scene_adapter_certified: CertificationStatus;
  camera_adapter_certified: CertificationStatus;
  emotion_adapter_certified: CertificationStatus;
  transition_adapter_certified: CertificationStatus;
  continuity_adapter_certified: CertificationStatus;
  storytelling_adapter_certified: CertificationStatus;
  image_mapping_certified: CertificationStatus;
  video_mapping_certified: CertificationStatus;
  traceability_certified: CertificationStatus;
  adapter_certification_ready: CertificationStatus;
  planning_only_status: CertificationStatus;
  certification_status_message: typeof ADAPTER_CERTIFICATION_STATUS_MESSAGE | null;
  source_audits: SourceAdapterCertificationAudit[];
  final_verdict:
    | typeof DNA_ADAPTER_CERTIFICATION_PASS_VERDICT
    | typeof DNA_ADAPTER_CERTIFICATION_FAIL_VERDICT;
  issues: AdapterCertificationIssue[];
};

function loadAdapterValidationReport(
  projectRoot: string
): MovieAnalysisDnaAdapterValidationReport | null {
  const abs = path.join(projectRoot, DNA_ADAPTER_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisDnaAdapterValidationReport;
}

function isLibraryEntryCertifiable(entry: DnaAdapterLibraryEntry): boolean {
  return (
    entry.library_readiness === 'READY' &&
    entry.reusability_score > 0 &&
    entry.safety.planning_only === true &&
    entry.safety.runtime_execution === false &&
    entry.safety.video_generation === false &&
    entry.safety.image_generation === false &&
    entry.safety.gpu_execution === false &&
    entry.safety.external_call_allowed === false
  );
}

function isTraceabilityCertified(
  libraryEntry: DnaAdapterLibraryEntry,
  library: MovieAnalysisDnaAdapterLibrary,
  validationAudit: SourceAdapterValidationAudit
): boolean {
  return (
    Boolean(libraryEntry.cinematic_dna_id) &&
    Boolean(libraryEntry.integration_id) &&
    Boolean(libraryEntry.adapter_library_entry_id) &&
    library.cinematic_dna_set_id.length > 0 &&
    library.integration_set_id.length > 0 &&
    library.quality_gate_verdict.length > 0 &&
    validationAudit.adapter_trace_integrity === 'PASS' &&
    validationAudit.adapter_consistency === 'PASS'
  );
}

function auditSource(
  libraryEntry: DnaAdapterLibraryEntry,
  library: MovieAnalysisDnaAdapterLibrary,
  validationAudit: SourceAdapterValidationAudit | undefined
): SourceAdapterCertificationAudit {
  if (!validationAudit || !isLibraryEntryCertifiable(libraryEntry)) {
    return {
      source_video_id: libraryEntry.source_video_id,
      scene_adapter_certified: 'FAIL',
      camera_adapter_certified: 'FAIL',
      emotion_adapter_certified: 'FAIL',
      transition_adapter_certified: 'FAIL',
      continuity_adapter_certified: 'FAIL',
      storytelling_adapter_certified: 'FAIL',
      image_mapping_certified: 'FAIL',
      video_mapping_certified: 'FAIL',
      traceability_certified: 'FAIL',
      source_certified: 'FAIL',
    };
  }

  const sceneCertified =
    validationAudit.scene_adapter_valid === 'PASS' &&
    libraryEntry.scene_adapter.adapter_ready === true
      ? 'PASS'
      : 'FAIL';
  const cameraCertified =
    validationAudit.camera_adapter_valid === 'PASS' &&
    libraryEntry.camera_adapter.adapter_ready === true
      ? 'PASS'
      : 'FAIL';
  const emotionCertified =
    validationAudit.emotion_adapter_valid === 'PASS' &&
    libraryEntry.emotion_adapter.adapter_ready === true
      ? 'PASS'
      : 'FAIL';
  const transitionCertified =
    validationAudit.transition_adapter_valid === 'PASS' &&
    libraryEntry.transition_adapter.adapter_ready === true
      ? 'PASS'
      : 'FAIL';
  const continuityCertified =
    validationAudit.continuity_adapter_valid === 'PASS' &&
    libraryEntry.continuity_adapter.adapter_ready === true
      ? 'PASS'
      : 'FAIL';
  const storytellingCertified =
    validationAudit.storytelling_adapter_valid === 'PASS' &&
    libraryEntry.storytelling_adapter.adapter_ready === true
      ? 'PASS'
      : 'FAIL';
  const imageCertified =
    validationAudit.image_mapping_valid === 'PASS' &&
    libraryEntry.image_adapter_mapping.adapter_ready === true
      ? 'PASS'
      : 'FAIL';
  const videoCertified =
    validationAudit.video_mapping_valid === 'PASS' &&
    libraryEntry.video_adapter_mapping.adapter_ready === true
      ? 'PASS'
      : 'FAIL';
  const traceability = isTraceabilityCertified(libraryEntry, library, validationAudit)
    ? 'PASS'
    : 'FAIL';

  const sourceCertified =
    sceneCertified === 'PASS' &&
    cameraCertified === 'PASS' &&
    emotionCertified === 'PASS' &&
    transitionCertified === 'PASS' &&
    continuityCertified === 'PASS' &&
    storytellingCertified === 'PASS' &&
    imageCertified === 'PASS' &&
    videoCertified === 'PASS' &&
    traceability === 'PASS' &&
    validationAudit.source_pass === 'PASS'
      ? 'PASS'
      : 'FAIL';

  return {
    source_video_id: libraryEntry.source_video_id,
    scene_adapter_certified: sceneCertified,
    camera_adapter_certified: cameraCertified,
    emotion_adapter_certified: emotionCertified,
    transition_adapter_certified: transitionCertified,
    continuity_adapter_certified: continuityCertified,
    storytelling_adapter_certified: storytellingCertified,
    image_mapping_certified: imageCertified,
    video_mapping_certified: videoCertified,
    traceability_certified: traceability,
    source_certified: sourceCertified,
  };
}

function aggregateStatus(
  audits: SourceAdapterCertificationAudit[],
  field: keyof SourceAdapterCertificationAudit
): CertificationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisDnaAdapterCertificationReport): string {
  const lines = [
    '# Movie Analysis DNA Adapter Certification',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status_message) {
    lines.push(`## ${report.certification_status_message}`, '');
  }

  lines.push(
    '## Certification Pipeline',
    '',
    '```',
    'Movie Analysis Dataset',
    '→ Cinematic DNA',
    '→ DNA Integration',
    '→ DNA Quality Gate',
    '→ Certified DNA Library',
    '→ DNA Adapter Library',
    '→ DNA Adapter Validation',
    '→ DNA Adapter Certification',
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
    '## Certification Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_library_ready | ${report.adapter_library_ready} |`,
    `| scene_adapter_certified | ${report.scene_adapter_certified} |`,
    `| camera_adapter_certified | ${report.camera_adapter_certified} |`,
    `| emotion_adapter_certified | ${report.emotion_adapter_certified} |`,
    `| transition_adapter_certified | ${report.transition_adapter_certified} |`,
    `| continuity_adapter_certified | ${report.continuity_adapter_certified} |`,
    `| storytelling_adapter_certified | ${report.storytelling_adapter_certified} |`,
    `| image_mapping_certified | ${report.image_mapping_certified} |`,
    `| video_mapping_certified | ${report.video_mapping_certified} |`,
    `| traceability_certified | ${report.traceability_certified} |`,
    `| adapter_certification_ready | ${report.adapter_certification_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- scene_adapter_certified: ${audit.scene_adapter_certified}`,
      `- camera_adapter_certified: ${audit.camera_adapter_certified}`,
      `- emotion_adapter_certified: ${audit.emotion_adapter_certified}`,
      `- transition_adapter_certified: ${audit.transition_adapter_certified}`,
      `- continuity_adapter_certified: ${audit.continuity_adapter_certified}`,
      `- storytelling_adapter_certified: ${audit.storytelling_adapter_certified}`,
      `- image_mapping_certified: ${audit.image_mapping_certified}`,
      `- video_mapping_certified: ${audit.video_mapping_certified}`,
      `- traceability_certified: ${audit.traceability_certified}`,
      `- source_certified: ${audit.source_certified}`,
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

export function writeMovieAnalysisDnaAdapterCertificationReport(
  projectRoot?: string
): MovieAnalysisDnaAdapterCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: AdapterCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  if (!fs.existsSync(path.join(root, DNA_ADAPTER_LIBRARY_PATH))) {
    issues.push({
      code: 'ADAPTER_LIBRARY_MISSING',
      message: `Missing ${DNA_ADAPTER_LIBRARY_PATH}`,
      severity: 'error',
    });
  }

  const validationReport = loadAdapterValidationReport(root);
  if (!validationReport) {
    issues.push({
      code: 'VALIDATION_REPORT_MISSING',
      message: `Missing ${DNA_ADAPTER_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
  } else if (validationReport.final_verdict !== DNA_ADAPTER_VALIDATION_PASS_VERDICT) {
    issues.push({
      code: 'VALIDATION_NOT_PASS',
      message: `Adapter validation must have ${DNA_ADAPTER_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  } else if (validationReport.adapter_validation_ready !== 'PASS') {
    issues.push({
      code: 'VALIDATION_NOT_READY',
      message: 'Adapter validation adapter_validation_ready must be PASS',
      severity: 'error',
    });
  } else if (!validationReport.ready_for_adapter_certification) {
    issues.push({
      code: 'NOT_READY_FOR_CERTIFICATION',
      message: 'Validation report ready_for_adapter_certification must be true',
      severity: 'error',
    });
  }

  const libraryReportPath = path.join(root, DNA_ADAPTER_LIBRARY_REPORT_PATH);
  let adapterLibraryReady: CertificationStatus = 'FAIL';
  if (!fs.existsSync(libraryReportPath)) {
    issues.push({
      code: 'LIBRARY_REPORT_MISSING',
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
        code: 'LIBRARY_REPORT_NOT_PASS',
        message: `Adapter library must have ${DNA_ADAPTER_LIBRARY_PASS_VERDICT}`,
        severity: 'error',
      });
    }
    adapterLibraryReady =
      libraryReport.adapter_library_ready === 'PASS' &&
      libraryReport.final_verdict === DNA_ADAPTER_LIBRARY_PASS_VERDICT
        ? 'PASS'
        : 'FAIL';
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

  const sourceAudits: SourceAdapterCertificationAudit[] = [];

  if (library && validationReport && cinematicDna && integration) {
    if (library.source_count !== EXPECTED_SOURCE_COUNT) {
      issues.push({
        code: 'SOURCE_COUNT_MISMATCH',
        message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
        severity: 'error',
      });
    }

    if (library.cinematic_dna_set_id !== cinematicDna.cinematic_dna_set_id) {
      issues.push({
        code: 'CINEMATIC_DNA_SET_MISMATCH',
        message: 'Adapter library cinematic_dna_set_id traceability failed',
        severity: 'error',
      });
    }

    if (library.integration_set_id !== integration.integration_set_id) {
      issues.push({
        code: 'INTEGRATION_SET_MISMATCH',
        message: 'Adapter library integration_set_id traceability failed',
        severity: 'error',
      });
    }

    for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
      const libraryEntry = library.entries.find(
        (entry) => entry.source_video_id === sourceVideoId
      );
      const validationAudit = validationReport.source_audits.find(
        (audit) => audit.source_video_id === sourceVideoId
      );

      if (!libraryEntry) {
        issues.push({
          code: 'LIBRARY_ENTRY_MISSING',
          message: `Missing adapter library entry for ${sourceVideoId}`,
          severity: 'error',
          source_video_id: sourceVideoId,
        });
        continue;
      }

      const audit = auditSource(libraryEntry, library, validationAudit);
      sourceAudits.push(audit);

      if (audit.source_certified === 'FAIL') {
        issues.push({
          code: 'SOURCE_NOT_CERTIFIED',
          message: `Adapter certification failed for ${sourceVideoId}`,
          severity: 'error',
          source_video_id: sourceVideoId,
        });
      }
    }
  }

  const safetyValid =
    library?.safety_summary.planning_only === true &&
    library.safety_summary.runtime_execution === false &&
    library.safety_summary.video_generation === false &&
    library.safety_summary.image_generation === false &&
    library.safety_summary.gpu_execution === false &&
    library.safety_summary.external_call_allowed === false;

  if (library && !safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Safety planning_only validation failed',
      severity: 'error',
    });
  }

  const sceneAdapterCertified = aggregateStatus(sourceAudits, 'scene_adapter_certified');
  const cameraAdapterCertified = aggregateStatus(sourceAudits, 'camera_adapter_certified');
  const emotionAdapterCertified = aggregateStatus(sourceAudits, 'emotion_adapter_certified');
  const transitionAdapterCertified = aggregateStatus(
    sourceAudits,
    'transition_adapter_certified'
  );
  const continuityAdapterCertified = aggregateStatus(
    sourceAudits,
    'continuity_adapter_certified'
  );
  const storytellingAdapterCertified = aggregateStatus(
    sourceAudits,
    'storytelling_adapter_certified'
  );
  const imageMappingCertified = aggregateStatus(sourceAudits, 'image_mapping_certified');
  const videoMappingCertified = aggregateStatus(sourceAudits, 'video_mapping_certified');
  const traceabilityCertified = aggregateStatus(sourceAudits, 'traceability_certified');
  const planningOnlyStatus: CertificationStatus = safetyValid ? 'PASS' : 'FAIL';

  const adapterCertificationReady =
    adapterLibraryReady === 'PASS' &&
    sceneAdapterCertified === 'PASS' &&
    cameraAdapterCertified === 'PASS' &&
    emotionAdapterCertified === 'PASS' &&
    transitionAdapterCertified === 'PASS' &&
    continuityAdapterCertified === 'PASS' &&
    storytellingAdapterCertified === 'PASS' &&
    imageMappingCertified === 'PASS' &&
    videoMappingCertified === 'PASS' &&
    traceabilityCertified === 'PASS' &&
    sourceAudits.every((audit) => audit.source_certified === 'PASS') &&
    planningOnlyStatus === 'PASS' &&
    validationReport?.final_verdict === DNA_ADAPTER_VALIDATION_PASS_VERDICT
      ? 'PASS'
      : 'FAIL';

  const pass =
    library !== null &&
    validationReport !== null &&
    library.source_count === EXPECTED_SOURCE_COUNT &&
    adapterCertificationReady === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieAnalysisDnaAdapterCertificationReport = {
    report_id: 'movie-analysis-dna-adapter-certification-report-v1',
    phase: DNA_ADAPTER_CERTIFICATION_PHASE,
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
    validation_report_path: DNA_ADAPTER_VALIDATION_REPORT_PATH,
    adapter_library_ready: adapterLibraryReady,
    scene_adapter_certified: sceneAdapterCertified,
    camera_adapter_certified: cameraAdapterCertified,
    emotion_adapter_certified: emotionAdapterCertified,
    transition_adapter_certified: transitionAdapterCertified,
    continuity_adapter_certified: continuityAdapterCertified,
    storytelling_adapter_certified: storytellingAdapterCertified,
    image_mapping_certified: imageMappingCertified,
    video_mapping_certified: videoMappingCertified,
    traceability_certified: traceabilityCertified,
    adapter_certification_ready: adapterCertificationReady,
    planning_only_status: planningOnlyStatus,
    certification_status_message: pass ? ADAPTER_CERTIFICATION_STATUS_MESSAGE : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? DNA_ADAPTER_CERTIFICATION_PASS_VERDICT
      : DNA_ADAPTER_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, DNA_ADAPTER_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, DNA_ADAPTER_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
