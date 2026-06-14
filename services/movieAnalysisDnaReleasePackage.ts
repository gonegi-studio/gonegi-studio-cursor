import fs from 'node:fs';
import path from 'node:path';
import { DNA_ADAPTER_CERTIFICATION_PASS_VERDICT } from './movieAnalysisDnaAdapterCertification.js';
import {
  DNA_ADAPTER_LIBRARY_PATH,
  type DnaAdapterLibraryEntry,
  loadMovieAnalysisDnaAdapterLibrary,
} from './movieAnalysisDnaAdapterLibrary.js';
import {
  DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT,
  DNA_CONSUMER_IMPORT_TEST_REPORT_PATH,
  type MovieAnalysisDnaConsumerImportTestReport,
} from './movieAnalysisDnaConsumerImportTest.js';
import {
  DNA_IMAGE_BRIDGE_PATH,
  DNA_VIDEO_BRIDGE_PATH,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_SOURCE_VIDEO_IDS,
  type MovieAnalysisDnaImageBridge,
  type MovieAnalysisDnaVideoBridge,
  loadMovieAnalysisDnaImageBridge,
  loadMovieAnalysisDnaVideoBridge,
} from './movieAnalysisDnaConsumerBridge.js';
import {
  DNA_PACKAGE_PATH,
  type MovieAnalysisDnaPackage,
  loadMovieAnalysisDnaPackage,
} from './movieAnalysisDnaPackaging.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DNA_RELEASE_PACKAGE_PHASE =
  'PHASE-SOURCE-VIDEO-062-MOVIE_ANALYSIS_DNA_RELEASE_PACKAGE_V1' as const;
export const DNA_RELEASE_PACKAGE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_DNA_RELEASE_PACKAGE_V1' as const;
export const DNA_RELEASE_PACKAGE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_DNA_RELEASE_PACKAGE_V1' as const;
export const DNA_RELEASE_DIR = 'exports/movie_analysis_dna_release' as const;
export const DNA_RELEASE_PACKAGE_PATH =
  'exports/movie_analysis_dna_release/movie-analysis-dna-release-package.json' as const;
export const DNA_RELEASE_MANIFEST_PATH =
  'exports/movie_analysis_dna_release/movie-analysis-dna-release-manifest.json' as const;
export const DNA_RELEASE_REPORT_PATH =
  'exports/movie_analysis_dna_release/movie-analysis-dna-release-report.json' as const;

export const DNA_RELEASE_VERSION = 'v1' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type DnaReleaseSafetySummary = {
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type DnaReleaseSourceEntry = {
  source_video_id: string;
  cinematic_dna_id: string;
  integration_id: string;
  adapter_library_entry_id: string;
  adapter_ids: string[];
  image_bridge_ready: boolean;
  video_bridge_ready: boolean;
  import_test_ready: boolean;
};

export type MovieAnalysisDnaReleasePackage = {
  release_id: string;
  release_version: typeof DNA_RELEASE_VERSION;
  phase: typeof DNA_RELEASE_PACKAGE_PHASE;
  released_at: string;
  source_count: number;
  adapter_count: number;
  dna_package_path: typeof DNA_PACKAGE_PATH;
  image_bridge_path: typeof DNA_IMAGE_BRIDGE_PATH;
  video_bridge_path: typeof DNA_VIDEO_BRIDGE_PATH;
  import_test_report_path: typeof DNA_CONSUMER_IMPORT_TEST_REPORT_PATH;
  package_id: string;
  image_bridge_id: string;
  video_bridge_id: string;
  adapter_library_id: string;
  cinematic_dna_set_id: string;
  integration_set_id: string;
  certification_verdict: string;
  certification_status: 'CERTIFIED';
  import_test_verdict: typeof DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT;
  consumer_targets: ['image_app', 'video_app'];
  sources: DnaReleaseSourceEntry[];
  release_readiness: {
    dna_package_linked: boolean;
    image_bridge_linked: boolean;
    video_bridge_linked: boolean;
    import_test_linked: boolean;
    source_ids_preserved: boolean;
    adapter_ids_preserved: boolean;
    traceability_preserved: boolean;
    certification_status_preserved: boolean;
    release_ready: boolean;
  };
  safety_summary: DnaReleaseSafetySummary;
};

export type DnaReleaseManifestAsset = {
  asset_id: string;
  path: string;
  role: string;
};

export type MovieAnalysisDnaReleaseManifest = {
  manifest_id: string;
  phase: typeof DNA_RELEASE_PACKAGE_PHASE;
  generated_at: string;
  release_package_path: typeof DNA_RELEASE_PACKAGE_PATH;
  release_report_path: typeof DNA_RELEASE_REPORT_PATH;
  dna_package_path: typeof DNA_PACKAGE_PATH;
  image_bridge_path: typeof DNA_IMAGE_BRIDGE_PATH;
  video_bridge_path: typeof DNA_VIDEO_BRIDGE_PATH;
  import_test_report_path: typeof DNA_CONSUMER_IMPORT_TEST_REPORT_PATH;
  source_count: number;
  adapter_count: number;
  assets: DnaReleaseManifestAsset[];
};

export type DnaReleasePackageIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceDnaReleaseAudit = {
  source_video_id: string;
  source_ids_preserved: ValidationStatus;
  adapter_ids_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  certification_status_preserved: ValidationStatus;
  source_release_ready: ValidationStatus;
};

export type MovieAnalysisDnaReleaseReport = {
  report_id: string;
  phase: typeof DNA_RELEASE_PACKAGE_PHASE;
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
  release_package_path: typeof DNA_RELEASE_PACKAGE_PATH;
  release_manifest_path: typeof DNA_RELEASE_MANIFEST_PATH;
  dna_package_linked: ValidationStatus;
  image_bridge_linked: ValidationStatus;
  video_bridge_linked: ValidationStatus;
  import_test_linked: ValidationStatus;
  source_ids_preserved: ValidationStatus;
  adapter_ids_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  certification_status_preserved: ValidationStatus;
  release_ready: ValidationStatus;
  planning_only_status: ValidationStatus;
  source_audits: SourceDnaReleaseAudit[];
  final_verdict:
    | typeof DNA_RELEASE_PACKAGE_PASS_VERDICT
    | typeof DNA_RELEASE_PACKAGE_FAIL_VERDICT;
  issues: DnaReleasePackageIssue[];
};

const RELEASE_SAFETY_SUMMARY: DnaReleaseSafetySummary = {
  planning_only: true,
  generation: false,
  runtime_execution: false,
  video_generation: false,
  image_generation: false,
  gpu_execution: false,
  external_call_allowed: false,
};

function collectAdapterIds(entry: DnaAdapterLibraryEntry): string[] {
  return [
    entry.scene_adapter.adapter_id,
    entry.camera_adapter.adapter_id,
    entry.emotion_adapter.adapter_id,
    entry.transition_adapter.adapter_id,
    entry.continuity_adapter.adapter_id,
    entry.storytelling_adapter.adapter_id,
  ];
}

function loadImportTestReport(
  projectRoot: string
): MovieAnalysisDnaConsumerImportTestReport | null {
  const abs = path.join(projectRoot, DNA_CONSUMER_IMPORT_TEST_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisDnaConsumerImportTestReport;
}

function isAssetLinked(projectRoot: string, relPath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relPath));
}

function buildSourceEntry(
  libraryEntry: DnaAdapterLibraryEntry,
  imageBridge: MovieAnalysisDnaImageBridge,
  videoBridge: MovieAnalysisDnaVideoBridge,
  importTestReport: MovieAnalysisDnaConsumerImportTestReport
): DnaReleaseSourceEntry {
  const imageEntry = imageBridge.entries.find(
    (entry) => entry.source_video_id === libraryEntry.source_video_id
  );
  const videoEntry = videoBridge.entries.find(
    (entry) => entry.source_video_id === libraryEntry.source_video_id
  );
  const importAudit = importTestReport.source_audits.find(
    (audit) => audit.source_video_id === libraryEntry.source_video_id
  );

  return {
    source_video_id: libraryEntry.source_video_id,
    cinematic_dna_id: libraryEntry.cinematic_dna_id,
    integration_id: libraryEntry.integration_id,
    adapter_library_entry_id: libraryEntry.adapter_library_entry_id,
    adapter_ids: collectAdapterIds(libraryEntry),
    image_bridge_ready: imageEntry?.consumer_ready === true,
    video_bridge_ready: videoEntry?.consumer_ready === true,
    import_test_ready: importAudit?.import_ready === 'PASS',
  };
}

function auditSource(
  releasePackage: MovieAnalysisDnaReleasePackage,
  dnaPackage: MovieAnalysisDnaPackage,
  libraryEntry: DnaAdapterLibraryEntry | undefined,
  sourceVideoId: string
): SourceDnaReleaseAudit {
  const releaseSource = releasePackage.sources.find(
    (source) => source.source_video_id === sourceVideoId
  );
  const packageSource = dnaPackage.sources.find(
    (source) => source.source_video_id === sourceVideoId
  );

  if (!releaseSource || !packageSource || !libraryEntry) {
    return {
      source_video_id: sourceVideoId,
      source_ids_preserved: 'FAIL',
      adapter_ids_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      certification_status_preserved: 'FAIL',
      source_release_ready: 'FAIL',
    };
  }

  const expectedAdapterIds = collectAdapterIds(libraryEntry);
  const sourceIdsPreserved =
    releaseSource.source_video_id === packageSource.source_video_id &&
    releaseSource.cinematic_dna_id === packageSource.cinematic_dna_id &&
    releaseSource.integration_id === packageSource.integration_id &&
    releaseSource.adapter_library_entry_id === packageSource.adapter_library_entry_id
      ? 'PASS'
      : 'FAIL';

  const adapterIdsPreserved =
    releaseSource.adapter_ids.length === expectedAdapterIds.length &&
    releaseSource.adapter_ids.every((adapterId) => expectedAdapterIds.includes(adapterId))
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved =
    releaseSource.cinematic_dna_id === libraryEntry.cinematic_dna_id &&
    releaseSource.integration_id === libraryEntry.integration_id &&
    releaseSource.adapter_library_entry_id === libraryEntry.adapter_library_entry_id
      ? 'PASS'
      : 'FAIL';

  const certificationStatusPreserved =
    releasePackage.certification_verdict === dnaPackage.certification_verdict &&
    releasePackage.certification_status === 'CERTIFIED' &&
    dnaPackage.package_readiness.certification_preserved === true
      ? 'PASS'
      : 'FAIL';

  const sourceReleaseReady =
    sourceIdsPreserved === 'PASS' &&
    adapterIdsPreserved === 'PASS' &&
    traceabilityPreserved === 'PASS' &&
    certificationStatusPreserved === 'PASS' &&
    releaseSource.image_bridge_ready &&
    releaseSource.video_bridge_ready &&
    releaseSource.import_test_ready
      ? 'PASS'
      : 'FAIL';

  return {
    source_video_id: sourceVideoId,
    source_ids_preserved: sourceIdsPreserved,
    adapter_ids_preserved: adapterIdsPreserved,
    traceability_preserved: traceabilityPreserved,
    certification_status_preserved: certificationStatusPreserved,
    source_release_ready: sourceReleaseReady,
  };
}

function aggregateStatus(
  audits: SourceDnaReleaseAudit[],
  field: keyof SourceDnaReleaseAudit
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

export function buildMovieAnalysisDnaReleasePackage(
  dnaPackage: MovieAnalysisDnaPackage,
  imageBridge: MovieAnalysisDnaImageBridge,
  videoBridge: MovieAnalysisDnaVideoBridge,
  importTestReport: MovieAnalysisDnaConsumerImportTestReport,
  adapterLibrary: NonNullable<ReturnType<typeof loadMovieAnalysisDnaAdapterLibrary>>
): MovieAnalysisDnaReleasePackage {
  const sources: DnaReleaseSourceEntry[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const libraryEntry = adapterLibrary.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    if (!libraryEntry) {
      throw new Error(`Missing adapter library entry for ${sourceVideoId}`);
    }
    sources.push(buildSourceEntry(libraryEntry, imageBridge, videoBridge, importTestReport));
  }

  const adapterCount = sources.reduce((sum, source) => sum + source.adapter_ids.length, 0);

  const dnaPackageLinked = true;
  const imageBridgeLinked = true;
  const videoBridgeLinked = true;
  const importTestLinked = true;

  const sourceIdsPreserved = sources.every((source) => {
    const packageSource = dnaPackage.sources.find(
      (entry) => entry.source_video_id === source.source_video_id
    );
    return (
      packageSource !== undefined &&
      source.cinematic_dna_id === packageSource.cinematic_dna_id &&
      source.integration_id === packageSource.integration_id &&
      source.adapter_library_entry_id === packageSource.adapter_library_entry_id
    );
  });

  const adapterIdsPreserved = sources.every((source) => {
    const libraryEntry = adapterLibrary.entries.find(
      (entry) => entry.source_video_id === source.source_video_id
    );
    if (!libraryEntry) return false;
    const expected = collectAdapterIds(libraryEntry);
    return (
      source.adapter_ids.length === expected.length &&
      source.adapter_ids.every((adapterId) => expected.includes(adapterId))
    );
  });

  const traceabilityPreserved =
    imageBridge.cinematic_dna_set_id === dnaPackage.cinematic_dna_set_id &&
    imageBridge.integration_set_id === dnaPackage.integration_set_id &&
    videoBridge.cinematic_dna_set_id === dnaPackage.cinematic_dna_set_id &&
    videoBridge.integration_set_id === dnaPackage.integration_set_id &&
    imageBridge.package_id === dnaPackage.package_id &&
    videoBridge.package_id === dnaPackage.package_id &&
    sourceIdsPreserved;

  const certificationStatusPreserved =
    dnaPackage.certification_verdict === DNA_ADAPTER_CERTIFICATION_PASS_VERDICT &&
    dnaPackage.package_readiness.certification_preserved === true;

  const releaseReady =
    sources.length === EXPECTED_SOURCE_COUNT &&
    dnaPackageLinked &&
    imageBridgeLinked &&
    videoBridgeLinked &&
    importTestLinked &&
    sourceIdsPreserved &&
    adapterIdsPreserved &&
    traceabilityPreserved &&
    certificationStatusPreserved &&
    importTestReport.final_verdict === DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT &&
    sources.every(
      (source) => source.image_bridge_ready && source.video_bridge_ready && source.import_test_ready
    );

  return {
    release_id: 'movie-analysis-dna-release-package-v1',
    release_version: DNA_RELEASE_VERSION,
    phase: DNA_RELEASE_PACKAGE_PHASE,
    released_at: new Date().toISOString(),
    source_count: sources.length,
    adapter_count: adapterCount,
    dna_package_path: DNA_PACKAGE_PATH,
    image_bridge_path: DNA_IMAGE_BRIDGE_PATH,
    video_bridge_path: DNA_VIDEO_BRIDGE_PATH,
    import_test_report_path: DNA_CONSUMER_IMPORT_TEST_REPORT_PATH,
    package_id: dnaPackage.package_id,
    image_bridge_id: imageBridge.bridge_id,
    video_bridge_id: videoBridge.bridge_id,
    adapter_library_id: dnaPackage.adapter_library_id,
    cinematic_dna_set_id: dnaPackage.cinematic_dna_set_id,
    integration_set_id: dnaPackage.integration_set_id,
    certification_verdict: dnaPackage.certification_verdict,
    certification_status: 'CERTIFIED',
    import_test_verdict: DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT,
    consumer_targets: ['image_app', 'video_app'],
    sources,
    release_readiness: {
      dna_package_linked: dnaPackageLinked,
      image_bridge_linked: imageBridgeLinked,
      video_bridge_linked: videoBridgeLinked,
      import_test_linked: importTestLinked,
      source_ids_preserved: sourceIdsPreserved,
      adapter_ids_preserved: adapterIdsPreserved,
      traceability_preserved: traceabilityPreserved,
      certification_status_preserved: certificationStatusPreserved,
      release_ready: releaseReady,
    },
    safety_summary: RELEASE_SAFETY_SUMMARY,
  };
}

export function writeMovieAnalysisDnaReleasePackage(
  projectRoot?: string
): MovieAnalysisDnaReleaseReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: DnaReleasePackageIssue[] = [];
  const timestamp = new Date().toISOString();

  const dnaPackage = loadMovieAnalysisDnaPackage(root);
  if (!dnaPackage) {
    issues.push({
      code: 'DNA_PACKAGE_MISSING',
      message: `Missing ${DNA_PACKAGE_PATH}`,
      severity: 'error',
    });
  }

  const imageBridge = loadMovieAnalysisDnaImageBridge(root);
  if (!imageBridge) {
    issues.push({
      code: 'IMAGE_BRIDGE_MISSING',
      message: `Missing ${DNA_IMAGE_BRIDGE_PATH}`,
      severity: 'error',
    });
  }

  const videoBridge = loadMovieAnalysisDnaVideoBridge(root);
  if (!videoBridge) {
    issues.push({
      code: 'VIDEO_BRIDGE_MISSING',
      message: `Missing ${DNA_VIDEO_BRIDGE_PATH}`,
      severity: 'error',
    });
  }

  const importTestReport = loadImportTestReport(root);
  if (!importTestReport) {
    issues.push({
      code: 'IMPORT_TEST_REPORT_MISSING',
      message: `Missing ${DNA_CONSUMER_IMPORT_TEST_REPORT_PATH}`,
      severity: 'error',
    });
  }

  const adapterLibrary = loadMovieAnalysisDnaAdapterLibrary(root);
  if (!adapterLibrary) {
    issues.push({
      code: 'ADAPTER_LIBRARY_MISSING',
      message: `Missing ${DNA_ADAPTER_LIBRARY_PATH}`,
      severity: 'error',
    });
  }

  if (!dnaPackage || !imageBridge || !videoBridge || !importTestReport || !adapterLibrary) {
    const report: MovieAnalysisDnaReleaseReport = {
      report_id: 'movie-analysis-dna-release-report-v1',
      phase: DNA_RELEASE_PACKAGE_PHASE,
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
      release_package_path: DNA_RELEASE_PACKAGE_PATH,
      release_manifest_path: DNA_RELEASE_MANIFEST_PATH,
      dna_package_linked: 'FAIL',
      image_bridge_linked: 'FAIL',
      video_bridge_linked: 'FAIL',
      import_test_linked: 'FAIL',
      source_ids_preserved: 'FAIL',
      adapter_ids_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      certification_status_preserved: 'FAIL',
      release_ready: 'FAIL',
      planning_only_status: 'FAIL',
      source_audits: [],
      final_verdict: DNA_RELEASE_PACKAGE_FAIL_VERDICT,
      issues,
    };
    return report;
  }

  if (importTestReport.final_verdict !== DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT) {
    issues.push({
      code: 'IMPORT_TEST_NOT_PASS',
      message: `Import test must have ${DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  if (dnaPackage.package_readiness.package_ready !== true) {
    issues.push({
      code: 'DNA_PACKAGE_NOT_READY',
      message: 'DNA package is not ready for release',
      severity: 'error',
    });
  }

  const dnaPackageLinked = isAssetLinked(root, DNA_PACKAGE_PATH);
  const imageBridgeLinked = isAssetLinked(root, DNA_IMAGE_BRIDGE_PATH);
  const videoBridgeLinked = isAssetLinked(root, DNA_VIDEO_BRIDGE_PATH);
  const importTestLinked = isAssetLinked(root, DNA_CONSUMER_IMPORT_TEST_REPORT_PATH);

  if (!dnaPackageLinked) {
    issues.push({
      code: 'DNA_PACKAGE_NOT_LINKED',
      message: `DNA package asset not found at ${DNA_PACKAGE_PATH}`,
      severity: 'error',
    });
  }
  if (!imageBridgeLinked) {
    issues.push({
      code: 'IMAGE_BRIDGE_NOT_LINKED',
      message: `Image bridge asset not found at ${DNA_IMAGE_BRIDGE_PATH}`,
      severity: 'error',
    });
  }
  if (!videoBridgeLinked) {
    issues.push({
      code: 'VIDEO_BRIDGE_NOT_LINKED',
      message: `Video bridge asset not found at ${DNA_VIDEO_BRIDGE_PATH}`,
      severity: 'error',
    });
  }
  if (!importTestLinked) {
    issues.push({
      code: 'IMPORT_TEST_NOT_LINKED',
      message: `Import test report not found at ${DNA_CONSUMER_IMPORT_TEST_REPORT_PATH}`,
      severity: 'error',
    });
  }

  if (imageBridge.package_id !== dnaPackage.package_id) {
    issues.push({
      code: 'IMAGE_BRIDGE_PACKAGE_MISMATCH',
      message: 'Image bridge package_id does not match DNA package',
      severity: 'error',
    });
  }

  if (videoBridge.package_id !== dnaPackage.package_id) {
    issues.push({
      code: 'VIDEO_BRIDGE_PACKAGE_MISMATCH',
      message: 'Video bridge package_id does not match DNA package',
      severity: 'error',
    });
  }

  const releasePackage = buildMovieAnalysisDnaReleasePackage(
    dnaPackage,
    imageBridge,
    videoBridge,
    importTestReport,
    adapterLibrary
  );

  const releaseManifest: MovieAnalysisDnaReleaseManifest = {
    manifest_id: 'movie-analysis-dna-release-manifest-v1',
    phase: DNA_RELEASE_PACKAGE_PHASE,
    generated_at: timestamp,
    release_package_path: DNA_RELEASE_PACKAGE_PATH,
    release_report_path: DNA_RELEASE_REPORT_PATH,
    dna_package_path: DNA_PACKAGE_PATH,
    image_bridge_path: DNA_IMAGE_BRIDGE_PATH,
    video_bridge_path: DNA_VIDEO_BRIDGE_PATH,
    import_test_report_path: DNA_CONSUMER_IMPORT_TEST_REPORT_PATH,
    source_count: releasePackage.source_count,
    adapter_count: releasePackage.adapter_count,
    assets: [
      { asset_id: 'dna_package', path: DNA_PACKAGE_PATH, role: 'deployable_dna_package' },
      { asset_id: 'image_bridge', path: DNA_IMAGE_BRIDGE_PATH, role: 'image_app_dna_bridge' },
      { asset_id: 'video_bridge', path: DNA_VIDEO_BRIDGE_PATH, role: 'video_app_dna_bridge' },
      {
        asset_id: 'import_test_report',
        path: DNA_CONSUMER_IMPORT_TEST_REPORT_PATH,
        role: 'consumer_import_test_verdict',
      },
      {
        asset_id: 'dna_release_package',
        path: DNA_RELEASE_PACKAGE_PATH,
        role: 'final_dna_release_package',
      },
    ],
  };

  const outDir = path.join(root, DNA_RELEASE_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, DNA_RELEASE_PACKAGE_PATH),
    `${JSON.stringify(releasePackage, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, DNA_RELEASE_MANIFEST_PATH),
    `${JSON.stringify(releaseManifest, null, 2)}\n`,
    'utf8'
  );

  const sourceAudits: SourceDnaReleaseAudit[] = [];
  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const libraryEntry = adapterLibrary.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const audit = auditSource(releasePackage, dnaPackage, libraryEntry, sourceVideoId);
    sourceAudits.push(audit);

    if (audit.source_release_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_RELEASE_NOT_READY',
        message: `DNA release source not ready: ${sourceVideoId}`,
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
    releasePackage.safety_summary.external_call_allowed === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Safety planning_only validation failed',
      severity: 'error',
    });
  }

  const dnaPackageLinkedStatus: ValidationStatus = dnaPackageLinked ? 'PASS' : 'FAIL';
  const imageBridgeLinkedStatus: ValidationStatus = imageBridgeLinked ? 'PASS' : 'FAIL';
  const videoBridgeLinkedStatus: ValidationStatus = videoBridgeLinked ? 'PASS' : 'FAIL';
  const importTestLinkedStatus: ValidationStatus = importTestLinked ? 'PASS' : 'FAIL';
  const sourceIdsPreserved = aggregateStatus(sourceAudits, 'source_ids_preserved');
  const adapterIdsPreserved = aggregateStatus(sourceAudits, 'adapter_ids_preserved');
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');
  const certificationStatusPreserved = aggregateStatus(
    sourceAudits,
    'certification_status_preserved'
  );
  const planningOnlyStatus: ValidationStatus = safetyValid ? 'PASS' : 'FAIL';

  const releaseReady =
    releasePackage.release_readiness.release_ready === true &&
    dnaPackageLinkedStatus === 'PASS' &&
    imageBridgeLinkedStatus === 'PASS' &&
    videoBridgeLinkedStatus === 'PASS' &&
    importTestLinkedStatus === 'PASS' &&
    sourceIdsPreserved === 'PASS' &&
    adapterIdsPreserved === 'PASS' &&
    traceabilityPreserved === 'PASS' &&
    certificationStatusPreserved === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.source_release_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = releaseReady === 'PASS';

  const report: MovieAnalysisDnaReleaseReport = {
    report_id: 'movie-analysis-dna-release-report-v1',
    phase: DNA_RELEASE_PACKAGE_PHASE,
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
    source_count: releasePackage.source_count,
    adapter_count: releasePackage.adapter_count,
    release_package_path: DNA_RELEASE_PACKAGE_PATH,
    release_manifest_path: DNA_RELEASE_MANIFEST_PATH,
    dna_package_linked: dnaPackageLinkedStatus,
    image_bridge_linked: imageBridgeLinkedStatus,
    video_bridge_linked: videoBridgeLinkedStatus,
    import_test_linked: importTestLinkedStatus,
    source_ids_preserved: sourceIdsPreserved,
    adapter_ids_preserved: adapterIdsPreserved,
    traceability_preserved: traceabilityPreserved,
    certification_status_preserved: certificationStatusPreserved,
    release_ready: releaseReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass ? DNA_RELEASE_PACKAGE_PASS_VERDICT : DNA_RELEASE_PACKAGE_FAIL_VERDICT,
    issues,
  };

  fs.writeFileSync(
    path.join(root, DNA_RELEASE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}

export function loadMovieAnalysisDnaReleasePackage(
  projectRoot?: string
): MovieAnalysisDnaReleasePackage | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, DNA_RELEASE_PACKAGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisDnaReleasePackage;
}

export function loadMovieAnalysisDnaReleaseManifest(
  projectRoot?: string
): MovieAnalysisDnaReleaseManifest | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, DNA_RELEASE_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisDnaReleaseManifest;
}
