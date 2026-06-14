import fs from 'node:fs';
import path from 'node:path';
import { DNA_ADAPTER_CERTIFICATION_PASS_VERDICT } from './movieAnalysisDnaAdapterCertification.js';
import { DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT } from './movieAnalysisDnaConsumerImportTest.js';
import {
  ADAPTERS_PER_SOURCE,
  EXPECTED_ADAPTER_COUNT,
} from './movieAnalysisDnaPackaging.js';
import {
  DNA_RELEASE_CERTIFICATION_PASS_VERDICT,
  DNA_RELEASE_CERTIFICATION_REPORT_PATH,
  type MovieAnalysisDnaReleaseCertificationReport,
} from './movieAnalysisDnaReleaseCertification.js';
import {
  DNA_RELEASE_MANIFEST_PATH,
  DNA_RELEASE_PACKAGE_PASS_VERDICT,
  DNA_RELEASE_PACKAGE_PATH,
  DNA_RELEASE_VERSION,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_SOURCE_VIDEO_IDS,
  type MovieAnalysisDnaReleasePackage,
  loadMovieAnalysisDnaReleaseManifest,
  loadMovieAnalysisDnaReleasePackage,
} from './movieAnalysisDnaReleasePackage.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DNA_ARCHIVE_PHASE =
  'PHASE-SOURCE-VIDEO-064-MOVIE_ANALYSIS_DNA_RELEASE_ARCHIVE_V1' as const;
export const DNA_ARCHIVE_PASS_VERDICT = 'PASS_MOVIE_ANALYSIS_DNA_RELEASE_ARCHIVE_V1' as const;
export const DNA_ARCHIVE_FAIL_VERDICT = 'FAIL_MOVIE_ANALYSIS_DNA_RELEASE_ARCHIVE_V1' as const;
export const DNA_ARCHIVE_DIR = 'exports/movie_analysis_dna_archive' as const;
export const DNA_ARCHIVE_PATH =
  'exports/movie_analysis_dna_archive/movie-analysis-dna-archive.json' as const;
export const DNA_ARCHIVE_MANIFEST_PATH =
  'exports/movie_analysis_dna_archive/movie-analysis-dna-archive-manifest.json' as const;
export const DNA_ARCHIVE_REPORT_PATH =
  'exports/movie_analysis_dna_archive/movie-analysis-dna-archive-report.json' as const;

export const DNA_ARCHIVE_VERSION = 'v1' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, ADAPTERS_PER_SOURCE };

export type ValidationStatus = 'PASS' | 'FAIL';

export type DnaArchiveSafetySummary = {
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type DnaArchiveTraceability = {
  package_id: string;
  image_bridge_id: string;
  video_bridge_id: string;
  adapter_library_id: string;
  cinematic_dna_set_id: string;
  integration_set_id: string;
  release_id: string;
};

export type DnaArchiveCertifications = {
  adapter_certification_verdict: typeof DNA_ADAPTER_CERTIFICATION_PASS_VERDICT;
  import_test_verdict: typeof DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT;
  release_package_verdict: typeof DNA_RELEASE_PACKAGE_PASS_VERDICT;
  release_certification_verdict: typeof DNA_RELEASE_CERTIFICATION_PASS_VERDICT;
  certification_status: 'CERTIFIED';
};

export type DnaArchiveSourceSnapshot = {
  source_video_id: string;
  cinematic_dna_id: string;
  integration_id: string;
  adapter_library_entry_id: string;
  adapter_ids: string[];
};

export type MovieAnalysisDnaArchive = {
  archive_id: string;
  archive_version: typeof DNA_ARCHIVE_VERSION;
  phase: typeof DNA_ARCHIVE_PHASE;
  archived_at: string;
  immutable: true;
  frozen_release_version: typeof DNA_RELEASE_VERSION;
  frozen_release_timestamp: string;
  source_count: number;
  adapter_count: number;
  all_source_ids: string[];
  all_adapter_ids: string[];
  traceability: DnaArchiveTraceability;
  certifications: DnaArchiveCertifications;
  sources: DnaArchiveSourceSnapshot[];
  release_package_path: typeof DNA_RELEASE_PACKAGE_PATH;
  release_manifest_path: typeof DNA_RELEASE_MANIFEST_PATH;
  release_certification_report_path: typeof DNA_RELEASE_CERTIFICATION_REPORT_PATH;
  archive_readiness: {
    all_source_ids_preserved: boolean;
    all_adapter_ids_preserved: boolean;
    all_traceability_preserved: boolean;
    all_certifications_preserved: boolean;
    release_version_frozen: boolean;
    release_timestamp_frozen: boolean;
    archive_ready: boolean;
  };
  safety_summary: DnaArchiveSafetySummary;
};

export type DnaArchiveManifestAsset = {
  asset_id: string;
  path: string;
  role: string;
};

export type MovieAnalysisDnaArchiveManifest = {
  manifest_id: string;
  phase: typeof DNA_ARCHIVE_PHASE;
  generated_at: string;
  archive_path: typeof DNA_ARCHIVE_PATH;
  archive_report_path: typeof DNA_ARCHIVE_REPORT_PATH;
  release_package_path: typeof DNA_RELEASE_PACKAGE_PATH;
  release_manifest_path: typeof DNA_RELEASE_MANIFEST_PATH;
  release_certification_report_path: typeof DNA_RELEASE_CERTIFICATION_REPORT_PATH;
  frozen_release_version: typeof DNA_RELEASE_VERSION;
  frozen_release_timestamp: string;
  source_count: number;
  adapter_count: number;
  immutable: true;
  assets: DnaArchiveManifestAsset[];
};

export type DnaArchiveIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceDnaArchiveAudit = {
  source_video_id: string;
  source_ids_preserved: ValidationStatus;
  adapter_ids_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  certifications_preserved: ValidationStatus;
  source_archive_ready: ValidationStatus;
};

export type MovieAnalysisDnaArchiveReport = {
  report_id: string;
  phase: typeof DNA_ARCHIVE_PHASE;
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
  all_source_ids_preserved: ValidationStatus;
  all_adapter_ids_preserved: ValidationStatus;
  all_traceability_preserved: ValidationStatus;
  all_certifications_preserved: ValidationStatus;
  release_version_frozen: ValidationStatus;
  release_timestamp_frozen: ValidationStatus;
  archive_ready: ValidationStatus;
  planning_only_status: ValidationStatus;
  source_audits: SourceDnaArchiveAudit[];
  final_verdict: typeof DNA_ARCHIVE_PASS_VERDICT | typeof DNA_ARCHIVE_FAIL_VERDICT;
  issues: DnaArchiveIssue[];
};

const ARCHIVE_SAFETY_SUMMARY: DnaArchiveSafetySummary = {
  planning_only: true,
  generation: false,
  runtime_execution: false,
  video_generation: false,
  image_generation: false,
  gpu_execution: false,
  external_call_allowed: false,
};

function loadReleaseCertificationReport(
  projectRoot: string
): MovieAnalysisDnaReleaseCertificationReport | null {
  const abs = path.join(projectRoot, DNA_RELEASE_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisDnaReleaseCertificationReport;
}

function aggregateStatus(
  audits: SourceDnaArchiveAudit[],
  field: keyof SourceDnaArchiveAudit
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildArchive(
  releasePackage: MovieAnalysisDnaReleasePackage,
  certificationReport: MovieAnalysisDnaReleaseCertificationReport,
  archivedAt: string
): MovieAnalysisDnaArchive {
  const sources: DnaArchiveSourceSnapshot[] = releasePackage.sources.map((source) => ({
    source_video_id: source.source_video_id,
    cinematic_dna_id: source.cinematic_dna_id,
    integration_id: source.integration_id,
    adapter_library_entry_id: source.adapter_library_entry_id,
    adapter_ids: [...source.adapter_ids],
  }));

  const allSourceIds = sources.map((source) => source.source_video_id);
  const allAdapterIds = sources.flatMap((source) => source.adapter_ids);

  const allSourceIdsPreserved =
    allSourceIds.length === EXPECTED_SOURCE_COUNT &&
    EXPECTED_SOURCE_VIDEO_IDS.every((sourceId) => allSourceIds.includes(sourceId));

  const allAdapterIdsPreserved =
    allAdapterIds.length === EXPECTED_ADAPTER_COUNT &&
    sources.every((source) => source.adapter_ids.length === ADAPTERS_PER_SOURCE);

  const traceability: DnaArchiveTraceability = {
    package_id: releasePackage.package_id,
    image_bridge_id: releasePackage.image_bridge_id,
    video_bridge_id: releasePackage.video_bridge_id,
    adapter_library_id: releasePackage.adapter_library_id,
    cinematic_dna_set_id: releasePackage.cinematic_dna_set_id,
    integration_set_id: releasePackage.integration_set_id,
    release_id: releasePackage.release_id,
  };

  const allTraceabilityPreserved =
    Boolean(traceability.package_id) &&
    Boolean(traceability.image_bridge_id) &&
    Boolean(traceability.video_bridge_id) &&
    Boolean(traceability.adapter_library_id) &&
    Boolean(traceability.cinematic_dna_set_id) &&
    Boolean(traceability.integration_set_id) &&
    Boolean(traceability.release_id) &&
    releasePackage.release_readiness.traceability_preserved === true &&
    certificationReport.traceability === 'PASS';

  const certifications: DnaArchiveCertifications = {
    adapter_certification_verdict: DNA_ADAPTER_CERTIFICATION_PASS_VERDICT,
    import_test_verdict: DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT,
    release_package_verdict: DNA_RELEASE_PACKAGE_PASS_VERDICT,
    release_certification_verdict: DNA_RELEASE_CERTIFICATION_PASS_VERDICT,
    certification_status: 'CERTIFIED',
  };

  const allCertificationsPreserved =
    releasePackage.certification_verdict === DNA_ADAPTER_CERTIFICATION_PASS_VERDICT &&
    releasePackage.certification_status === 'CERTIFIED' &&
    releasePackage.import_test_verdict === DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT &&
    certificationReport.final_verdict === DNA_RELEASE_CERTIFICATION_PASS_VERDICT &&
    certificationReport.release_certification_ready === 'PASS' &&
    certificationReport.certification_chain === 'PASS';

  const releaseVersionFrozen =
    releasePackage.release_version === DNA_RELEASE_VERSION &&
    releasePackage.release_version.length > 0;

  const releaseTimestampFrozen =
    Boolean(releasePackage.released_at) && releasePackage.released_at.length > 0;

  const archiveReady =
    allSourceIdsPreserved &&
    allAdapterIdsPreserved &&
    allTraceabilityPreserved &&
    allCertificationsPreserved &&
    releaseVersionFrozen &&
    releaseTimestampFrozen &&
    certificationReport.release_certification_ready === 'PASS';

  return {
    archive_id: 'movie-analysis-dna-archive-v1',
    archive_version: DNA_ARCHIVE_VERSION,
    phase: DNA_ARCHIVE_PHASE,
    archived_at: archivedAt,
    immutable: true,
    frozen_release_version: releasePackage.release_version,
    frozen_release_timestamp: releasePackage.released_at,
    source_count: releasePackage.source_count,
    adapter_count: releasePackage.adapter_count,
    all_source_ids: allSourceIds,
    all_adapter_ids: allAdapterIds,
    traceability,
    certifications,
    sources,
    release_package_path: DNA_RELEASE_PACKAGE_PATH,
    release_manifest_path: DNA_RELEASE_MANIFEST_PATH,
    release_certification_report_path: DNA_RELEASE_CERTIFICATION_REPORT_PATH,
    archive_readiness: {
      all_source_ids_preserved: allSourceIdsPreserved,
      all_adapter_ids_preserved: allAdapterIdsPreserved,
      all_traceability_preserved: allTraceabilityPreserved,
      all_certifications_preserved: allCertificationsPreserved,
      release_version_frozen: releaseVersionFrozen,
      release_timestamp_frozen: releaseTimestampFrozen,
      archive_ready: archiveReady,
    },
    safety_summary: ARCHIVE_SAFETY_SUMMARY,
  };
}

function auditSource(
  archive: MovieAnalysisDnaArchive,
  releaseSource: MovieAnalysisDnaReleasePackage['sources'][number] | undefined,
  sourceVideoId: string
): SourceDnaArchiveAudit {
  const archiveSource = archive.sources.find(
    (source) => source.source_video_id === sourceVideoId
  );

  if (!archiveSource || !releaseSource) {
    return {
      source_video_id: sourceVideoId,
      source_ids_preserved: 'FAIL',
      adapter_ids_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      certifications_preserved: 'FAIL',
      source_archive_ready: 'FAIL',
    };
  }

  const sourceIdsPreserved =
    archiveSource.source_video_id === releaseSource.source_video_id &&
    archiveSource.cinematic_dna_id === releaseSource.cinematic_dna_id &&
    archiveSource.integration_id === releaseSource.integration_id &&
    archiveSource.adapter_library_entry_id === releaseSource.adapter_library_entry_id
      ? 'PASS'
      : 'FAIL';

  const adapterIdsPreserved =
    archiveSource.adapter_ids.length === releaseSource.adapter_ids.length &&
    archiveSource.adapter_ids.every((adapterId) => releaseSource.adapter_ids.includes(adapterId))
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved =
    archiveSource.cinematic_dna_id === releaseSource.cinematic_dna_id &&
    archiveSource.integration_id === releaseSource.integration_id &&
    archiveSource.adapter_library_entry_id === releaseSource.adapter_library_entry_id &&
    archive.traceability.package_id.length > 0
      ? 'PASS'
      : 'FAIL';

  const certificationsPreserved =
    archive.certifications.certification_status === 'CERTIFIED' &&
    archive.certifications.adapter_certification_verdict ===
      DNA_ADAPTER_CERTIFICATION_PASS_VERDICT &&
    archive.certifications.release_certification_verdict ===
      DNA_RELEASE_CERTIFICATION_PASS_VERDICT
      ? 'PASS'
      : 'FAIL';

  const sourceArchiveReady =
    sourceIdsPreserved === 'PASS' &&
    adapterIdsPreserved === 'PASS' &&
    traceabilityPreserved === 'PASS' &&
    certificationsPreserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  return {
    source_video_id: sourceVideoId,
    source_ids_preserved: sourceIdsPreserved,
    adapter_ids_preserved: adapterIdsPreserved,
    traceability_preserved: traceabilityPreserved,
    certifications_preserved: certificationsPreserved,
    source_archive_ready: sourceArchiveReady,
  };
}

export function writeMovieAnalysisDnaArchive(
  projectRoot?: string
): MovieAnalysisDnaArchiveReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: DnaArchiveIssue[] = [];
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

  const certificationReport = loadReleaseCertificationReport(root);
  if (!certificationReport) {
    issues.push({
      code: 'RELEASE_CERTIFICATION_REPORT_MISSING',
      message: `Missing ${DNA_RELEASE_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
  }

  if (!releasePackage || !releaseManifest || !certificationReport) {
    const report: MovieAnalysisDnaArchiveReport = {
      report_id: 'movie-analysis-dna-archive-report-v1',
      phase: DNA_ARCHIVE_PHASE,
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
      all_source_ids_preserved: 'FAIL',
      all_adapter_ids_preserved: 'FAIL',
      all_traceability_preserved: 'FAIL',
      all_certifications_preserved: 'FAIL',
      release_version_frozen: 'FAIL',
      release_timestamp_frozen: 'FAIL',
      archive_ready: 'FAIL',
      planning_only_status: 'FAIL',
      source_audits: [],
      final_verdict: DNA_ARCHIVE_FAIL_VERDICT,
      issues,
    };
    return report;
  }

  if (certificationReport.final_verdict !== DNA_RELEASE_CERTIFICATION_PASS_VERDICT) {
    issues.push({
      code: 'RELEASE_NOT_CERTIFIED',
      message: `Release certification must have ${DNA_RELEASE_CERTIFICATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  if (releasePackage.release_readiness.release_ready !== true) {
    issues.push({
      code: 'RELEASE_NOT_READY',
      message: 'Release package is not ready for archival',
      severity: 'error',
    });
  }

  for (const asset of releaseManifest.assets) {
    if (!fs.existsSync(path.join(root, asset.path))) {
      issues.push({
        code: 'RELEASE_MANIFEST_ASSET_MISSING',
        message: `Missing release manifest asset ${asset.path}`,
        severity: 'error',
      });
    }
  }

  const archive = buildArchive(releasePackage, certificationReport, timestamp);

  const archiveManifest: MovieAnalysisDnaArchiveManifest = {
    manifest_id: 'movie-analysis-dna-archive-manifest-v1',
    phase: DNA_ARCHIVE_PHASE,
    generated_at: timestamp,
    archive_path: DNA_ARCHIVE_PATH,
    archive_report_path: DNA_ARCHIVE_REPORT_PATH,
    release_package_path: DNA_RELEASE_PACKAGE_PATH,
    release_manifest_path: DNA_RELEASE_MANIFEST_PATH,
    release_certification_report_path: DNA_RELEASE_CERTIFICATION_REPORT_PATH,
    frozen_release_version: archive.frozen_release_version,
    frozen_release_timestamp: archive.frozen_release_timestamp,
    source_count: archive.source_count,
    adapter_count: archive.adapter_count,
    immutable: true,
    assets: [
      {
        asset_id: 'dna_release_package',
        path: DNA_RELEASE_PACKAGE_PATH,
        role: 'archived_release_package',
      },
      {
        asset_id: 'dna_release_manifest',
        path: DNA_RELEASE_MANIFEST_PATH,
        role: 'archived_release_manifest',
      },
      {
        asset_id: 'release_certification_report',
        path: DNA_RELEASE_CERTIFICATION_REPORT_PATH,
        role: 'release_certification_verdict',
      },
      {
        asset_id: 'dna_archive',
        path: DNA_ARCHIVE_PATH,
        role: 'immutable_dna_archive',
      },
    ],
  };

  const outDir = path.join(root, DNA_ARCHIVE_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, DNA_ARCHIVE_PATH),
    `${JSON.stringify(archive, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, DNA_ARCHIVE_MANIFEST_PATH),
    `${JSON.stringify(archiveManifest, null, 2)}\n`,
    'utf8'
  );

  const sourceAudits: SourceDnaArchiveAudit[] = [];
  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const releaseSource = releasePackage.sources.find(
      (source) => source.source_video_id === sourceVideoId
    );
    const audit = auditSource(archive, releaseSource, sourceVideoId);
    sourceAudits.push(audit);

    if (audit.source_archive_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_ARCHIVE_NOT_READY',
        message: `DNA archive source not ready: ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const safetyValid =
    archive.safety_summary.planning_only === true &&
    archive.safety_summary.generation === false &&
    archive.safety_summary.runtime_execution === false &&
    archive.safety_summary.gpu_execution === false &&
    archive.safety_summary.external_call_allowed === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Safety planning_only validation failed',
      severity: 'error',
    });
  }

  const allSourceIdsPreserved =
    archive.archive_readiness.all_source_ids_preserved &&
    aggregateStatus(sourceAudits, 'source_ids_preserved') === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const allAdapterIdsPreserved =
    archive.archive_readiness.all_adapter_ids_preserved &&
    aggregateStatus(sourceAudits, 'adapter_ids_preserved') === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const allTraceabilityPreserved =
    archive.archive_readiness.all_traceability_preserved &&
    aggregateStatus(sourceAudits, 'traceability_preserved') === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const allCertificationsPreserved =
    archive.archive_readiness.all_certifications_preserved &&
    aggregateStatus(sourceAudits, 'certifications_preserved') === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const releaseVersionFrozen = archive.archive_readiness.release_version_frozen ? 'PASS' : 'FAIL';
  const releaseTimestampFrozen = archive.archive_readiness.release_timestamp_frozen
    ? 'PASS'
    : 'FAIL';
  const planningOnlyStatus: ValidationStatus = safetyValid ? 'PASS' : 'FAIL';

  const archiveReady =
    archive.archive_readiness.archive_ready === true &&
    allSourceIdsPreserved === 'PASS' &&
    allAdapterIdsPreserved === 'PASS' &&
    allTraceabilityPreserved === 'PASS' &&
    allCertificationsPreserved === 'PASS' &&
    releaseVersionFrozen === 'PASS' &&
    releaseTimestampFrozen === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    archive.source_count === EXPECTED_SOURCE_COUNT &&
    archive.adapter_count === EXPECTED_ADAPTER_COUNT &&
    sourceAudits.every((audit) => audit.source_archive_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = archiveReady === 'PASS';

  const report: MovieAnalysisDnaArchiveReport = {
    report_id: 'movie-analysis-dna-archive-report-v1',
    phase: DNA_ARCHIVE_PHASE,
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
    all_source_ids_preserved: allSourceIdsPreserved,
    all_adapter_ids_preserved: allAdapterIdsPreserved,
    all_traceability_preserved: allTraceabilityPreserved,
    all_certifications_preserved: allCertificationsPreserved,
    release_version_frozen: releaseVersionFrozen,
    release_timestamp_frozen: releaseTimestampFrozen,
    archive_ready: archiveReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass ? DNA_ARCHIVE_PASS_VERDICT : DNA_ARCHIVE_FAIL_VERDICT,
    issues,
  };

  fs.writeFileSync(
    path.join(root, DNA_ARCHIVE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}

export function loadMovieAnalysisDnaArchive(
  projectRoot?: string
): MovieAnalysisDnaArchive | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, DNA_ARCHIVE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisDnaArchive;
}

export function loadMovieAnalysisDnaArchiveManifest(
  projectRoot?: string
): MovieAnalysisDnaArchiveManifest | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, DNA_ARCHIVE_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisDnaArchiveManifest;
}
