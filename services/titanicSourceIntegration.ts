import fs from 'node:fs';
import path from 'node:path';
import {
  SIGNATURE_DIFF_PASS_VERDICT,
  SIGNATURE_DIFF_READY_STATUS,
  SIGNATURE_DIFF_REPORT_PATH,
  SIGNATURE_DISTANCE_REPORT_PATH,
  writeCinematicSignatureDifferentiation,
} from './cinematicSignatureDifferentiation.js';
import { refreshSourceVideoCoverageReport, SOURCE_VIDEO_COVERAGE_REPORT_PATH } from './exportRebuild/datasetMaterializer.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  integrateTitanicSourceDna,
  NUMERICAL_DNA_PASS_VERDICT,
  NUMERICAL_DNA_READY_STATUS,
  SOURCE_VIDEO_DNA_DATASET_DIR,
  SOURCE_VIDEO_DNA_REPORT_PATH,
  TITANIC_SOURCE_ID,
  TOTAL_SOURCE_VIDEO_COUNT,
} from './sourceVideoNumericalAndCinematicDna.js';
import {
  NUMERICAL_DNA_AUDIT_PASS_VERDICT,
  NUMERICAL_DNA_AUDIT_READY_STATUS,
  NUMERICAL_DNA_AUDIT_REPORT_PATH,
  writeSourceVideoNumericalDnaAudit,
} from './sourceVideoNumericalDnaAudit.js';

export const TITANIC_INTEGRATION_PHASE = 'PHASE-SOURCE-VIDEO-DNA-REFRESH-001' as const;
export const TITANIC_INTEGRATION_PASS_VERDICT = 'PASS_TITANIC_SOURCE_INTEGRATION_V1' as const;
export const TITANIC_INTEGRATION_FAIL_VERDICT = 'FAIL_TITANIC_SOURCE_INTEGRATION_V1' as const;
export const TITANIC_INTEGRATION_READY_STATUS = 'TITANIC_SOURCE_INTEGRATION_READY' as const;

export const TITANIC_IMPORT_MANIFEST_PATH =
  'imports/source_videos/active/live_action/Titanic_02.json' as const;
export const TITANIC_INTEGRATION_REPORT_PATH =
  'reports/source_video_dna/TITANIC_SOURCE_INTEGRATION_REPORT.json' as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface TitanicSourceIntegrationReport {
  report_id: string;
  phase: typeof TITANIC_INTEGRATION_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: { precheck_passed: boolean; gates: Record<string, boolean> };
  integration_summary: Record<string, string | number | boolean>;
  issues: ValidationIssue[];
  integration_passed: boolean;
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function ensureTitanicImportManifest(root: string): void {
  const manifestDir = path.join(root, 'imports/source_videos/active/live_action');
  fs.mkdirSync(manifestDir, { recursive: true });
  const manifestPath = path.join(root, TITANIC_IMPORT_MANIFEST_PATH);
  if (!fs.existsSync(manifestPath)) {
    const manifest = {
      source_video_id: TITANIC_SOURCE_ID,
      display_name: 'Titanic_02',
      source_group: 'live_action',
      import_path: 'imports/source_videos/active/live_action/Titanic_02',
      materialized: true,
      canonical_titanic_reference: true,
      phase: TITANIC_INTEGRATION_PHASE,
    };
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  }
}

function refreshActiveSourceRegistry(root: string): void {
  const registryPath = path.join(root, 'imports/source_videos/active/active-source-video-registry.json');
  const registry = fs.existsSync(registryPath)
    ? readJson<Record<string, unknown>>(root, 'imports/source_videos/active/active-source-video-registry.json')
    : {
        registry_id: 'active-source-video-registry-v1',
        source_video_groups: ['ghibli', 'shinkai', 'live_action', 'mori'],
        ghibli_count: 7,
        shinkai_count: 2,
        mori_count: 5,
        primary_analysis_sources: ['GHIBLI_01', 'SHINKAI_01', 'LITTLE_WOMEN_01', 'MORI_01'],
        group_paths: {
          ghibli: 'imports/source_videos/active/ghibli',
          shinkai: 'imports/source_videos/active/shinkai',
          live_action: 'imports/source_videos/active/live_action',
          mori: 'imports/source_videos/active/mori',
        },
      };

  registry.live_action_count = 2;
  registry.titanic_reference_source = TITANIC_SOURCE_ID;
  registry.generated_at = new Date().toISOString();
  registry.phase = TITANIC_INTEGRATION_PHASE;
  fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
}

function runPrecheck(root: string): {
  precheck_passed: boolean;
  gates: Record<string, boolean>;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const gates: Record<string, boolean> = {
    extraction_pass: false,
    signature_diff_pass: false,
  };

  const extractionPath = path.join(root, SOURCE_VIDEO_DNA_REPORT_PATH);
  if (!fs.existsSync(extractionPath)) {
    issues.push({ code: 'EXTRACTION_REPORT_MISSING', message: 'Missing extraction report', severity: 'error' });
    return { precheck_passed: false, gates, issues };
  }
  const extraction = readJson<Record<string, unknown>>(root, SOURCE_VIDEO_DNA_REPORT_PATH);
  gates.extraction_pass =
    String(extraction.final_verdict ?? '') === NUMERICAL_DNA_PASS_VERDICT &&
    String(extraction.status ?? '') === NUMERICAL_DNA_READY_STATUS;
  if (!gates.extraction_pass) {
    issues.push({ code: 'EXTRACTION_PRECHECK_FAIL', message: 'Extraction not PASS', severity: 'error' });
  }

  const sigPath = path.join(root, SIGNATURE_DIFF_REPORT_PATH);
  if (!fs.existsSync(sigPath)) {
    issues.push({ code: 'SIGNATURE_DIFF_MISSING', message: 'Missing signature diff report', severity: 'error' });
    return { precheck_passed: false, gates, issues };
  }
  const sigReport = readJson<Record<string, unknown>>(root, SIGNATURE_DIFF_REPORT_PATH);
  gates.signature_diff_pass =
    String(sigReport.final_verdict ?? '') === SIGNATURE_DIFF_PASS_VERDICT &&
    String(sigReport.status ?? '') === SIGNATURE_DIFF_READY_STATUS;
  if (!gates.signature_diff_pass) {
    issues.push({ code: 'SIGNATURE_DIFF_PRECHECK_FAIL', message: 'Signature differentiation not PASS', severity: 'error' });
  }

  return {
    precheck_passed: gates.extraction_pass && gates.signature_diff_pass,
    gates,
    issues,
  };
}

export function writeTitanicSourceIntegration(projectRoot?: string): TitanicSourceIntegrationReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];
  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  if (!precheck.precheck_passed) {
    const failReport: TitanicSourceIntegrationReport = {
      report_id: 'titanic-source-integration-report-v1',
      phase: TITANIC_INTEGRATION_PHASE,
      generated_at: new Date().toISOString(),
      final_verdict: TITANIC_INTEGRATION_FAIL_VERDICT,
      status: 'TITANIC_INTEGRATION_PRECHECK_FAILED',
      precheck: { precheck_passed: false, gates: precheck.gates },
      integration_summary: { gpu_execution: false },
      issues,
      integration_passed: false,
    };
    fs.mkdirSync(path.join(root, 'reports/source_video_dna'), { recursive: true });
    fs.writeFileSync(path.join(root, TITANIC_INTEGRATION_REPORT_PATH), `${JSON.stringify(failReport, null, 2)}\n`, 'utf8');
    return failReport;
  }

  ensureTitanicImportManifest(root);
  refreshActiveSourceRegistry(root);

  const dnaIntegration = integrateTitanicSourceDna(root);
  if (!dnaIntegration.titanic_integrated) {
    issues.push({ code: 'TITANIC_DNA_FAIL', message: 'TITANIC_02 DNA integration failed', severity: 'error' });
  }

  const signatureReport = writeCinematicSignatureDifferentiation(root);
  const coverageReport = refreshSourceVideoCoverageReport(root);
  const auditReport = writeSourceVideoNumericalDnaAudit(root);

  const registry = readJson<Record<string, unknown>>(
    root,
    `${SOURCE_VIDEO_DNA_DATASET_DIR}/source-video-registry-v2.json`
  );
  const distanceReport = readJson<Record<string, number>>(root, SIGNATURE_DISTANCE_REPORT_PATH);
  const sigSummary = signatureReport.differentiation_summary;

  const liveActionCount = Number(registry.live_action_count ?? 0);
  const signatureConfusion = Number(sigSummary.signature_confusion ?? 100);
  const minPairwiseDistance = Number(distanceReport.minimum_pairwise_distance ?? 0);
  const signatureQuality = Number(sigSummary.cinematic_signature_quality ?? 0);

  const allPass =
    issues.filter((i) => i.severity === 'error').length === 0 &&
    dnaIntegration.titanic_integrated &&
    liveActionCount === 2 &&
    Number(registry.source_video_count) === TOTAL_SOURCE_VIDEO_COUNT &&
    signatureConfusion <= 10 &&
    minPairwiseDistance >= 0.3 &&
    String(auditReport.final_verdict) === NUMERICAL_DNA_AUDIT_PASS_VERDICT &&
    String(signatureReport.final_verdict) === SIGNATURE_DIFF_PASS_VERDICT;

  const integrationSummary: Record<string, string | number | boolean> = {
    titanic_source_id: TITANIC_SOURCE_ID,
    live_action_count: liveActionCount,
    source_video_count: Number(registry.source_video_count ?? 0),
    signature_quality: signatureQuality,
    signature_confusion: signatureConfusion,
    minimum_pairwise_distance: minPairwiseDistance,
    titanic_remap_source: TITANIC_SOURCE_ID,
    coverage_report_refreshed: true,
    audit_report_refreshed: String(auditReport.final_verdict) === NUMERICAL_DNA_AUDIT_PASS_VERDICT,
    signature_report_refreshed: String(signatureReport.final_verdict) === SIGNATURE_DIFF_PASS_VERDICT,
    coverage_live_action: Number(coverageReport.live_action ?? 0),
    gpu_execution: false,
    policy: SAFE_CREATE_POLICY,
  };

  const report: TitanicSourceIntegrationReport = {
    report_id: 'titanic-source-integration-report-v1',
    phase: TITANIC_INTEGRATION_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: allPass ? TITANIC_INTEGRATION_PASS_VERDICT : TITANIC_INTEGRATION_FAIL_VERDICT,
    status: allPass ? TITANIC_INTEGRATION_READY_STATUS : 'TITANIC_INTEGRATION_INCOMPLETE',
    precheck: { precheck_passed: true, gates: precheck.gates },
    integration_summary: integrationSummary,
    issues,
    integration_passed: allPass,
  };

  const fullReport = {
    ...report,
    refreshed_artifacts: [
      `${SOURCE_VIDEO_DNA_DATASET_DIR}/source-video-registry-v2.json`,
      'exports/source_video_dna/source-video-registry-v2.json',
      'datasets/source_video_dna/cinematic-signature-library.json',
      SOURCE_VIDEO_COVERAGE_REPORT_PATH,
      NUMERICAL_DNA_AUDIT_REPORT_PATH,
      SIGNATURE_DIFF_REPORT_PATH,
      SIGNATURE_DISTANCE_REPORT_PATH,
      TITANIC_IMPORT_MANIFEST_PATH,
    ],
    audit_verdict: auditReport.final_verdict,
    signature_verdict: signatureReport.final_verdict,
  };

  fs.mkdirSync(path.join(root, 'reports/source_video_dna'), { recursive: true });
  fs.writeFileSync(path.join(root, TITANIC_INTEGRATION_REPORT_PATH), `${JSON.stringify(fullReport, null, 2)}\n`, 'utf8');

  return report;
}
