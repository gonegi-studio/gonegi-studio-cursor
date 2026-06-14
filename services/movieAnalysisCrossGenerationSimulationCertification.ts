import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  IMAGE_GENERATION_SIMULATION_DIR,
  IMAGE_GENERATION_SIMULATION_PASS_VERDICT,
  IMAGE_GENERATION_SIMULATION_REPORT_PATH,
  type ImageGenerationSimulationEntry,
  type MovieAnalysisImageGenerationSimulationReport,
  type SourceImageGenerationSimulationAudit,
} from './movieAnalysisImageGenerationSimulation.js';
import {
  VIDEO_GENERATION_SIMULATION_DIR,
  VIDEO_GENERATION_SIMULATION_PASS_VERDICT,
  VIDEO_GENERATION_SIMULATION_REPORT_PATH,
  type MovieAnalysisVideoGenerationSimulationReport,
  type SourceVideoGenerationSimulationAudit,
  type VideoGenerationSimulationEntry,
} from './movieAnalysisVideoGenerationSimulation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const CROSS_GENERATION_SIMULATION_CERTIFICATION_PHASE =
  'PHASE-LEVEL2C-003-MOVIE_ANALYSIS_CROSS_GENERATION_SIMULATION_CERTIFICATION_V1' as const;
export const CROSS_GENERATION_SIMULATION_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_CROSS_GENERATION_SIMULATION_CERTIFICATION_V1' as const;
export const CROSS_GENERATION_SIMULATION_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_CROSS_GENERATION_SIMULATION_CERTIFICATION_V1' as const;
export const CROSS_GENERATION_SIMULATION_CERTIFICATION_DIR =
  'reports/movie_analysis_cross_generation_simulation_certification' as const;
export const CROSS_GENERATION_SIMULATION_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_cross_generation_simulation_certification/movie-analysis-cross-generation-simulation-certification-report.json' as const;
export const CROSS_GENERATION_SIMULATION_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_cross_generation_simulation_certification/MOVIE_ANALYSIS_CROSS_GENERATION_SIMULATION_CERTIFICATION.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type CertificationStatus = 'PASS' | 'FAIL';

export type CrossGenerationSimulationCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type SourceCrossGenerationSimulationAudit = {
  source_id: string;
  image_simulation_pass: CertificationStatus;
  video_simulation_pass: CertificationStatus;
  runtime_mapping_preserved: CertificationStatus;
  traceability_preserved: CertificationStatus;
  cross_generation_ready: CertificationStatus;
};

export type MovieAnalysisCrossGenerationSimulationCertificationReport = {
  report_id: string;
  phase: typeof CROSS_GENERATION_SIMULATION_CERTIFICATION_PHASE;
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
  simulation_only: true;
  image_generation_simulation_report_path: typeof IMAGE_GENERATION_SIMULATION_REPORT_PATH;
  video_generation_simulation_report_path: typeof VIDEO_GENERATION_SIMULATION_REPORT_PATH;
  source_count: number;
  adapter_count: number;
  image_generation_simulation_ready: CertificationStatus;
  video_generation_simulation_ready: CertificationStatus;
  runtime_mapping_consistency: CertificationStatus;
  traceability_consistency: CertificationStatus;
  cross_generation_consistency: CertificationStatus;
  planning_only_status: CertificationStatus;
  source_audits: SourceCrossGenerationSimulationAudit[];
  final_verdict:
    | typeof CROSS_GENERATION_SIMULATION_CERTIFICATION_PASS_VERDICT
    | typeof CROSS_GENERATION_SIMULATION_CERTIFICATION_FAIL_VERDICT;
  issues: CrossGenerationSimulationCertificationIssue[];
};

const SHARED_RUNTIME_KEYS = [
  'scene_runtime',
  'camera_runtime',
  'emotion_runtime',
  'continuity_runtime',
  'storytelling_runtime',
] as const;

type SharedRuntimeKey = (typeof SHARED_RUNTIME_KEYS)[number];

function loadImageSimulationReport(
  projectRoot: string
): MovieAnalysisImageGenerationSimulationReport | null {
  const abs = path.join(projectRoot, IMAGE_GENERATION_SIMULATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisImageGenerationSimulationReport;
}

function loadVideoSimulationReport(
  projectRoot: string
): MovieAnalysisVideoGenerationSimulationReport | null {
  const abs = path.join(projectRoot, VIDEO_GENERATION_SIMULATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisVideoGenerationSimulationReport;
}

function simulationBindingsConsistent(
  imageEntry: ImageGenerationSimulationEntry,
  videoEntry: VideoGenerationSimulationEntry
): boolean {
  return SHARED_RUNTIME_KEYS.every((key) => {
    const imageBlock = imageEntry[key];
    const videoBlock = videoEntry[key];

    return (
      imageBlock.binding_id === videoBlock.binding_id &&
      imageBlock.runtime_target === videoBlock.runtime_target &&
      JSON.stringify(imageBlock.resolved_pattern_signatures) ===
        JSON.stringify(videoBlock.resolved_pattern_signatures) &&
      imageBlock.simulated_section === videoBlock.resolved_section
    );
  });
}

function auditSource(
  sourceId: string,
  imageAudit: SourceImageGenerationSimulationAudit | undefined,
  videoAudit: SourceVideoGenerationSimulationAudit | undefined,
  imageSimulationEntry: ImageGenerationSimulationEntry | undefined,
  videoSimulationEntry: VideoGenerationSimulationEntry | undefined
): SourceCrossGenerationSimulationAudit {
  if (!imageAudit || !videoAudit || !imageSimulationEntry || !videoSimulationEntry) {
    return {
      source_id: sourceId,
      image_simulation_pass: 'FAIL',
      video_simulation_pass: 'FAIL',
      runtime_mapping_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      cross_generation_ready: 'FAIL',
    };
  }

  const imageSimulationPass =
    imageAudit.source_simulation_ready === 'PASS' ? 'PASS' : 'FAIL';
  const videoSimulationPass =
    videoAudit.source_simulation_ready === 'PASS' ? 'PASS' : 'FAIL';

  const runtimeMappingPreserved =
    imageAudit.runtime_mapping_preserved === 'PASS' &&
    videoAudit.runtime_mapping_preserved === 'PASS' &&
    simulationBindingsConsistent(imageSimulationEntry, videoSimulationEntry)
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved =
    imageAudit.traceability_preserved === 'PASS' &&
    videoAudit.traceability_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const crossGenerationReady =
    imageSimulationPass === 'PASS' &&
    videoSimulationPass === 'PASS' &&
    runtimeMappingPreserved === 'PASS' &&
    traceabilityPreserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  return {
    source_id: sourceId,
    image_simulation_pass: imageSimulationPass,
    video_simulation_pass: videoSimulationPass,
    runtime_mapping_preserved: runtimeMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    cross_generation_ready: crossGenerationReady,
  };
}

function aggregateStatus(
  audits: SourceCrossGenerationSimulationAudit[],
  field: keyof Omit<SourceCrossGenerationSimulationAudit, 'source_id'>
): CertificationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisCrossGenerationSimulationCertificationReport): string {
  const lines = [
    '# Movie Analysis Cross Generation Simulation Certification',
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
    `| generation | ${report.generation} |`,
    `| simulation_only | ${report.simulation_only} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Simulation Chain',
    '',
    `${IMAGE_GENERATION_SIMULATION_DIR} ↔ ${VIDEO_GENERATION_SIMULATION_DIR}`,
    '',
    '## Certification Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| image_generation_simulation_ready | ${report.image_generation_simulation_ready} |`,
    `| video_generation_simulation_ready | ${report.video_generation_simulation_ready} |`,
    `| runtime_mapping_consistency | ${report.runtime_mapping_consistency} |`,
    `| traceability_consistency | ${report.traceability_consistency} |`,
    `| cross_generation_consistency | ${report.cross_generation_consistency} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- image_simulation_pass: ${audit.image_simulation_pass}`,
      `- video_simulation_pass: ${audit.video_simulation_pass}`,
      `- runtime_mapping_preserved: ${audit.runtime_mapping_preserved}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- cross_generation_ready: ${audit.cross_generation_ready}`,
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

function writeFailReport(
  root: string,
  timestamp: string,
  issues: CrossGenerationSimulationCertificationIssue[]
): MovieAnalysisCrossGenerationSimulationCertificationReport {
  const report: MovieAnalysisCrossGenerationSimulationCertificationReport = {
    report_id: 'movie-analysis-cross-generation-simulation-certification-report-v1',
    phase: CROSS_GENERATION_SIMULATION_CERTIFICATION_PHASE,
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
    simulation_only: true,
    image_generation_simulation_report_path: IMAGE_GENERATION_SIMULATION_REPORT_PATH,
    video_generation_simulation_report_path: VIDEO_GENERATION_SIMULATION_REPORT_PATH,
    source_count: 0,
    adapter_count: 0,
    image_generation_simulation_ready: 'FAIL',
    video_generation_simulation_ready: 'FAIL',
    runtime_mapping_consistency: 'FAIL',
    traceability_consistency: 'FAIL',
    cross_generation_consistency: 'FAIL',
    planning_only_status: 'FAIL',
    source_audits: [],
    final_verdict: CROSS_GENERATION_SIMULATION_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, CROSS_GENERATION_SIMULATION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, CROSS_GENERATION_SIMULATION_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, CROSS_GENERATION_SIMULATION_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisCrossGenerationSimulationCertification(
  projectRoot?: string
): MovieAnalysisCrossGenerationSimulationCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: CrossGenerationSimulationCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const imageSimulationDir = path.join(root, IMAGE_GENERATION_SIMULATION_DIR);
  const videoSimulationDir = path.join(root, VIDEO_GENERATION_SIMULATION_DIR);

  if (!fs.existsSync(imageSimulationDir)) {
    issues.push({
      code: 'IMAGE_SIMULATION_DIR_MISSING',
      message: `Missing ${IMAGE_GENERATION_SIMULATION_DIR}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (!fs.existsSync(videoSimulationDir)) {
    issues.push({
      code: 'VIDEO_SIMULATION_DIR_MISSING',
      message: `Missing ${VIDEO_GENERATION_SIMULATION_DIR}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const imageSimulationReport = loadImageSimulationReport(root);
  if (!imageSimulationReport) {
    issues.push({
      code: 'IMAGE_SIMULATION_REPORT_MISSING',
      message: `Missing ${IMAGE_GENERATION_SIMULATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (imageSimulationReport.final_verdict !== IMAGE_GENERATION_SIMULATION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2C_001_NOT_PASS',
      message: `Image generation simulation must have ${IMAGE_GENERATION_SIMULATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const videoSimulationReport = loadVideoSimulationReport(root);
  if (!videoSimulationReport) {
    issues.push({
      code: 'VIDEO_SIMULATION_REPORT_MISSING',
      message: `Missing ${VIDEO_GENERATION_SIMULATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (videoSimulationReport.final_verdict !== VIDEO_GENERATION_SIMULATION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2C_002_NOT_PASS',
      message: `Video generation simulation must have ${VIDEO_GENERATION_SIMULATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const sourceAudits: SourceCrossGenerationSimulationAudit[] = [];

  for (const sourceId of EXPECTED_SOURCE_VIDEO_IDS) {
    const audit = auditSource(
      sourceId,
      imageSimulationReport.source_audits.find((entry) => entry.source_video_id === sourceId),
      videoSimulationReport.source_audits.find((entry) => entry.source_id === sourceId),
      imageSimulationReport.simulation_entries.find(
        (entry) => entry.source_video_id === sourceId
      ),
      videoSimulationReport.simulation_entries.find((entry) => entry.source_id === sourceId)
    );
    sourceAudits.push(audit);

    if (audit.cross_generation_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_CROSS_GENERATION_NOT_READY',
        message: `Cross generation simulation certification failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
  }

  const imageGenerationSimulationReady: CertificationStatus =
    imageSimulationReport.image_generation_simulation_ready === 'PASS' &&
    imageSimulationReport.final_verdict === IMAGE_GENERATION_SIMULATION_PASS_VERDICT
      ? 'PASS'
      : 'FAIL';

  const videoGenerationSimulationReady: CertificationStatus =
    videoSimulationReport.video_generation_simulation_ready === 'PASS' &&
    videoSimulationReport.final_verdict === VIDEO_GENERATION_SIMULATION_PASS_VERDICT
      ? 'PASS'
      : 'FAIL';

  const runtimeMappingConsistency = aggregateStatus(sourceAudits, 'runtime_mapping_preserved');
  const traceabilityConsistency = aggregateStatus(sourceAudits, 'traceability_preserved');
  const crossGenerationConsistency = aggregateStatus(sourceAudits, 'cross_generation_ready');

  const gateChecks: CertificationStatus[] = [
    imageGenerationSimulationReady,
    videoGenerationSimulationReady,
    runtimeMappingConsistency,
    traceabilityConsistency,
    crossGenerationConsistency,
  ];

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'CROSS_GENERATION_CERTIFICATION_VALIDATION_FAIL',
        message: 'Cross generation simulation certification validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const safetyValid =
    imageSimulationReport.planning_only === true &&
    imageSimulationReport.planning_only_status === 'PASS' &&
    imageSimulationReport.generation === false &&
    imageSimulationReport.simulation_only === true &&
    videoSimulationReport.planning_only === true &&
    videoSimulationReport.planning_only_status === 'PASS' &&
    videoSimulationReport.generation === false &&
    videoSimulationReport.simulation_only === true;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: CertificationStatus = safetyValid ? 'PASS' : 'FAIL';

  const sourceCount = imageSimulationReport.source_count;
  const adapterCount = imageSimulationReport.adapter_count;

  if (
    sourceCount !== EXPECTED_SOURCE_COUNT ||
    videoSimulationReport.source_count !== EXPECTED_SOURCE_COUNT
  ) {
    issues.push({
      code: 'SOURCE_COUNT_INVALID',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  if (
    adapterCount !== EXPECTED_ADAPTER_COUNT ||
    videoSimulationReport.adapter_count !== EXPECTED_ADAPTER_COUNT
  ) {
    issues.push({
      code: 'ADAPTER_COUNT_INVALID',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }

  const pass =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    videoSimulationReport.source_count === EXPECTED_SOURCE_COUNT &&
    videoSimulationReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.cross_generation_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'CROSS_GENERATION_CERTIFICATION_VALIDATION_FAIL')
  ) {
    issues.push({
      code: 'CROSS_GENERATION_NOT_READY',
      message: 'Cross generation simulation certification is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisCrossGenerationSimulationCertificationReport = {
    report_id: 'movie-analysis-cross-generation-simulation-certification-report-v1',
    phase: CROSS_GENERATION_SIMULATION_CERTIFICATION_PHASE,
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
    simulation_only: true,
    image_generation_simulation_report_path: IMAGE_GENERATION_SIMULATION_REPORT_PATH,
    video_generation_simulation_report_path: VIDEO_GENERATION_SIMULATION_REPORT_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    image_generation_simulation_ready: imageGenerationSimulationReady,
    video_generation_simulation_ready: videoGenerationSimulationReady,
    runtime_mapping_consistency: runtimeMappingConsistency,
    traceability_consistency: traceabilityConsistency,
    cross_generation_consistency: crossGenerationConsistency,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass
      ? CROSS_GENERATION_SIMULATION_CERTIFICATION_PASS_VERDICT
      : CROSS_GENERATION_SIMULATION_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, CROSS_GENERATION_SIMULATION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, CROSS_GENERATION_SIMULATION_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, CROSS_GENERATION_SIMULATION_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
