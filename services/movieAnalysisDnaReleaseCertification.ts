import fs from 'node:fs';
import path from 'node:path';
import { DNA_ADAPTER_CERTIFICATION_PASS_VERDICT } from './movieAnalysisDnaAdapterCertification.js';
import {
  type DnaAdapterLibraryEntry,
  loadMovieAnalysisDnaAdapterLibrary,
} from './movieAnalysisDnaAdapterLibrary.js';
import { DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT } from './movieAnalysisDnaConsumerImportTest.js';
import {
  loadMovieAnalysisDnaImageBridge,
  loadMovieAnalysisDnaVideoBridge,
} from './movieAnalysisDnaConsumerBridge.js';
import {
  ADAPTERS_PER_SOURCE,
  EXPECTED_ADAPTER_COUNT,
  loadMovieAnalysisDnaPackage,
} from './movieAnalysisDnaPackaging.js';
import {
  DNA_RELEASE_MANIFEST_PATH,
  DNA_RELEASE_PACKAGE_PASS_VERDICT,
  DNA_RELEASE_PACKAGE_PATH,
  DNA_RELEASE_REPORT_PATH,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_SOURCE_VIDEO_IDS,
  type MovieAnalysisDnaReleasePackage,
  type MovieAnalysisDnaReleaseReport,
  loadMovieAnalysisDnaReleaseManifest,
  loadMovieAnalysisDnaReleasePackage,
} from './movieAnalysisDnaReleasePackage.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DNA_RELEASE_CERTIFICATION_PHASE =
  'PHASE-SOURCE-VIDEO-063-MOVIE_ANALYSIS_DNA_RELEASE_CERTIFICATION_V1' as const;
export const DNA_RELEASE_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_DNA_RELEASE_CERTIFICATION_V1' as const;
export const DNA_RELEASE_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_DNA_RELEASE_CERTIFICATION_V1' as const;
export const DNA_RELEASE_CERTIFICATION_REPORT_PATH =
  'reports/movie-analysis-dna-release-certification-report.json' as const;
export const DNA_RELEASE_CERTIFICATION_MD_PATH =
  'reports/MOVIE_ANALYSIS_DNA_RELEASE_CERTIFICATION.md' as const;
export const RELEASE_CERTIFICATION_STATUS_MESSAGE =
  'DNA Release Package Production Ready' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, ADAPTERS_PER_SOURCE };

export type CertificationStatus = 'PASS' | 'FAIL';

export type DnaReleaseCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceDnaReleaseCertificationAudit = {
  source_video_id: string;
  traceability_certified: CertificationStatus;
  certification_chain_certified: CertificationStatus;
  image_mapping_certified: CertificationStatus;
  video_mapping_certified: CertificationStatus;
  release_integrity_certified: CertificationStatus;
  source_certified: CertificationStatus;
};

export type MovieAnalysisDnaReleaseCertificationReport = {
  report_id: string;
  phase: typeof DNA_RELEASE_CERTIFICATION_PHASE;
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
  no_generation: true;
  source_count: number;
  adapter_count: number;
  release_package_path: typeof DNA_RELEASE_PACKAGE_PATH;
  release_manifest_path: typeof DNA_RELEASE_MANIFEST_PATH;
  release_report_path: typeof DNA_RELEASE_REPORT_PATH;
  release_package_valid: CertificationStatus;
  manifest_valid: CertificationStatus;
  report_valid: CertificationStatus;
  source_count_valid: CertificationStatus;
  adapter_count_valid: CertificationStatus;
  traceability: CertificationStatus;
  certification_chain: CertificationStatus;
  image_mapping: CertificationStatus;
  video_mapping: CertificationStatus;
  release_integrity: CertificationStatus;
  release_certification_ready: CertificationStatus;
  planning_only_status: CertificationStatus;
  certification_status_message: typeof RELEASE_CERTIFICATION_STATUS_MESSAGE | null;
  source_audits: SourceDnaReleaseCertificationAudit[];
  final_verdict:
    | typeof DNA_RELEASE_CERTIFICATION_PASS_VERDICT
    | typeof DNA_RELEASE_CERTIFICATION_FAIL_VERDICT;
  issues: DnaReleaseCertificationIssue[];
};

function loadReleaseReport(projectRoot: string): MovieAnalysisDnaReleaseReport | null {
  const abs = path.join(projectRoot, DNA_RELEASE_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisDnaReleaseReport;
}

function aggregateStatus(
  audits: SourceDnaReleaseCertificationAudit[],
  field: keyof SourceDnaReleaseCertificationAudit
): CertificationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function isCertificationChainValid(
  releasePackage: MovieAnalysisDnaReleasePackage,
  releaseReport: MovieAnalysisDnaReleaseReport
): boolean {
  return (
    releasePackage.certification_verdict === DNA_ADAPTER_CERTIFICATION_PASS_VERDICT &&
    releasePackage.certification_status === 'CERTIFIED' &&
    releasePackage.import_test_verdict === DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT &&
    releaseReport.final_verdict === DNA_RELEASE_PACKAGE_PASS_VERDICT &&
    releaseReport.certification_status_preserved === 'PASS' &&
    releasePackage.release_readiness.certification_status_preserved === true
  );
}

function isTraceabilityValid(
  releasePackage: MovieAnalysisDnaReleasePackage,
  releaseReport: MovieAnalysisDnaReleaseReport
): boolean {
  const setIdsValid =
    Boolean(releasePackage.cinematic_dna_set_id) &&
    Boolean(releasePackage.integration_set_id) &&
    Boolean(releasePackage.adapter_library_id) &&
    Boolean(releasePackage.package_id);

  const readinessValid = releasePackage.release_readiness.traceability_preserved === true;

  const reportValid = releaseReport.traceability_preserved === 'PASS';

  const sourcesValid = releasePackage.sources.every(
    (source) =>
      Boolean(source.cinematic_dna_id) &&
      Boolean(source.integration_id) &&
      Boolean(source.adapter_library_entry_id) &&
      source.adapter_ids.length === ADAPTERS_PER_SOURCE
  );

  return setIdsValid && readinessValid && reportValid && sourcesValid;
}

function isImageMappingValid(
  releaseSource: MovieAnalysisDnaReleasePackage['sources'][number],
  libraryEntry: DnaAdapterLibraryEntry | undefined,
  packageSource: { image_mapping_ready: boolean } | undefined
): boolean {
  return (
    releaseSource.image_bridge_ready === true &&
    packageSource?.image_mapping_ready === true &&
    libraryEntry?.image_adapter_mapping.adapter_ready === true &&
    libraryEntry.image_adapter_mapping.emotion_adapter === true
  );
}

function isVideoMappingValid(
  releaseSource: MovieAnalysisDnaReleasePackage['sources'][number],
  libraryEntry: DnaAdapterLibraryEntry | undefined,
  packageSource: { video_mapping_ready: boolean } | undefined
): boolean {
  return (
    releaseSource.video_bridge_ready === true &&
    packageSource?.video_mapping_ready === true &&
    libraryEntry?.video_adapter_mapping.adapter_ready === true &&
    libraryEntry.video_adapter_mapping.scene_adapter === true &&
    libraryEntry.video_adapter_mapping.camera_adapter === true &&
    libraryEntry.video_adapter_mapping.transition_adapter === true &&
    libraryEntry.video_adapter_mapping.continuity_adapter === true &&
    libraryEntry.video_adapter_mapping.storytelling_adapter === true
  );
}

function auditSource(
  releasePackage: MovieAnalysisDnaReleasePackage,
  releaseReport: MovieAnalysisDnaReleaseReport,
  libraryEntry: DnaAdapterLibraryEntry | undefined,
  packageSource: { image_mapping_ready: boolean; video_mapping_ready: boolean } | undefined,
  releaseReportSource:
    | MovieAnalysisDnaReleaseReport['source_audits'][number]
    | undefined,
  sourceVideoId: string
): SourceDnaReleaseCertificationAudit {
  const releaseSource = releasePackage.sources.find(
    (source) => source.source_video_id === sourceVideoId
  );

  if (!releaseSource || !libraryEntry || !packageSource || !releaseReportSource) {
    return {
      source_video_id: sourceVideoId,
      traceability_certified: 'FAIL',
      certification_chain_certified: 'FAIL',
      image_mapping_certified: 'FAIL',
      video_mapping_certified: 'FAIL',
      release_integrity_certified: 'FAIL',
      source_certified: 'FAIL',
    };
  }

  const traceabilityCertified =
    Boolean(releaseSource.cinematic_dna_id) &&
    releaseSource.cinematic_dna_id === libraryEntry.cinematic_dna_id &&
    releaseSource.integration_id === libraryEntry.integration_id &&
    releaseSource.adapter_library_entry_id === libraryEntry.adapter_library_entry_id &&
    releaseReportSource.traceability_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const certificationChainCertified =
    releasePackage.certification_verdict === DNA_ADAPTER_CERTIFICATION_PASS_VERDICT &&
    releasePackage.import_test_verdict === DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT &&
    releaseReportSource.certification_status_preserved === 'PASS' &&
    releaseSource.import_test_ready === true
      ? 'PASS'
      : 'FAIL';

  const imageMappingCertified = isImageMappingValid(releaseSource, libraryEntry, packageSource)
    ? 'PASS'
    : 'FAIL';

  const videoMappingCertified = isVideoMappingValid(releaseSource, libraryEntry, packageSource)
    ? 'PASS'
    : 'FAIL';

  const releaseIntegrityCertified =
    releaseReportSource.source_release_ready === 'PASS' &&
    releaseSource.adapter_ids.length === ADAPTERS_PER_SOURCE
      ? 'PASS'
      : 'FAIL';

  const sourceCertified =
    traceabilityCertified === 'PASS' &&
    certificationChainCertified === 'PASS' &&
    imageMappingCertified === 'PASS' &&
    videoMappingCertified === 'PASS' &&
    releaseIntegrityCertified === 'PASS'
      ? 'PASS'
      : 'FAIL';

  return {
    source_video_id: sourceVideoId,
    traceability_certified: traceabilityCertified,
    certification_chain_certified: certificationChainCertified,
    image_mapping_certified: imageMappingCertified,
    video_mapping_certified: videoMappingCertified,
    release_integrity_certified: releaseIntegrityCertified,
    source_certified: sourceCertified,
  };
}

function buildMarkdown(report: MovieAnalysisDnaReleaseCertificationReport): string {
  const lines = [
    '# Movie Analysis DNA Release Certification',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Certification Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| runtime_execution | ${report.runtime_execution} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Release Artifact Validation',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| release_package_valid | ${report.release_package_valid} |`,
    `| manifest_valid | ${report.manifest_valid} |`,
    `| report_valid | ${report.report_valid} |`,
    '',
    '## Certification Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| source_count_valid | ${report.source_count_valid} |`,
    `| adapter_count_valid | ${report.adapter_count_valid} |`,
    `| traceability | ${report.traceability} |`,
    `| certification_chain | ${report.certification_chain} |`,
    `| image_mapping | ${report.image_mapping} |`,
    `| video_mapping | ${report.video_mapping} |`,
    `| release_integrity | ${report.release_integrity} |`,
    `| release_certification_ready | ${report.release_certification_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Certification Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- traceability_certified: ${audit.traceability_certified}`,
      `- certification_chain_certified: ${audit.certification_chain_certified}`,
      `- image_mapping_certified: ${audit.image_mapping_certified}`,
      `- video_mapping_certified: ${audit.video_mapping_certified}`,
      `- release_integrity_certified: ${audit.release_integrity_certified}`,
      `- source_certified: ${audit.source_certified}`,
      ''
    );
  }

  if (report.certification_status_message) {
    lines.push('## Status', '', report.certification_status_message, '');
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

export function writeMovieAnalysisDnaReleaseCertificationReport(
  projectRoot?: string
): MovieAnalysisDnaReleaseCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: DnaReleaseCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const releasePackage = loadMovieAnalysisDnaReleasePackage(root);
  if (!releasePackage) {
    issues.push({
      code: 'RELEASE_PACKAGE_MISSING',
      message: `Missing ${DNA_RELEASE_PACKAGE_PATH}`,
      severity: 'error',
    });
  }

  const releaseManifest = loadMovieAnalysisDnaReleaseManifest(root);
  if (!releaseManifest) {
    issues.push({
      code: 'RELEASE_MANIFEST_MISSING',
      message: `Missing ${DNA_RELEASE_MANIFEST_PATH}`,
      severity: 'error',
    });
  }

  const releaseReport = loadReleaseReport(root);
  if (!releaseReport) {
    issues.push({
      code: 'RELEASE_REPORT_MISSING',
      message: `Missing ${DNA_RELEASE_REPORT_PATH}`,
      severity: 'error',
    });
  }

  const dnaPackage = loadMovieAnalysisDnaPackage(root);
  const adapterLibrary = loadMovieAnalysisDnaAdapterLibrary(root);
  const imageBridge = loadMovieAnalysisDnaImageBridge(root);
  const videoBridge = loadMovieAnalysisDnaVideoBridge(root);

  if (!releasePackage || !releaseManifest || !releaseReport) {
    const report: MovieAnalysisDnaReleaseCertificationReport = {
      report_id: 'movie-analysis-dna-release-certification-report-v1',
      phase: DNA_RELEASE_CERTIFICATION_PHASE,
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
      no_generation: true,
      source_count: 0,
      adapter_count: 0,
      release_package_path: DNA_RELEASE_PACKAGE_PATH,
      release_manifest_path: DNA_RELEASE_MANIFEST_PATH,
      release_report_path: DNA_RELEASE_REPORT_PATH,
      release_package_valid: 'FAIL',
      manifest_valid: 'FAIL',
      report_valid: 'FAIL',
      source_count_valid: 'FAIL',
      adapter_count_valid: 'FAIL',
      traceability: 'FAIL',
      certification_chain: 'FAIL',
      image_mapping: 'FAIL',
      video_mapping: 'FAIL',
      release_integrity: 'FAIL',
      release_certification_ready: 'FAIL',
      planning_only_status: 'FAIL',
      certification_status_message: null,
      source_audits: [],
      final_verdict: DNA_RELEASE_CERTIFICATION_FAIL_VERDICT,
      issues,
    };

    fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(root, DNA_RELEASE_CERTIFICATION_REPORT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(root, DNA_RELEASE_CERTIFICATION_MD_PATH),
      `${buildMarkdown(report)}\n`,
      'utf8'
    );

    return report;
  }

  const releasePackageValid =
    releasePackage.release_readiness.release_ready === true &&
    releasePackage.certification_status === 'CERTIFIED'
      ? 'PASS'
      : 'FAIL';

  if (releasePackageValid === 'FAIL') {
    issues.push({
      code: 'RELEASE_PACKAGE_INVALID',
      message: 'Release package is not ready for certification',
      severity: 'error',
    });
  }

  let manifestValid: CertificationStatus = 'PASS';
  for (const asset of releaseManifest.assets) {
    if (!fs.existsSync(path.join(root, asset.path))) {
      manifestValid = 'FAIL';
      issues.push({
        code: 'MANIFEST_ASSET_MISSING',
        message: `Missing manifest asset ${asset.path}`,
        severity: 'error',
      });
    }
  }

  if (releaseManifest.source_count !== releasePackage.source_count) {
    manifestValid = 'FAIL';
    issues.push({
      code: 'MANIFEST_SOURCE_COUNT_MISMATCH',
      message: 'Manifest source_count does not match release package',
      severity: 'error',
    });
  }

  if (releaseManifest.adapter_count !== releasePackage.adapter_count) {
    manifestValid = 'FAIL';
    issues.push({
      code: 'MANIFEST_ADAPTER_COUNT_MISMATCH',
      message: 'Manifest adapter_count does not match release package',
      severity: 'error',
    });
  }

  const reportValid =
    releaseReport.final_verdict === DNA_RELEASE_PACKAGE_PASS_VERDICT &&
    releaseReport.release_ready === 'PASS'
      ? 'PASS'
      : 'FAIL';

  if (reportValid === 'FAIL') {
    issues.push({
      code: 'RELEASE_REPORT_INVALID',
      message: `Release report must have ${DNA_RELEASE_PACKAGE_PASS_VERDICT} and release_ready=PASS`,
      severity: 'error',
    });
  }

  const sourceCountValid =
    releasePackage.source_count === EXPECTED_SOURCE_COUNT &&
    releaseManifest.source_count === EXPECTED_SOURCE_COUNT &&
    releaseReport.source_count === EXPECTED_SOURCE_COUNT
      ? 'PASS'
      : 'FAIL';

  if (sourceCountValid === 'FAIL') {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  const adapterCountValid =
    releasePackage.adapter_count === EXPECTED_ADAPTER_COUNT &&
    releaseManifest.adapter_count === EXPECTED_ADAPTER_COUNT &&
    releaseReport.adapter_count === EXPECTED_ADAPTER_COUNT
      ? 'PASS'
      : 'FAIL';

  if (adapterCountValid === 'FAIL') {
    issues.push({
      code: 'ADAPTER_COUNT_MISMATCH',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }

  if (imageBridge && imageBridge.package_id !== releasePackage.package_id) {
    issues.push({
      code: 'IMAGE_BRIDGE_PACKAGE_MISMATCH',
      message: 'Image bridge package_id does not match release package',
      severity: 'error',
    });
  }

  if (videoBridge && videoBridge.package_id !== releasePackage.package_id) {
    issues.push({
      code: 'VIDEO_BRIDGE_PACKAGE_MISMATCH',
      message: 'Video bridge package_id does not match release package',
      severity: 'error',
    });
  }

  const sourceAudits: SourceDnaReleaseCertificationAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const libraryEntry = adapterLibrary?.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const packageSource = dnaPackage?.sources.find(
      (source) => source.source_video_id === sourceVideoId
    );
    const releaseReportSource = releaseReport.source_audits.find(
      (audit) => audit.source_video_id === sourceVideoId
    );

    const audit = auditSource(
      releasePackage,
      releaseReport,
      libraryEntry,
      packageSource,
      releaseReportSource,
      sourceVideoId
    );
    sourceAudits.push(audit);

    if (audit.source_certified === 'FAIL') {
      issues.push({
        code: 'SOURCE_NOT_CERTIFIED',
        message: `DNA release certification failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const safetyValid =
    releasePackage.safety_summary.planning_only === true &&
    releasePackage.safety_summary.generation === false &&
    releasePackage.safety_summary.runtime_execution === false &&
    releasePackage.safety_summary.gpu_execution === false &&
    releasePackage.safety_summary.external_call_allowed === false &&
    releaseReport.planning_only === true &&
    releaseReport.planning_only_status === 'PASS';

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Safety planning_only validation failed',
      severity: 'error',
    });
  }

  const traceability =
    isTraceabilityValid(releasePackage, releaseReport) &&
    aggregateStatus(sourceAudits, 'traceability_certified') === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const certificationChain =
    isCertificationChainValid(releasePackage, releaseReport) &&
    aggregateStatus(sourceAudits, 'certification_chain_certified') === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const imageMapping = aggregateStatus(sourceAudits, 'image_mapping_certified');
  const videoMapping = aggregateStatus(sourceAudits, 'video_mapping_certified');

  const releaseIntegrityBase =
    releasePackageValid === 'PASS' &&
    manifestValid === 'PASS' &&
    reportValid === 'PASS' &&
    releasePackage.release_readiness.dna_package_linked === true &&
    releasePackage.release_readiness.image_bridge_linked === true &&
    releasePackage.release_readiness.video_bridge_linked === true &&
    releasePackage.release_readiness.import_test_linked === true &&
    releasePackage.release_readiness.source_ids_preserved === true &&
    releasePackage.release_readiness.adapter_ids_preserved === true &&
    releaseReport.release_ready === 'PASS';

  const releaseIntegrity =
    releaseIntegrityBase &&
    aggregateStatus(sourceAudits, 'release_integrity_certified') === 'PASS'
      ? 'PASS'
      : 'FAIL';

  if (releaseIntegrity === 'FAIL') {
    issues.push({
      code: 'RELEASE_INTEGRITY_FAIL',
      message: 'Release integrity validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: CertificationStatus = safetyValid ? 'PASS' : 'FAIL';

  const releaseCertificationReady =
    releasePackageValid === 'PASS' &&
    manifestValid === 'PASS' &&
    reportValid === 'PASS' &&
    sourceCountValid === 'PASS' &&
    adapterCountValid === 'PASS' &&
    traceability === 'PASS' &&
    certificationChain === 'PASS' &&
    imageMapping === 'PASS' &&
    videoMapping === 'PASS' &&
    releaseIntegrity === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.source_certified === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = releaseCertificationReady === 'PASS';

  const report: MovieAnalysisDnaReleaseCertificationReport = {
    report_id: 'movie-analysis-dna-release-certification-report-v1',
    phase: DNA_RELEASE_CERTIFICATION_PHASE,
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
    no_generation: true,
    source_count: releasePackage.source_count,
    adapter_count: releasePackage.adapter_count,
    release_package_path: DNA_RELEASE_PACKAGE_PATH,
    release_manifest_path: DNA_RELEASE_MANIFEST_PATH,
    release_report_path: DNA_RELEASE_REPORT_PATH,
    release_package_valid: releasePackageValid,
    manifest_valid: manifestValid,
    report_valid: reportValid,
    source_count_valid: sourceCountValid,
    adapter_count_valid: adapterCountValid,
    traceability,
    certification_chain: certificationChain,
    image_mapping: imageMapping,
    video_mapping: videoMapping,
    release_integrity: releaseIntegrity,
    release_certification_ready: releaseCertificationReady,
    planning_only_status: planningOnlyStatus,
    certification_status_message: pass ? RELEASE_CERTIFICATION_STATUS_MESSAGE : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? DNA_RELEASE_CERTIFICATION_PASS_VERDICT
      : DNA_RELEASE_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, DNA_RELEASE_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, DNA_RELEASE_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
