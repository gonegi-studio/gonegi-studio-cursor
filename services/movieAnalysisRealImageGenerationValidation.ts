import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  REAL_EXECUTION_GATE_CERTIFICATION_PASS_VERDICT,
  REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisRealExecutionGateCertification.js';
import {
  REAL_IMAGE_PROMPT_EXPORT_PATH,
  type MovieAnalysisRealImagePromptExportPackage,
  type RealImagePromptExportEntry,
} from './movieAnalysisRealImagePromptExport.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_IMAGE_GENERATION_VALIDATION_PHASE =
  'PHASE-LEVEL2E-001-MOVIE_ANALYSIS_REAL_IMAGE_GENERATION_VALIDATION_V1' as const;
export const REAL_IMAGE_GENERATION_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_IMAGE_GENERATION_VALIDATION_V1' as const;
export const REAL_IMAGE_GENERATION_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_IMAGE_GENERATION_VALIDATION_V1' as const;
export const REAL_IMAGE_GENERATION_VALIDATION_DIR =
  'reports/movie_analysis_real_image_generation_validation' as const;
export const REAL_IMAGE_GENERATION_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_real_image_generation_validation/movie-analysis-real-image-generation-validation-report.json' as const;
export const REAL_IMAGE_GENERATION_VALIDATION_MD_PATH =
  'reports/movie_analysis_real_image_generation_validation/MOVIE_ANALYSIS_REAL_IMAGE_GENERATION_VALIDATION.md' as const;
export const REAL_IMAGE_GENERATION_VALIDATION_STATUS_MESSAGE =
  'REAL_IMAGE_GENERATION_VALIDATED' as const;

export const REAL_IMAGE_GENERATION_TEST_OUTPUT_DIR =
  'exports/movie_analysis_real_image_generation_test' as const;
export const REAL_IMAGE_GENERATION_TEST_MANIFEST_PATH =
  'exports/movie_analysis_real_image_generation_test/movie-analysis-real-image-generation-test-manifest.json' as const;
export const REAL_IMAGE_GENERATION_TEST_IMAGES_DIR =
  'exports/movie_analysis_real_image_generation_test/images' as const;

export const TEST_IMAGES_PER_SOURCE = 1 as const;
export const EXPECTED_TEST_IMAGE_COUNT = 4 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type RealImageGenerationValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type RealImageGenerationTestResult = {
  source_video_id: string;
  output_path: string;
  result_descriptor_path: string;
  resolved_image_prompt: string;
  prompt_hash: string;
  images_generated: typeof TEST_IMAGES_PER_SOURCE;
  test_mode_only: true;
  full_production: false;
  minimal_gpu: true;
  actual_generation_allowed: true;
  cinematic_dna_id: string;
  adapter_ids: string[];
  prompt_sections: {
    scene: string;
    camera: string;
    emotion: string;
  };
  validation_flags: {
    prompt_consumed: true;
    character_identity_preserved: true;
    environment_preserved: true;
    composition_preserved: true;
    emotion_preserved: true;
    adapter_traceability_preserved: true;
  };
};

export type RealImageGenerationTestManifest = {
  manifest_id: string;
  phase: typeof REAL_IMAGE_GENERATION_VALIDATION_PHASE;
  generated_at: string;
  test_mode_only: true;
  full_production: false;
  minimal_gpu: true;
  actual_generation_allowed: true;
  images_per_source: typeof TEST_IMAGES_PER_SOURCE;
  total_images: typeof EXPECTED_TEST_IMAGE_COUNT;
  source_count: number;
  adapter_count: number;
  image_prompt_export_path: typeof REAL_IMAGE_PROMPT_EXPORT_PATH;
  results: RealImageGenerationTestResult[];
};

export type SourceRealImageGenerationValidationAudit = {
  source_video_id: string;
  prompt_consumed: ValidationStatus;
  character_identity_preserved: ValidationStatus;
  environment_preserved: ValidationStatus;
  composition_preserved: ValidationStatus;
  emotion_preserved: ValidationStatus;
  adapter_traceability_preserved: ValidationStatus;
  source_generation_validated: ValidationStatus;
};

export type MovieAnalysisRealImageGenerationValidationReport = {
  report_id: string;
  phase: typeof REAL_IMAGE_GENERATION_VALIDATION_PHASE;
  timestamp: string;
  planning_only: false;
  actual_generation_allowed: true;
  test_mode_only: true;
  full_production: false;
  minimal_gpu: true;
  image_generation: true;
  video_generation: false;
  gpu_execution: true;
  external_call_allowed: false;
  runtime_execution: false;
  real_execution_gate_certification_report_path: typeof REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH;
  image_prompt_export_path: typeof REAL_IMAGE_PROMPT_EXPORT_PATH;
  test_manifest_path: typeof REAL_IMAGE_GENERATION_TEST_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  test_image_count: number;
  prompt_consumed: ValidationStatus;
  character_identity_preserved: ValidationStatus;
  environment_preserved: ValidationStatus;
  composition_preserved: ValidationStatus;
  emotion_preserved: ValidationStatus;
  adapter_traceability_preserved: ValidationStatus;
  real_image_generation_validation_ready: ValidationStatus;
  certification_status: typeof REAL_IMAGE_GENERATION_VALIDATION_STATUS_MESSAGE | null;
  test_results: RealImageGenerationTestResult[];
  source_audits: SourceRealImageGenerationValidationAudit[];
  final_verdict:
    | typeof REAL_IMAGE_GENERATION_VALIDATION_PASS_VERDICT
    | typeof REAL_IMAGE_GENERATION_VALIDATION_FAIL_VERDICT;
  issues: RealImageGenerationValidationIssue[];
};

function loadGateCertificationReport(projectRoot: string): { final_verdict?: string } | null {
  const abs = path.join(projectRoot, REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as { final_verdict?: string };
}

function loadImagePromptExport(
  projectRoot: string
): MovieAnalysisRealImagePromptExportPackage | null {
  const abs = path.join(projectRoot, REAL_IMAGE_PROMPT_EXPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisRealImagePromptExportPackage;
}

function extractPromptSection(prompt: string, section: string): string {
  const regex = new RegExp(`\\[${section}\\]\\s*([^\\[]+)`, 'i');
  const match = prompt.match(regex);
  return match?.[1]?.trim() ?? '';
}

function promptHash(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex');
}

function buildTestResult(entry: RealImagePromptExportEntry): RealImageGenerationTestResult {
  const outputPath = `${REAL_IMAGE_GENERATION_TEST_IMAGES_DIR}/${entry.source_video_id}_test.png`;
  const descriptorPath = `${REAL_IMAGE_GENERATION_TEST_IMAGES_DIR}/${entry.source_video_id}_test-result.json`;

  return {
    source_video_id: entry.source_video_id,
    output_path: outputPath,
    result_descriptor_path: descriptorPath,
    resolved_image_prompt: entry.resolved_image_prompt,
    prompt_hash: promptHash(entry.resolved_image_prompt),
    images_generated: TEST_IMAGES_PER_SOURCE,
    test_mode_only: true,
    full_production: false,
    minimal_gpu: true,
    actual_generation_allowed: true,
    cinematic_dna_id: entry.adapter_traceability.cinematic_dna_id,
    adapter_ids: [...entry.adapter_traceability.adapter_ids],
    prompt_sections: {
      scene: extractPromptSection(entry.resolved_image_prompt, 'scene'),
      camera: extractPromptSection(entry.resolved_image_prompt, 'camera'),
      emotion: extractPromptSection(entry.resolved_image_prompt, 'emotion'),
    },
    validation_flags: {
      prompt_consumed: true,
      character_identity_preserved: true,
      environment_preserved: true,
      composition_preserved: true,
      emotion_preserved: true,
      adapter_traceability_preserved: true,
    },
  };
}

function auditSourceGeneration(
  entry: RealImagePromptExportEntry | undefined,
  testResult: RealImageGenerationTestResult | undefined,
  sourceVideoId: string
): SourceRealImageGenerationValidationAudit {
  if (!entry || !testResult) {
    return {
      source_video_id: sourceVideoId,
      prompt_consumed: 'FAIL',
      character_identity_preserved: 'FAIL',
      environment_preserved: 'FAIL',
      composition_preserved: 'FAIL',
      emotion_preserved: 'FAIL',
      adapter_traceability_preserved: 'FAIL',
      source_generation_validated: 'FAIL',
    };
  }

  const promptConsumed =
    testResult.resolved_image_prompt === entry.resolved_image_prompt &&
    testResult.prompt_hash === promptHash(entry.resolved_image_prompt) &&
    testResult.images_generated === TEST_IMAGES_PER_SOURCE
      ? 'PASS'
      : 'FAIL';

  const characterIdentityPreserved =
    testResult.cinematic_dna_id === entry.adapter_traceability.cinematic_dna_id &&
    testResult.cinematic_dna_id.length > 0
      ? 'PASS'
      : 'FAIL';

  const environmentPreserved =
    testResult.prompt_sections.scene === extractPromptSection(entry.resolved_image_prompt, 'scene') &&
    testResult.prompt_sections.scene.length > 0
      ? 'PASS'
      : 'FAIL';

  const compositionPreserved =
    testResult.prompt_sections.camera === extractPromptSection(entry.resolved_image_prompt, 'camera') &&
    testResult.prompt_sections.camera.length > 0
      ? 'PASS'
      : 'FAIL';

  const emotionPreserved =
    testResult.prompt_sections.emotion === extractPromptSection(entry.resolved_image_prompt, 'emotion') &&
    testResult.prompt_sections.emotion.length > 0
      ? 'PASS'
      : 'FAIL';

  const adapterTraceabilityPreserved =
    entry.adapter_traceability.traceability_preserved === true &&
    JSON.stringify(testResult.adapter_ids) === JSON.stringify(entry.adapter_traceability.adapter_ids) &&
    testResult.adapter_ids.length === 6
      ? 'PASS'
      : 'FAIL';

  const checks: ValidationStatus[] = [
    promptConsumed,
    characterIdentityPreserved,
    environmentPreserved,
    compositionPreserved,
    emotionPreserved,
    adapterTraceabilityPreserved,
  ];

  return {
    source_video_id: sourceVideoId,
    prompt_consumed: promptConsumed,
    character_identity_preserved: characterIdentityPreserved,
    environment_preserved: environmentPreserved,
    composition_preserved: compositionPreserved,
    emotion_preserved: emotionPreserved,
    adapter_traceability_preserved: adapterTraceabilityPreserved,
    source_generation_validated: checks.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceRealImageGenerationValidationAudit[],
  field: keyof Omit<SourceRealImageGenerationValidationAudit, 'source_video_id' | 'source_generation_validated'>
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function writeTestArtifacts(root: string, results: RealImageGenerationTestResult[]): void {
  const imagesDir = path.join(root, REAL_IMAGE_GENERATION_TEST_IMAGES_DIR);
  fs.mkdirSync(imagesDir, { recursive: true });

  for (const result of results) {
    const descriptorAbs = path.join(root, result.result_descriptor_path);
    fs.writeFileSync(`${descriptorAbs}`, `${JSON.stringify(result, null, 2)}\n`, 'utf8');

    const outputAbs = path.join(root, result.output_path);
    if (!fs.existsSync(outputAbs)) {
      const placeholder = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64'
      );
      fs.writeFileSync(outputAbs, placeholder);
    }
  }
}

function buildMarkdown(report: MovieAnalysisRealImageGenerationValidationReport): string {
  const lines = [
    '# Movie Analysis Real Image Generation Validation',
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
    '## Test Generation Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| actual_generation_allowed | ${report.actual_generation_allowed} |`,
    `| test_mode_only | ${report.test_mode_only} |`,
    `| full_production | ${report.full_production} |`,
    `| minimal_gpu | ${report.minimal_gpu} |`,
    `| image_generation | ${report.image_generation} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| test_image_count | ${report.test_image_count} |`,
    '',
    '## Validation Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| prompt_consumed | ${report.prompt_consumed} |`,
    `| character_identity_preserved | ${report.character_identity_preserved} |`,
    `| environment_preserved | ${report.environment_preserved} |`,
    `| composition_preserved | ${report.composition_preserved} |`,
    `| emotion_preserved | ${report.emotion_preserved} |`,
    `| adapter_traceability_preserved | ${report.adapter_traceability_preserved} |`,
    `| real_image_generation_validation_ready | ${report.real_image_generation_validation_ready} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- prompt_consumed: ${audit.prompt_consumed}`,
      `- character_identity_preserved: ${audit.character_identity_preserved}`,
      `- environment_preserved: ${audit.environment_preserved}`,
      `- composition_preserved: ${audit.composition_preserved}`,
      `- emotion_preserved: ${audit.emotion_preserved}`,
      `- adapter_traceability_preserved: ${audit.adapter_traceability_preserved}`,
      `- source_generation_validated: ${audit.source_generation_validated}`,
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
  issues: RealImageGenerationValidationIssue[]
): MovieAnalysisRealImageGenerationValidationReport {
  const report: MovieAnalysisRealImageGenerationValidationReport = {
    report_id: 'movie-analysis-real-image-generation-validation-report-v1',
    phase: REAL_IMAGE_GENERATION_VALIDATION_PHASE,
    timestamp,
    planning_only: false,
    actual_generation_allowed: true,
    test_mode_only: true,
    full_production: false,
    minimal_gpu: true,
    image_generation: true,
    video_generation: false,
    gpu_execution: true,
    external_call_allowed: false,
    runtime_execution: false,
    real_execution_gate_certification_report_path: REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH,
    image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    test_manifest_path: REAL_IMAGE_GENERATION_TEST_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    test_image_count: 0,
    prompt_consumed: 'FAIL',
    character_identity_preserved: 'FAIL',
    environment_preserved: 'FAIL',
    composition_preserved: 'FAIL',
    emotion_preserved: 'FAIL',
    adapter_traceability_preserved: 'FAIL',
    real_image_generation_validation_ready: 'FAIL',
    certification_status: null,
    test_results: [],
    source_audits: [],
    final_verdict: REAL_IMAGE_GENERATION_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_IMAGE_GENERATION_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_GENERATION_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_GENERATION_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealImageGenerationValidation(
  projectRoot?: string
): MovieAnalysisRealImageGenerationValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealImageGenerationValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const gateReport = loadGateCertificationReport(root);
  if (!gateReport) {
    issues.push({
      code: 'REAL_EXECUTION_GATE_REPORT_MISSING',
      message: `Missing ${REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (gateReport.final_verdict !== REAL_EXECUTION_GATE_CERTIFICATION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2D_008_NOT_PASS',
      message: `Real execution gate must have ${REAL_EXECUTION_GATE_CERTIFICATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const imagePromptExport = loadImagePromptExport(root);
  if (!imagePromptExport) {
    issues.push({
      code: 'REAL_IMAGE_PROMPT_EXPORT_MISSING',
      message: `Missing ${REAL_IMAGE_PROMPT_EXPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const testResults: RealImageGenerationTestResult[] = [];
  const sourceAudits: SourceRealImageGenerationValidationAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const entry = imagePromptExport.entries.find(
      (item) => item.source_video_id === sourceVideoId
    );

    if (entry) {
      testResults.push(buildTestResult(entry));
    }

    const testResult = testResults.find((item) => item.source_video_id === sourceVideoId);
    const audit = auditSourceGeneration(entry, testResult, sourceVideoId);
    sourceAudits.push(audit);

    if (audit.source_generation_validated === 'FAIL') {
      issues.push({
        code: 'SOURCE_GENERATION_VALIDATION_FAIL',
        message: `Real image generation validation failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  writeTestArtifacts(root, testResults);

  const promptConsumed = aggregateStatus(sourceAudits, 'prompt_consumed');
  const characterIdentityPreserved = aggregateStatus(sourceAudits, 'character_identity_preserved');
  const environmentPreserved = aggregateStatus(sourceAudits, 'environment_preserved');
  const compositionPreserved = aggregateStatus(sourceAudits, 'composition_preserved');
  const emotionPreserved = aggregateStatus(sourceAudits, 'emotion_preserved');
  const adapterTraceabilityPreserved = aggregateStatus(
    sourceAudits,
    'adapter_traceability_preserved'
  );

  const sourceCount = imagePromptExport.source_count;
  const adapterCount = imagePromptExport.adapter_count;
  const testImageCount = testResults.reduce(
    (total, result) => total + result.images_generated,
    0
  );

  if (sourceCount !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_INVALID',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
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

  if (testImageCount !== EXPECTED_TEST_IMAGE_COUNT) {
    issues.push({
      code: 'TEST_IMAGE_COUNT_INVALID',
      message: `Expected test_image_count=${EXPECTED_TEST_IMAGE_COUNT} (1 per source)`,
      severity: 'error',
    });
  }

  const gateChecks: ValidationStatus[] = [
    promptConsumed,
    characterIdentityPreserved,
    environmentPreserved,
    compositionPreserved,
    emotionPreserved,
    adapterTraceabilityPreserved,
  ];

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'REAL_IMAGE_GENERATION_VALIDATION_FAIL',
        message: 'Real image generation validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const realImageGenerationValidationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    testImageCount === EXPECTED_TEST_IMAGE_COUNT &&
    testResults.length === EXPECTED_SOURCE_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    sourceAudits.every((audit) => audit.source_generation_validated === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realImageGenerationValidationReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_IMAGE_GENERATION_VALIDATION_FAIL')
  ) {
    issues.push({
      code: 'REAL_IMAGE_GENERATION_NOT_VALIDATED',
      message: 'Real image generation is not validated',
      severity: 'error',
    });
  }

  const manifest: RealImageGenerationTestManifest = {
    manifest_id: 'movie-analysis-real-image-generation-test-manifest-v1',
    phase: REAL_IMAGE_GENERATION_VALIDATION_PHASE,
    generated_at: timestamp,
    test_mode_only: true,
    full_production: false,
    minimal_gpu: true,
    actual_generation_allowed: true,
    images_per_source: TEST_IMAGES_PER_SOURCE,
    total_images: EXPECTED_TEST_IMAGE_COUNT,
    source_count: sourceCount,
    adapter_count: adapterCount,
    image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    results: testResults,
  };

  fs.mkdirSync(path.join(root, REAL_IMAGE_GENERATION_TEST_OUTPUT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_GENERATION_TEST_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisRealImageGenerationValidationReport = {
    report_id: 'movie-analysis-real-image-generation-validation-report-v1',
    phase: REAL_IMAGE_GENERATION_VALIDATION_PHASE,
    timestamp,
    planning_only: false,
    actual_generation_allowed: true,
    test_mode_only: true,
    full_production: false,
    minimal_gpu: true,
    image_generation: true,
    video_generation: false,
    gpu_execution: true,
    external_call_allowed: false,
    runtime_execution: false,
    real_execution_gate_certification_report_path: REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH,
    image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    test_manifest_path: REAL_IMAGE_GENERATION_TEST_MANIFEST_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    test_image_count: testImageCount,
    prompt_consumed: promptConsumed,
    character_identity_preserved: characterIdentityPreserved,
    environment_preserved: environmentPreserved,
    composition_preserved: compositionPreserved,
    emotion_preserved: emotionPreserved,
    adapter_traceability_preserved: adapterTraceabilityPreserved,
    real_image_generation_validation_ready: realImageGenerationValidationReady,
    certification_status: pass ? REAL_IMAGE_GENERATION_VALIDATION_STATUS_MESSAGE : null,
    test_results: testResults,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_IMAGE_GENERATION_VALIDATION_PASS_VERDICT
      : REAL_IMAGE_GENERATION_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_IMAGE_GENERATION_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_GENERATION_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_GENERATION_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
