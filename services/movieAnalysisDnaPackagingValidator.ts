import fs from 'node:fs';
import path from 'node:path';
import { CINEMATIC_DNA_PATH } from './movieAnalysisCinematicDnaExtraction.js';
import { CINEMATIC_DNA_INTEGRATION_PATH } from './movieAnalysisCinematicDnaIntegration.js';
import { DNA_ADAPTER_CERTIFICATION_PASS_VERDICT } from './movieAnalysisDnaAdapterCertification.js';
import { DNA_ADAPTER_LIBRARY_PATH } from './movieAnalysisDnaAdapterLibrary.js';
import {
  ADAPTERS_PER_SOURCE,
  DNA_PACKAGING_FAIL_VERDICT,
  DNA_PACKAGING_PASS_VERDICT,
  DNA_PACKAGING_PHASE,
  DNA_PACKAGE_MANIFEST_PATH,
  DNA_PACKAGE_PATH,
  DNA_PACKAGE_REPORT_PATH,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_SOURCE_VIDEO_IDS,
  type MovieAnalysisDnaPackage,
  loadMovieAnalysisDnaPackage,
  loadMovieAnalysisDnaPackageManifest,
} from './movieAnalysisDnaPackaging.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export type ValidationStatus = 'PASS' | 'FAIL';

export type DnaPackagingValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceDnaPackagingAudit = {
  source_video_id: string;
  adapter_count_valid: ValidationStatus;
  certification_preserved: ValidationStatus;
  dna_traceability_preserved: ValidationStatus;
  image_mapping_preserved: ValidationStatus;
  video_mapping_preserved: ValidationStatus;
  source_ready: ValidationStatus;
};

export type MovieAnalysisDnaPackageReport = {
  report_id: string;
  phase: typeof DNA_PACKAGING_PHASE;
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
  package_path: typeof DNA_PACKAGE_PATH;
  manifest_path: typeof DNA_PACKAGE_MANIFEST_PATH;
  adapter_count_valid: ValidationStatus;
  certification_preserved: ValidationStatus;
  dna_traceability_preserved: ValidationStatus;
  image_mapping_preserved: ValidationStatus;
  video_mapping_preserved: ValidationStatus;
  package_ready: ValidationStatus;
  planning_only_status: ValidationStatus;
  source_audits: SourceDnaPackagingAudit[];
  final_verdict: typeof DNA_PACKAGING_PASS_VERDICT | typeof DNA_PACKAGING_FAIL_VERDICT;
  issues: DnaPackagingValidationIssue[];
};

function auditSource(dnaPackage: MovieAnalysisDnaPackage, sourceVideoId: string): SourceDnaPackagingAudit {
  const source = dnaPackage.sources.find((entry) => entry.source_video_id === sourceVideoId);

  if (!source) {
    return {
      source_video_id: sourceVideoId,
      adapter_count_valid: 'FAIL',
      certification_preserved: 'FAIL',
      dna_traceability_preserved: 'FAIL',
      image_mapping_preserved: 'FAIL',
      video_mapping_preserved: 'FAIL',
      source_ready: 'FAIL',
    };
  }

  const adapterCountValid = source.adapter_count === ADAPTERS_PER_SOURCE ? 'PASS' : 'FAIL';
  const certificationPreserved =
    dnaPackage.certification_verdict === DNA_ADAPTER_CERTIFICATION_PASS_VERDICT &&
    dnaPackage.package_readiness.certification_preserved
      ? 'PASS'
      : 'FAIL';
  const traceability =
    Boolean(source.cinematic_dna_id) &&
    Boolean(source.integration_id) &&
    Boolean(source.adapter_library_entry_id) &&
    dnaPackage.package_readiness.dna_traceability_preserved
      ? 'PASS'
      : 'FAIL';
  const imageMapping = source.image_mapping_ready ? 'PASS' : 'FAIL';
  const videoMapping = source.video_mapping_ready ? 'PASS' : 'FAIL';

  const sourceReady =
    adapterCountValid === 'PASS' &&
    certificationPreserved === 'PASS' &&
    traceability === 'PASS' &&
    imageMapping === 'PASS' &&
    videoMapping === 'PASS' &&
    source.library_readiness === 'READY'
      ? 'PASS'
      : 'FAIL';

  return {
    source_video_id: sourceVideoId,
    adapter_count_valid: adapterCountValid,
    certification_preserved: certificationPreserved,
    dna_traceability_preserved: traceability,
    image_mapping_preserved: imageMapping,
    video_mapping_preserved: videoMapping,
    source_ready: sourceReady,
  };
}

function aggregateStatus(
  audits: SourceDnaPackagingAudit[],
  field: keyof SourceDnaPackagingAudit
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

export function writeMovieAnalysisDnaPackagingValidationReport(
  projectRoot?: string
): MovieAnalysisDnaPackageReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: DnaPackagingValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const dnaPackage = loadMovieAnalysisDnaPackage(root);
  const manifest = loadMovieAnalysisDnaPackageManifest(root);

  if (!dnaPackage) {
    issues.push({
      code: 'DNA_PACKAGE_MISSING',
      message: `Missing ${DNA_PACKAGE_PATH}`,
      severity: 'error',
    });
  }

  if (!manifest) {
    issues.push({
      code: 'DNA_PACKAGE_MANIFEST_MISSING',
      message: `Missing ${DNA_PACKAGE_MANIFEST_PATH}`,
      severity: 'error',
    });
  }

  if (manifest) {
    for (const asset of manifest.assets) {
      if (!fs.existsSync(path.join(root, asset.path))) {
        issues.push({
          code: 'MANIFEST_ASSET_MISSING',
          message: `Missing manifest asset ${asset.path}`,
          severity: 'error',
        });
      }
    }
  }

  const sourceAudits: SourceDnaPackagingAudit[] = [];

  if (dnaPackage) {
    if (dnaPackage.source_count !== EXPECTED_SOURCE_COUNT) {
      issues.push({
        code: 'SOURCE_COUNT_MISMATCH',
        message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
        severity: 'error',
      });
    }

    if (dnaPackage.adapter_count !== EXPECTED_ADAPTER_COUNT) {
      issues.push({
        code: 'ADAPTER_COUNT_MISMATCH',
        message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
        severity: 'error',
      });
    }

    for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
      const audit = auditSource(dnaPackage, sourceVideoId);
      sourceAudits.push(audit);

      if (audit.source_ready === 'FAIL') {
        issues.push({
          code: 'SOURCE_PACKAGE_NOT_READY',
          message: `DNA package source not ready: ${sourceVideoId}`,
          severity: 'error',
          source_video_id: sourceVideoId,
        });
      }
    }
  }

  const safetyValid =
    dnaPackage?.safety_summary.planning_only === true &&
    dnaPackage.safety_summary.generation === false &&
    dnaPackage.safety_summary.runtime_execution === false &&
    dnaPackage.safety_summary.video_generation === false &&
    dnaPackage.safety_summary.image_generation === false &&
    dnaPackage.safety_summary.gpu_execution === false &&
    dnaPackage.safety_summary.external_call_allowed === false;

  if (dnaPackage && !safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Safety planning_only validation failed',
      severity: 'error',
    });
  }

  const adapterCountValid =
    dnaPackage !== null &&
    dnaPackage.adapter_count === EXPECTED_ADAPTER_COUNT &&
    aggregateStatus(sourceAudits, 'adapter_count_valid') === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const certificationPreserved =
    dnaPackage?.package_readiness.certification_preserved === true &&
    dnaPackage.certification_verdict === DNA_ADAPTER_CERTIFICATION_PASS_VERDICT
      ? 'PASS'
      : 'FAIL';

  const dnaTraceabilityPreserved =
    dnaPackage?.package_readiness.dna_traceability_preserved === true &&
    aggregateStatus(sourceAudits, 'dna_traceability_preserved') === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const imageMappingPreserved =
    dnaPackage?.package_readiness.image_mapping_preserved === true &&
    aggregateStatus(sourceAudits, 'image_mapping_preserved') === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const videoMappingPreserved =
    dnaPackage?.package_readiness.video_mapping_preserved === true &&
    aggregateStatus(sourceAudits, 'video_mapping_preserved') === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const planningOnlyStatus: ValidationStatus = safetyValid ? 'PASS' : 'FAIL';

  const packageReady =
    dnaPackage !== null &&
    dnaPackage.package_readiness.package_ready === true &&
    adapterCountValid === 'PASS' &&
    certificationPreserved === 'PASS' &&
    dnaTraceabilityPreserved === 'PASS' &&
    imageMappingPreserved === 'PASS' &&
    videoMappingPreserved === 'PASS' &&
    sourceAudits.every((audit) => audit.source_ready === 'PASS') &&
    planningOnlyStatus === 'PASS' &&
    fs.existsSync(path.join(root, CINEMATIC_DNA_PATH)) &&
    fs.existsSync(path.join(root, CINEMATIC_DNA_INTEGRATION_PATH)) &&
    fs.existsSync(path.join(root, DNA_ADAPTER_LIBRARY_PATH))
      ? 'PASS'
      : 'FAIL';

  const pass =
    dnaPackage !== null &&
    manifest !== null &&
    packageReady === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieAnalysisDnaPackageReport = {
    report_id: 'movie-analysis-dna-package-report-v1',
    phase: DNA_PACKAGING_PHASE,
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
    source_count: dnaPackage?.source_count ?? 0,
    adapter_count: dnaPackage?.adapter_count ?? 0,
    package_path: DNA_PACKAGE_PATH,
    manifest_path: DNA_PACKAGE_MANIFEST_PATH,
    adapter_count_valid: adapterCountValid,
    certification_preserved: certificationPreserved,
    dna_traceability_preserved: dnaTraceabilityPreserved,
    image_mapping_preserved: imageMappingPreserved,
    video_mapping_preserved: videoMappingPreserved,
    package_ready: packageReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass ? DNA_PACKAGING_PASS_VERDICT : DNA_PACKAGING_FAIL_VERDICT,
    issues,
  };

  const outDir = path.join(root, 'exports', 'movie_analysis_dna_package');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(root, DNA_PACKAGE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
