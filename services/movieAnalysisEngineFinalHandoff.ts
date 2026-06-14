import fs from 'node:fs';
import path from 'node:path';
import {
  CROSS_APP_CERTIFICATION_PASS_VERDICT,
  CROSS_APP_CERTIFICATION_REPORT_PATH,
  CROSS_APP_CERTIFICATION_STATUS_MESSAGE,
  type MovieAnalysisCrossAppCertificationReport,
} from './movieAnalysisCrossAppCertification.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
} from './movieAnalysisDnaPackaging.js';
import { DNA_RELEASE_PACKAGE_PATH } from './movieAnalysisDnaReleasePackage.js';
import {
  IMAGE_APP_BRIDGE_PATH,
  IMAGE_APP_BRIDGE_REPORT_PATH,
} from './movieAnalysisImageAppBridge.js';
import {
  IMAGE_APP_CERTIFICATION_PASS_VERDICT,
  IMAGE_APP_CERTIFICATION_REPORT_PATH,
  IMAGE_APP_CERTIFICATION_STATUS_MESSAGE,
} from './movieAnalysisImageAppCertification.js';
import {
  PRODUCTION_READY_CERTIFICATION_PASS_VERDICT,
  PRODUCTION_READY_CERTIFICATION_REPORT_PATH,
  PRODUCTION_READY_STATUS_MESSAGE,
} from './movieAnalysisProductionReadyCertification.js';
import {
  VIDEO_APP_BRIDGE_PATH,
  VIDEO_APP_BRIDGE_REPORT_PATH,
} from './movieAnalysisVideoAppBridge.js';
import {
  VIDEO_APP_CERTIFICATION_PASS_VERDICT,
  VIDEO_APP_CERTIFICATION_REPORT_PATH,
  VIDEO_APP_CERTIFICATION_STATUS_MESSAGE,
} from './movieAnalysisVideoAppCertification.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const ENGINE_FINAL_HANDOFF_PHASE =
  'PHASE-SOURCE-VIDEO-076-MOVIE_ANALYSIS_ENGINE_FINAL_HANDOFF_V1' as const;
export const ENGINE_FINAL_HANDOFF_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_ENGINE_FINAL_HANDOFF_V1' as const;
export const ENGINE_FINAL_HANDOFF_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_ENGINE_FINAL_HANDOFF_V1' as const;
export const ENGINE_FINAL_HANDOFF_DIR = 'exports/movie_analysis_final_handoff' as const;
export const ENGINE_FINAL_HANDOFF_PATH =
  'exports/movie_analysis_final_handoff/movie-analysis-engine-final-handoff.json' as const;
export const ENGINE_FINAL_HANDOFF_MD_PATH =
  'exports/movie_analysis_final_handoff/MOVIE_ANALYSIS_ENGINE_FINAL_HANDOFF.md' as const;
export const ENGINE_FINAL_HANDOFF_REPORT_PATH =
  'reports/movie-analysis-engine-final-handoff-report.json' as const;
export const ENGINE_FINAL_HANDOFF_STATUS_MESSAGE =
  'MOVIE_ANALYSIS_ENGINE_V1_HANDOFF_READY' as const;

export const PHASE_RANGE_START = '022' as const;
export const PHASE_RANGE_END = '075' as const;
export const PHASE_RANGE_COUNT = 54 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type HandoffStatus = 'PASS' | 'FAIL';

export type HandoffSafetyFlags = {
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
};

export type PhaseRange022075 = {
  start_phase_num: typeof PHASE_RANGE_START;
  end_phase_num: typeof PHASE_RANGE_END;
  start_phase: 'PHASE-SOURCE-VIDEO-022-MOVIE_ANALYSIS_ENGINE_FOUNDATION_V1';
  end_phase: 'PHASE-SOURCE-VIDEO-075-MOVIE_ANALYSIS_CROSS_APP_CERTIFICATION_V1';
  handoff_phase: typeof ENGINE_FINAL_HANDOFF_PHASE;
  phase_count: typeof PHASE_RANGE_COUNT;
  complete: true;
};

export type LongTermRoadmapLevel = {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  status: 'COMPLETE' | 'PLANNED';
  scope: string;
};

export type MovieAnalysisEngineFinalHandoff = {
  handoff_id: string;
  handoff_version: 'v1';
  phase: typeof ENGINE_FINAL_HANDOFF_PHASE;
  generated_at: string;
  handoff_status: typeof ENGINE_FINAL_HANDOFF_STATUS_MESSAGE;
  production_ready_status: typeof PRODUCTION_READY_STATUS_MESSAGE;
  image_app_ready_status: typeof IMAGE_APP_CERTIFICATION_STATUS_MESSAGE;
  video_app_ready_status: typeof VIDEO_APP_CERTIFICATION_STATUS_MESSAGE;
  cross_app_ready_status: typeof CROSS_APP_CERTIFICATION_STATUS_MESSAGE;
  phase_range_022_075: PhaseRange022075;
  source_count: number;
  adapter_count: number;
  source_video_ids: string[];
  safety_flags: HandoffSafetyFlags;
  long_term_roadmap_level_1_to_5: LongTermRoadmapLevel[];
  upstream_reports: {
    production_ready_report_path: typeof PRODUCTION_READY_CERTIFICATION_REPORT_PATH;
    image_app_certification_report_path: typeof IMAGE_APP_CERTIFICATION_REPORT_PATH;
    video_app_certification_report_path: typeof VIDEO_APP_CERTIFICATION_REPORT_PATH;
    cross_app_certification_report_path: typeof CROSS_APP_CERTIFICATION_REPORT_PATH;
  };
  consumer_assets: {
    dna_release_package_path: typeof DNA_RELEASE_PACKAGE_PATH;
    image_app_bridge_path: typeof IMAGE_APP_BRIDGE_PATH;
    video_app_bridge_path: typeof VIDEO_APP_BRIDGE_PATH;
    image_app_bridge_report_path: typeof IMAGE_APP_BRIDGE_REPORT_PATH;
    video_app_bridge_report_path: typeof VIDEO_APP_BRIDGE_REPORT_PATH;
  };
};

export type EngineFinalHandoffIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
};

export type MovieAnalysisEngineFinalHandoffReport = {
  report_id: string;
  phase: typeof ENGINE_FINAL_HANDOFF_PHASE;
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
  handoff_path: typeof ENGINE_FINAL_HANDOFF_PATH;
  handoff_md_path: typeof ENGINE_FINAL_HANDOFF_MD_PATH;
  production_ready_status: typeof PRODUCTION_READY_STATUS_MESSAGE | null;
  image_app_ready_status: typeof IMAGE_APP_CERTIFICATION_STATUS_MESSAGE | null;
  video_app_ready_status: typeof VIDEO_APP_CERTIFICATION_STATUS_MESSAGE | null;
  cross_app_ready_status: typeof CROSS_APP_CERTIFICATION_STATUS_MESSAGE | null;
  phase_range_022_075_complete: HandoffStatus;
  source_count: number;
  adapter_count: number;
  source_count_valid: HandoffStatus;
  adapter_count_valid: HandoffStatus;
  safety_flags_valid: HandoffStatus;
  roadmap_complete: HandoffStatus;
  handoff_package_ready: HandoffStatus;
  planning_only_status: HandoffStatus;
  certification_status: typeof ENGINE_FINAL_HANDOFF_STATUS_MESSAGE | null;
  final_verdict:
    | typeof ENGINE_FINAL_HANDOFF_PASS_VERDICT
    | typeof ENGINE_FINAL_HANDOFF_FAIL_VERDICT;
  issues: EngineFinalHandoffIssue[];
};

const HANDOFF_SAFETY_FLAGS: HandoffSafetyFlags = {
  planning_only: true,
  generation: false,
  runtime_execution: false,
  video_generation: false,
  image_generation: false,
  gpu_execution: false,
  external_call_allowed: false,
  no_execution: true,
  no_rendering: true,
};

const LONG_TERM_ROADMAP: LongTermRoadmapLevel[] = [
  {
    level: 1,
    name: 'Planning-Only Engine V1',
    status: 'COMPLETE',
    scope:
      'Movie Analysis Engine phases 022-076: DNA extraction, adapter library, release package, Image App bridge, Video App bridge, cross-app certification.',
  },
  {
    level: 2,
    name: 'Runtime Consumer Binding',
    status: 'PLANNED',
    scope:
      'Live Image App and Video App ingestion of certified bridges without generation or GPU execution.',
  },
  {
    level: 3,
    name: 'Source Expansion',
    status: 'PLANNED',
    scope:
      'Extend beyond four baseline source videos with quality-gated adapter library growth.',
  },
  {
    level: 4,
    name: 'Active DNA Refinement',
    status: 'PLANNED',
    scope:
      'Iterative cinematic DNA and adapter updates from new source analysis with traceability preservation.',
  },
  {
    level: 5,
    name: 'Autonomous Cinematic Pipeline',
    status: 'PLANNED',
    scope:
      'Closed-loop movie analysis to consumer rendering with governance, safety flags, and audit trails.',
  },
];

const PHASE_RANGE_022_075: PhaseRange022075 = {
  start_phase_num: PHASE_RANGE_START,
  end_phase_num: PHASE_RANGE_END,
  start_phase: 'PHASE-SOURCE-VIDEO-022-MOVIE_ANALYSIS_ENGINE_FOUNDATION_V1',
  end_phase: 'PHASE-SOURCE-VIDEO-075-MOVIE_ANALYSIS_CROSS_APP_CERTIFICATION_V1',
  handoff_phase: ENGINE_FINAL_HANDOFF_PHASE,
  phase_count: PHASE_RANGE_COUNT,
  complete: true,
};

function loadCrossAppCertificationReport(
  projectRoot: string
): MovieAnalysisCrossAppCertificationReport | null {
  const abs = path.join(projectRoot, CROSS_APP_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisCrossAppCertificationReport;
}

function buildHandoffPackage(
  crossAppReport: MovieAnalysisCrossAppCertificationReport
): MovieAnalysisEngineFinalHandoff {
  return {
    handoff_id: 'movie-analysis-engine-final-handoff-v1',
    handoff_version: 'v1',
    phase: ENGINE_FINAL_HANDOFF_PHASE,
    generated_at: new Date().toISOString(),
    handoff_status: ENGINE_FINAL_HANDOFF_STATUS_MESSAGE,
    production_ready_status: PRODUCTION_READY_STATUS_MESSAGE,
    image_app_ready_status: IMAGE_APP_CERTIFICATION_STATUS_MESSAGE,
    video_app_ready_status: VIDEO_APP_CERTIFICATION_STATUS_MESSAGE,
    cross_app_ready_status: CROSS_APP_CERTIFICATION_STATUS_MESSAGE,
    phase_range_022_075: PHASE_RANGE_022_075,
    source_count: crossAppReport.source_count,
    adapter_count: crossAppReport.adapter_count,
    source_video_ids: [...EXPECTED_SOURCE_VIDEO_IDS],
    safety_flags: HANDOFF_SAFETY_FLAGS,
    long_term_roadmap_level_1_to_5: LONG_TERM_ROADMAP,
    upstream_reports: {
      production_ready_report_path: PRODUCTION_READY_CERTIFICATION_REPORT_PATH,
      image_app_certification_report_path: IMAGE_APP_CERTIFICATION_REPORT_PATH,
      video_app_certification_report_path: VIDEO_APP_CERTIFICATION_REPORT_PATH,
      cross_app_certification_report_path: CROSS_APP_CERTIFICATION_REPORT_PATH,
    },
    consumer_assets: {
      dna_release_package_path: DNA_RELEASE_PACKAGE_PATH,
      image_app_bridge_path: crossAppReport.image_bridge_path,
      video_app_bridge_path: crossAppReport.video_bridge_path,
      image_app_bridge_report_path: IMAGE_APP_BRIDGE_REPORT_PATH,
      video_app_bridge_report_path: VIDEO_APP_BRIDGE_REPORT_PATH,
    },
  };
}

function buildMarkdown(
  handoff: MovieAnalysisEngineFinalHandoff,
  report: MovieAnalysisEngineFinalHandoffReport
): string {
  const lines = [
    '# Movie Analysis Engine Final Handoff',
    '',
    `**Phase:** ${handoff.phase}`,
    `**Generated:** ${handoff.generated_at}`,
    `**Handoff Status:** ${handoff.handoff_status}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Readiness Status',
    '',
    '| Status | Value |',
    '| --- | --- |',
    `| production_ready_status | ${handoff.production_ready_status} |`,
    `| image_app_ready_status | ${handoff.image_app_ready_status} |`,
    `| video_app_ready_status | ${handoff.video_app_ready_status} |`,
    `| cross_app_ready_status | ${handoff.cross_app_ready_status} |`,
    '',
    '## Phase Range',
    '',
    `Phases ${handoff.phase_range_022_075.start_phase_num} through ${handoff.phase_range_022_075.end_phase_num} (${handoff.phase_range_022_075.phase_count} phases) — complete.`,
    '',
    `- Start: ${handoff.phase_range_022_075.start_phase}`,
    `- End: ${handoff.phase_range_022_075.end_phase}`,
    `- Handoff: ${handoff.phase_range_022_075.handoff_phase}`,
    '',
    '## Inventory',
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| source_count | ${handoff.source_count} |`,
    `| adapter_count | ${handoff.adapter_count} |`,
    `| source_video_ids | ${handoff.source_video_ids.join(', ')} |`,
    '',
    '## Safety Flags',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${handoff.safety_flags.planning_only} |`,
    `| generation | ${handoff.safety_flags.generation} |`,
    `| runtime_execution | ${handoff.safety_flags.runtime_execution} |`,
    `| video_generation | ${handoff.safety_flags.video_generation} |`,
    `| image_generation | ${handoff.safety_flags.image_generation} |`,
    `| gpu_execution | ${handoff.safety_flags.gpu_execution} |`,
    `| external_call_allowed | ${handoff.safety_flags.external_call_allowed} |`,
    `| no_execution | ${handoff.safety_flags.no_execution} |`,
    `| no_rendering | ${handoff.safety_flags.no_rendering} |`,
    '',
    '## Long-Term Roadmap (Levels 1–5)',
    '',
  ];

  for (const level of handoff.long_term_roadmap_level_1_to_5) {
    lines.push(
      `### Level ${level.level}: ${level.name}`,
      '',
      `- status: ${level.status}`,
      `- scope: ${level.scope}`,
      ''
    );
  }

  lines.push(
    '## Consumer Assets',
    '',
    `- DNA release package: ${handoff.consumer_assets.dna_release_package_path}`,
    `- Image App bridge: ${handoff.consumer_assets.image_app_bridge_path}`,
    `- Video App bridge: ${handoff.consumer_assets.video_app_bridge_path}`,
    ''
  );

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

export function writeMovieAnalysisEngineFinalHandoff(
  projectRoot?: string
): {
  handoff: MovieAnalysisEngineFinalHandoff;
  report: MovieAnalysisEngineFinalHandoffReport;
} {
  const root = resolveProjectRoot(projectRoot);
  const issues: EngineFinalHandoffIssue[] = [];
  const timestamp = new Date().toISOString();

  const crossAppReport = loadCrossAppCertificationReport(root);
  if (!crossAppReport) {
    issues.push({
      code: 'CROSS_APP_CERTIFICATION_REPORT_MISSING',
      message: `Missing ${CROSS_APP_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
  }

  if (!crossAppReport) {
    const report: MovieAnalysisEngineFinalHandoffReport = {
      report_id: 'movie-analysis-engine-final-handoff-report-v1',
      phase: ENGINE_FINAL_HANDOFF_PHASE,
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
      handoff_path: ENGINE_FINAL_HANDOFF_PATH,
      handoff_md_path: ENGINE_FINAL_HANDOFF_MD_PATH,
      production_ready_status: null,
      image_app_ready_status: null,
      video_app_ready_status: null,
      cross_app_ready_status: null,
      phase_range_022_075_complete: 'FAIL',
      source_count: 0,
      adapter_count: 0,
      source_count_valid: 'FAIL',
      adapter_count_valid: 'FAIL',
      safety_flags_valid: 'FAIL',
      roadmap_complete: 'FAIL',
      handoff_package_ready: 'FAIL',
      planning_only_status: 'FAIL',
      certification_status: null,
      final_verdict: ENGINE_FINAL_HANDOFF_FAIL_VERDICT,
      issues,
    };

    fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(root, ENGINE_FINAL_HANDOFF_REPORT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    return { handoff: null as unknown as MovieAnalysisEngineFinalHandoff, report };
  }

  if (crossAppReport.final_verdict !== CROSS_APP_CERTIFICATION_PASS_VERDICT) {
    issues.push({
      code: 'CROSS_APP_CERTIFICATION_NOT_PASS',
      message: `Cross App certification must have ${CROSS_APP_CERTIFICATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  if (crossAppReport.certification_status !== CROSS_APP_CERTIFICATION_STATUS_MESSAGE) {
    issues.push({
      code: 'CROSS_APP_STATUS_MISMATCH',
      message: `Expected ${CROSS_APP_CERTIFICATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

  const productionReadyPath = path.join(root, PRODUCTION_READY_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(productionReadyPath)) {
    issues.push({
      code: 'PRODUCTION_READY_REPORT_MISSING',
      message: `Missing ${PRODUCTION_READY_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
  } else {
    const productionReadyReport = JSON.parse(
      fs.readFileSync(productionReadyPath, 'utf8')
    ) as { final_verdict?: string; certification_status?: string };
    if (productionReadyReport.final_verdict !== PRODUCTION_READY_CERTIFICATION_PASS_VERDICT) {
      issues.push({
        code: 'PRODUCTION_READY_NOT_PASS',
        message: `Production ready must have ${PRODUCTION_READY_CERTIFICATION_PASS_VERDICT}`,
        severity: 'error',
      });
    }
    if (productionReadyReport.certification_status !== PRODUCTION_READY_STATUS_MESSAGE) {
      issues.push({
        code: 'PRODUCTION_READY_STATUS_MISMATCH',
        message: `Expected ${PRODUCTION_READY_STATUS_MESSAGE}`,
        severity: 'error',
      });
    }
  }

  const imageCertPath = path.join(root, IMAGE_APP_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(imageCertPath)) {
    issues.push({
      code: 'IMAGE_APP_CERTIFICATION_REPORT_MISSING',
      message: `Missing ${IMAGE_APP_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
  } else {
    const imageCertReport = JSON.parse(fs.readFileSync(imageCertPath, 'utf8')) as {
      final_verdict?: string;
      certification_status?: string;
    };
    if (imageCertReport.final_verdict !== IMAGE_APP_CERTIFICATION_PASS_VERDICT) {
      issues.push({
        code: 'IMAGE_APP_CERTIFICATION_NOT_PASS',
        message: `Image App certification must have ${IMAGE_APP_CERTIFICATION_PASS_VERDICT}`,
        severity: 'error',
      });
    }
    if (imageCertReport.certification_status !== IMAGE_APP_CERTIFICATION_STATUS_MESSAGE) {
      issues.push({
        code: 'IMAGE_APP_STATUS_MISMATCH',
        message: `Expected ${IMAGE_APP_CERTIFICATION_STATUS_MESSAGE}`,
        severity: 'error',
      });
    }
  }

  const videoCertPath = path.join(root, VIDEO_APP_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(videoCertPath)) {
    issues.push({
      code: 'VIDEO_APP_CERTIFICATION_REPORT_MISSING',
      message: `Missing ${VIDEO_APP_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
  } else {
    const videoCertReport = JSON.parse(fs.readFileSync(videoCertPath, 'utf8')) as {
      final_verdict?: string;
      certification_status?: string;
    };
    if (videoCertReport.final_verdict !== VIDEO_APP_CERTIFICATION_PASS_VERDICT) {
      issues.push({
        code: 'VIDEO_APP_CERTIFICATION_NOT_PASS',
        message: `Video App certification must have ${VIDEO_APP_CERTIFICATION_PASS_VERDICT}`,
        severity: 'error',
      });
    }
    if (videoCertReport.certification_status !== VIDEO_APP_CERTIFICATION_STATUS_MESSAGE) {
      issues.push({
        code: 'VIDEO_APP_STATUS_MISMATCH',
        message: `Expected ${VIDEO_APP_CERTIFICATION_STATUS_MESSAGE}`,
        severity: 'error',
      });
    }
  }

  for (const assetPath of [
    DNA_RELEASE_PACKAGE_PATH,
    IMAGE_APP_BRIDGE_PATH,
    VIDEO_APP_BRIDGE_PATH,
  ]) {
    if (!fs.existsSync(path.join(root, assetPath))) {
      issues.push({
        code: 'CONSUMER_ASSET_MISSING',
        message: `Missing ${assetPath}`,
        severity: 'error',
      });
    }
  }

  const sourceCountValid =
    crossAppReport.source_count === EXPECTED_SOURCE_COUNT ? 'PASS' : 'FAIL';
  const adapterCountValid =
    crossAppReport.adapter_count === EXPECTED_ADAPTER_COUNT ? 'PASS' : 'FAIL';

  if (sourceCountValid === 'FAIL') {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  if (adapterCountValid === 'FAIL') {
    issues.push({
      code: 'ADAPTER_COUNT_MISMATCH',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }

  const safetyValid =
    crossAppReport.planning_only === true &&
    crossAppReport.planning_only_status === 'PASS' &&
    HANDOFF_SAFETY_FLAGS.planning_only === true &&
    HANDOFF_SAFETY_FLAGS.generation === false &&
    HANDOFF_SAFETY_FLAGS.gpu_execution === false &&
    HANDOFF_SAFETY_FLAGS.external_call_allowed === false;

  if (!safetyValid) {
    issues.push({
      code: 'SAFETY_FLAGS_INVALID',
      message: 'Handoff safety flags validation failed',
      severity: 'error',
    });
  }

  const roadmapComplete =
    LONG_TERM_ROADMAP.length === 5 &&
    LONG_TERM_ROADMAP[0].status === 'COMPLETE' &&
    LONG_TERM_ROADMAP.slice(1).every((level) => level.status === 'PLANNED')
      ? 'PASS'
      : 'FAIL';

  if (roadmapComplete === 'FAIL') {
    issues.push({
      code: 'ROADMAP_INCOMPLETE',
      message: 'Long-term roadmap level 1 to 5 validation failed',
      severity: 'error',
    });
  }

  const phaseRangeComplete =
    PHASE_RANGE_022_075.complete === true &&
    PHASE_RANGE_022_075.phase_count === PHASE_RANGE_COUNT
      ? 'PASS'
      : 'FAIL';

  if (phaseRangeComplete === 'FAIL') {
    issues.push({
      code: 'PHASE_RANGE_INCOMPLETE',
      message: 'Phase range 022-075 validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: HandoffStatus = safetyValid ? 'PASS' : 'FAIL';

  const handoff = buildHandoffPackage(crossAppReport);

  const outDir = path.join(root, ENGINE_FINAL_HANDOFF_DIR);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(root, ENGINE_FINAL_HANDOFF_PATH),
    `${JSON.stringify(handoff, null, 2)}\n`,
    'utf8'
  );

  const handoffPackageReady =
    fs.existsSync(path.join(root, ENGINE_FINAL_HANDOFF_PATH)) &&
    handoff.handoff_status === ENGINE_FINAL_HANDOFF_STATUS_MESSAGE &&
    handoff.production_ready_status === PRODUCTION_READY_STATUS_MESSAGE &&
    handoff.image_app_ready_status === IMAGE_APP_CERTIFICATION_STATUS_MESSAGE &&
    handoff.video_app_ready_status === VIDEO_APP_CERTIFICATION_STATUS_MESSAGE &&
    handoff.cross_app_ready_status === CROSS_APP_CERTIFICATION_STATUS_MESSAGE &&
    phaseRangeComplete === 'PASS' &&
    sourceCountValid === 'PASS' &&
    adapterCountValid === 'PASS' &&
    safetyValid &&
    roadmapComplete === 'PASS' &&
    crossAppReport.cross_app_certification_ready === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = handoffPackageReady === 'PASS';

  const report: MovieAnalysisEngineFinalHandoffReport = {
    report_id: 'movie-analysis-engine-final-handoff-report-v1',
    phase: ENGINE_FINAL_HANDOFF_PHASE,
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
    handoff_path: ENGINE_FINAL_HANDOFF_PATH,
    handoff_md_path: ENGINE_FINAL_HANDOFF_MD_PATH,
    production_ready_status: pass ? PRODUCTION_READY_STATUS_MESSAGE : null,
    image_app_ready_status: pass ? IMAGE_APP_CERTIFICATION_STATUS_MESSAGE : null,
    video_app_ready_status: pass ? VIDEO_APP_CERTIFICATION_STATUS_MESSAGE : null,
    cross_app_ready_status: pass ? CROSS_APP_CERTIFICATION_STATUS_MESSAGE : null,
    phase_range_022_075_complete: phaseRangeComplete,
    source_count: handoff.source_count,
    adapter_count: handoff.adapter_count,
    source_count_valid: sourceCountValid,
    adapter_count_valid: adapterCountValid,
    safety_flags_valid: safetyValid ? 'PASS' : 'FAIL',
    roadmap_complete: roadmapComplete,
    handoff_package_ready: handoffPackageReady,
    planning_only_status: planningOnlyStatus,
    certification_status: pass ? ENGINE_FINAL_HANDOFF_STATUS_MESSAGE : null,
    final_verdict: pass
      ? ENGINE_FINAL_HANDOFF_PASS_VERDICT
      : ENGINE_FINAL_HANDOFF_FAIL_VERDICT,
    issues,
  };

  fs.writeFileSync(
    path.join(root, ENGINE_FINAL_HANDOFF_MD_PATH),
    `${buildMarkdown(handoff, report)}\n`,
    'utf8'
  );

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, ENGINE_FINAL_HANDOFF_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return { handoff, report };
}

export function loadMovieAnalysisEngineFinalHandoff(
  projectRoot?: string
): MovieAnalysisEngineFinalHandoff | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, ENGINE_FINAL_HANDOFF_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisEngineFinalHandoff;
}
