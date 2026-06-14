import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  TEST_KIKI_EXTRACTION_JSON_PATH,
  TEST_KIKI_VIDEO_ID,
  type TestKikiActingGrammar,
  type TestKikiCameraGrammar,
  type TestKikiDailyLifeGrammar,
  type TestKikiExtractionDocument,
  type TestKikiGlobalPatterns,
  type TestKikiLocationGrammar,
} from './testKikiExtractionSchema.js';
import { TEST_KIKI_EXTRACTION_QUALITY_REPORT_PATH } from './testKikiExtractionQualityAudit.js';

export const TEST_KIKI_BRAIN_DATASET_PACKAGE_PATH =
  'exports/test-kiki-brain-dataset-package.json' as const;
export const TEST_KIKI_BRAIN_DATASET_REPORT_PATH =
  'exports/test-kiki-brain-dataset-report.json' as const;

export const TEST_KIKI_BRAIN_DATASET_TYPE = 'brain_dataset' as const;
export const TEST_KIKI_BRAIN_DATASET_VERSION = '101F' as const;

export const TEST_KIKI_BRAIN_APP_INGESTION_TARGETS = Object.freeze([
  'Story Engine',
  'Scene Generator',
  'Image Planning Layer',
] as const);

export type TestKikiBrainGrammarPattern<T> = T & {
  pattern_id: string;
};

export type TestKikiBrainDatasetPackage = {
  dataset_type: typeof TEST_KIKI_BRAIN_DATASET_TYPE;
  dataset_version: typeof TEST_KIKI_BRAIN_DATASET_VERSION;
  source: typeof TEST_KIKI_VIDEO_ID;
  source_schema_version: TestKikiExtractionDocument['schema_version'];
  source_fingerprint: string;
  quality_audit_result: 'PASS' | 'FAIL' | 'MISSING';
  app_ingestion_targets: typeof TEST_KIKI_BRAIN_APP_INGESTION_TARGETS;
  camera_grammar_library: readonly TestKikiBrainGrammarPattern<TestKikiCameraGrammar>[];
  acting_grammar_library: readonly TestKikiBrainGrammarPattern<TestKikiActingGrammar>[];
  daily_life_grammar_library: readonly TestKikiBrainGrammarPattern<TestKikiDailyLifeGrammar>[];
  location_grammar_library: readonly TestKikiBrainGrammarPattern<TestKikiLocationGrammar>[];
  global_patterns: TestKikiGlobalPatterns;
  grammar_pattern_counts: {
    camera: number;
    acting: number;
    daily_life: number;
    location: number;
  };
};

function digestPattern(prefix: string, value: Record<string, string>): string {
  const ordered = Object.keys(value)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `${key}=${value[key]}`)
    .join('|');
  return `${prefix}-${crypto.createHash('sha256').update(ordered).digest('hex').slice(0, 12)}`;
}

function dedupeGrammarPatterns<T extends Record<string, string>>(
  prefix: string,
  patterns: readonly T[]
): readonly TestKikiBrainGrammarPattern<T>[] {
  const grouped = new Map<string, T>();

  for (const pattern of patterns) {
    const patternId = digestPattern(prefix, pattern);
    if (!grouped.has(patternId)) {
      grouped.set(patternId, pattern);
    }
  }

  return Object.freeze(
    [...grouped.entries()]
      .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
      .map(([patternId, pattern]) =>
        Object.freeze({
          pattern_id: patternId,
          ...pattern,
        })
      )
  );
}

function loadExtractionDocument(projectRoot: string): TestKikiExtractionDocument {
  const extractionPath = path.join(projectRoot, TEST_KIKI_EXTRACTION_JSON_PATH);
  if (!fs.existsSync(extractionPath)) {
    throw new Error(`Missing extraction export at ${TEST_KIKI_EXTRACTION_JSON_PATH}`);
  }
  return JSON.parse(fs.readFileSync(extractionPath, 'utf8')) as TestKikiExtractionDocument;
}

function loadQualityAuditResult(projectRoot: string): 'PASS' | 'FAIL' | 'MISSING' {
  const reportPath = path.join(projectRoot, TEST_KIKI_EXTRACTION_QUALITY_REPORT_PATH);
  if (!fs.existsSync(reportPath)) {
    return 'MISSING';
  }
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as {
    auditResult?: string;
    app_ingestion_ready?: boolean;
  };
  if (report.auditResult === 'PASS' && report.app_ingestion_ready === true) {
    return 'PASS';
  }
  if (report.auditResult === 'FAIL') {
    return 'FAIL';
  }
  return 'MISSING';
}

export function buildTestKikiBrainDatasetPackage(projectRoot: string): TestKikiBrainDatasetPackage {
  const extraction = loadExtractionDocument(projectRoot);
  const qualityAuditResult = loadQualityAuditResult(projectRoot);

  const cameraPatterns = dedupeGrammarPatterns(
    'camera',
    extraction.frames.map((frame) => frame.camera)
  );
  const actingPatterns = dedupeGrammarPatterns(
    'acting',
    extraction.frames.map((frame) => frame.acting)
  );
  const dailyLifePatterns = dedupeGrammarPatterns(
    'daily-life',
    extraction.frames.map((frame) => frame.daily_life)
  );
  const locationPatterns = dedupeGrammarPatterns(
    'location',
    extraction.frames.map((frame) => frame.location)
  );

  return Object.freeze({
    dataset_type: TEST_KIKI_BRAIN_DATASET_TYPE,
    dataset_version: TEST_KIKI_BRAIN_DATASET_VERSION,
    source: TEST_KIKI_VIDEO_ID,
    source_schema_version: extraction.schema_version,
    source_fingerprint: extraction.source.source_fingerprint,
    quality_audit_result: qualityAuditResult,
    app_ingestion_targets: TEST_KIKI_BRAIN_APP_INGESTION_TARGETS,
    camera_grammar_library: cameraPatterns,
    acting_grammar_library: actingPatterns,
    daily_life_grammar_library: dailyLifePatterns,
    location_grammar_library: locationPatterns,
    global_patterns: extraction.global_patterns,
    grammar_pattern_counts: Object.freeze({
      camera: cameraPatterns.length,
      acting: actingPatterns.length,
      daily_life: dailyLifePatterns.length,
      location: locationPatterns.length,
    }),
  });
}

export function writeTestKikiBrainDatasetPackage(projectRoot: string): TestKikiBrainDatasetPackage {
  const packageDoc = buildTestKikiBrainDatasetPackage(projectRoot);
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, TEST_KIKI_BRAIN_DATASET_PACKAGE_PATH),
    `${JSON.stringify(packageDoc)}\n`,
    'utf8'
  );
  return packageDoc;
}
