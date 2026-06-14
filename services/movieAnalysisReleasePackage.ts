import fs from 'node:fs';
import path from 'node:path';
import {
  UPLOAD_BUNDLE_QUALITY_GATE_PASS_VERDICT,
  UPLOAD_BUNDLE_QUALITY_GATE_REPORT_PATH,
  type MovieAnalysisUploadBundleQualityGateReport,
} from './movieAnalysisUploadBundleQualityGate.js';
import {
  EXPECTED_SOURCE_COUNT,
  UPLOAD_BUNDLE_DIR,
  UPLOAD_BUNDLE_PASS_VERDICT,
  UPLOAD_MANIFEST_PATH,
  UPLOAD_REPORT_PATH,
  IMAGE_UPLOAD_PATH,
  VIDEO_UPLOAD_PATH,
  type MovieAnalysisUploadManifest,
  type MovieAnalysisUploadReport,
  loadMovieAnalysisImageUpload,
  loadMovieAnalysisUploadManifest,
  loadMovieAnalysisVideoUpload,
} from './movieAnalysisUploadBundle.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const RELEASE_PACKAGE_PHASE =
  'PHASE-SOURCE-VIDEO-050-MOVIE_ANALYSIS_RELEASE_PACKAGE_V1' as const;
export const RELEASE_PACKAGE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_RELEASE_PACKAGE_V1' as const;
export const RELEASE_PACKAGE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_RELEASE_PACKAGE_V1' as const;
export const RELEASE_DIR = 'exports/movie_analysis_release' as const;
export const RELEASE_PACKAGE_PATH =
  'exports/movie_analysis_release/movie-analysis-release-package.json' as const;
export const RELEASE_MANIFEST_PATH =
  'exports/movie_analysis_release/movie-analysis-release-manifest.json' as const;
export const RELEASE_REPORT_PATH =
  'exports/movie_analysis_release/movie-analysis-release-report.json' as const;

export const RELEASE_VERSION = 'v1' as const;

export { EXPECTED_SOURCE_COUNT };

export type ReleaseSafetySummary = {
  planning_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  ocr: false;
  external_call_allowed: false;
};

export type ReleaseSourceEntry = {
  source_video_id: string;
  source_video_path: string;
  master_package_id: string;
  image_upload_ready: boolean;
  video_upload_ready: boolean;
};

export type MovieAnalysisReleasePackage = {
  release_id: string;
  release_version: typeof RELEASE_VERSION;
  phase: typeof RELEASE_PACKAGE_PHASE;
  released_at: string;
  source_count: number;
  dataset_id: string;
  dataset_version: string;
  upload_bundle_dir: typeof UPLOAD_BUNDLE_DIR;
  quality_gate_report_path: typeof UPLOAD_BUNDLE_QUALITY_GATE_REPORT_PATH;
  consumer_targets: ['image_app', 'video_app'];
  image_upload_path: typeof IMAGE_UPLOAD_PATH;
  video_upload_path: typeof VIDEO_UPLOAD_PATH;
  upload_manifest_path: typeof UPLOAD_MANIFEST_PATH;
  sources: ReleaseSourceEntry[];
  release_readiness: {
    image_upload_ready: boolean;
    video_upload_ready: boolean;
    quality_gate_passed: boolean;
    safety_flags_preserved: boolean;
    version_ready: boolean;
  };
  safety_summary: ReleaseSafetySummary;
};

export type MovieAnalysisReleaseManifestAsset = {
  asset_id: string;
  path: string;
  role: string;
};

export type MovieAnalysisReleaseManifest = {
  manifest_id: string;
  phase: typeof RELEASE_PACKAGE_PHASE;
  generated_at: string;
  release_package_path: typeof RELEASE_PACKAGE_PATH;
  release_report_path: typeof RELEASE_REPORT_PATH;
  upload_bundle_dir: typeof UPLOAD_BUNDLE_DIR;
  quality_gate_report_path: typeof UPLOAD_BUNDLE_QUALITY_GATE_REPORT_PATH;
  upload_bundle_linked: boolean;
  source_count: number;
  assets: MovieAnalysisReleaseManifestAsset[];
};

export type ReleasePackageIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
};

export type MovieAnalysisReleaseReport = {
  report_id: string;
  phase: typeof RELEASE_PACKAGE_PHASE;
  timestamp: string;
  source_count: number;
  release_package_complete: boolean;
  upload_bundle_linked: boolean;
  quality_gate_passed: boolean;
  image_upload_ready: boolean;
  video_upload_ready: boolean;
  safety_flags_preserved: boolean;
  version_ready: boolean;
  release_package_path: typeof RELEASE_PACKAGE_PATH;
  release_manifest_path: typeof RELEASE_MANIFEST_PATH;
  final_verdict: typeof RELEASE_PACKAGE_PASS_VERDICT | typeof RELEASE_PACKAGE_FAIL_VERDICT;
  issues: ReleasePackageIssue[];
};

const RELEASE_SAFETY_SUMMARY: ReleaseSafetySummary = {
  planning_only: true,
  runtime_execution: false,
  video_generation: false,
  image_generation: false,
  gpu_execution: false,
  ocr: false,
  external_call_allowed: false,
};

function loadQualityGateReport(projectRoot: string): MovieAnalysisUploadBundleQualityGateReport | null {
  const abs = path.join(projectRoot, UPLOAD_BUNDLE_QUALITY_GATE_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisUploadBundleQualityGateReport;
}

function loadUploadReport(projectRoot: string): MovieAnalysisUploadReport | null {
  const abs = path.join(projectRoot, UPLOAD_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisUploadReport;
}

function areSafetyFlagsPreserved(
  imageUpload: NonNullable<ReturnType<typeof loadMovieAnalysisImageUpload>>,
  videoUpload: NonNullable<ReturnType<typeof loadMovieAnalysisVideoUpload>>
): boolean {
  const summaries = [imageUpload.safety_summary, videoUpload.safety_summary];
  const summaryOk = summaries.every(
    (summary) =>
      summary.planning_only === true &&
      summary.runtime_execution === false &&
      summary.video_generation === false &&
      summary.image_generation === false &&
      summary.gpu_execution === false &&
      summary.ocr === false &&
      summary.external_call_allowed === false
  );

  const entriesOk = [...imageUpload.upload_entries, ...videoUpload.upload_entries].every(
    (entry) =>
      entry.safety.planning_only === true &&
      entry.safety.runtime_execution === false &&
      entry.safety.video_generation === false &&
      entry.safety.image_generation === false &&
      entry.safety.gpu_execution === false
  );

  return summaryOk && entriesOk;
}

function isUploadBundleLinked(
  projectRoot: string,
  uploadManifest: MovieAnalysisUploadManifest
): boolean {
  const paths = [
    UPLOAD_BUNDLE_DIR,
    IMAGE_UPLOAD_PATH,
    VIDEO_UPLOAD_PATH,
    UPLOAD_MANIFEST_PATH,
    UPLOAD_REPORT_PATH,
    uploadManifest.dataset_path,
    uploadManifest.image_bridge_path,
    uploadManifest.video_bridge_path,
    uploadManifest.image_upload_path,
    uploadManifest.video_upload_path,
  ];

  return paths.every((relPath) => fs.existsSync(path.join(projectRoot, relPath)));
}

function isVersionReady(
  imageUpload: NonNullable<ReturnType<typeof loadMovieAnalysisImageUpload>>,
  videoUpload: NonNullable<ReturnType<typeof loadMovieAnalysisVideoUpload>>
): boolean {
  return (
    imageUpload.dataset_version === videoUpload.dataset_version &&
    Boolean(imageUpload.dataset_id) &&
    imageUpload.dataset_id === videoUpload.dataset_id &&
    Boolean(imageUpload.upload_id) &&
    Boolean(videoUpload.upload_id)
  );
}

export function buildMovieAnalysisReleasePackage(
  uploadManifest: MovieAnalysisUploadManifest,
  imageUpload: NonNullable<ReturnType<typeof loadMovieAnalysisImageUpload>>,
  videoUpload: NonNullable<ReturnType<typeof loadMovieAnalysisVideoUpload>>,
  qualityGateReport: MovieAnalysisUploadBundleQualityGateReport,
  uploadReport: MovieAnalysisUploadReport
): MovieAnalysisReleasePackage {
  const sources: ReleaseSourceEntry[] = uploadManifest.entries.map((entry) => ({
    source_video_id: entry.source_video_id,
    source_video_path: entry.source_video_path,
    master_package_id: entry.master_package_id,
    image_upload_ready: entry.image_upload_ready,
    video_upload_ready: entry.video_upload_ready,
  }));

  const safetyPreserved = areSafetyFlagsPreserved(imageUpload, videoUpload);
  const versionReady = isVersionReady(imageUpload, videoUpload);
  const qualityGatePassed =
    qualityGateReport.final_verdict === UPLOAD_BUNDLE_QUALITY_GATE_PASS_VERDICT;

  return {
    release_id: 'movie-analysis-release-package-v1',
    release_version: RELEASE_VERSION,
    phase: RELEASE_PACKAGE_PHASE,
    released_at: new Date().toISOString(),
    source_count: uploadManifest.source_count,
    dataset_id: imageUpload.dataset_id,
    dataset_version: imageUpload.dataset_version,
    upload_bundle_dir: UPLOAD_BUNDLE_DIR,
    quality_gate_report_path: UPLOAD_BUNDLE_QUALITY_GATE_REPORT_PATH,
    consumer_targets: ['image_app', 'video_app'],
    image_upload_path: IMAGE_UPLOAD_PATH,
    video_upload_path: VIDEO_UPLOAD_PATH,
    upload_manifest_path: UPLOAD_MANIFEST_PATH,
    sources,
    release_readiness: {
      image_upload_ready: uploadReport.image_upload_ready,
      video_upload_ready: uploadReport.video_upload_ready,
      quality_gate_passed: qualityGatePassed,
      safety_flags_preserved: safetyPreserved,
      version_ready: versionReady,
    },
    safety_summary: RELEASE_SAFETY_SUMMARY,
  };
}

export function writeMovieAnalysisReleasePackage(
  projectRoot?: string
): MovieAnalysisReleaseReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ReleasePackageIssue[] = [];
  const timestamp = new Date().toISOString();

  const imageUpload = loadMovieAnalysisImageUpload(root);
  if (!imageUpload) {
    issues.push({
      code: 'IMAGE_UPLOAD_MISSING',
      message: `Missing ${IMAGE_UPLOAD_PATH}`,
      severity: 'error',
    });
  }

  const videoUpload = loadMovieAnalysisVideoUpload(root);
  if (!videoUpload) {
    issues.push({
      code: 'VIDEO_UPLOAD_MISSING',
      message: `Missing ${VIDEO_UPLOAD_PATH}`,
      severity: 'error',
    });
  }

  const uploadManifest = loadMovieAnalysisUploadManifest(root);
  if (!uploadManifest) {
    issues.push({
      code: 'UPLOAD_MANIFEST_MISSING',
      message: `Missing ${UPLOAD_MANIFEST_PATH}`,
      severity: 'error',
    });
  }

  const qualityGateReport = loadQualityGateReport(root);
  if (!qualityGateReport) {
    issues.push({
      code: 'QUALITY_GATE_REPORT_MISSING',
      message: `Missing ${UPLOAD_BUNDLE_QUALITY_GATE_REPORT_PATH}`,
      severity: 'error',
    });
  }

  const uploadReport = loadUploadReport(root);
  if (!uploadReport) {
    issues.push({
      code: 'UPLOAD_REPORT_MISSING',
      message: `Missing ${UPLOAD_REPORT_PATH}`,
      severity: 'error',
    });
  }

  if (!imageUpload || !videoUpload || !uploadManifest || !qualityGateReport || !uploadReport) {
    const report: MovieAnalysisReleaseReport = {
      report_id: 'movie-analysis-release-report-v1',
      phase: RELEASE_PACKAGE_PHASE,
      timestamp,
      source_count: 0,
      release_package_complete: false,
      upload_bundle_linked: false,
      quality_gate_passed: false,
      image_upload_ready: false,
      video_upload_ready: false,
      safety_flags_preserved: false,
      version_ready: false,
      release_package_path: RELEASE_PACKAGE_PATH,
      release_manifest_path: RELEASE_MANIFEST_PATH,
      final_verdict: RELEASE_PACKAGE_FAIL_VERDICT,
      issues,
    };
    return report;
  }

  if (uploadReport.final_verdict !== UPLOAD_BUNDLE_PASS_VERDICT) {
    issues.push({
      code: 'UPLOAD_BUNDLE_NOT_PASS',
      message: `Upload bundle must have ${UPLOAD_BUNDLE_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  if (qualityGateReport.final_verdict !== UPLOAD_BUNDLE_QUALITY_GATE_PASS_VERDICT) {
    issues.push({
      code: 'QUALITY_GATE_NOT_PASS',
      message: `Quality gate must have ${UPLOAD_BUNDLE_QUALITY_GATE_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  if (uploadManifest.source_count !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  const uploadBundleLinked = isUploadBundleLinked(root, uploadManifest);
  if (!uploadBundleLinked) {
    issues.push({
      code: 'UPLOAD_BUNDLE_NOT_LINKED',
      message: 'Upload bundle linkage validation failed',
      severity: 'error',
    });
  }

  const qualityGatePassed =
    qualityGateReport.final_verdict === UPLOAD_BUNDLE_QUALITY_GATE_PASS_VERDICT &&
    qualityGateReport.safety_flags_preserved === true;
  const imageUploadReady =
    uploadReport.image_upload_ready === true &&
    uploadManifest.entries.every((entry) => entry.image_upload_ready);
  const videoUploadReady =
    uploadReport.video_upload_ready === true &&
    uploadManifest.entries.every((entry) => entry.video_upload_ready);
  const safetyFlagsPreserved = areSafetyFlagsPreserved(imageUpload, videoUpload);
  const versionReady = isVersionReady(imageUpload, videoUpload);

  if (!imageUploadReady) {
    issues.push({
      code: 'IMAGE_UPLOAD_NOT_READY',
      message: 'Image upload not ready for release',
      severity: 'error',
    });
  }
  if (!videoUploadReady) {
    issues.push({
      code: 'VIDEO_UPLOAD_NOT_READY',
      message: 'Video upload not ready for release',
      severity: 'error',
    });
  }
  if (!safetyFlagsPreserved) {
    issues.push({
      code: 'SAFETY_FLAGS_NOT_PRESERVED',
      message: 'Safety flags not preserved in release package',
      severity: 'error',
    });
  }
  if (!versionReady) {
    issues.push({
      code: 'VERSION_NOT_READY',
      message: 'Release version metadata not ready',
      severity: 'error',
    });
  }

  const releasePackage = buildMovieAnalysisReleasePackage(
    uploadManifest,
    imageUpload,
    videoUpload,
    qualityGateReport,
    uploadReport
  );

  const releaseManifest: MovieAnalysisReleaseManifest = {
    manifest_id: 'movie-analysis-release-manifest-v1',
    phase: RELEASE_PACKAGE_PHASE,
    generated_at: timestamp,
    release_package_path: RELEASE_PACKAGE_PATH,
    release_report_path: RELEASE_REPORT_PATH,
    upload_bundle_dir: UPLOAD_BUNDLE_DIR,
    quality_gate_report_path: UPLOAD_BUNDLE_QUALITY_GATE_REPORT_PATH,
    upload_bundle_linked: uploadBundleLinked,
    source_count: releasePackage.source_count,
    assets: [
      {
        asset_id: 'image_upload',
        path: IMAGE_UPLOAD_PATH,
        role: 'image_app_upload',
      },
      {
        asset_id: 'video_upload',
        path: VIDEO_UPLOAD_PATH,
        role: 'video_app_upload',
      },
      {
        asset_id: 'upload_manifest',
        path: UPLOAD_MANIFEST_PATH,
        role: 'upload_bundle_manifest',
      },
      {
        asset_id: 'quality_gate_report',
        path: UPLOAD_BUNDLE_QUALITY_GATE_REPORT_PATH,
        role: 'quality_gate_verdict',
      },
    ],
  };

  const outDir = path.join(root, RELEASE_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, RELEASE_PACKAGE_PATH),
    `${JSON.stringify(releasePackage, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, RELEASE_MANIFEST_PATH),
    `${JSON.stringify(releaseManifest, null, 2)}\n`,
    'utf8'
  );

  const releasePackageComplete =
    fs.existsSync(path.join(root, RELEASE_PACKAGE_PATH)) &&
    fs.existsSync(path.join(root, RELEASE_MANIFEST_PATH));

  const pass =
    releasePackage.source_count === EXPECTED_SOURCE_COUNT &&
    releasePackageComplete &&
    uploadBundleLinked &&
    qualityGatePassed &&
    imageUploadReady &&
    videoUploadReady &&
    safetyFlagsPreserved &&
    versionReady &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieAnalysisReleaseReport = {
    report_id: 'movie-analysis-release-report-v1',
    phase: RELEASE_PACKAGE_PHASE,
    timestamp,
    source_count: releasePackage.source_count,
    release_package_complete: releasePackageComplete,
    upload_bundle_linked: uploadBundleLinked,
    quality_gate_passed: qualityGatePassed,
    image_upload_ready: imageUploadReady,
    video_upload_ready: videoUploadReady,
    safety_flags_preserved: safetyFlagsPreserved,
    version_ready: versionReady,
    release_package_path: RELEASE_PACKAGE_PATH,
    release_manifest_path: RELEASE_MANIFEST_PATH,
    final_verdict: pass ? RELEASE_PACKAGE_PASS_VERDICT : RELEASE_PACKAGE_FAIL_VERDICT,
    issues,
  };

  fs.writeFileSync(
    path.join(root, RELEASE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}

export function loadMovieAnalysisReleasePackage(
  projectRoot?: string
): MovieAnalysisReleasePackage | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, RELEASE_PACKAGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisReleasePackage;
}

export function loadMovieAnalysisReleaseManifest(
  projectRoot?: string
): MovieAnalysisReleaseManifest | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, RELEASE_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisReleaseManifest;
}

export function loadMovieAnalysisReleaseReport(
  projectRoot?: string
): MovieAnalysisReleaseReport | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, RELEASE_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisReleaseReport;
}
