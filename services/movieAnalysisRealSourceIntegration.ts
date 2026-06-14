import fs from 'node:fs';
import path from 'node:path';
import { loadMovieAnalysisPlan } from './movieAnalysisPlanBuilder.js';
import {
  EXPORT_PACKAGE_PASS_VERDICT,
  EXPECTED_SOURCE_COUNT,
  loadMovieAnalysisExportPackage,
  loadMovieAnalysisExportReport,
} from './movieAnalysisExportPackage.js';
import {
  IMPORT_SIMULATION_PASS_VERDICT,
  IMPORT_SIMULATION_REPORT_PATH,
} from './movieAnalysisImportSimulation.js';
import {
  SEED_MASTER_PACKAGE_SPECS,
  loadMovieAnalysisMasterPackagePlan,
} from './movieAnalysisMasterPackageDesign.js';
import {
  FINAL_SET_PATH,
  SOURCE_VIDEO_IMPORT_ROOT,
  type FinalSetVideoEntry,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_SOURCE_INTEGRATION_PHASE =
  'PHASE-SOURCE-VIDEO-044-MOVIE_ANALYSIS_REAL_SOURCE_INTEGRATION_V1' as const;
export const REAL_SOURCE_INTEGRATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_SOURCE_INTEGRATION_V1' as const;
export const REAL_SOURCE_INTEGRATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_SOURCE_INTEGRATION_V1' as const;
export const REAL_SOURCE_INTEGRATION_REPORT_PATH =
  'reports/movie-analysis-real-source-integration-report.json' as const;
export const REAL_SOURCE_INTEGRATION_MD_PATH =
  'reports/MOVIE_ANALYSIS_REAL_SOURCE_INTEGRATION.md' as const;

export { EXPECTED_SOURCE_COUNT };

export type RealSourceIntegrationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceRealIntegrationAudit = {
  source_video_id: string;
  master_package_id: string;
  import_path: string;
  source_video_binding: boolean;
  source_video_traceability: boolean;
  master_package_linkability: boolean;
  export_linkability: boolean;
  import_linkability: boolean;
};

export type MovieAnalysisRealSourceIntegrationReport = {
  report_id: string;
  phase: typeof REAL_SOURCE_INTEGRATION_PHASE;
  timestamp: string;
  import_root: typeof SOURCE_VIDEO_IMPORT_ROOT;
  source_count: number;
  source_video_binding: boolean;
  source_video_traceability: boolean;
  master_package_linkability: boolean;
  export_linkability: boolean;
  import_linkability: boolean;
  source_audits: SourceRealIntegrationAudit[];
  final_verdict:
    | typeof REAL_SOURCE_INTEGRATION_PASS_VERDICT
    | typeof REAL_SOURCE_INTEGRATION_FAIL_VERDICT;
  issues: RealSourceIntegrationIssue[];
};

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function findActiveVideo(
  finalSet: SourceVideoFinalSet,
  sourceVideoId: string
): FinalSetVideoEntry | undefined {
  return finalSet.videos.find(
    (video) => video.source_video_id === sourceVideoId && video.tier === 'active'
  );
}

function isSourceVideoBound(projectRoot: string, video: FinalSetVideoEntry | undefined): boolean {
  if (!video) {
    return false;
  }
  const absPath = path.join(projectRoot, video.import_path);
  return (
    video.file_present === true &&
    video.file_size_bytes > 0 &&
    fs.existsSync(absPath) &&
    video.import_path.startsWith(`${SOURCE_VIDEO_IMPORT_ROOT}/`)
  );
}

function isSourceVideoTraceable(
  projectRoot: string,
  sourceVideoId: string,
  analysisPlanId: string,
  video: FinalSetVideoEntry | undefined
): boolean {
  const analysisPlan = loadMovieAnalysisPlan(projectRoot, analysisPlanId);
  if (!analysisPlan || !video) {
    return false;
  }

  const absPath = path.join(projectRoot, analysisPlan.source_video_path);
  return (
    analysisPlan.source_video_id === sourceVideoId &&
    analysisPlan.source_video_path === video.import_path &&
    analysisPlan.analysis_mode === 'design_only' &&
    fs.existsSync(absPath)
  );
}

function isMasterPackageLinkable(
  projectRoot: string,
  masterPackageId: string,
  sourceVideoId: string,
  video: FinalSetVideoEntry | undefined
): boolean {
  const master = loadMovieAnalysisMasterPackagePlan(projectRoot, masterPackageId);
  if (!master || !video) {
    return false;
  }

  const traceRoot = master.package_trace[0];
  return (
    master.source_video_id === sourceVideoId &&
    master.analysis_plan_id.length > 0 &&
    master.readiness_summary.chain_complete === true &&
    traceRoot?.plan_type === 'analysis_plan' &&
    traceRoot.plan_id === master.analysis_plan_id &&
    master.package_trace.length >= 17
  );
}

function isExportLinkable(
  sourceVideoId: string,
  masterPackageId: string,
  exportPackage: ReturnType<typeof loadMovieAnalysisExportPackage>
): boolean {
  if (!exportPackage) {
    return false;
  }

  const exportEntry = exportPackage.entries.find(
    (entry) => entry.source_video_id === sourceVideoId
  );
  if (!exportEntry) {
    return false;
  }

  return (
    exportEntry.master_package_id === masterPackageId &&
    exportEntry.package_trace.length === 17 &&
    exportEntry.chain_ids.analysis_plan_id === exportEntry.package_trace[0]?.plan_id
  );
}

function isImportLinkable(
  sourceVideoId: string,
  importSimulationReport: {
    final_verdict?: string;
    source_audits?: Array<{
      source_video_id: string;
      image_app_importable: boolean;
      video_app_importable: boolean;
      chain_trace_preserved: boolean;
      payload_integrity: boolean;
    }>;
  } | null
): boolean {
  if (!importSimulationReport) {
    return false;
  }
  if (importSimulationReport.final_verdict !== IMPORT_SIMULATION_PASS_VERDICT) {
    return false;
  }

  const audit = importSimulationReport.source_audits?.find(
    (entry) => entry.source_video_id === sourceVideoId
  );
  if (!audit) {
    return false;
  }

  return (
    audit.image_app_importable === true &&
    audit.video_app_importable === true &&
    audit.chain_trace_preserved === true &&
    audit.payload_integrity === true
  );
}

function buildMarkdown(report: MovieAnalysisRealSourceIntegrationReport): string {
  const lines = [
    '# Movie Analysis Real Source Integration',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Integration Checks',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| import_root | ${report.import_root} |`,
    `| source_count | ${report.source_count} |`,
    `| source_video_binding | ${report.source_video_binding} |`,
    `| source_video_traceability | ${report.source_video_traceability} |`,
    `| master_package_linkability | ${report.master_package_linkability} |`,
    `| export_linkability | ${report.export_linkability} |`,
    `| import_linkability | ${report.import_linkability} |`,
    '',
    '## Source Integration Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(`### ${audit.source_video_id}`);
    lines.push('');
    lines.push(`- master_package_id: ${audit.master_package_id}`);
    lines.push(`- import_path: ${audit.import_path}`);
    lines.push(`- source_video_binding: ${audit.source_video_binding}`);
    lines.push(`- source_video_traceability: ${audit.source_video_traceability}`);
    lines.push(`- master_package_linkability: ${audit.master_package_linkability}`);
    lines.push(`- export_linkability: ${audit.export_linkability}`);
    lines.push(`- import_linkability: ${audit.import_linkability}`);
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

export function writeMovieAnalysisRealSourceIntegrationReport(
  projectRoot?: string
): MovieAnalysisRealSourceIntegrationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealSourceIntegrationIssue[] = [];
  const timestamp = new Date().toISOString();

  const importRootAbs = path.join(root, SOURCE_VIDEO_IMPORT_ROOT);
  if (!fs.existsSync(importRootAbs)) {
    issues.push({
      code: 'IMPORT_ROOT_MISSING',
      message: `Missing ${SOURCE_VIDEO_IMPORT_ROOT}/`,
      severity: 'error',
    });
  }

  const finalSet = loadFinalSet(root);
  if (!finalSet) {
    issues.push({
      code: 'FINAL_SET_MISSING',
      message: `Missing ${FINAL_SET_PATH}`,
      severity: 'error',
    });
  }

  const exportPackage = loadMovieAnalysisExportPackage(root);
  if (!exportPackage) {
    issues.push({
      code: 'EXPORT_PACKAGE_MISSING',
      message: 'Missing exports/movie_analysis/movie-analysis-export-package.json',
      severity: 'error',
    });
  }

  const exportReport = loadMovieAnalysisExportReport(root);
  if (!exportReport) {
    issues.push({
      code: 'EXPORT_REPORT_MISSING',
      message: 'Missing exports/movie_analysis/movie-analysis-export-report.json',
      severity: 'error',
    });
  } else if (exportReport.final_verdict !== EXPORT_PACKAGE_PASS_VERDICT) {
    issues.push({
      code: 'EXPORT_PACKAGE_NOT_PASS',
      message: `Export package must have ${EXPORT_PACKAGE_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const importSimulationPath = path.join(root, IMPORT_SIMULATION_REPORT_PATH);
  const importSimulationReport = fs.existsSync(importSimulationPath)
    ? (JSON.parse(fs.readFileSync(importSimulationPath, 'utf8')) as {
        final_verdict?: string;
        source_audits?: Array<{
          source_video_id: string;
          image_app_importable: boolean;
          video_app_importable: boolean;
          chain_trace_preserved: boolean;
          payload_integrity: boolean;
        }>;
      })
    : null;

  if (!importSimulationReport) {
    issues.push({
      code: 'IMPORT_SIMULATION_MISSING',
      message: `Missing ${IMPORT_SIMULATION_REPORT_PATH}`,
      severity: 'error',
    });
  } else if (importSimulationReport.final_verdict !== IMPORT_SIMULATION_PASS_VERDICT) {
    issues.push({
      code: 'IMPORT_SIMULATION_NOT_PASS',
      message: `Import simulation must have ${IMPORT_SIMULATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  if (!finalSet || !exportPackage) {
    const report: MovieAnalysisRealSourceIntegrationReport = {
      report_id: 'movie-analysis-real-source-integration-report-v1',
      phase: REAL_SOURCE_INTEGRATION_PHASE,
      timestamp,
      import_root: SOURCE_VIDEO_IMPORT_ROOT,
      source_count: 0,
      source_video_binding: false,
      source_video_traceability: false,
      master_package_linkability: false,
      export_linkability: false,
      import_linkability: false,
      source_audits: [],
      final_verdict: REAL_SOURCE_INTEGRATION_FAIL_VERDICT,
      issues,
    };

    fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(root, REAL_SOURCE_INTEGRATION_REPORT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(root, REAL_SOURCE_INTEGRATION_MD_PATH),
      `${buildMarkdown(report)}\n`,
      'utf8'
    );
    return report;
  }

  const sourceAudits: SourceRealIntegrationAudit[] = [];

  for (const spec of SEED_MASTER_PACKAGE_SPECS) {
    const video = findActiveVideo(finalSet, spec.source_video_id);
    const master = loadMovieAnalysisMasterPackagePlan(root, spec.master_package_id);

    const binding = isSourceVideoBound(root, video);
    const traceability =
      master && video
        ? isSourceVideoTraceable(root, spec.source_video_id, master.analysis_plan_id, video)
        : false;
    const masterLinkable = isMasterPackageLinkable(
      root,
      spec.master_package_id,
      spec.source_video_id,
      video
    );
    const exportLinkable = isExportLinkable(
      spec.source_video_id,
      spec.master_package_id,
      exportPackage
    );
    const importLinkable = isImportLinkable(spec.source_video_id, importSimulationReport);

    if (!binding) {
      issues.push({
        code: 'SOURCE_VIDEO_BINDING_FAIL',
        message: `Real source video not bound for ${spec.source_video_id}`,
        severity: 'error',
        source_video_id: spec.source_video_id,
      });
    }
    if (!traceability) {
      issues.push({
        code: 'SOURCE_VIDEO_TRACEABILITY_FAIL',
        message: `Source video traceability failed for ${spec.source_video_id}`,
        severity: 'error',
        source_video_id: spec.source_video_id,
      });
    }
    if (!masterLinkable) {
      issues.push({
        code: 'MASTER_PACKAGE_LINKABILITY_FAIL',
        message: `Master package linkability failed for ${spec.source_video_id}`,
        severity: 'error',
        source_video_id: spec.source_video_id,
      });
    }
    if (!exportLinkable) {
      issues.push({
        code: 'EXPORT_LINKABILITY_FAIL',
        message: `Export linkability failed for ${spec.source_video_id}`,
        severity: 'error',
        source_video_id: spec.source_video_id,
      });
    }
    if (!importLinkable) {
      issues.push({
        code: 'IMPORT_LINKABILITY_FAIL',
        message: `Import linkability failed for ${spec.source_video_id}`,
        severity: 'error',
        source_video_id: spec.source_video_id,
      });
    }

    sourceAudits.push({
      source_video_id: spec.source_video_id,
      master_package_id: spec.master_package_id,
      import_path: video?.import_path ?? '',
      source_video_binding: binding,
      source_video_traceability: traceability,
      master_package_linkability: masterLinkable,
      export_linkability: exportLinkable,
      import_linkability: importLinkable,
    });
  }

  const sourceVideoBinding =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.source_video_binding);
  const sourceVideoTraceability =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.source_video_traceability);
  const masterPackageLinkability =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.master_package_linkability);
  const exportLinkability =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.export_linkability);
  const importLinkability =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.import_linkability);

  const pass =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceVideoBinding &&
    sourceVideoTraceability &&
    masterPackageLinkability &&
    exportLinkability &&
    importLinkability &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieAnalysisRealSourceIntegrationReport = {
    report_id: 'movie-analysis-real-source-integration-report-v1',
    phase: REAL_SOURCE_INTEGRATION_PHASE,
    timestamp,
    import_root: SOURCE_VIDEO_IMPORT_ROOT,
    source_count: sourceAudits.length,
    source_video_binding: sourceVideoBinding,
    source_video_traceability: sourceVideoTraceability,
    master_package_linkability: masterPackageLinkability,
    export_linkability: exportLinkability,
    import_linkability: importLinkability,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_SOURCE_INTEGRATION_PASS_VERDICT
      : REAL_SOURCE_INTEGRATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_SOURCE_INTEGRATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_SOURCE_INTEGRATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
