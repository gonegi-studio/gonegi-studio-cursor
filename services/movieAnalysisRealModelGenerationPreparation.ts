import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT,
  REAL_IMAGE_PROMPT_EXPORT_PATH,
  REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH,
  type MovieAnalysisRealImagePromptExportPackage,
  type RealImagePromptExportEntry,
} from './movieAnalysisRealImagePromptExport.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_MODEL_GENERATION_PREPARATION_PHASE =
  'PHASE-LEVEL2F-001-REAL_IMAGE_MODEL_INTEGRATION_V1' as const;
export const REAL_MODEL_GENERATION_PREPARATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_MODEL_GENERATION_PREPARATION_V1' as const;
export const REAL_MODEL_GENERATION_PREPARATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_MODEL_GENERATION_PREPARATION_V1' as const;
export const REAL_MODEL_GENERATION_PREPARATION_STATUS_MESSAGE =
  'REAL_MODEL_GENERATION_PREPARATION_READY' as const;
export const REAL_MODEL_GENERATION_PREPARATION_DIR =
  'reports/movie_analysis_real_model_generation_preparation' as const;
export const REAL_MODEL_GENERATION_PREPARATION_REPORT_PATH =
  'reports/movie_analysis_real_model_generation_preparation/movie-analysis-real-model-generation-preparation-report.json' as const;
export const REAL_MODEL_GENERATION_PREPARATION_MD_PATH =
  'reports/movie_analysis_real_model_generation_preparation/MOVIE_ANALYSIS_REAL_MODEL_GENERATION_PREPARATION.md' as const;
export const MODEL_GENERATION_TEST_DIR = 'exports/movie_analysis_model_generation_test' as const;
export const MODEL_GENERATION_TEST_PACKAGE_PATH =
  'exports/movie_analysis_model_generation_test/movie-analysis-real-model-generation-preparation-package.json' as const;
export const MODEL_GENERATION_TEST_PROMPTS_DIR =
  'exports/movie_analysis_model_generation_test/prompts' as const;

export const ADAPTERS_PER_SOURCE = 6 as const;
export const EXPECTED_PROMPT_COUNT = EXPECTED_SOURCE_COUNT;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type PreparationStatus = 'PASS' | 'FAIL';

export type RealModelGenerationPreparationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type RealModelGenerationDnaBinding = {
  cinematic_dna_id: string;
  integration_id: string;
  adapter_library_entry_id: string;
  binding_preserved: true;
};

export type RealModelGenerationAdapterBinding = {
  adapter_ids: string[];
  runtime_binding_ids: string[];
  binding_preserved: true;
};

export type RealModelGenerationTraceability = {
  template_id: string;
  assembly_id: string;
  cinematic_dna_id: string;
  adapter_ids: string[];
  traceability_preserved: true;
};

export type RealModelGenerationPreparationEntry = {
  source_id: string;
  prompt: string;
  negative_prompt: string;
  dna_binding: RealModelGenerationDnaBinding;
  adapter_binding: RealModelGenerationAdapterBinding;
  generation_target: 'real_image_model_v1';
  traceability: RealModelGenerationTraceability;
  preparation_ready: true;
  planning_only: true;
  model_execution: false;
};

export type MovieAnalysisRealModelGenerationPreparationPackage = {
  package_id: string;
  package_type: 'movie_analysis_real_model_generation_preparation';
  phase: typeof REAL_MODEL_GENERATION_PREPARATION_PHASE;
  generated_at: string;
  image_prompt_export_path: typeof REAL_IMAGE_PROMPT_EXPORT_PATH;
  prompt_count: number;
  adapter_count: number;
  generation_target: 'real_image_model_v1';
  model_connection_prepared: true;
  actual_generation: false;
  entries: RealModelGenerationPreparationEntry[];
  safety_summary: {
    planning_only: true;
    model_execution: false;
    image_generation: false;
    gpu_execution: false;
    external_call_allowed: false;
  };
};

export type SourceRealModelGenerationPreparationAudit = {
  source_id: string;
  prompt_present: PreparationStatus;
  negative_prompt_present: PreparationStatus;
  dna_binding_preserved: PreparationStatus;
  adapter_binding_preserved: PreparationStatus;
  traceability_preserved: PreparationStatus;
  source_preparation_ready: PreparationStatus;
};

export type MovieAnalysisRealModelGenerationPreparationReport = {
  report_id: string;
  phase: typeof REAL_MODEL_GENERATION_PREPARATION_PHASE;
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
  model_connection_prepared: true;
  actual_generation: false;
  image_prompt_export_path: typeof REAL_IMAGE_PROMPT_EXPORT_PATH;
  image_prompt_export_report_path: typeof REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH;
  model_generation_test_dir: typeof MODEL_GENERATION_TEST_DIR;
  model_generation_test_package_path: typeof MODEL_GENERATION_TEST_PACKAGE_PATH;
  prompt_count: number;
  adapter_count: number;
  dna_binding_preserved: PreparationStatus;
  traceability_preserved: PreparationStatus;
  real_model_generation_ready: PreparationStatus;
  planning_only_status: PreparationStatus;
  certification_status: typeof REAL_MODEL_GENERATION_PREPARATION_STATUS_MESSAGE | null;
  preparation_entries: RealModelGenerationPreparationEntry[];
  source_audits: SourceRealModelGenerationPreparationAudit[];
  final_verdict:
    | typeof REAL_MODEL_GENERATION_PREPARATION_PASS_VERDICT
    | typeof REAL_MODEL_GENERATION_PREPARATION_FAIL_VERDICT;
  issues: RealModelGenerationPreparationIssue[];
};

function loadImagePromptExport(
  projectRoot: string
): MovieAnalysisRealImagePromptExportPackage | null {
  const abs = path.join(projectRoot, REAL_IMAGE_PROMPT_EXPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisRealImagePromptExportPackage;
}

function loadImagePromptExportReport(
  projectRoot: string
): { final_verdict?: string; traceability_preserved?: PreparationStatus } | null {
  const abs = path.join(projectRoot, REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    final_verdict?: string;
    traceability_preserved?: PreparationStatus;
  };
}

function buildPreparationEntry(
  entry: RealImagePromptExportEntry
): RealModelGenerationPreparationEntry {
  return {
    source_id: entry.source_video_id,
    prompt: entry.resolved_image_prompt,
    negative_prompt: entry.negative_prompt,
    dna_binding: {
      cinematic_dna_id: entry.adapter_traceability.cinematic_dna_id,
      integration_id: entry.adapter_traceability.integration_id,
      adapter_library_entry_id: entry.adapter_traceability.adapter_library_entry_id,
      binding_preserved: true,
    },
    adapter_binding: {
      adapter_ids: [...entry.adapter_traceability.adapter_ids],
      runtime_binding_ids: entry.resolved_runtime_mappings.map((mapping) => mapping.binding_id),
      binding_preserved: true,
    },
    generation_target: 'real_image_model_v1',
    traceability: {
      template_id: entry.template_id,
      assembly_id: entry.assembly_id,
      cinematic_dna_id: entry.adapter_traceability.cinematic_dna_id,
      adapter_ids: [...entry.adapter_traceability.adapter_ids],
      traceability_preserved: true,
    },
    preparation_ready: true,
    planning_only: true,
    model_execution: false,
  };
}

function auditSourcePreparation(
  entry: RealModelGenerationPreparationEntry | undefined,
  sourceId: string
): SourceRealModelGenerationPreparationAudit {
  if (!entry) {
    return {
      source_id: sourceId,
      prompt_present: 'FAIL',
      negative_prompt_present: 'FAIL',
      dna_binding_preserved: 'FAIL',
      adapter_binding_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      source_preparation_ready: 'FAIL',
    };
  }

  const promptPresent = entry.prompt.length > 0 ? 'PASS' : 'FAIL';
  const negativePromptPresent = entry.negative_prompt.length > 0 ? 'PASS' : 'FAIL';

  const dnaBindingPreserved =
    entry.dna_binding.binding_preserved === true &&
    entry.dna_binding.cinematic_dna_id.length > 0 &&
    entry.dna_binding.integration_id.length > 0 &&
    entry.dna_binding.adapter_library_entry_id.length > 0 &&
    entry.dna_binding.cinematic_dna_id === entry.traceability.cinematic_dna_id
      ? 'PASS'
      : 'FAIL';

  const adapterBindingPreserved =
    entry.adapter_binding.binding_preserved === true &&
    entry.adapter_binding.adapter_ids.length === ADAPTERS_PER_SOURCE &&
    entry.adapter_binding.runtime_binding_ids.length === ADAPTERS_PER_SOURCE &&
    JSON.stringify(entry.adapter_binding.adapter_ids) ===
      JSON.stringify(entry.traceability.adapter_ids)
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved =
    entry.traceability.traceability_preserved === true &&
    entry.traceability.template_id.length > 0 &&
    entry.traceability.assembly_id.length > 0
      ? 'PASS'
      : 'FAIL';

  const checks: PreparationStatus[] = [
    promptPresent,
    negativePromptPresent,
    dnaBindingPreserved,
    adapterBindingPreserved,
    traceabilityPreserved,
  ];

  return {
    source_id: sourceId,
    prompt_present: promptPresent,
    negative_prompt_present: negativePromptPresent,
    dna_binding_preserved: dnaBindingPreserved,
    adapter_binding_preserved: adapterBindingPreserved,
    traceability_preserved: traceabilityPreserved,
    source_preparation_ready: checks.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceRealModelGenerationPreparationAudit[],
  field: keyof Omit<SourceRealModelGenerationPreparationAudit, 'source_id' | 'source_preparation_ready'>
): PreparationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(
  report: MovieAnalysisRealModelGenerationPreparationReport,
  preparationPackage: MovieAnalysisRealModelGenerationPreparationPackage
): string {
  const lines = [
    '# Movie Analysis Real Model Generation Preparation',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status) {
    lines.push(`## Status: ${report.certification_status}`, '');
  }

  lines.push(
    '## Model Connection Preparation',
    '',
    'Bridges Movie Analysis DNA/prompt exports to real image generation model inputs.',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| model_connection_prepared | ${report.model_connection_prepared} |`,
    `| actual_generation | ${report.actual_generation} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Validation Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| prompt_count | ${report.prompt_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| dna_binding_preserved | ${report.dna_binding_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| real_model_generation_ready | ${report.real_model_generation_ready} |`,
    '',
    '## Package',
    '',
    `- package_path: ${report.model_generation_test_package_path}`,
    `- generation_target: ${preparationPackage.generation_target}`,
    `- entries: ${preparationPackage.entries.length}`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- prompt_present: ${audit.prompt_present}`,
      `- negative_prompt_present: ${audit.negative_prompt_present}`,
      `- dna_binding_preserved: ${audit.dna_binding_preserved}`,
      `- adapter_binding_preserved: ${audit.adapter_binding_preserved}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- source_preparation_ready: ${audit.source_preparation_ready}`,
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
  issues: RealModelGenerationPreparationIssue[],
  preparationEntries: RealModelGenerationPreparationEntry[] = [],
  sourceAudits: SourceRealModelGenerationPreparationAudit[] = []
): MovieAnalysisRealModelGenerationPreparationReport {
  const report: MovieAnalysisRealModelGenerationPreparationReport = {
    report_id: 'movie-analysis-real-model-generation-preparation-report-v1',
    phase: REAL_MODEL_GENERATION_PREPARATION_PHASE,
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
    model_connection_prepared: true,
    actual_generation: false,
    image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    image_prompt_export_report_path: REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH,
    model_generation_test_dir: MODEL_GENERATION_TEST_DIR,
    model_generation_test_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    prompt_count: preparationEntries.length,
    adapter_count: preparationEntries.reduce(
      (sum, entry) => sum + entry.adapter_binding.adapter_ids.length,
      0
    ),
    dna_binding_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    real_model_generation_ready: 'FAIL',
    planning_only_status: 'FAIL',
    certification_status: null,
    preparation_entries: preparationEntries,
    source_audits: sourceAudits,
    final_verdict: REAL_MODEL_GENERATION_PREPARATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_MODEL_GENERATION_PREPARATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_MODEL_GENERATION_PREPARATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_MODEL_GENERATION_PREPARATION_MD_PATH),
    `${buildMarkdown(report, {
      package_id: 'movie-analysis-real-model-generation-preparation-v1',
      package_type: 'movie_analysis_real_model_generation_preparation',
      phase: REAL_MODEL_GENERATION_PREPARATION_PHASE,
      generated_at: timestamp,
      image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
      prompt_count: report.prompt_count,
      adapter_count: report.adapter_count,
      generation_target: 'real_image_model_v1',
      model_connection_prepared: true,
      actual_generation: false,
      entries: preparationEntries,
      safety_summary: {
        planning_only: true,
        model_execution: false,
        image_generation: false,
        gpu_execution: false,
        external_call_allowed: false,
      },
    })}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealModelGenerationPreparation(
  projectRoot?: string
): {
  preparationPackage: MovieAnalysisRealModelGenerationPreparationPackage;
  report: MovieAnalysisRealModelGenerationPreparationReport;
} {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealModelGenerationPreparationIssue[] = [];
  const timestamp = new Date().toISOString();

  const promptExport = loadImagePromptExport(root);
  const promptExportReport = loadImagePromptExportReport(root);

  if (!promptExport) {
    issues.push({
      code: 'REAL_IMAGE_PROMPT_EXPORT_MISSING',
      message: `Missing ${REAL_IMAGE_PROMPT_EXPORT_PATH}`,
      severity: 'error',
    });
    const report = writeFailReport(root, timestamp, issues);
    return {
      preparationPackage: {
        package_id: 'movie-analysis-real-model-generation-preparation-v1',
        package_type: 'movie_analysis_real_model_generation_preparation',
        phase: REAL_MODEL_GENERATION_PREPARATION_PHASE,
        generated_at: timestamp,
        image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
        prompt_count: 0,
        adapter_count: 0,
        generation_target: 'real_image_model_v1',
        model_connection_prepared: true,
        actual_generation: false,
        entries: [],
        safety_summary: {
          planning_only: true,
          model_execution: false,
          image_generation: false,
          gpu_execution: false,
          external_call_allowed: false,
        },
      },
      report,
    };
  }

  if (!promptExportReport) {
    issues.push({
      code: 'REAL_IMAGE_PROMPT_EXPORT_REPORT_MISSING',
      message: `Missing ${REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH}`,
      severity: 'error',
    });
  } else if (promptExportReport.final_verdict !== REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT) {
    issues.push({
      code: 'REAL_IMAGE_PROMPT_EXPORT_NOT_CERTIFIED',
      message: `Real image prompt export must have ${REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const exportEntryBySource = Object.fromEntries(
    promptExport.entries.map((entry) => [entry.source_video_id, entry])
  );

  const preparationEntries = EXPECTED_SOURCE_VIDEO_IDS.map((sourceId) => {
    const exportEntry = exportEntryBySource[sourceId];
    if (!exportEntry) {
      issues.push({
        code: 'PROMPT_EXPORT_ENTRY_MISSING',
        message: `Missing prompt export entry for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
      return null;
    }
    return buildPreparationEntry(exportEntry);
  }).filter((entry): entry is RealModelGenerationPreparationEntry => entry !== null);

  const sourceAudits = EXPECTED_SOURCE_VIDEO_IDS.map((sourceId) => {
    const entry = preparationEntries.find((item) => item.source_id === sourceId);
    return auditSourcePreparation(entry, sourceId);
  });

  const promptCount = preparationEntries.length;
  const adapterCount = preparationEntries.reduce(
    (sum, entry) => sum + entry.adapter_binding.adapter_ids.length,
    0
  );

  if (promptCount !== EXPECTED_PROMPT_COUNT) {
    issues.push({
      code: 'PROMPT_COUNT_INVALID',
      message: `Expected prompt_count=${EXPECTED_PROMPT_COUNT}`,
      severity: 'error',
    });
  }

  if (adapterCount !== EXPECTED_ADAPTER_COUNT) {
    issues.push({
      code: 'ADAPTER_COUNT_INVALID',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }

  if (promptExport.source_count !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_INVALID',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  const dnaBindingPreserved = aggregateStatus(sourceAudits, 'dna_binding_preserved');
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');

  if (dnaBindingPreserved === 'FAIL') {
    issues.push({
      code: 'DNA_BINDING_NOT_PRESERVED',
      message: 'DNA binding is not preserved across model generation preparation entries',
      severity: 'error',
    });
  }

  if (traceabilityPreserved === 'FAIL') {
    issues.push({
      code: 'TRACEABILITY_NOT_PRESERVED',
      message: 'Traceability is not preserved across model generation preparation entries',
      severity: 'error',
    });
  }

  if (promptExportReport?.traceability_preserved === 'FAIL') {
    issues.push({
      code: 'UPSTREAM_TRACEABILITY_NOT_PRESERVED',
      message: 'Upstream real image prompt export traceability is not preserved',
      severity: 'error',
    });
  }

  const planningOnlyStatus: PreparationStatus =
    preparationEntries.every(
      (entry) => entry.planning_only === true && entry.model_execution === false
    ) && preparationEntries.length === EXPECTED_PROMPT_COUNT
      ? 'PASS'
      : 'FAIL';

  const gateChecks: PreparationStatus[] = [
    dnaBindingPreserved,
    traceabilityPreserved,
    planningOnlyStatus,
  ];

  const realModelGenerationReady =
    promptCount === EXPECTED_PROMPT_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    promptExport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    sourceAudits.every((audit) => audit.source_preparation_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realModelGenerationReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'REAL_MODEL_GENERATION_NOT_READY')) {
    issues.push({
      code: 'REAL_MODEL_GENERATION_NOT_READY',
      message: 'Real model generation preparation is not ready',
      severity: 'error',
    });
  }

  const preparationPackage: MovieAnalysisRealModelGenerationPreparationPackage = {
    package_id: 'movie-analysis-real-model-generation-preparation-v1',
    package_type: 'movie_analysis_real_model_generation_preparation',
    phase: REAL_MODEL_GENERATION_PREPARATION_PHASE,
    generated_at: timestamp,
    image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    prompt_count: promptCount,
    adapter_count: adapterCount,
    generation_target: 'real_image_model_v1',
    model_connection_prepared: true,
    actual_generation: false,
    entries: preparationEntries,
    safety_summary: {
      planning_only: true,
      model_execution: false,
      image_generation: false,
      gpu_execution: false,
      external_call_allowed: false,
    },
  };

  const report: MovieAnalysisRealModelGenerationPreparationReport = {
    report_id: 'movie-analysis-real-model-generation-preparation-report-v1',
    phase: REAL_MODEL_GENERATION_PREPARATION_PHASE,
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
    model_connection_prepared: true,
    actual_generation: false,
    image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    image_prompt_export_report_path: REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH,
    model_generation_test_dir: MODEL_GENERATION_TEST_DIR,
    model_generation_test_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    prompt_count: promptCount,
    adapter_count: adapterCount,
    dna_binding_preserved: dnaBindingPreserved,
    traceability_preserved: traceabilityPreserved,
    real_model_generation_ready: realModelGenerationReady,
    planning_only_status: planningOnlyStatus,
    certification_status: pass ? REAL_MODEL_GENERATION_PREPARATION_STATUS_MESSAGE : null,
    preparation_entries: preparationEntries,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_MODEL_GENERATION_PREPARATION_PASS_VERDICT
      : REAL_MODEL_GENERATION_PREPARATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MODEL_GENERATION_TEST_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, MODEL_GENERATION_TEST_PROMPTS_DIR), { recursive: true });
  for (const entry of preparationEntries) {
    const promptPath = path.join(
      root,
      MODEL_GENERATION_TEST_PROMPTS_DIR,
      `${entry.source_id}.json`
    );
    fs.writeFileSync(`${promptPath}`, `${JSON.stringify(entry, null, 2)}\n`, 'utf8');
  }
  fs.writeFileSync(
    path.join(root, MODEL_GENERATION_TEST_PACKAGE_PATH),
    `${JSON.stringify(preparationPackage, null, 2)}\n`,
    'utf8'
  );

  fs.mkdirSync(path.join(root, REAL_MODEL_GENERATION_PREPARATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_MODEL_GENERATION_PREPARATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_MODEL_GENERATION_PREPARATION_MD_PATH),
    `${buildMarkdown(report, preparationPackage)}\n`,
    'utf8'
  );

  return { preparationPackage, report };
}
