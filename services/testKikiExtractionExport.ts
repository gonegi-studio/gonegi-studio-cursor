import fs from 'node:fs';
import path from 'node:path';
import { assembleTestKikiFrameGrammar } from './testKikiFrameGrammarAssembler.js';
import {
  auditTestKikiExtractionDocument,
  type TestKikiExtractionReport,
} from './testKikiExtractionAudit.js';
import { extractTestKikiFrames } from './testKikiFrameExtraction.js';
import { aggregateTestKikiGlobalPatterns } from './testKikiGlobalPatternAggregator.js';
import {
  TEST_KIKI_EXTRACTION_JSON_PATH,
  TEST_KIKI_EXTRACTION_REPORT_PATH,
  TEST_KIKI_EXTRACTION_SCHEMA_VERSION,
  TEST_KIKI_VIDEO_ID,
  type TestKikiExtractionDocument,
} from './testKikiExtractionSchema.js';
import { buildTestKikiSourceMetadata } from './testKikiVideoIntake.js';

export function buildTestKikiExtractionDocument(projectRoot: string): {
  document: TestKikiExtractionDocument;
  extractionStatus: TestKikiExtractionReport['extraction_status'];
} {
  const source = buildTestKikiSourceMetadata(projectRoot);
  let extractionStatus: TestKikiExtractionReport['extraction_status'] = 'not-run';
  let frames;

  try {
    const extraction = extractTestKikiFrames(projectRoot);
    extractionStatus = extraction.extractionStatus;
    frames = assembleTestKikiFrameGrammar(source, extraction.frames);
  } catch {
    extractionStatus = 'extraction-failed';
    frames = Object.freeze([]);
  }

  const globalPatterns =
    frames.length > 0 ? aggregateTestKikiGlobalPatterns(frames) : Object.freeze({
      dominant_camera_language: 'unknown-unknown',
      dominant_acting_language: 'unknown-unknown',
      dominant_daily_life_language: 'unknown-unknown',
      dominant_space_language: 'unknown-unknown',
    });

  const preliminary: TestKikiExtractionDocument = Object.freeze({
    schema_version: TEST_KIKI_EXTRACTION_SCHEMA_VERSION,
    video_id: TEST_KIKI_VIDEO_ID,
    source,
    frames,
    global_patterns: globalPatterns,
    audit_result: 'FAIL',
    audit_codes: Object.freeze([]),
    weight_profile: Object.freeze({
      camera: 0.3,
      acting: 0.25,
      daily_life: 0.2,
      location: 0.15,
      emotion: 0.05,
      story: 0.05,
    }),
  });

  const report = auditTestKikiExtractionDocument(preliminary, extractionStatus);
  const document: TestKikiExtractionDocument = Object.freeze({
    ...preliminary,
    audit_result: report.auditResult,
    audit_codes: report.audit_codes,
  });

  return Object.freeze({ document, extractionStatus });
}

export function writeTestKikiExtractionExports(projectRoot: string): {
  document: TestKikiExtractionDocument;
  report: TestKikiExtractionReport;
} {
  const { document, extractionStatus } = buildTestKikiExtractionDocument(projectRoot);
  const report = auditTestKikiExtractionDocument(document, extractionStatus);

  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, TEST_KIKI_EXTRACTION_JSON_PATH),
    `${JSON.stringify(document, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(projectRoot, TEST_KIKI_EXTRACTION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return Object.freeze({ document, report });
}

export function runTestKikiExtractionAudit(projectRoot: string): TestKikiExtractionReport {
  return writeTestKikiExtractionExports(projectRoot).report;
}
