import fs from 'node:fs';
import path from 'node:path';
import { DATASET_PATH, loadMovieAnalysisDataset } from './movieAnalysisDatasetExport.js';
import {
  IMAGE_CONSUMER_BRIDGE_PATH,
  VIDEO_CONSUMER_BRIDGE_PATH,
} from './movieAnalysisDatasetConsumerBridge.js';
import {
  EXPECTED_SOURCE_COUNT,
  RELEASE_MANIFEST_PATH,
  RELEASE_PACKAGE_PASS_VERDICT,
  RELEASE_PACKAGE_PATH,
  RELEASE_REPORT_PATH,
  loadMovieAnalysisReleaseManifest,
  loadMovieAnalysisReleasePackage,
  loadMovieAnalysisReleaseReport,
} from './movieAnalysisReleasePackage.js';
import { TRACE_DEFINITIONS } from './movieAnalysisMasterPackageDesign.js';
import {
  IMAGE_UPLOAD_PATH,
  UPLOAD_MANIFEST_PATH,
  VIDEO_UPLOAD_PATH,
  loadMovieAnalysisImageUpload,
  loadMovieAnalysisUploadManifest,
  loadMovieAnalysisVideoUpload,
} from './movieAnalysisUploadBundle.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const RUNTIME_CONSUMER_VALIDATION_PHASE =
  'PHASE-SOURCE-VIDEO-051-MOVIE_ANALYSIS_RUNTIME_CONSUMER_VALIDATION_V1' as const;
export const RUNTIME_CONSUMER_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_RUNTIME_CONSUMER_VALIDATION_V1' as const;
export const RUNTIME_CONSUMER_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_RUNTIME_CONSUMER_VALIDATION_V1' as const;
export const RUNTIME_CONSUMER_VALIDATION_REPORT_PATH =
  'reports/movie-analysis-runtime-consumer-validation-report.json' as const;
export const RUNTIME_CONSUMER_VALIDATION_MD_PATH =
  'reports/MOVIE_ANALYSIS_RUNTIME_CONSUMER_VALIDATION.md' as const;

export { EXPECTED_SOURCE_COUNT };

export type ValidationStatus = 'PASS' | 'FAIL';

export type RuntimeConsumerValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceImageConsumerAudit = {
  source_video_id: string;
  character_payload_present: boolean;
  emotion_payload_present: boolean;
  chain_ids_present: boolean;
  package_trace_present: boolean;
  safety_flags_present: boolean;
};

export type SourceVideoConsumerAudit = {
  source_video_id: string;
  scene_payload_present: boolean;
  camera_payload_present: boolean;
  transition_payload_present: boolean;
  continuity_payload_present: boolean;
  runtime_bundle_present: boolean;
  chain_ids_present: boolean;
  package_trace_present: boolean;
};

export type MovieAnalysisRuntimeConsumerValidationReport = {
  report_id: string;
  phase: typeof RUNTIME_CONSUMER_VALIDATION_PHASE;
  timestamp: string;
  planning_only: true;
  runtime_consumer_validation_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  no_inference: true;
  source_count: number;
  release_package_exists: boolean;
  release_manifest_exists: boolean;
  release_report_exists: boolean;
  image_consumer_ready: ValidationStatus;
  video_consumer_ready: ValidationStatus;
  release_integrity: ValidationStatus;
  trace_integrity: ValidationStatus;
  safety_integrity: ValidationStatus;
  runtime_consumer_validation_only_status: ValidationStatus;
  image_consumer_audits: SourceImageConsumerAudit[];
  video_consumer_audits: SourceVideoConsumerAudit[];
  release_integrity_checks: {
    release_package_complete: boolean;
    manifest_links_valid: boolean;
    upload_bundle_links_valid: boolean;
    dataset_links_valid: boolean;
    bridge_links_valid: boolean;
    trace_integrity: boolean;
  };
  safety_checks: {
    runtime_execution: false;
    video_generation: false;
    image_generation: false;
    gpu_execution: false;
    external_call_allowed: false;
    planning_only: true;
  };
  final_verdict:
    | typeof RUNTIME_CONSUMER_VALIDATION_PASS_VERDICT
    | typeof RUNTIME_CONSUMER_VALIDATION_FAIL_VERDICT;
  issues: RuntimeConsumerValidationIssue[];
};

function isPackageTracePresent(trace: { step: number; phase: string; plan_type: string }[]): boolean {
  if (trace.length !== TRACE_DEFINITIONS.length) {
    return false;
  }
  for (let i = 0; i < TRACE_DEFINITIONS.length; i++) {
    const definition = TRACE_DEFINITIONS[i];
    const entry = trace[i];
    if (
      !entry ||
      entry.step !== i + 1 ||
      entry.phase !== definition.phase ||
      entry.plan_type !== definition.plan_type
    ) {
      return false;
    }
  }
  return true;
}

function areSafetyFlagsPresent(safety: {
  planning_only: boolean;
  design_only: boolean;
  runtime_execution: boolean;
  video_generation: boolean;
  image_generation: boolean;
  gpu_execution: boolean;
  external_call_allowed: boolean;
}): boolean {
  return (
    safety.planning_only === true &&
    safety.design_only === true &&
    safety.runtime_execution === false &&
    safety.video_generation === false &&
    safety.image_generation === false &&
    safety.gpu_execution === false &&
    safety.external_call_allowed === false
  );
}

function buildMarkdown(report: MovieAnalysisRuntimeConsumerValidationReport): string {
  const lines = [
    '# Movie Analysis Runtime Consumer Validation',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Validation Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| runtime_consumer_validation_only | ${report.runtime_consumer_validation_only} |`,
    `| runtime_execution | ${report.runtime_execution} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    `| no_inference | ${report.no_inference} |`,
    '',
    '## Summary Checks',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| release_package_exists | ${report.release_package_exists} |`,
    `| release_manifest_exists | ${report.release_manifest_exists} |`,
    `| release_report_exists | ${report.release_report_exists} |`,
    `| image_consumer_ready | ${report.image_consumer_ready} |`,
    `| video_consumer_ready | ${report.video_consumer_ready} |`,
    `| release_integrity | ${report.release_integrity} |`,
    `| trace_integrity | ${report.trace_integrity} |`,
    `| safety_integrity | ${report.safety_integrity} |`,
    `| runtime_consumer_validation_only | ${report.runtime_consumer_validation_only_status} |`,
    '',
    '## Image Consumer Audits',
    '',
  ];

  for (const audit of report.image_consumer_audits) {
    lines.push(`### ${audit.source_video_id}`);
    lines.push('');
    lines.push(`- character_payload_present: ${audit.character_payload_present}`);
    lines.push(`- emotion_payload_present: ${audit.emotion_payload_present}`);
    lines.push(`- chain_ids_present: ${audit.chain_ids_present}`);
    lines.push(`- package_trace_present: ${audit.package_trace_present}`);
    lines.push(`- safety_flags_present: ${audit.safety_flags_present}`);
    lines.push('');
  }

  lines.push('## Video Consumer Audits', '');
  for (const audit of report.video_consumer_audits) {
    lines.push(`### ${audit.source_video_id}`);
    lines.push('');
    lines.push(`- scene_payload_present: ${audit.scene_payload_present}`);
    lines.push(`- camera_payload_present: ${audit.camera_payload_present}`);
    lines.push(`- transition_payload_present: ${audit.transition_payload_present}`);
    lines.push(`- continuity_payload_present: ${audit.continuity_payload_present}`);
    lines.push(`- runtime_bundle_present: ${audit.runtime_bundle_present}`);
    lines.push(`- chain_ids_present: ${audit.chain_ids_present}`);
    lines.push(`- package_trace_present: ${audit.package_trace_present}`);
    lines.push('');
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

export function writeMovieAnalysisRuntimeConsumerValidationReport(
  projectRoot?: string
): MovieAnalysisRuntimeConsumerValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RuntimeConsumerValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const releasePackage = loadMovieAnalysisReleasePackage(root);
  const releaseManifest = loadMovieAnalysisReleaseManifest(root);
  const releaseReport = loadMovieAnalysisReleaseReport(root);

  const releasePackageExists = releasePackage !== null;
  const releaseManifestExists = releaseManifest !== null;
  const releaseReportExists = releaseReport !== null;

  if (!releasePackageExists) {
    issues.push({
      code: 'RELEASE_PACKAGE_MISSING',
      message: `Missing ${RELEASE_PACKAGE_PATH}`,
      severity: 'error',
    });
  }
  if (!releaseManifestExists) {
    issues.push({
      code: 'RELEASE_MANIFEST_MISSING',
      message: `Missing ${RELEASE_MANIFEST_PATH}`,
      severity: 'error',
    });
  }
  if (!releaseReportExists) {
    issues.push({
      code: 'RELEASE_REPORT_MISSING',
      message: `Missing ${RELEASE_REPORT_PATH}`,
      severity: 'error',
    });
  }

  if (!releasePackage || !releaseManifest || !releaseReport) {
    const report: MovieAnalysisRuntimeConsumerValidationReport = {
      report_id: 'movie-analysis-runtime-consumer-validation-report-v1',
      phase: RUNTIME_CONSUMER_VALIDATION_PHASE,
      timestamp,
      planning_only: true,
      runtime_consumer_validation_only: true,
      runtime_execution: false,
      video_generation: false,
      image_generation: false,
      gpu_execution: false,
      external_call_allowed: false,
      no_execution: true,
      no_rendering: true,
      no_inference: true,
      source_count: 0,
      release_package_exists: releasePackageExists,
      release_manifest_exists: releaseManifestExists,
      release_report_exists: releaseReportExists,
      image_consumer_ready: 'FAIL',
      video_consumer_ready: 'FAIL',
      release_integrity: 'FAIL',
      trace_integrity: 'FAIL',
      safety_integrity: 'FAIL',
      runtime_consumer_validation_only_status: 'PASS',
      image_consumer_audits: [],
      video_consumer_audits: [],
      release_integrity_checks: {
        release_package_complete: false,
        manifest_links_valid: false,
        upload_bundle_links_valid: false,
        dataset_links_valid: false,
        bridge_links_valid: false,
        trace_integrity: false,
      },
      safety_checks: {
        runtime_execution: false,
        video_generation: false,
        image_generation: false,
        gpu_execution: false,
        external_call_allowed: false,
        planning_only: true,
      },
      final_verdict: RUNTIME_CONSUMER_VALIDATION_FAIL_VERDICT,
      issues,
    };

    fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(root, RUNTIME_CONSUMER_VALIDATION_REPORT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(root, RUNTIME_CONSUMER_VALIDATION_MD_PATH),
      `${buildMarkdown(report)}\n`,
      'utf8'
    );
    return report;
  }

  if (releaseReport.final_verdict !== RELEASE_PACKAGE_PASS_VERDICT) {
    issues.push({
      code: 'RELEASE_PACKAGE_NOT_PASS',
      message: `Release package must have ${RELEASE_PACKAGE_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  if (releasePackage.source_count !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  const imageUpload = loadMovieAnalysisImageUpload(root);
  const videoUpload = loadMovieAnalysisVideoUpload(root);
  const uploadManifest = loadMovieAnalysisUploadManifest(root);
  const dataset = loadMovieAnalysisDataset(root);

  if (!imageUpload || !videoUpload || !uploadManifest || !dataset) {
    issues.push({
      code: 'UPSTREAM_ARTIFACTS_MISSING',
      message: 'Missing upload bundle or dataset artifacts for runtime consumer validation',
      severity: 'error',
    });
  }

  const imageConsumerAudits: SourceImageConsumerAudit[] = [];
  const videoConsumerAudits: SourceVideoConsumerAudit[] = [];

  if (imageUpload && videoUpload) {
    for (const source of releasePackage.sources) {
      const imageEntry = imageUpload.upload_entries.find(
        (e) => e.source_video_id === source.source_video_id
      );
      const videoEntry = videoUpload.upload_entries.find(
        (e) => e.source_video_id === source.source_video_id
      );

      const characterPayload =
        Boolean(imageEntry?.upload_payload.character_generation_structure.length) &&
        Boolean(imageEntry?.upload_payload.character_bundle.length);
      const emotionPayload =
        Boolean(imageEntry?.upload_payload.emotion_generation_structure.length) &&
        Boolean(imageEntry?.upload_payload.emotion_bundle.length);
      const imageChainIds = Boolean(
        imageEntry?.chain_ids.analysis_plan_id &&
          imageEntry?.chain_ids.keyframe_preparation_id &&
          imageEntry?.chain_ids.generation_blueprint_id
      );
      const imageTrace = imageEntry ? isPackageTracePresent(imageEntry.package_trace) : false;
      const imageSafety = imageEntry ? areSafetyFlagsPresent(imageEntry.safety) : false;

      const scenePayload = Boolean(videoEntry?.upload_payload.scene_generation_structure.length);
      const cameraPayload = Boolean(videoEntry?.upload_payload.camera_generation_structure.length);
      const transitionPayload = Boolean(
        videoEntry?.upload_payload.transition_generation_structure.length
      );
      const continuityPayload = Boolean(
        videoEntry?.upload_payload.continuity_generation_structure.length
      );
      const runtimeBundle = Boolean(videoEntry?.upload_payload.runtime_bundle.length);
      const videoChainIds = Boolean(
        videoEntry?.chain_ids.video_blueprint_id &&
          videoEntry?.chain_ids.temporal_flow_id &&
          videoEntry?.chain_ids.motion_plan_id
      );
      const videoTrace = videoEntry ? isPackageTracePresent(videoEntry.package_trace) : false;

      if (!characterPayload) {
        issues.push({
          code: 'CHARACTER_PAYLOAD_MISSING',
          message: `Character payload missing for ${source.source_video_id}`,
          severity: 'error',
          source_video_id: source.source_video_id,
        });
      }
      if (!emotionPayload) {
        issues.push({
          code: 'EMOTION_PAYLOAD_MISSING',
          message: `Emotion payload missing for ${source.source_video_id}`,
          severity: 'error',
          source_video_id: source.source_video_id,
        });
      }
      if (!imageChainIds) {
        issues.push({
          code: 'IMAGE_CHAIN_IDS_MISSING',
          message: `Image chain IDs missing for ${source.source_video_id}`,
          severity: 'error',
          source_video_id: source.source_video_id,
        });
      }
      if (!imageTrace) {
        issues.push({
          code: 'IMAGE_TRACE_MISSING',
          message: `Image package trace missing for ${source.source_video_id}`,
          severity: 'error',
          source_video_id: source.source_video_id,
        });
      }
      if (!imageSafety) {
        issues.push({
          code: 'IMAGE_SAFETY_MISSING',
          message: `Image safety flags missing for ${source.source_video_id}`,
          severity: 'error',
          source_video_id: source.source_video_id,
        });
      }

      if (!scenePayload) {
        issues.push({
          code: 'SCENE_PAYLOAD_MISSING',
          message: `Scene payload missing for ${source.source_video_id}`,
          severity: 'error',
          source_video_id: source.source_video_id,
        });
      }
      if (!cameraPayload) {
        issues.push({
          code: 'CAMERA_PAYLOAD_MISSING',
          message: `Camera payload missing for ${source.source_video_id}`,
          severity: 'error',
          source_video_id: source.source_video_id,
        });
      }
      if (!transitionPayload) {
        issues.push({
          code: 'TRANSITION_PAYLOAD_MISSING',
          message: `Transition payload missing for ${source.source_video_id}`,
          severity: 'error',
          source_video_id: source.source_video_id,
        });
      }
      if (!continuityPayload) {
        issues.push({
          code: 'CONTINUITY_PAYLOAD_MISSING',
          message: `Continuity payload missing for ${source.source_video_id}`,
          severity: 'error',
          source_video_id: source.source_video_id,
        });
      }
      if (!runtimeBundle) {
        issues.push({
          code: 'RUNTIME_BUNDLE_MISSING',
          message: `Runtime bundle missing for ${source.source_video_id}`,
          severity: 'error',
          source_video_id: source.source_video_id,
        });
      }
      if (!videoChainIds) {
        issues.push({
          code: 'VIDEO_CHAIN_IDS_MISSING',
          message: `Video chain IDs missing for ${source.source_video_id}`,
          severity: 'error',
          source_video_id: source.source_video_id,
        });
      }
      if (!videoTrace) {
        issues.push({
          code: 'VIDEO_TRACE_MISSING',
          message: `Video package trace missing for ${source.source_video_id}`,
          severity: 'error',
          source_video_id: source.source_video_id,
        });
      }

      imageConsumerAudits.push({
        source_video_id: source.source_video_id,
        character_payload_present: characterPayload,
        emotion_payload_present: emotionPayload,
        chain_ids_present: imageChainIds,
        package_trace_present: imageTrace,
        safety_flags_present: imageSafety,
      });

      videoConsumerAudits.push({
        source_video_id: source.source_video_id,
        scene_payload_present: scenePayload,
        camera_payload_present: cameraPayload,
        transition_payload_present: transitionPayload,
        continuity_payload_present: continuityPayload,
        runtime_bundle_present: runtimeBundle,
        chain_ids_present: videoChainIds,
        package_trace_present: videoTrace,
      });
    }
  }

  const releasePackageComplete =
    releasePackageExists &&
    releaseManifestExists &&
    releaseReportExists &&
    releaseReport.release_package_complete === true &&
    releaseReport.final_verdict === RELEASE_PACKAGE_PASS_VERDICT;

  const manifestLinksValid =
    releaseManifest.assets.every((asset) => fs.existsSync(path.join(root, asset.path))) &&
    fs.existsSync(path.join(root, releaseManifest.release_package_path)) &&
    fs.existsSync(path.join(root, releaseManifest.release_report_path));

  const uploadBundleLinksValid =
    fs.existsSync(path.join(root, releasePackage.image_upload_path)) &&
    fs.existsSync(path.join(root, releasePackage.video_upload_path)) &&
    fs.existsSync(path.join(root, releasePackage.upload_manifest_path)) &&
    fs.existsSync(path.join(root, releasePackage.upload_bundle_dir));

  const datasetLinksValid =
    uploadManifest !== null &&
    dataset !== null &&
    fs.existsSync(path.join(root, uploadManifest.dataset_path)) &&
    uploadManifest.dataset_path === DATASET_PATH &&
    releasePackage.dataset_id === dataset.dataset_id &&
    releasePackage.dataset_version === dataset.dataset_version;

  const bridgeLinksValid =
    uploadManifest !== null &&
    fs.existsSync(path.join(root, uploadManifest.image_bridge_path)) &&
    fs.existsSync(path.join(root, uploadManifest.video_bridge_path)) &&
    uploadManifest.image_bridge_path === IMAGE_CONSUMER_BRIDGE_PATH &&
    uploadManifest.video_bridge_path === VIDEO_CONSUMER_BRIDGE_PATH;

  const traceIntegrity =
    imageConsumerAudits.length === EXPECTED_SOURCE_COUNT &&
    videoConsumerAudits.length === EXPECTED_SOURCE_COUNT &&
    imageConsumerAudits.every((a) => a.package_trace_present) &&
    videoConsumerAudits.every((a) => a.package_trace_present);

  if (!releasePackageComplete) {
    issues.push({
      code: 'RELEASE_PACKAGE_INCOMPLETE',
      message: 'Release package completeness check failed',
      severity: 'error',
    });
  }
  if (!manifestLinksValid) {
    issues.push({
      code: 'MANIFEST_LINKS_INVALID',
      message: 'Release manifest links validation failed',
      severity: 'error',
    });
  }
  if (!uploadBundleLinksValid) {
    issues.push({
      code: 'UPLOAD_BUNDLE_LINKS_INVALID',
      message: 'Upload bundle links validation failed',
      severity: 'error',
    });
  }
  if (!datasetLinksValid) {
    issues.push({
      code: 'DATASET_LINKS_INVALID',
      message: 'Dataset links validation failed',
      severity: 'error',
    });
  }
  if (!bridgeLinksValid) {
    issues.push({
      code: 'BRIDGE_LINKS_INVALID',
      message: 'Bridge links validation failed',
      severity: 'error',
    });
  }
  if (!traceIntegrity) {
    issues.push({
      code: 'TRACE_INTEGRITY_FAIL',
      message: 'Trace integrity validation failed',
      severity: 'error',
    });
  }

  const releaseSafety = releasePackage.safety_summary;
  const safetyIntegrity =
    releaseSafety.planning_only === true &&
    releaseSafety.runtime_execution === false &&
    releaseSafety.video_generation === false &&
    releaseSafety.image_generation === false &&
    releaseSafety.gpu_execution === false &&
    releaseSafety.external_call_allowed === false &&
    imageUpload !== null &&
    videoUpload !== null &&
    imageUpload.safety_summary.runtime_execution === false &&
    videoUpload.safety_summary.runtime_execution === false &&
    imageUpload.safety_summary.video_generation === false &&
    videoUpload.safety_summary.video_generation === false &&
    imageUpload.safety_summary.image_generation === false &&
    videoUpload.safety_summary.image_generation === false &&
    imageUpload.safety_summary.gpu_execution === false &&
    videoUpload.safety_summary.gpu_execution === false;

  if (!safetyIntegrity) {
    issues.push({
      code: 'SAFETY_INTEGRITY_FAIL',
      message: 'Safety integrity validation failed',
      severity: 'error',
    });
  }

  const imageConsumerReady =
    imageConsumerAudits.length === EXPECTED_SOURCE_COUNT &&
    imageConsumerAudits.every(
      (a) =>
        a.character_payload_present &&
        a.emotion_payload_present &&
        a.chain_ids_present &&
        a.package_trace_present &&
        a.safety_flags_present
    )
      ? 'PASS'
      : 'FAIL';

  const videoConsumerReady =
    videoConsumerAudits.length === EXPECTED_SOURCE_COUNT &&
    videoConsumerAudits.every(
      (a) =>
        a.scene_payload_present &&
        a.camera_payload_present &&
        a.transition_payload_present &&
        a.continuity_payload_present &&
        a.runtime_bundle_present &&
        a.chain_ids_present &&
        a.package_trace_present
    )
      ? 'PASS'
      : 'FAIL';

  const releaseIntegrity =
    releasePackageComplete &&
    manifestLinksValid &&
    uploadBundleLinksValid &&
    datasetLinksValid &&
    bridgeLinksValid
      ? 'PASS'
      : 'FAIL';

  const traceIntegrityStatus = traceIntegrity ? 'PASS' : 'FAIL';
  const safetyIntegrityStatus = safetyIntegrity ? 'PASS' : 'FAIL';
  const runtimeConsumerValidationOnlyStatus: ValidationStatus = 'PASS';

  const pass =
    releasePackage.source_count === EXPECTED_SOURCE_COUNT &&
    releasePackageExists &&
    releaseManifestExists &&
    releaseReportExists &&
    imageConsumerReady === 'PASS' &&
    videoConsumerReady === 'PASS' &&
    releaseIntegrity === 'PASS' &&
    traceIntegrityStatus === 'PASS' &&
    safetyIntegrityStatus === 'PASS' &&
    runtimeConsumerValidationOnlyStatus === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieAnalysisRuntimeConsumerValidationReport = {
    report_id: 'movie-analysis-runtime-consumer-validation-report-v1',
    phase: RUNTIME_CONSUMER_VALIDATION_PHASE,
    timestamp,
    planning_only: true,
    runtime_consumer_validation_only: true,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    no_inference: true,
    source_count: releasePackage.source_count,
    release_package_exists: releasePackageExists,
    release_manifest_exists: releaseManifestExists,
    release_report_exists: releaseReportExists,
    image_consumer_ready: imageConsumerReady,
    video_consumer_ready: videoConsumerReady,
    release_integrity: releaseIntegrity,
    trace_integrity: traceIntegrityStatus,
    safety_integrity: safetyIntegrityStatus,
    runtime_consumer_validation_only_status: runtimeConsumerValidationOnlyStatus,
    image_consumer_audits: imageConsumerAudits,
    video_consumer_audits: videoConsumerAudits,
    release_integrity_checks: {
      release_package_complete: releasePackageComplete,
      manifest_links_valid: manifestLinksValid,
      upload_bundle_links_valid: uploadBundleLinksValid,
      dataset_links_valid: datasetLinksValid,
      bridge_links_valid: bridgeLinksValid,
      trace_integrity: traceIntegrity,
    },
    safety_checks: {
      runtime_execution: false,
      video_generation: false,
      image_generation: false,
      gpu_execution: false,
      external_call_allowed: false,
      planning_only: true,
    },
    final_verdict: pass
      ? RUNTIME_CONSUMER_VALIDATION_PASS_VERDICT
      : RUNTIME_CONSUMER_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, RUNTIME_CONSUMER_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, RUNTIME_CONSUMER_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
