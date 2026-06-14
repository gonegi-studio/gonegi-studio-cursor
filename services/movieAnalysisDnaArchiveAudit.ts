import fs from 'node:fs';
import path from 'node:path';
import { DNA_ADAPTER_CERTIFICATION_PASS_VERDICT } from './movieAnalysisDnaAdapterCertification.js';
import { DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT } from './movieAnalysisDnaConsumerImportTest.js';
import {
  ADAPTERS_PER_SOURCE,
  DNA_ARCHIVE_MANIFEST_PATH,
  DNA_ARCHIVE_PASS_VERDICT,
  DNA_ARCHIVE_PATH,
  DNA_ARCHIVE_REPORT_PATH,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  type MovieAnalysisDnaArchive,
  type MovieAnalysisDnaArchiveManifest,
  type MovieAnalysisDnaArchiveReport,
  loadMovieAnalysisDnaArchive,
  loadMovieAnalysisDnaArchiveManifest,
} from './movieAnalysisDnaArchive.js';
import {
  DNA_RELEASE_CERTIFICATION_PASS_VERDICT,
} from './movieAnalysisDnaReleaseCertification.js';
import {
  DNA_RELEASE_PACKAGE_PASS_VERDICT,
  DNA_RELEASE_VERSION,
  EXPECTED_SOURCE_VIDEO_IDS,
  loadMovieAnalysisDnaReleasePackage,
} from './movieAnalysisDnaReleasePackage.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DNA_ARCHIVE_AUDIT_PHASE =
  'PHASE-SOURCE-VIDEO-065-MOVIE_ANALYSIS_DNA_ARCHIVE_AUDIT_V1' as const;
export const DNA_ARCHIVE_AUDIT_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_DNA_ARCHIVE_AUDIT_V1' as const;
export const DNA_ARCHIVE_AUDIT_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_DNA_ARCHIVE_AUDIT_V1' as const;
export const DNA_ARCHIVE_AUDIT_REPORT_PATH =
  'reports/movie-analysis-dna-archive-audit-report.json' as const;
export const DNA_ARCHIVE_AUDIT_MD_PATH =
  'reports/MOVIE_ANALYSIS_DNA_ARCHIVE_AUDIT.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, ADAPTERS_PER_SOURCE };

export type AuditStatus = 'PASS' | 'FAIL';

export type DnaArchiveAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceDnaArchiveChainAudit = {
  source_video_id: string;
  traceability_chain: AuditStatus;
  certification_chain: AuditStatus;
  source_audit_ready: AuditStatus;
};

export type MovieAnalysisDnaArchiveAuditReport = {
  report_id: string;
  phase: typeof DNA_ARCHIVE_AUDIT_PHASE;
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
  archive_path: typeof DNA_ARCHIVE_PATH;
  archive_manifest_path: typeof DNA_ARCHIVE_MANIFEST_PATH;
  archive_report_path: typeof DNA_ARCHIVE_REPORT_PATH;
  source_count_valid: AuditStatus;
  adapter_count_valid: AuditStatus;
  archive_immutability: AuditStatus;
  traceability_chain: AuditStatus;
  certification_chain: AuditStatus;
  release_version_frozen: AuditStatus;
  archive_audit_ready: AuditStatus;
  planning_only_status: AuditStatus;
  source_audits: SourceDnaArchiveChainAudit[];
  final_verdict:
    | typeof DNA_ARCHIVE_AUDIT_PASS_VERDICT
    | typeof DNA_ARCHIVE_AUDIT_FAIL_VERDICT;
  issues: DnaArchiveAuditIssue[];
};

function loadArchiveReport(projectRoot: string): MovieAnalysisDnaArchiveReport | null {
  const abs = path.join(projectRoot, DNA_ARCHIVE_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisDnaArchiveReport;
}

function aggregateStatus(
  audits: SourceDnaArchiveChainAudit[],
  field: keyof SourceDnaArchiveChainAudit
): AuditStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function isArchiveImmutabilityValid(
  archive: MovieAnalysisDnaArchive,
  manifest: MovieAnalysisDnaArchiveManifest,
  archiveReport: MovieAnalysisDnaArchiveReport
): boolean {
  return (
    archive.immutable === true &&
    manifest.immutable === true &&
    archive.frozen_release_version === manifest.frozen_release_version &&
    archive.frozen_release_timestamp === manifest.frozen_release_timestamp &&
    archive.archive_readiness.release_version_frozen === true &&
    archive.archive_readiness.release_timestamp_frozen === true &&
    archive.archive_readiness.archive_ready === true &&
    archiveReport.archive_ready === 'PASS'
  );
}

function isTraceabilityChainValid(archive: MovieAnalysisDnaArchive): boolean {
  const trace = archive.traceability;
  const setIdsValid =
    Boolean(trace.package_id) &&
    Boolean(trace.image_bridge_id) &&
    Boolean(trace.video_bridge_id) &&
    Boolean(trace.adapter_library_id) &&
    Boolean(trace.cinematic_dna_set_id) &&
    Boolean(trace.integration_set_id) &&
    Boolean(trace.release_id);

  const sourceIdsValid =
    archive.all_source_ids.length === EXPECTED_SOURCE_COUNT &&
    EXPECTED_SOURCE_VIDEO_IDS.every((sourceId) => archive.all_source_ids.includes(sourceId));

  const perSourceValid = archive.sources.every(
    (source) =>
      Boolean(source.cinematic_dna_id) &&
      Boolean(source.integration_id) &&
      Boolean(source.adapter_library_entry_id) &&
      source.adapter_ids.length === ADAPTERS_PER_SOURCE
  );

  return (
    setIdsValid &&
    sourceIdsValid &&
    perSourceValid &&
    archive.archive_readiness.all_traceability_preserved === true
  );
}

function isCertificationChainValid(archive: MovieAnalysisDnaArchive): boolean {
  const certs = archive.certifications;
  return (
    certs.adapter_certification_verdict === DNA_ADAPTER_CERTIFICATION_PASS_VERDICT &&
    certs.import_test_verdict === DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT &&
    certs.release_package_verdict === DNA_RELEASE_PACKAGE_PASS_VERDICT &&
    certs.release_certification_verdict === DNA_RELEASE_CERTIFICATION_PASS_VERDICT &&
    certs.certification_status === 'CERTIFIED' &&
    archive.archive_readiness.all_certifications_preserved === true
  );
}

function isReleaseVersionFrozen(
  archive: MovieAnalysisDnaArchive,
  manifest: MovieAnalysisDnaArchiveManifest,
  releasePackage: NonNullable<ReturnType<typeof loadMovieAnalysisDnaReleasePackage>>
): boolean {
  return (
    archive.frozen_release_version === DNA_RELEASE_VERSION &&
    manifest.frozen_release_version === DNA_RELEASE_VERSION &&
    archive.frozen_release_version === releasePackage.release_version &&
    archive.frozen_release_timestamp === releasePackage.released_at &&
    manifest.frozen_release_timestamp === releasePackage.released_at
  );
}

function auditSource(
  archive: MovieAnalysisDnaArchive,
  sourceVideoId: string
): SourceDnaArchiveChainAudit {
  const source = archive.sources.find((entry) => entry.source_video_id === sourceVideoId);

  if (!source) {
    return {
      source_video_id: sourceVideoId,
      traceability_chain: 'FAIL',
      certification_chain: 'FAIL',
      source_audit_ready: 'FAIL',
    };
  }

  const traceabilityChain =
    Boolean(source.cinematic_dna_id) &&
    Boolean(source.integration_id) &&
    Boolean(source.adapter_library_entry_id) &&
    source.adapter_ids.length === ADAPTERS_PER_SOURCE &&
    source.adapter_ids.every((adapterId) => archive.all_adapter_ids.includes(adapterId))
      ? 'PASS'
      : 'FAIL';

  const certificationChain =
    archive.certifications.certification_status === 'CERTIFIED' &&
    archive.certifications.release_certification_verdict === DNA_RELEASE_CERTIFICATION_PASS_VERDICT
      ? 'PASS'
      : 'FAIL';

  const sourceAuditReady =
    traceabilityChain === 'PASS' && certificationChain === 'PASS' ? 'PASS' : 'FAIL';

  return {
    source_video_id: sourceVideoId,
    traceability_chain: traceabilityChain,
    certification_chain: certificationChain,
    source_audit_ready: sourceAuditReady,
  };
}

function buildMarkdown(report: MovieAnalysisDnaArchiveAuditReport): string {
  const lines = [
    '# Movie Analysis DNA Archive Audit',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Audit Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| runtime_execution | ${report.runtime_execution} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Archive Audit Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| source_count_valid | ${report.source_count_valid} |`,
    `| adapter_count_valid | ${report.adapter_count_valid} |`,
    `| archive_immutability | ${report.archive_immutability} |`,
    `| traceability_chain | ${report.traceability_chain} |`,
    `| certification_chain | ${report.certification_chain} |`,
    `| release_version_frozen | ${report.release_version_frozen} |`,
    `| archive_audit_ready | ${report.archive_audit_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Chain Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- traceability_chain: ${audit.traceability_chain}`,
      `- certification_chain: ${audit.certification_chain}`,
      `- source_audit_ready: ${audit.source_audit_ready}`,
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

export function writeMovieAnalysisDnaArchiveAuditReport(
  projectRoot?: string
): MovieAnalysisDnaArchiveAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: DnaArchiveAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const archive = loadMovieAnalysisDnaArchive(root);
  if (!archive) {
    issues.push({
      code: 'ARCHIVE_MISSING',
      message: `Missing ${DNA_ARCHIVE_PATH}`,
      severity: 'error',
    });
  }

  const manifest = loadMovieAnalysisDnaArchiveManifest(root);
  if (!manifest) {
    issues.push({
      code: 'ARCHIVE_MANIFEST_MISSING',
      message: `Missing ${DNA_ARCHIVE_MANIFEST_PATH}`,
      severity: 'error',
    });
  }

  const archiveReport = loadArchiveReport(root);
  if (!archiveReport) {
    issues.push({
      code: 'ARCHIVE_REPORT_MISSING',
      message: `Missing ${DNA_ARCHIVE_REPORT_PATH}`,
      severity: 'error',
    });
  }

  if (!archive || !manifest || !archiveReport) {
    const report: MovieAnalysisDnaArchiveAuditReport = {
      report_id: 'movie-analysis-dna-archive-audit-report-v1',
      phase: DNA_ARCHIVE_AUDIT_PHASE,
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
      archive_path: DNA_ARCHIVE_PATH,
      archive_manifest_path: DNA_ARCHIVE_MANIFEST_PATH,
      archive_report_path: DNA_ARCHIVE_REPORT_PATH,
      source_count_valid: 'FAIL',
      adapter_count_valid: 'FAIL',
      archive_immutability: 'FAIL',
      traceability_chain: 'FAIL',
      certification_chain: 'FAIL',
      release_version_frozen: 'FAIL',
      archive_audit_ready: 'FAIL',
      planning_only_status: 'FAIL',
      source_audits: [],
      final_verdict: DNA_ARCHIVE_AUDIT_FAIL_VERDICT,
      issues,
    };

    fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(root, DNA_ARCHIVE_AUDIT_REPORT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(root, DNA_ARCHIVE_AUDIT_MD_PATH),
      `${buildMarkdown(report)}\n`,
      'utf8'
    );

    return report;
  }

  if (archiveReport.final_verdict !== DNA_ARCHIVE_PASS_VERDICT) {
    issues.push({
      code: 'ARCHIVE_NOT_PASS',
      message: `Archive must have ${DNA_ARCHIVE_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  for (const asset of manifest.assets) {
    if (!fs.existsSync(path.join(root, asset.path))) {
      issues.push({
        code: 'MANIFEST_ASSET_MISSING',
        message: `Missing manifest asset ${asset.path}`,
        severity: 'error',
      });
    }
  }

  const releasePackage = loadMovieAnalysisDnaReleasePackage(root);
  if (!releasePackage) {
    issues.push({
      code: 'RELEASE_PACKAGE_MISSING',
      message: 'Release package missing for frozen version cross-check',
      severity: 'error',
    });
  }

  const sourceCountValid =
    archive.source_count === EXPECTED_SOURCE_COUNT &&
    manifest.source_count === EXPECTED_SOURCE_COUNT &&
    archiveReport.source_count === EXPECTED_SOURCE_COUNT
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
    archive.adapter_count === EXPECTED_ADAPTER_COUNT &&
    manifest.adapter_count === EXPECTED_ADAPTER_COUNT &&
    archiveReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    archive.all_adapter_ids.length === EXPECTED_ADAPTER_COUNT
      ? 'PASS'
      : 'FAIL';

  if (adapterCountValid === 'FAIL') {
    issues.push({
      code: 'ADAPTER_COUNT_MISMATCH',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }

  const archiveImmutability =
    releasePackage !== null &&
    isArchiveImmutabilityValid(archive, manifest, archiveReport)
      ? 'PASS'
      : 'FAIL';

  if (archiveImmutability === 'FAIL') {
    issues.push({
      code: 'ARCHIVE_IMMUTABILITY_FAIL',
      message: 'Archive immutability validation failed',
      severity: 'error',
    });
  }

  const sourceAudits: SourceDnaArchiveChainAudit[] = [];
  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const audit = auditSource(archive, sourceVideoId);
    sourceAudits.push(audit);

    if (audit.source_audit_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_ARCHIVE_AUDIT_FAIL',
        message: `Archive audit failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const traceabilityChain =
    isTraceabilityChainValid(archive) &&
    aggregateStatus(sourceAudits, 'traceability_chain') === 'PASS' &&
    archiveReport.all_traceability_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  if (traceabilityChain === 'FAIL') {
    issues.push({
      code: 'TRACEABILITY_CHAIN_FAIL',
      message: 'Traceability chain validation failed',
      severity: 'error',
    });
  }

  const certificationChain =
    isCertificationChainValid(archive) &&
    aggregateStatus(sourceAudits, 'certification_chain') === 'PASS' &&
    archiveReport.all_certifications_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  if (certificationChain === 'FAIL') {
    issues.push({
      code: 'CERTIFICATION_CHAIN_FAIL',
      message: 'Certification chain validation failed',
      severity: 'error',
    });
  }

  const releaseVersionFrozen =
    releasePackage !== null && isReleaseVersionFrozen(archive, manifest, releasePackage)
      ? 'PASS'
      : 'FAIL';

  if (releaseVersionFrozen === 'FAIL') {
    issues.push({
      code: 'RELEASE_VERSION_NOT_FROZEN',
      message: 'Release version/timestamp freeze validation failed',
      severity: 'error',
    });
  }

  const safetyValid =
    archive.safety_summary.planning_only === true &&
    archive.safety_summary.generation === false &&
    archive.safety_summary.runtime_execution === false &&
    archive.safety_summary.gpu_execution === false &&
    archive.safety_summary.external_call_allowed === false &&
    archiveReport.planning_only === true &&
    archiveReport.planning_only_status === 'PASS';

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Safety planning_only validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: AuditStatus = safetyValid ? 'PASS' : 'FAIL';

  const archiveAuditReady =
    sourceCountValid === 'PASS' &&
    adapterCountValid === 'PASS' &&
    archiveImmutability === 'PASS' &&
    traceabilityChain === 'PASS' &&
    certificationChain === 'PASS' &&
    releaseVersionFrozen === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    archiveReport.archive_ready === 'PASS' &&
    sourceAudits.every((audit) => audit.source_audit_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = archiveAuditReady === 'PASS';

  const report: MovieAnalysisDnaArchiveAuditReport = {
    report_id: 'movie-analysis-dna-archive-audit-report-v1',
    phase: DNA_ARCHIVE_AUDIT_PHASE,
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
    source_count: archive.source_count,
    adapter_count: archive.adapter_count,
    archive_path: DNA_ARCHIVE_PATH,
    archive_manifest_path: DNA_ARCHIVE_MANIFEST_PATH,
    archive_report_path: DNA_ARCHIVE_REPORT_PATH,
    source_count_valid: sourceCountValid,
    adapter_count_valid: adapterCountValid,
    archive_immutability: archiveImmutability,
    traceability_chain: traceabilityChain,
    certification_chain: certificationChain,
    release_version_frozen: releaseVersionFrozen,
    archive_audit_ready: archiveAuditReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass ? DNA_ARCHIVE_AUDIT_PASS_VERDICT : DNA_ARCHIVE_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, DNA_ARCHIVE_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, DNA_ARCHIVE_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
