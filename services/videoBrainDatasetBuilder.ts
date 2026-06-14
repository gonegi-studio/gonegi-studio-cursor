import fs from 'node:fs';
import path from 'node:path';
import { resolveExportAssetPathOrThrow } from './projectRootResolver.js';
import {
  publishGovernedExport,
  VIDEO_APP_LATEST_DATASET_NAME,
  VIDEO_APP_LATEST_DATASET_PATH,
  VIDEO_APP_REPORTS_DIR,
  writeGovernedReport,
  type ExportValidationResult,
} from './exportGovernance.js';
import { buildVideoDatasetExport, type VideoDatasetExport } from './videoDatasetExport.js';
import { VIDEO_DATASET_EXPORT_JSON_PATH } from './videoDatasetExport.js';

export const VIDEO_BRAIN_DATASET_VERSION = '106A' as const;
export const VIDEO_BRAIN_DATASET_TYPE = 'video_brain_dataset' as const;
export const VIDEO_BRAIN_DATASET_REPORT_NAME = 'video-brain-dataset-report.json' as const;

export const VIDEO_BRAIN_APP_TARGETS = Object.freeze(['Video App', 'Music Drama Studio'] as const);

const CONTINUITY_SOURCES = Object.freeze({
  character: 'exports/character-continuity-preview.json',
  location: 'exports/location-continuity-preview.json',
  world: 'exports/world-continuity-preview.json',
} as const);

const RUNTIME_FINGERPRINT_SOURCES = Object.freeze([
  'exports/runtime-assembly-fingerprint.json',
  'exports/runtime-contract-fingerprint.json',
  'exports/runtime-output-contract-fingerprint.json',
  'exports/runtime-resolver-contract-fingerprint.json',
  'exports/runtime-selection-rule-fingerprint.json',
  'exports/runtime-library-cross-link-fingerprint.json',
  'exports/shot-fingerprint-contract-fingerprint.json',
  'exports/transition-dna-contract-fingerprint.json',
] as const);

export type VideoBrainDataset = {
  dataset_type: typeof VIDEO_BRAIN_DATASET_TYPE;
  dataset_version: typeof VIDEO_BRAIN_DATASET_VERSION;
  app_targets: typeof VIDEO_BRAIN_APP_TARGETS;
  temporal: {
    video_dataset: VideoDatasetExport;
  };
  continuity: {
    character: unknown;
    location: unknown;
    world: unknown;
  };
  runtime: {
    fingerprints: Record<string, unknown>;
  };
};

function loadJsonFile(projectRoot: string, relativePath: string): unknown {
  const filePath = resolveExportAssetPathOrThrow(relativePath, projectRoot);
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
}

function loadOptionalJsonFile(projectRoot: string, relativePath: string): unknown | null {
  try {
    return loadJsonFile(projectRoot, relativePath);
  } catch {
    return null;
  }
}

function loadVideoDataset(projectRoot: string): VideoDatasetExport {
  const existing = loadOptionalJsonFile(projectRoot, VIDEO_DATASET_EXPORT_JSON_PATH);
  if (existing !== null) {
    return existing as VideoDatasetExport;
  }
  return buildVideoDatasetExport(new Date().toISOString());
}

export function buildVideoBrainDataset(projectRoot: string): VideoBrainDataset {
  const fingerprints: Record<string, unknown> = {};
  for (const relativePath of RUNTIME_FINGERPRINT_SOURCES) {
    const fileName = path.basename(relativePath, '.json');
    const payload = loadOptionalJsonFile(projectRoot, relativePath);
    if (payload !== null) {
      fingerprints[fileName] = payload;
    }
  }

  return Object.freeze({
    dataset_type: VIDEO_BRAIN_DATASET_TYPE,
    dataset_version: VIDEO_BRAIN_DATASET_VERSION,
    app_targets: VIDEO_BRAIN_APP_TARGETS,
    temporal: Object.freeze({
      video_dataset: loadVideoDataset(projectRoot),
    }),
    continuity: Object.freeze({
      character: loadJsonFile(projectRoot, CONTINUITY_SOURCES.character),
      location: loadJsonFile(projectRoot, CONTINUITY_SOURCES.location),
      world: loadJsonFile(projectRoot, CONTINUITY_SOURCES.world),
    }),
    runtime: Object.freeze({
      fingerprints: Object.freeze(fingerprints),
    }),
  });
}

export function writeVideoBrainDataset(projectRoot: string): {
  dataset: VideoBrainDataset;
  validation: ExportValidationResult;
} {
  const dataset = buildVideoBrainDataset(projectRoot);
  const validation = publishGovernedExport({
    projectRoot,
    relativePath: VIDEO_APP_LATEST_DATASET_PATH,
    datasetName: VIDEO_APP_LATEST_DATASET_NAME,
    datasetVersion: VIDEO_BRAIN_DATASET_VERSION,
    datasetType: VIDEO_BRAIN_DATASET_TYPE,
    content: dataset,
  });
  return { dataset, validation };
}

export function writeVideoBrainDatasetReport(
  projectRoot: string,
  report: unknown
): string {
  return writeGovernedReport(projectRoot, VIDEO_APP_REPORTS_DIR, VIDEO_BRAIN_DATASET_REPORT_NAME, report);
}
