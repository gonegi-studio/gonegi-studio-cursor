import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  PROMPT_ASSEMBLY_ENGINE_PASS_VERDICT,
  PROMPT_ASSEMBLY_ENGINE_REPORT_PATH,
  type AssembledPromptPackage,
  type MovieAnalysisPromptAssemblyEngineReport,
  type PromptSectionId,
} from './movieAnalysisPromptAssemblyEngine.js';
import {
  PROMPT_GENERATION_FRAMEWORK_REPORT_PATH,
  type MovieAnalysisPromptGenerationFrameworkReport,
} from './movieAnalysisPromptGenerationFramework.js';
import {
  RUNTIME_BINDING_FRAMEWORK_REPORT_PATH,
  type MovieAnalysisRuntimeBindingFrameworkReport,
} from './movieAnalysisRuntimeBindingFramework.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROMPT_QUALITY_GATE_PHASE =
  'PHASE-LEVEL2-004-MOVIE_ANALYSIS_PROMPT_QUALITY_GATE_V1' as const;
export const PROMPT_QUALITY_GATE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_PROMPT_QUALITY_GATE_V1' as const;
export const PROMPT_QUALITY_GATE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_PROMPT_QUALITY_GATE_V1' as const;
export const PROMPT_QUALITY_GATE_DIR =
  'reports/movie_analysis_prompt_quality_gate' as const;
export const PROMPT_QUALITY_GATE_REPORT_PATH =
  'reports/movie_analysis_prompt_quality_gate/movie-analysis-prompt-quality-gate-report.json' as const;
export const PROMPT_QUALITY_GATE_MD_PATH =
  'reports/movie_analysis_prompt_quality_gate/MOVIE_ANALYSIS_PROMPT_QUALITY_GATE.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type GateStatus = 'PASS' | 'FAIL';

export type PromptQualityGateIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type PromptQualityRiskDetection = {
  risk_id: string;
  risk_type:
    | 'missing_prompt_sections'
    | 'weak_prompt_sections'
    | 'overlong_prompt_risk'
    | 'conflicting_prompt_terms';
  source_video_id: string;
  severity: 'warning' | 'info';
  detail: string;
};

export type SourcePromptQualityAudit = {
  source_video_id: string;
  final_image_prompt_present: GateStatus;
  final_video_prompt_present: GateStatus;
  section_order_valid: GateStatus;
  required_sections_present: GateStatus;
  duplicate_section_absent: GateStatus;
  prompt_length_safe: GateStatus;
  adapter_traceability_preserved: GateStatus;
  negative_prompt_present: GateStatus;
  source_quality_pass: GateStatus;
};

export type MovieAnalysisPromptQualityGateReport = {
  report_id: string;
  phase: typeof PROMPT_QUALITY_GATE_PHASE;
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
  prompt_assembly_report_path: typeof PROMPT_ASSEMBLY_ENGINE_REPORT_PATH;
  source_count: number;
  adapter_count: number;
  final_image_prompt_present: GateStatus;
  final_video_prompt_present: GateStatus;
  section_order_valid: GateStatus;
  required_sections_present: GateStatus;
  duplicate_section_absent: GateStatus;
  prompt_length_safe: GateStatus;
  adapter_traceability_preserved: GateStatus;
  negative_prompt_present: GateStatus;
  missing_prompt_sections: PromptQualityRiskDetection[];
  weak_prompt_sections: PromptQualityRiskDetection[];
  overlong_prompt_risk: PromptQualityRiskDetection[];
  conflicting_prompt_terms: PromptQualityRiskDetection[];
  prompt_quality_gate_ready: GateStatus;
  planning_only_status: GateStatus;
  source_audits: SourcePromptQualityAudit[];
  final_verdict:
    | typeof PROMPT_QUALITY_GATE_PASS_VERDICT
    | typeof PROMPT_QUALITY_GATE_FAIL_VERDICT;
  issues: PromptQualityGateIssue[];
};

const ASSEMBLY_ORDER: PromptSectionId[] = [
  'scene',
  'camera',
  'emotion',
  'style',
  'continuity',
  'negative',
];

const SECTION_MARKERS: Record<PromptSectionId, string> = {
  scene: '[scene]',
  camera: '[camera]',
  emotion: '[emotion]',
  style: '[style]',
  continuity: '[continuity]',
  negative: '[negative]',
};

const MAX_SAFE_PROMPT_LENGTH = 8000;
const OVERLONG_WARNING_LENGTH = 6000;
const MIN_SECTION_CONTENT_LENGTH = 30;

const CONFLICT_PAIRS: [string, string][] = [
  ['no_runtime_execution', 'runtime_execution'],
  ['no_video_generation', 'video_generation'],
  ['no_image_generation', 'image_generation'],
  ['no_gpu', 'gpu_ready'],
];

function loadAssemblyReport(projectRoot: string): MovieAnalysisPromptAssemblyEngineReport | null {
  const abs = path.join(projectRoot, PROMPT_ASSEMBLY_ENGINE_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisPromptAssemblyEngineReport;
}

function loadGenerationReport(
  projectRoot: string
): MovieAnalysisPromptGenerationFrameworkReport | null {
  const abs = path.join(projectRoot, PROMPT_GENERATION_FRAMEWORK_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisPromptGenerationFrameworkReport;
}

function loadBindingReport(
  projectRoot: string
): MovieAnalysisRuntimeBindingFrameworkReport | null {
  const abs = path.join(projectRoot, RUNTIME_BINDING_FRAMEWORK_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRuntimeBindingFrameworkReport;
}

function extractSectionIds(prompt: string): PromptSectionId[] {
  const found: PromptSectionId[] = [];
  for (const sectionId of ASSEMBLY_ORDER) {
    if (prompt.includes(SECTION_MARKERS[sectionId])) {
      found.push(sectionId);
    }
  }
  return found;
}

function positivePromptContent(prompt: string): string {
  const negativeIndex = prompt.indexOf(SECTION_MARKERS.negative);
  return negativeIndex >= 0 ? prompt.slice(0, negativeIndex) : prompt;
}

function detectConflicts(prompt: string): string[] {
  const positive = positivePromptContent(prompt).toLowerCase();
  const conflicts: string[] = [];
  for (const [a, b] of CONFLICT_PAIRS) {
    if (positive.includes(a.toLowerCase()) && positive.includes(b.toLowerCase())) {
      conflicts.push(`${a}/${b}`);
    }
  }
  return conflicts;
}

function auditAssembledPackage(
  assembled: AssembledPromptPackage | undefined,
  generationReport: MovieAnalysisPromptGenerationFrameworkReport | null,
  bindingReport: MovieAnalysisRuntimeBindingFrameworkReport | null,
  sourceVideoId: string
): {
  audit: SourcePromptQualityAudit;
  risks: PromptQualityRiskDetection[];
} {
  const risks: PromptQualityRiskDetection[] = [];

  if (!assembled) {
    return {
      audit: {
        source_video_id: sourceVideoId,
        final_image_prompt_present: 'FAIL',
        final_video_prompt_present: 'FAIL',
        section_order_valid: 'FAIL',
        required_sections_present: 'FAIL',
        duplicate_section_absent: 'FAIL',
        prompt_length_safe: 'FAIL',
        adapter_traceability_preserved: 'FAIL',
        negative_prompt_present: 'FAIL',
        source_quality_pass: 'FAIL',
      },
      risks: [
        {
          risk_id: `missing_package_${sourceVideoId.toLowerCase()}_v1`,
          risk_type: 'missing_prompt_sections',
          source_video_id: sourceVideoId,
          severity: 'warning',
          detail: 'Assembled prompt package missing',
        },
      ],
    };
  }

  const imagePresent = assembled.final_image_prompt.trim().length > 0 ? 'PASS' : 'FAIL';
  const videoPresent = assembled.final_video_prompt.trim().length > 0 ? 'PASS' : 'FAIL';

  const imageSections = extractSectionIds(assembled.final_image_prompt);
  const videoSections = extractSectionIds(assembled.final_video_prompt);
  const orderValid =
    imageSections.length === ASSEMBLY_ORDER.length &&
    videoSections.length === ASSEMBLY_ORDER.length &&
    imageSections.every((section, index) => section === ASSEMBLY_ORDER[index]) &&
    videoSections.every((section, index) => section === ASSEMBLY_ORDER[index])
      ? 'PASS'
      : 'FAIL';

  const missingSections = ASSEMBLY_ORDER.filter(
    (sectionId) =>
      !assembled.assembly_sections.some(
        (section) => section.section_id === sectionId && section.content.trim().length > 0
      )
  );

  if (missingSections.length > 0) {
    risks.push({
      risk_id: `missing_sections_${sourceVideoId.toLowerCase()}_v1`,
      risk_type: 'missing_prompt_sections',
      source_video_id: sourceVideoId,
      severity: 'warning',
      detail: `Missing or empty sections: ${missingSections.join(', ')}`,
    });
  }

  const sectionsPresent =
    missingSections.length === 0 && assembled.assembly_sections.length === ASSEMBLY_ORDER.length
      ? 'PASS'
      : 'FAIL';

  const duplicatesAbsent =
    new Set(imageSections).size === ASSEMBLY_ORDER.length &&
    new Set(videoSections).size === ASSEMBLY_ORDER.length
      ? 'PASS'
      : 'FAIL';

  const maxLength = Math.max(
    assembled.final_image_prompt.length,
    assembled.final_video_prompt.length
  );
  const lengthSafe = maxLength <= MAX_SAFE_PROMPT_LENGTH ? 'PASS' : 'FAIL';

  if (maxLength > OVERLONG_WARNING_LENGTH) {
    risks.push({
      risk_id: `overlong_${sourceVideoId.toLowerCase()}_v1`,
      risk_type: 'overlong_prompt_risk',
      source_video_id: sourceVideoId,
      severity: 'warning',
      detail: `Prompt length ${maxLength} exceeds warning threshold ${OVERLONG_WARNING_LENGTH}`,
    });
  }

  for (const section of assembled.assembly_sections) {
    if (
      section.section_id !== 'negative' &&
      section.content.trim().length < MIN_SECTION_CONTENT_LENGTH
    ) {
      risks.push({
        risk_id: `weak_${sourceVideoId.toLowerCase()}_${section.section_id}_v1`,
        risk_type: 'weak_prompt_sections',
        source_video_id: sourceVideoId,
        severity: 'warning',
        detail: `${section.section_id} section content below ${MIN_SECTION_CONTENT_LENGTH} chars`,
      });
    }
  }

  const imageConflicts = detectConflicts(assembled.final_image_prompt);
  const videoConflicts = detectConflicts(assembled.final_video_prompt);
  const allConflicts = [...new Set([...imageConflicts, ...videoConflicts])];

  for (const conflict of allConflicts) {
    risks.push({
      risk_id: `conflict_${sourceVideoId.toLowerCase()}_${conflict.replace('/', '_')}_v1`,
      risk_type: 'conflicting_prompt_terms',
      source_video_id: sourceVideoId,
      severity: 'warning',
      detail: `Conflicting terms detected: ${conflict}`,
    });
  }

  const negativeSection = assembled.assembly_sections.find(
    (section) => section.section_id === 'negative'
  );
  const negativePresent =
    negativeSection !== undefined &&
    negativeSection.content.trim().length > 0 &&
    assembled.final_image_prompt.includes(SECTION_MARKERS.negative) &&
    assembled.final_video_prompt.includes(SECTION_MARKERS.negative)
      ? 'PASS'
      : 'FAIL';

  const promptPackage = generationReport?.source_prompt_packages.find(
    (entry) => entry.source_video_id === sourceVideoId
  );
  const sourceBindings =
    bindingReport?.adapter_runtime_bindings.filter(
      (binding) => binding.source_video_id === sourceVideoId
    ) ?? [];

  const traceabilityPreserved =
    assembled.traceability_preserved === true &&
    promptPackage?.traceability_preserved === true &&
    promptPackage.prompt_package_id === assembled.prompt_package_id &&
    sourceBindings.length === 6 &&
    sourceBindings.every((binding) => binding.traceability_preserved === true)
      ? 'PASS'
      : 'FAIL';

  const checks: GateStatus[] = [
    imagePresent,
    videoPresent,
    orderValid,
    sectionsPresent,
    duplicatesAbsent,
    lengthSafe,
    traceabilityPreserved,
    negativePresent,
  ];

  return {
    audit: {
      source_video_id: sourceVideoId,
      final_image_prompt_present: imagePresent,
      final_video_prompt_present: videoPresent,
      section_order_valid: orderValid,
      required_sections_present: sectionsPresent,
      duplicate_section_absent: duplicatesAbsent,
      prompt_length_safe: lengthSafe,
      adapter_traceability_preserved: traceabilityPreserved,
      negative_prompt_present: negativePresent,
      source_quality_pass: checks.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
    },
    risks,
  };
}

function aggregateStatus(
  audits: SourcePromptQualityAudit[],
  field: keyof Omit<SourcePromptQualityAudit, 'source_video_id' | 'source_quality_pass'>
): GateStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisPromptQualityGateReport): string {
  const lines = [
    '# Movie Analysis Prompt Quality Gate',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Quality Gate Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    '',
    '## Validation Summary',
    '',
    '| Check | Result |',
    '| --- | --- |',
    `| final_image_prompt_present | ${report.final_image_prompt_present} |`,
    `| final_video_prompt_present | ${report.final_video_prompt_present} |`,
    `| section_order_valid | ${report.section_order_valid} |`,
    `| required_sections_present | ${report.required_sections_present} |`,
    `| duplicate_section_absent | ${report.duplicate_section_absent} |`,
    `| prompt_length_safe | ${report.prompt_length_safe} |`,
    `| adapter_traceability_preserved | ${report.adapter_traceability_preserved} |`,
    `| negative_prompt_present | ${report.negative_prompt_present} |`,
    `| prompt_quality_gate_ready | ${report.prompt_quality_gate_ready} |`,
    '',
    '## Risk Detections',
    '',
    `### Missing Prompt Sections (${report.missing_prompt_sections.length})`,
    '',
  ];

  for (const risk of report.missing_prompt_sections) {
    lines.push(`- ${risk.source_video_id}: ${risk.detail}`);
  }

  lines.push('', `### Weak Prompt Sections (${report.weak_prompt_sections.length})`, '');
  for (const risk of report.weak_prompt_sections) {
    lines.push(`- ${risk.source_video_id}: ${risk.detail}`);
  }

  lines.push('', `### Overlong Prompt Risk (${report.overlong_prompt_risk.length})`, '');
  for (const risk of report.overlong_prompt_risk) {
    lines.push(`- ${risk.source_video_id}: ${risk.detail}`);
  }

  lines.push('', `### Conflicting Prompt Terms (${report.conflicting_prompt_terms.length})`, '');
  for (const risk of report.conflicting_prompt_terms) {
    lines.push(`- ${risk.source_video_id}: ${risk.detail}`);
  }

  lines.push('', '## Source Audits', '');
  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- final_image_prompt_present: ${audit.final_image_prompt_present}`,
      `- final_video_prompt_present: ${audit.final_video_prompt_present}`,
      `- section_order_valid: ${audit.section_order_valid}`,
      `- required_sections_present: ${audit.required_sections_present}`,
      `- duplicate_section_absent: ${audit.duplicate_section_absent}`,
      `- prompt_length_safe: ${audit.prompt_length_safe}`,
      `- adapter_traceability_preserved: ${audit.adapter_traceability_preserved}`,
      `- negative_prompt_present: ${audit.negative_prompt_present}`,
      `- source_quality_pass: ${audit.source_quality_pass}`,
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
  issues: PromptQualityGateIssue[]
): MovieAnalysisPromptQualityGateReport {
  const report: MovieAnalysisPromptQualityGateReport = {
    report_id: 'movie-analysis-prompt-quality-gate-report-v1',
    phase: PROMPT_QUALITY_GATE_PHASE,
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
    prompt_assembly_report_path: PROMPT_ASSEMBLY_ENGINE_REPORT_PATH,
    source_count: 0,
    adapter_count: 0,
    final_image_prompt_present: 'FAIL',
    final_video_prompt_present: 'FAIL',
    section_order_valid: 'FAIL',
    required_sections_present: 'FAIL',
    duplicate_section_absent: 'FAIL',
    prompt_length_safe: 'FAIL',
    adapter_traceability_preserved: 'FAIL',
    negative_prompt_present: 'FAIL',
    missing_prompt_sections: [],
    weak_prompt_sections: [],
    overlong_prompt_risk: [],
    conflicting_prompt_terms: [],
    prompt_quality_gate_ready: 'FAIL',
    planning_only_status: 'FAIL',
    source_audits: [],
    final_verdict: PROMPT_QUALITY_GATE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PROMPT_QUALITY_GATE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PROMPT_QUALITY_GATE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PROMPT_QUALITY_GATE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisPromptQualityGateReport(
  projectRoot?: string
): MovieAnalysisPromptQualityGateReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: PromptQualityGateIssue[] = [];
  const timestamp = new Date().toISOString();

  const assemblyReport = loadAssemblyReport(root);
  if (!assemblyReport) {
    issues.push({
      code: 'PROMPT_ASSEMBLY_REPORT_MISSING',
      message: `Missing ${PROMPT_ASSEMBLY_ENGINE_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (assemblyReport.final_verdict !== PROMPT_ASSEMBLY_ENGINE_PASS_VERDICT) {
    issues.push({
      code: 'PROMPT_ASSEMBLY_NOT_PASS',
      message: `Prompt assembly engine must have ${PROMPT_ASSEMBLY_ENGINE_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  if (assemblyReport.prompt_assembly_engine_ready !== 'PASS') {
    issues.push({
      code: 'PROMPT_ASSEMBLY_NOT_READY',
      message: 'Prompt assembly engine is not ready',
      severity: 'error',
    });
  }

  const generationReport = loadGenerationReport(root);
  const bindingReport = loadBindingReport(root);

  if (!generationReport || !bindingReport) {
    issues.push({
      code: 'UPSTREAM_REPORT_MISSING',
      message: 'Missing prompt generation or runtime binding report for traceability validation',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const sourceAudits: SourcePromptQualityAudit[] = [];
  const allRisks: PromptQualityRiskDetection[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const assembled = assemblyReport.assembled_prompt_packages.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const { audit, risks } = auditAssembledPackage(
      assembled,
      generationReport,
      bindingReport,
      sourceVideoId
    );
    sourceAudits.push(audit);
    allRisks.push(...risks);

    if (audit.source_quality_pass === 'FAIL') {
      issues.push({
        code: 'SOURCE_QUALITY_FAIL',
        message: `Prompt quality gate failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const missingPromptSections = allRisks.filter(
    (risk) => risk.risk_type === 'missing_prompt_sections'
  );
  const weakPromptSections = allRisks.filter((risk) => risk.risk_type === 'weak_prompt_sections');
  const overlongPromptRisk = allRisks.filter((risk) => risk.risk_type === 'overlong_prompt_risk');
  const conflictingPromptTerms = allRisks.filter(
    (risk) => risk.risk_type === 'conflicting_prompt_terms'
  );

  const finalImagePromptPresent = aggregateStatus(sourceAudits, 'final_image_prompt_present');
  const finalVideoPromptPresent = aggregateStatus(sourceAudits, 'final_video_prompt_present');
  const sectionOrderValid = aggregateStatus(sourceAudits, 'section_order_valid');
  const requiredSectionsPresent = aggregateStatus(sourceAudits, 'required_sections_present');
  const duplicateSectionAbsent = aggregateStatus(sourceAudits, 'duplicate_section_absent');
  const promptLengthSafe = aggregateStatus(sourceAudits, 'prompt_length_safe');
  const adapterTraceabilityPreserved = aggregateStatus(
    sourceAudits,
    'adapter_traceability_preserved'
  );
  const negativePromptPresent = aggregateStatus(sourceAudits, 'negative_prompt_present');

  const gateChecks: GateStatus[] = [
    finalImagePromptPresent,
    finalVideoPromptPresent,
    sectionOrderValid,
    requiredSectionsPresent,
    duplicateSectionAbsent,
    promptLengthSafe,
    adapterTraceabilityPreserved,
    negativePromptPresent,
  ];

  for (const [index, status] of gateChecks.entries()) {
    if (status === 'FAIL') {
      issues.push({
        code: 'GATE_CHECK_FAIL',
        message: `Gate check at index ${index} failed`,
        severity: 'error',
      });
    }
  }

  const safetyValid =
    assemblyReport.planning_only === true &&
    assemblyReport.planning_only_status === 'PASS' &&
    assemblyReport.generation === false &&
    assemblyReport.gpu_execution === false &&
    assemblyReport.external_call_allowed === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: GateStatus = safetyValid ? 'PASS' : 'FAIL';

  const promptQualityGateReady =
    assemblyReport.source_count === EXPECTED_SOURCE_COUNT &&
    assemblyReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    bindingReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.source_quality_pass === 'PASS') &&
    missingPromptSections.length === 0 &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = promptQualityGateReady === 'PASS';

  const report: MovieAnalysisPromptQualityGateReport = {
    report_id: 'movie-analysis-prompt-quality-gate-report-v1',
    phase: PROMPT_QUALITY_GATE_PHASE,
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
    prompt_assembly_report_path: PROMPT_ASSEMBLY_ENGINE_REPORT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    final_image_prompt_present: finalImagePromptPresent,
    final_video_prompt_present: finalVideoPromptPresent,
    section_order_valid: sectionOrderValid,
    required_sections_present: requiredSectionsPresent,
    duplicate_section_absent: duplicateSectionAbsent,
    prompt_length_safe: promptLengthSafe,
    adapter_traceability_preserved: adapterTraceabilityPreserved,
    negative_prompt_present: negativePromptPresent,
    missing_prompt_sections: missingPromptSections,
    weak_prompt_sections: weakPromptSections,
    overlong_prompt_risk: overlongPromptRisk,
    conflicting_prompt_terms: conflictingPromptTerms,
    prompt_quality_gate_ready: promptQualityGateReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass ? PROMPT_QUALITY_GATE_PASS_VERDICT : PROMPT_QUALITY_GATE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PROMPT_QUALITY_GATE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PROMPT_QUALITY_GATE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PROMPT_QUALITY_GATE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
