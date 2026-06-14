import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  PROMPT_GENERATION_FRAMEWORK_PASS_VERDICT,
  PROMPT_GENERATION_FRAMEWORK_REPORT_PATH,
  type MovieAnalysisPromptGenerationFrameworkReport,
  type SourcePromptPackage,
} from './movieAnalysisPromptGenerationFramework.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROMPT_ASSEMBLY_ENGINE_PHASE =
  'PHASE-LEVEL2-003-MOVIE_ANALYSIS_PROMPT_ASSEMBLY_ENGINE_V1' as const;
export const PROMPT_ASSEMBLY_ENGINE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_PROMPT_ASSEMBLY_ENGINE_V1' as const;
export const PROMPT_ASSEMBLY_ENGINE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_PROMPT_ASSEMBLY_ENGINE_V1' as const;
export const PROMPT_ASSEMBLY_ENGINE_DIR =
  'reports/movie_analysis_prompt_assembly_engine' as const;
export const PROMPT_ASSEMBLY_ENGINE_REPORT_PATH =
  'reports/movie_analysis_prompt_assembly_engine/movie-analysis-prompt-assembly-engine-report.json' as const;
export const PROMPT_ASSEMBLY_ENGINE_MD_PATH =
  'reports/movie_analysis_prompt_assembly_engine/MOVIE_ANALYSIS_PROMPT_ASSEMBLY_ENGINE.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type AssemblyStatus = 'PASS' | 'FAIL';

export type PromptAssemblyIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type PromptSectionId =
  | 'scene'
  | 'camera'
  | 'emotion'
  | 'style'
  | 'continuity'
  | 'negative';

export type PromptAssemblySection = {
  section_id: PromptSectionId;
  section_order: number;
  template_type: string;
  content: string;
  planning_only: true;
  generation: false;
};

export type AssembledPromptPackage = {
  assembly_id: string;
  source_video_id: string;
  prompt_package_id: string;
  final_image_prompt: string;
  final_video_prompt: string;
  assembly_sections: PromptAssemblySection[];
  section_count: number;
  traceability_preserved: true;
  planning_only: true;
  generation: false;
};

export type PromptAssemblyValidation = {
  prompt_structure_valid: AssemblyStatus;
  prompt_order_valid: AssemblyStatus;
  required_sections_present: AssemblyStatus;
  duplicate_section_absent: AssemblyStatus;
};

export type SourcePromptAssemblyAudit = {
  source_video_id: string;
  prompt_structure_valid: AssemblyStatus;
  prompt_order_valid: AssemblyStatus;
  required_sections_present: AssemblyStatus;
  duplicate_section_absent: AssemblyStatus;
  source_assembly_ready: AssemblyStatus;
};

export type MovieAnalysisPromptAssemblyEngineReport = {
  report_id: string;
  phase: typeof PROMPT_ASSEMBLY_ENGINE_PHASE;
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
  prompt_generation_report_path: typeof PROMPT_GENERATION_FRAMEWORK_REPORT_PATH;
  source_count: number;
  adapter_count: number;
  assembly_order: PromptSectionId[];
  assembled_prompt_packages: AssembledPromptPackage[];
  validation: PromptAssemblyValidation;
  prompt_assembly_engine_ready: AssemblyStatus;
  planning_only_status: AssemblyStatus;
  source_audits: SourcePromptAssemblyAudit[];
  final_verdict:
    | typeof PROMPT_ASSEMBLY_ENGINE_PASS_VERDICT
    | typeof PROMPT_ASSEMBLY_ENGINE_FAIL_VERDICT;
  issues: PromptAssemblyIssue[];
};

const ASSEMBLY_ORDER: PromptSectionId[] = [
  'scene',
  'camera',
  'emotion',
  'style',
  'continuity',
  'negative',
];

const SECTION_TEMPLATE_TYPES: Record<PromptSectionId, string> = {
  scene: 'scene_prompt_template',
  camera: 'camera_prompt_template',
  emotion: 'emotion_prompt_template',
  style: 'style_prompt_template',
  continuity: 'continuity_prompt_template',
  negative: 'negative_prompt_template',
};

const SECTION_MARKERS: Record<PromptSectionId, string> = {
  scene: '[scene]',
  camera: '[camera]',
  emotion: '[emotion]',
  style: '[style]',
  continuity: '[continuity]',
  negative: '[negative]',
};

function loadPromptGenerationReport(
  projectRoot: string
): MovieAnalysisPromptGenerationFrameworkReport | null {
  const abs = path.join(projectRoot, PROMPT_GENERATION_FRAMEWORK_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisPromptGenerationFrameworkReport;
}

function sectionContent(promptPackage: SourcePromptPackage, sectionId: PromptSectionId): string {
  switch (sectionId) {
    case 'scene':
      return promptPackage.scene_prompt;
    case 'camera':
      return promptPackage.camera_prompt;
    case 'emotion':
      return promptPackage.emotion_prompt;
    case 'style':
      return promptPackage.style_prompt;
    case 'continuity':
      return promptPackage.continuity_prompt;
    case 'negative':
      return promptPackage.negative_prompt;
  }
}

function buildAssemblySections(promptPackage: SourcePromptPackage): PromptAssemblySection[] {
  return ASSEMBLY_ORDER.map((sectionId, index) => ({
    section_id: sectionId,
    section_order: index + 1,
    template_type: SECTION_TEMPLATE_TYPES[sectionId],
    content: sectionContent(promptPackage, sectionId),
    planning_only: true as const,
    generation: false as const,
  }));
}

function assembleFinalPrompt(
  sections: PromptAssemblySection[],
  consumerTarget: 'image_app' | 'video_app'
): string {
  const prefix = consumerTarget === 'image_app' ? 'image_prompt:' : 'video_prompt:';
  const body = sections
    .map((section) => `${SECTION_MARKERS[section.section_id]} ${section.content}`)
    .join(' ');
  return `${prefix} ${body}`.trim();
}

function validateAssembledPrompt(
  assembled: AssembledPromptPackage
): {
  structureValid: boolean;
  orderValid: boolean;
  sectionsPresent: boolean;
  duplicatesAbsent: boolean;
} {
  const imageSections = extractSectionIds(assembled.final_image_prompt);
  const videoSections = extractSectionIds(assembled.final_video_prompt);

  const structureValid =
    imageSections.length === ASSEMBLY_ORDER.length &&
    videoSections.length === ASSEMBLY_ORDER.length &&
    assembled.assembly_sections.length === ASSEMBLY_ORDER.length;

  const orderValid =
    arraysEqual(imageSections, ASSEMBLY_ORDER) &&
    arraysEqual(videoSections, ASSEMBLY_ORDER) &&
    assembled.assembly_sections.every(
      (section, index) => section.section_id === ASSEMBLY_ORDER[index]
    );

  const sectionsPresent =
    assembled.assembly_sections.every((section) => section.content.trim().length > 0) &&
    assembled.final_image_prompt.length > 0 &&
    assembled.final_video_prompt.length > 0;

  const duplicatesAbsent =
    new Set(imageSections).size === ASSEMBLY_ORDER.length &&
    new Set(videoSections).size === ASSEMBLY_ORDER.length &&
    new Set(assembled.assembly_sections.map((section) => section.section_id)).size ===
      ASSEMBLY_ORDER.length;

  return { structureValid, orderValid, sectionsPresent, duplicatesAbsent };
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

function arraysEqual<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function buildAssembledPackage(promptPackage: SourcePromptPackage): AssembledPromptPackage {
  const sections = buildAssemblySections(promptPackage);
  return {
    assembly_id: `prompt_assembly_${promptPackage.source_video_id.toLowerCase()}_v1`,
    source_video_id: promptPackage.source_video_id,
    prompt_package_id: promptPackage.prompt_package_id,
    final_image_prompt: assembleFinalPrompt(sections, 'image_app'),
    final_video_prompt: assembleFinalPrompt(sections, 'video_app'),
    assembly_sections: sections,
    section_count: sections.length,
    traceability_preserved: true,
    planning_only: true,
    generation: false,
  };
}

function auditSourceAssembly(assembled: AssembledPromptPackage): SourcePromptAssemblyAudit {
  const validation = validateAssembledPrompt(assembled);
  const structureStatus: AssemblyStatus = validation.structureValid ? 'PASS' : 'FAIL';
  const orderStatus: AssemblyStatus = validation.orderValid ? 'PASS' : 'FAIL';
  const sectionsStatus: AssemblyStatus = validation.sectionsPresent ? 'PASS' : 'FAIL';
  const duplicatesStatus: AssemblyStatus = validation.duplicatesAbsent ? 'PASS' : 'FAIL';

  const sourceAssemblyReady =
    structureStatus === 'PASS' &&
    orderStatus === 'PASS' &&
    sectionsStatus === 'PASS' &&
    duplicatesStatus === 'PASS'
      ? 'PASS'
      : 'FAIL';

  return {
    source_video_id: assembled.source_video_id,
    prompt_structure_valid: structureStatus,
    prompt_order_valid: orderStatus,
    required_sections_present: sectionsStatus,
    duplicate_section_absent: duplicatesStatus,
    source_assembly_ready: sourceAssemblyReady,
  };
}

function aggregateValidation(
  audits: SourcePromptAssemblyAudit[],
  field: keyof Pick<
    SourcePromptAssemblyAudit,
    | 'prompt_structure_valid'
    | 'prompt_order_valid'
    | 'required_sections_present'
    | 'duplicate_section_absent'
  >
): AssemblyStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisPromptAssemblyEngineReport): string {
  const lines = [
    '# Movie Analysis Prompt Assembly Engine',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Engine Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    '',
    '## Assembly Order',
    '',
    report.assembly_order.join(' → '),
    '',
    '## Validation',
    '',
    '| Check | Result |',
    '| --- | --- |',
    `| prompt_structure_valid | ${report.validation.prompt_structure_valid} |`,
    `| prompt_order_valid | ${report.validation.prompt_order_valid} |`,
    `| required_sections_present | ${report.validation.required_sections_present} |`,
    `| duplicate_section_absent | ${report.validation.duplicate_section_absent} |`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| assembled_prompt_packages | ${report.assembled_prompt_packages.length} |`,
    `| prompt_assembly_engine_ready | ${report.prompt_assembly_engine_ready} |`,
    '',
    '## Source Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- prompt_structure_valid: ${audit.prompt_structure_valid}`,
      `- prompt_order_valid: ${audit.prompt_order_valid}`,
      `- required_sections_present: ${audit.required_sections_present}`,
      `- duplicate_section_absent: ${audit.duplicate_section_absent}`,
      `- source_assembly_ready: ${audit.source_assembly_ready}`,
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
  issues: PromptAssemblyIssue[]
): MovieAnalysisPromptAssemblyEngineReport {
  const report: MovieAnalysisPromptAssemblyEngineReport = {
    report_id: 'movie-analysis-prompt-assembly-engine-report-v1',
    phase: PROMPT_ASSEMBLY_ENGINE_PHASE,
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
    prompt_generation_report_path: PROMPT_GENERATION_FRAMEWORK_REPORT_PATH,
    source_count: 0,
    adapter_count: 0,
    assembly_order: ASSEMBLY_ORDER,
    assembled_prompt_packages: [],
    validation: {
      prompt_structure_valid: 'FAIL',
      prompt_order_valid: 'FAIL',
      required_sections_present: 'FAIL',
      duplicate_section_absent: 'FAIL',
    },
    prompt_assembly_engine_ready: 'FAIL',
    planning_only_status: 'FAIL',
    source_audits: [],
    final_verdict: PROMPT_ASSEMBLY_ENGINE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PROMPT_ASSEMBLY_ENGINE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PROMPT_ASSEMBLY_ENGINE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PROMPT_ASSEMBLY_ENGINE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisPromptAssemblyEngineReport(
  projectRoot?: string
): MovieAnalysisPromptAssemblyEngineReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: PromptAssemblyIssue[] = [];
  const timestamp = new Date().toISOString();

  const generationReport = loadPromptGenerationReport(root);
  if (!generationReport) {
    issues.push({
      code: 'PROMPT_GENERATION_REPORT_MISSING',
      message: `Missing ${PROMPT_GENERATION_FRAMEWORK_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (generationReport.final_verdict !== PROMPT_GENERATION_FRAMEWORK_PASS_VERDICT) {
    issues.push({
      code: 'PROMPT_GENERATION_NOT_PASS',
      message: `Prompt generation framework must have ${PROMPT_GENERATION_FRAMEWORK_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  if (generationReport.prompt_generation_framework_ready !== 'PASS') {
    issues.push({
      code: 'PROMPT_GENERATION_NOT_READY',
      message: 'Prompt generation framework is not ready',
      severity: 'error',
    });
  }

  const assembledPromptPackages: AssembledPromptPackage[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const promptPackage = generationReport.source_prompt_packages.find(
      (entry) => entry.source_video_id === sourceVideoId
    );

    if (!promptPackage) {
      issues.push({
        code: 'SOURCE_PROMPT_PACKAGE_MISSING',
        message: `Missing prompt package for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
      continue;
    }

    assembledPromptPackages.push(buildAssembledPackage(promptPackage));
  }

  const sourceAudits = assembledPromptPackages.map((assembled) => {
    const audit = auditSourceAssembly(assembled);
    if (audit.source_assembly_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_ASSEMBLY_NOT_READY',
        message: `Prompt assembly failed for ${assembled.source_video_id}`,
        severity: 'error',
        source_video_id: assembled.source_video_id,
      });
    }
    return audit;
  });

  const validation: PromptAssemblyValidation = {
    prompt_structure_valid: aggregateValidation(sourceAudits, 'prompt_structure_valid'),
    prompt_order_valid: aggregateValidation(sourceAudits, 'prompt_order_valid'),
    required_sections_present: aggregateValidation(sourceAudits, 'required_sections_present'),
    duplicate_section_absent: aggregateValidation(sourceAudits, 'duplicate_section_absent'),
  };

  for (const [check, status] of Object.entries(validation)) {
    if (status === 'FAIL') {
      issues.push({
        code: 'ASSEMBLY_VALIDATION_FAIL',
        message: `${check} must be PASS`,
        severity: 'error',
      });
    }
  }

  const safetyValid =
    generationReport.planning_only === true &&
    generationReport.planning_only_status === 'PASS' &&
    generationReport.generation === false &&
    generationReport.gpu_execution === false &&
    generationReport.external_call_allowed === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: AssemblyStatus = safetyValid ? 'PASS' : 'FAIL';

  const promptAssemblyEngineReady =
    generationReport.source_count === EXPECTED_SOURCE_COUNT &&
    generationReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    assembledPromptPackages.length === EXPECTED_SOURCE_COUNT &&
    Object.values(validation).every((status) => status === 'PASS') &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.source_assembly_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = promptAssemblyEngineReady === 'PASS';

  const report: MovieAnalysisPromptAssemblyEngineReport = {
    report_id: 'movie-analysis-prompt-assembly-engine-report-v1',
    phase: PROMPT_ASSEMBLY_ENGINE_PHASE,
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
    prompt_generation_report_path: PROMPT_GENERATION_FRAMEWORK_REPORT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    assembly_order: ASSEMBLY_ORDER,
    assembled_prompt_packages: assembledPromptPackages,
    validation,
    prompt_assembly_engine_ready: promptAssemblyEngineReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass
      ? PROMPT_ASSEMBLY_ENGINE_PASS_VERDICT
      : PROMPT_ASSEMBLY_ENGINE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PROMPT_ASSEMBLY_ENGINE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PROMPT_ASSEMBLY_ENGINE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PROMPT_ASSEMBLY_ENGINE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
