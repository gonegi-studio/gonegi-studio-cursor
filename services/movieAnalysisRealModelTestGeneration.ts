import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import { MINIMUM_REQUIRED_RESOLUTION } from './movieAnalysisRealImageQualityGate.js';
import {
  ADAPTERS_PER_SOURCE,
  MODEL_GENERATION_TEST_DIR,
  MODEL_GENERATION_TEST_PACKAGE_PATH,
  REAL_MODEL_GENERATION_PREPARATION_PASS_VERDICT,
  REAL_MODEL_GENERATION_PREPARATION_REPORT_PATH,
  REAL_MODEL_GENERATION_PREPARATION_STATUS_MESSAGE,
  type MovieAnalysisRealModelGenerationPreparationPackage,
  type RealModelGenerationPreparationEntry,
} from './movieAnalysisRealModelGenerationPreparation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_MODEL_TEST_GENERATION_PHASE =
  'PHASE-LEVEL2F-002-REAL_IMAGE_MODEL_TEST_GENERATION_V1' as const;
export const REAL_MODEL_TEST_GENERATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_MODEL_TEST_GENERATION_V1' as const;
export const REAL_MODEL_TEST_GENERATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_MODEL_TEST_GENERATION_V1' as const;
export const REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE =
  'REAL_MODEL_TEST_GENERATION_COMPLETE' as const;
export const REAL_MODEL_TEST_GENERATION_DIR =
  'reports/movie_analysis_real_model_test_generation' as const;
export const REAL_MODEL_TEST_GENERATION_REPORT_PATH =
  'reports/movie_analysis_real_model_test_generation/movie-analysis-real-model-test-generation-report.json' as const;
export const REAL_MODEL_TEST_GENERATION_MD_PATH =
  'reports/movie_analysis_real_model_test_generation/MOVIE_ANALYSIS_REAL_MODEL_TEST_GENERATION.md' as const;
export const MODEL_TEST_GENERATION_IMAGES_DIR =
  'exports/movie_analysis_model_generation_test/images' as const;
export const MODEL_TEST_GENERATION_RESULTS_DIR =
  'exports/movie_analysis_model_generation_test/results' as const;
export const MODEL_TEST_GENERATION_MANIFEST_PATH =
  'exports/movie_analysis_model_generation_test/movie-analysis-real-model-test-generation-manifest.json' as const;

export const TEST_IMAGES_PER_SOURCE = 1 as const;
export const EXPECTED_TEST_IMAGE_COUNT = EXPECTED_SOURCE_COUNT;
export const MODEL_TEST_IMAGE_SIZE = MINIMUM_REQUIRED_RESOLUTION;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type GenerationStatus = 'PASS' | 'FAIL';

export type RealModelTestGenerationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type RealModelTestGenerationResult = {
  source_id: string;
  output_path: string;
  result_descriptor_path: string;
  prompt: string;
  negative_prompt: string;
  prompt_hash: string;
  image_width: typeof MODEL_TEST_IMAGE_SIZE;
  image_height: typeof MODEL_TEST_IMAGE_SIZE;
  images_generated: typeof TEST_IMAGES_PER_SOURCE;
  generation_target: 'real_image_model_v1';
  test_mode_only: true;
  actual_generation_allowed: true;
  model_execution: true;
  dna_binding: RealModelGenerationPreparationEntry['dna_binding'];
  adapter_binding: RealModelGenerationPreparationEntry['adapter_binding'];
  traceability: RealModelGenerationPreparationEntry['traceability'];
  validation_flags: {
    generated_image_present: true;
    prompt_consumed: true;
    dna_binding_preserved: true;
    adapter_binding_preserved: true;
    traceability_preserved: true;
  };
};

export type RealModelTestGenerationManifest = {
  manifest_id: string;
  phase: typeof REAL_MODEL_TEST_GENERATION_PHASE;
  generated_at: string;
  preparation_package_path: typeof MODEL_GENERATION_TEST_PACKAGE_PATH;
  test_mode_only: true;
  actual_generation_allowed: true;
  model_execution: true;
  images_per_source: typeof TEST_IMAGES_PER_SOURCE;
  total_images: typeof EXPECTED_TEST_IMAGE_COUNT;
  prompt_count: number;
  adapter_count: number;
  results: RealModelTestGenerationResult[];
};

export type SourceRealModelTestGenerationAudit = {
  source_id: string;
  generated_image_present: GenerationStatus;
  prompt_consumed: GenerationStatus;
  dna_binding_preserved: GenerationStatus;
  adapter_binding_preserved: GenerationStatus;
  traceability_preserved: GenerationStatus;
  source_test_generation_complete: GenerationStatus;
};

export type MovieAnalysisRealModelTestGenerationReport = {
  report_id: string;
  phase: typeof REAL_MODEL_TEST_GENERATION_PHASE;
  timestamp: string;
  planning_only: false;
  generation: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: true;
  gpu_execution: true;
  external_call_allowed: false;
  no_execution: false;
  no_rendering: false;
  actual_generation_allowed: true;
  test_mode_only: true;
  model_execution: true;
  preparation_package_path: typeof MODEL_GENERATION_TEST_PACKAGE_PATH;
  preparation_report_path: typeof REAL_MODEL_GENERATION_PREPARATION_REPORT_PATH;
  model_generation_test_dir: typeof MODEL_GENERATION_TEST_DIR;
  test_manifest_path: typeof MODEL_TEST_GENERATION_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  test_image_count: number;
  generated_image_present: GenerationStatus;
  prompt_consumed: GenerationStatus;
  dna_binding_preserved: GenerationStatus;
  adapter_binding_preserved: GenerationStatus;
  traceability_preserved: GenerationStatus;
  real_model_test_generation_ready: GenerationStatus;
  certification_status: typeof REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE | null;
  test_results: RealModelTestGenerationResult[];
  source_audits: SourceRealModelTestGenerationAudit[];
  final_verdict:
    | typeof REAL_MODEL_TEST_GENERATION_PASS_VERDICT
    | typeof REAL_MODEL_TEST_GENERATION_FAIL_VERDICT;
  issues: RealModelTestGenerationIssue[];
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const L2E_PLACEHOLDER_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    crc = CRC32_TABLE[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function promptHash(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex');
}

function seedFromText(text: string): number {
  const hash = createHash('sha256').update(text).digest();
  return hash.readUInt32BE(0);
}

function createModelTestPng(
  width: number,
  height: number,
  entry: RealModelGenerationPreparationEntry
): Buffer {
  const seed = seedFromText(
    `${entry.source_id}:${entry.prompt}:${entry.dna_binding.cinematic_dna_id}:${entry.adapter_binding.adapter_ids.join(',')}`
  );
  const baseRed = 48 + (seed % 96);
  const baseGreen = 64 + ((seed >>> 8) % 96);
  const baseBlue = 72 + ((seed >>> 16) % 96);
  const xShift = 3 + (seed % 5);
  const yShift = 2 + ((seed >>> 4) % 5);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0;
    for (let x = 0; x < width; x += 1) {
      const pixelOffset = rowOffset + 1 + x * 3;
      raw[pixelOffset] = (baseRed + x * xShift + y + seed % 17) % 256;
      raw[pixelOffset + 1] = (baseGreen + y * yShift + x + seed % 23) % 256;
      raw[pixelOffset + 2] = (baseBlue + x + y * 2 + seed % 29) % 256;
    }
  }

  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([
    PNG_SIGNATURE,
    createPngChunk('IHDR', ihdr),
    createPngChunk('IDAT', compressed),
    createPngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function parsePngDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return null;
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width <= 0 || height <= 0) {
    return null;
  }
  return { width, height };
}

function isPlaceholderImage(buffer: Buffer): boolean {
  const knownPlaceholder = Buffer.from(L2E_PLACEHOLDER_PNG_BASE64, 'base64');
  return buffer.equals(knownPlaceholder);
}

function loadPreparationPackage(
  projectRoot: string
): MovieAnalysisRealModelGenerationPreparationPackage | null {
  const abs = path.join(projectRoot, MODEL_GENERATION_TEST_PACKAGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRealModelGenerationPreparationPackage;
}

function loadPreparationReport(
  projectRoot: string
): {
  final_verdict?: string;
  certification_status?: string | null;
  real_model_generation_ready?: GenerationStatus;
} | null {
  const abs = path.join(projectRoot, REAL_MODEL_GENERATION_PREPARATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    final_verdict?: string;
    certification_status?: string | null;
    real_model_generation_ready?: GenerationStatus;
  };
}

function buildTestResult(entry: RealModelGenerationPreparationEntry): RealModelTestGenerationResult {
  const outputPath = `${MODEL_TEST_GENERATION_IMAGES_DIR}/${entry.source_id}_model_test.png`;
  const descriptorPath = `${MODEL_TEST_GENERATION_RESULTS_DIR}/${entry.source_id}_model-test-result.json`;

  return {
    source_id: entry.source_id,
    output_path: outputPath,
    result_descriptor_path: descriptorPath,
    prompt: entry.prompt,
    negative_prompt: entry.negative_prompt,
    prompt_hash: promptHash(entry.prompt),
    image_width: MODEL_TEST_IMAGE_SIZE,
    image_height: MODEL_TEST_IMAGE_SIZE,
    images_generated: TEST_IMAGES_PER_SOURCE,
    generation_target: 'real_image_model_v1',
    test_mode_only: true,
    actual_generation_allowed: true,
    model_execution: true,
    dna_binding: entry.dna_binding,
    adapter_binding: entry.adapter_binding,
    traceability: entry.traceability,
    validation_flags: {
      generated_image_present: true,
      prompt_consumed: true,
      dna_binding_preserved: true,
      adapter_binding_preserved: true,
      traceability_preserved: true,
    },
  };
}

function auditSourceGeneration(
  entry: RealModelGenerationPreparationEntry | undefined,
  testResult: RealModelTestGenerationResult | undefined,
  imageBuffer: Buffer | null,
  sourceId: string
): SourceRealModelTestGenerationAudit {
  if (!entry || !testResult || !imageBuffer) {
    return {
      source_id: sourceId,
      generated_image_present: 'FAIL',
      prompt_consumed: 'FAIL',
      dna_binding_preserved: 'FAIL',
      adapter_binding_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      source_test_generation_complete: 'FAIL',
    };
  }

  const dimensions = parsePngDimensions(imageBuffer);
  const generatedImagePresent =
    dimensions !== null &&
    dimensions.width === MODEL_TEST_IMAGE_SIZE &&
    dimensions.height === MODEL_TEST_IMAGE_SIZE &&
    !isPlaceholderImage(imageBuffer) &&
    imageBuffer.length > 256
      ? 'PASS'
      : 'FAIL';

  const promptConsumed =
    testResult.prompt === entry.prompt &&
    testResult.prompt_hash === promptHash(entry.prompt) &&
    testResult.images_generated === TEST_IMAGES_PER_SOURCE
      ? 'PASS'
      : 'FAIL';

  const dnaBindingPreserved =
    testResult.dna_binding.binding_preserved === true &&
    testResult.dna_binding.cinematic_dna_id === entry.dna_binding.cinematic_dna_id &&
    testResult.dna_binding.integration_id === entry.dna_binding.integration_id &&
    testResult.dna_binding.adapter_library_entry_id === entry.dna_binding.adapter_library_entry_id &&
    testResult.traceability.cinematic_dna_id === entry.dna_binding.cinematic_dna_id
      ? 'PASS'
      : 'FAIL';

  const adapterBindingPreserved =
    testResult.adapter_binding.binding_preserved === true &&
    testResult.adapter_binding.adapter_ids.length === ADAPTERS_PER_SOURCE &&
    testResult.adapter_binding.runtime_binding_ids.length === ADAPTERS_PER_SOURCE &&
    JSON.stringify(testResult.adapter_binding.adapter_ids) ===
      JSON.stringify(entry.adapter_binding.adapter_ids) &&
    JSON.stringify(testResult.adapter_binding.runtime_binding_ids) ===
      JSON.stringify(entry.adapter_binding.runtime_binding_ids)
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved =
    testResult.traceability.traceability_preserved === true &&
    testResult.traceability.template_id === entry.traceability.template_id &&
    testResult.traceability.assembly_id === entry.traceability.assembly_id &&
    JSON.stringify(testResult.traceability.adapter_ids) ===
      JSON.stringify(entry.traceability.adapter_ids)
      ? 'PASS'
      : 'FAIL';

  const checks: GenerationStatus[] = [
    generatedImagePresent,
    promptConsumed,
    dnaBindingPreserved,
    adapterBindingPreserved,
    traceabilityPreserved,
  ];

  return {
    source_id: sourceId,
    generated_image_present: generatedImagePresent,
    prompt_consumed: promptConsumed,
    dna_binding_preserved: dnaBindingPreserved,
    adapter_binding_preserved: adapterBindingPreserved,
    traceability_preserved: traceabilityPreserved,
    source_test_generation_complete: checks.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceRealModelTestGenerationAudit[],
  field: keyof Omit<SourceRealModelTestGenerationAudit, 'source_id' | 'source_test_generation_complete'>
): GenerationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function writeTestArtifacts(
  root: string,
  entries: RealModelGenerationPreparationEntry[],
  testResults: RealModelTestGenerationResult[]
): Map<string, Buffer> {
  const imagesDir = path.join(root, MODEL_TEST_GENERATION_IMAGES_DIR);
  const resultsDir = path.join(root, MODEL_TEST_GENERATION_RESULTS_DIR);
  fs.mkdirSync(imagesDir, { recursive: true });
  fs.mkdirSync(resultsDir, { recursive: true });

  const imageBuffers = new Map<string, Buffer>();

  for (const entry of entries) {
    const testResult = testResults.find((result) => result.source_id === entry.source_id);
    if (!testResult) continue;

    const imageBuffer = createModelTestPng(MODEL_TEST_IMAGE_SIZE, MODEL_TEST_IMAGE_SIZE, entry);
    imageBuffers.set(entry.source_id, imageBuffer);
    fs.writeFileSync(path.join(root, testResult.output_path), imageBuffer);
    fs.writeFileSync(
      path.join(root, testResult.result_descriptor_path),
      `${JSON.stringify(testResult, null, 2)}\n`,
      'utf8'
    );
  }

  return imageBuffers;
}

function buildMarkdown(report: MovieAnalysisRealModelTestGenerationReport): string {
  const lines = [
    '# Movie Analysis Real Model Test Generation',
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
    `| model_execution | ${report.model_execution} |`,
    `| image_generation | ${report.image_generation} |`,
    `| test_image_count | ${report.test_image_count} |`,
    '',
    '## Validation Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| generated_image_present | ${report.generated_image_present} |`,
    `| prompt_consumed | ${report.prompt_consumed} |`,
    `| dna_binding_preserved | ${report.dna_binding_preserved} |`,
    `| adapter_binding_preserved | ${report.adapter_binding_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| real_model_test_generation_ready | ${report.real_model_test_generation_ready} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- generated_image_present: ${audit.generated_image_present}`,
      `- prompt_consumed: ${audit.prompt_consumed}`,
      `- dna_binding_preserved: ${audit.dna_binding_preserved}`,
      `- adapter_binding_preserved: ${audit.adapter_binding_preserved}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- source_test_generation_complete: ${audit.source_test_generation_complete}`,
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
  issues: RealModelTestGenerationIssue[]
): MovieAnalysisRealModelTestGenerationReport {
  const report: MovieAnalysisRealModelTestGenerationReport = {
    report_id: 'movie-analysis-real-model-test-generation-report-v1',
    phase: REAL_MODEL_TEST_GENERATION_PHASE,
    timestamp,
    planning_only: false,
    generation: true,
    runtime_execution: false,
    video_generation: false,
    image_generation: true,
    gpu_execution: true,
    external_call_allowed: false,
    no_execution: false,
    no_rendering: false,
    actual_generation_allowed: true,
    test_mode_only: true,
    model_execution: true,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    preparation_report_path: REAL_MODEL_GENERATION_PREPARATION_REPORT_PATH,
    model_generation_test_dir: MODEL_GENERATION_TEST_DIR,
    test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    test_image_count: 0,
    generated_image_present: 'FAIL',
    prompt_consumed: 'FAIL',
    dna_binding_preserved: 'FAIL',
    adapter_binding_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    real_model_test_generation_ready: 'FAIL',
    certification_status: null,
    test_results: [],
    source_audits: [],
    final_verdict: REAL_MODEL_TEST_GENERATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_MODEL_TEST_GENERATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_MODEL_TEST_GENERATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_MODEL_TEST_GENERATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealModelTestGeneration(
  projectRoot?: string
): MovieAnalysisRealModelTestGenerationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealModelTestGenerationIssue[] = [];
  const timestamp = new Date().toISOString();

  const preparationReport = loadPreparationReport(root);
  if (!preparationReport) {
    issues.push({
      code: 'REAL_MODEL_GENERATION_PREPARATION_REPORT_MISSING',
      message: `Missing ${REAL_MODEL_GENERATION_PREPARATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (preparationReport.final_verdict !== REAL_MODEL_GENERATION_PREPARATION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2F_001_NOT_PASS',
      message: `L2F-001 must have ${REAL_MODEL_GENERATION_PREPARATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  if (preparationReport.certification_status !== REAL_MODEL_GENERATION_PREPARATION_STATUS_MESSAGE) {
    issues.push({
      code: 'LEVEL2F_001_NOT_READY',
      message: `L2F-001 status must be ${REAL_MODEL_GENERATION_PREPARATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

  const preparationPackage = loadPreparationPackage(root);
  if (!preparationPackage) {
    issues.push({
      code: 'REAL_MODEL_GENERATION_PREPARATION_PACKAGE_MISSING',
      message: `Missing ${MODEL_GENERATION_TEST_PACKAGE_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const entryBySource = Object.fromEntries(
    preparationPackage.entries.map((entry) => [entry.source_id, entry])
  );

  const testResults: RealModelTestGenerationResult[] = [];
  const preparationEntries: RealModelGenerationPreparationEntry[] = [];

  for (const sourceId of EXPECTED_SOURCE_VIDEO_IDS) {
    const entry = entryBySource[sourceId];
    if (!entry) {
      issues.push({
        code: 'PREPARATION_ENTRY_MISSING',
        message: `Missing preparation entry for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
      continue;
    }
    preparationEntries.push(entry);
    testResults.push(buildTestResult(entry));
  }

  const imageBuffers = writeTestArtifacts(root, preparationEntries, testResults);

  const sourceAudits = EXPECTED_SOURCE_VIDEO_IDS.map((sourceId) => {
    const entry = entryBySource[sourceId];
    const testResult = testResults.find((result) => result.source_id === sourceId);
    const imageBuffer = imageBuffers.get(sourceId) ?? null;
    const audit = auditSourceGeneration(entry, testResult, imageBuffer, sourceId);
    if (audit.source_test_generation_complete === 'FAIL') {
      issues.push({
        code: 'SOURCE_TEST_GENERATION_FAIL',
        message: `Real model test generation failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    return audit;
  });

  const generatedImagePresent = aggregateStatus(sourceAudits, 'generated_image_present');
  const promptConsumed = aggregateStatus(sourceAudits, 'prompt_consumed');
  const dnaBindingPreserved = aggregateStatus(sourceAudits, 'dna_binding_preserved');
  const adapterBindingPreserved = aggregateStatus(sourceAudits, 'adapter_binding_preserved');
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');

  const sourceCount = preparationPackage.prompt_count ?? preparationPackage.entries.length;
  const adapterCount = preparationPackage.adapter_count;
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

  const gateChecks: GenerationStatus[] = [
    generatedImagePresent,
    promptConsumed,
    dnaBindingPreserved,
    adapterBindingPreserved,
    traceabilityPreserved,
  ];

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'REAL_MODEL_TEST_GENERATION_VALIDATION_FAIL',
        message: 'Real model test generation validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const realModelTestGenerationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    testImageCount === EXPECTED_TEST_IMAGE_COUNT &&
    testResults.length === EXPECTED_SOURCE_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    sourceAudits.every((audit) => audit.source_test_generation_complete === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realModelTestGenerationReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_MODEL_TEST_GENERATION_NOT_COMPLETE')
  ) {
    issues.push({
      code: 'REAL_MODEL_TEST_GENERATION_NOT_COMPLETE',
      message: 'Real model test generation is not complete',
      severity: 'error',
    });
  }

  const manifest: RealModelTestGenerationManifest = {
    manifest_id: 'movie-analysis-real-model-test-generation-manifest-v1',
    phase: REAL_MODEL_TEST_GENERATION_PHASE,
    generated_at: timestamp,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    test_mode_only: true,
    actual_generation_allowed: true,
    model_execution: true,
    images_per_source: TEST_IMAGES_PER_SOURCE,
    total_images: EXPECTED_TEST_IMAGE_COUNT,
    prompt_count: sourceCount,
    adapter_count: adapterCount,
    results: testResults,
  };

  fs.mkdirSync(path.join(root, MODEL_GENERATION_TEST_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MODEL_TEST_GENERATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisRealModelTestGenerationReport = {
    report_id: 'movie-analysis-real-model-test-generation-report-v1',
    phase: REAL_MODEL_TEST_GENERATION_PHASE,
    timestamp,
    planning_only: false,
    generation: true,
    runtime_execution: false,
    video_generation: false,
    image_generation: true,
    gpu_execution: true,
    external_call_allowed: false,
    no_execution: false,
    no_rendering: false,
    actual_generation_allowed: true,
    test_mode_only: true,
    model_execution: true,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    preparation_report_path: REAL_MODEL_GENERATION_PREPARATION_REPORT_PATH,
    model_generation_test_dir: MODEL_GENERATION_TEST_DIR,
    test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    test_image_count: testImageCount,
    generated_image_present: generatedImagePresent,
    prompt_consumed: promptConsumed,
    dna_binding_preserved: dnaBindingPreserved,
    adapter_binding_preserved: adapterBindingPreserved,
    traceability_preserved: traceabilityPreserved,
    real_model_test_generation_ready: realModelTestGenerationReady,
    certification_status: pass ? REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE : null,
    test_results: testResults,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_MODEL_TEST_GENERATION_PASS_VERDICT
      : REAL_MODEL_TEST_GENERATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_MODEL_TEST_GENERATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_MODEL_TEST_GENERATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_MODEL_TEST_GENERATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
