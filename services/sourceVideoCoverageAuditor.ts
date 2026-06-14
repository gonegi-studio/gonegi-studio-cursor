import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import { GHIBLI_01_DURATION_SECONDS, GHIBLI_01_VIDEO_ID } from './ghibli01GrammarCatalog.js';
import { MORI_SOURCE_IDS } from './moriGrammarCatalog.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  TEST_KIKI_DURATION_SECONDS,
  TEST_KIKI_VIDEO_ID,
} from './testKikiExtractionSchema.js';

export const SOURCE_VIDEO_AUDIT_PHASE =
  'PHASE-SOURCE-VIDEO-001-SOURCE_VIDEO_COVERAGE_AUDIT_V1' as const;
export const SOURCE_VIDEO_IMPORT_DIR = 'imports/source_videos' as const;
export const SOURCE_VIDEO_REGISTRY_PATH =
  'datasets/source_video/source-video-coverage-registry.json' as const;
export const SOURCE_VIDEO_SCHEMA_PATH =
  'datasets/source_video/source-video-coverage.schema.json' as const;

export const REGISTERED_SOURCE_VIDEO_IDS = Object.freeze([
  GHIBLI_01_VIDEO_ID,
  ...MORI_SOURCE_IDS,
  TEST_KIKI_VIDEO_ID,
] as const);

export type CoverageCategory =
  | 'indoor'
  | 'outdoor'
  | 'emotion'
  | 'relationship'
  | 'camera'
  | 'lighting'
  | 'weather'
  | 'crowd'
  | 'animal'
  | 'motion'
  | 'environment';

export const COVERAGE_CATEGORIES = Object.freeze([
  'indoor',
  'outdoor',
  'emotion',
  'relationship',
  'camera',
  'lighting',
  'weather',
  'crowd',
  'animal',
  'motion',
  'environment',
] as const);

export type CategoryCoverageMap = Record<CoverageCategory, string[]>;

export type SourceVideoCoverageRecord = {
  source_video_id: string;
  phase: typeof SOURCE_VIDEO_AUDIT_PHASE;
  filename: string;
  import_path: string;
  file_present: boolean;
  file_size_bytes: number;
  duration_seconds: number | null;
  category_coverage: CategoryCoverageMap;
  audit_status: 'audited' | 'missing_file' | 'unregistered';
  audited_at: string;
};

const SEED_CATEGORY_PROFILES: Record<string, CategoryCoverageMap> = {
  GHIBLI_01: {
    indoor: ['domestic-interior', 'kitchen-hearth', 'workroom', 'bedroom'],
    outdoor: ['harbor', 'village-street', 'rooftop', 'crosswalk', 'departure-trail'],
    emotion: ['joy', 'warmth', 'longing', 'calm', 'startle', 'hope'],
    relationship: ['solo', 'pair', 'family', 'stranger-exchange', 'group'],
    camera: ['wide', 'close', 'tracking', 'aerial', 'static', 'over-shoulder'],
    lighting: ['daylight', 'golden-hour', 'interior-warm', 'overcast-soft'],
    weather: ['clear', 'rain', 'wind'],
    crowd: ['sparse', 'market-crowd', 'street-passers'],
    animal: ['companion', 'wildlife', 'working-animal'],
    motion: ['slow-contemplative', 'walking', 'task-motion', 'departure'],
    environment: ['mediterranean', 'domestic', 'village', 'water-edge', 'urban-harbor'],
  },
  MORI_01: {
    indoor: ['shrine-interior'],
    outdoor: ['forest-path', 'creek-bank', 'woodland-trail', 'shrine-steps', 'moss-log'],
    emotion: ['calm', 'focus', 'wonder'],
    relationship: ['solo', 'nature-companion'],
    camera: ['wide', 'close', 'extreme-wide', 'profile-detail'],
    lighting: ['daylight', 'canopy-dappled', 'creek-reflection'],
    weather: ['clear', 'humid-mist'],
    crowd: ['empty', 'sparse'],
    animal: ['wildlife', 'foraging-companion'],
    motion: ['slow-contemplative', 'foraging', 'path-walk', 'creek-wade'],
    environment: ['woodland', 'forest-floor', 'water-edge', 'shrine'],
  },
  MORI_02: {
    indoor: ['workroom-loom', 'kitchen-hearth', 'tatami-room', 'porch-seat'],
    outdoor: ['village-walk', 'garden-bed', 'market-stall', 'village-square'],
    emotion: ['warmth', 'focus', 'contentment', 'social-ease'],
    relationship: ['pair', 'family', 'group', 'stranger-exchange', 'craft-mentor'],
    camera: ['mid-wide', 'close', 'over-shoulder', 'two-shot', 'task-detail'],
    lighting: ['daylight', 'interior-warm', 'hearth-glow'],
    weather: ['clear'],
    crowd: ['market-crowd', 'sparse', 'festival-prep'],
    animal: ['working-animal'],
    motion: ['task-motion', 'walking', 'craft-work', 'social-gather'],
    environment: ['village', 'domestic', 'craft-workspace', 'market'],
  },
  MORI_03: {
    indoor: ['veranda-edge'],
    outdoor: ['evening-path', 'wooden-bridge', 'river-dock', 'field-row', 'apiary-stand'],
    emotion: ['hope', 'tenderness', 'patience', 'reunion-hint'],
    relationship: ['pair', 'companion-walk', 'community-help'],
    camera: ['wide', 'tracking', 'extreme-wide', 'reaction-close'],
    lighting: ['lantern', 'golden-hour', 'overcast-soft', 'twilight'],
    weather: ['rain', 'overcast', 'clear-evening'],
    crowd: ['sparse', 'festival-group'],
    animal: ['companion'],
    motion: ['walking', 'ferry-wait', 'bridge-cross', 'festival-carry'],
    environment: ['village', 'water-edge', 'bridge', 'field', 'evening-path'],
  },
  TEST_KIKI_25S: {
    indoor: [],
    outdoor: ['harbor-establishing', 'terrace-edge', 'environmental-depth'],
    emotion: ['warmth', 'joy', 'wonder'],
    relationship: ['solo', 'companion-hint'],
    camera: ['wide', 'mid-close', 'establishing-wide', 'three-quarter'],
    lighting: ['daylight', 'golden-hour'],
    weather: ['clear'],
    crowd: ['sparse'],
    animal: [],
    motion: ['slow-contemplative', 'environmental-drift'],
    environment: ['mediterranean', 'harbor', 'water-edge'],
  },
};

export function loadSourceVideoRegistry(projectRoot?: string) {
  return readJsonRecord(resolveProjectRoot(projectRoot), SOURCE_VIDEO_REGISTRY_PATH) as {
    source_videos?: Array<{
      source_video_id: string;
      filename: string;
      import_path: string;
      duration_seconds: number | null;
    }>;
  } | null;
}

export function listImportVideoFiles(projectRoot: string): string[] {
  const root = resolveProjectRoot(projectRoot);
  const importDir = path.join(root, SOURCE_VIDEO_IMPORT_DIR);
  if (!fs.existsSync(importDir)) return [];

  return fs
    .readdirSync(importDir)
    .filter((name) => /\.(mp4|mov|mkv|webm)$/i.test(name))
    .sort();
}

function emptyCategoryMap(): CategoryCoverageMap {
  return {
    indoor: [],
    outdoor: [],
    emotion: [],
    relationship: [],
    camera: [],
    lighting: [],
    weather: [],
    crowd: [],
    animal: [],
    motion: [],
    environment: [],
  };
}

function resolveDuration(sourceVideoId: string, registryDuration: number | null): number | null {
  if (registryDuration != null) return registryDuration;
  if (sourceVideoId === GHIBLI_01_VIDEO_ID) return GHIBLI_01_DURATION_SECONDS;
  if (sourceVideoId === TEST_KIKI_VIDEO_ID) return TEST_KIKI_DURATION_SECONDS;
  return null;
}

export function auditSourceVideo(
  projectRoot: string,
  sourceVideoId: string,
  filename: string,
  importPath: string,
  registryDuration: number | null
): SourceVideoCoverageRecord {
  const root = resolveProjectRoot(projectRoot);
  const absPath = path.join(root, importPath);
  const file_present = fs.existsSync(absPath);
  const file_size_bytes = file_present ? fs.statSync(absPath).size : 0;
  const profile = SEED_CATEGORY_PROFILES[sourceVideoId] ?? emptyCategoryMap();

  return {
    source_video_id: sourceVideoId,
    phase: SOURCE_VIDEO_AUDIT_PHASE,
    filename,
    import_path: importPath,
    file_present,
    file_size_bytes,
    duration_seconds: resolveDuration(sourceVideoId, registryDuration),
    category_coverage: profile,
    audit_status: file_present ? 'audited' : 'missing_file',
    audited_at: new Date().toISOString(),
  };
}

export function auditAllSourceVideos(projectRoot?: string): SourceVideoCoverageRecord[] {
  const root = resolveProjectRoot(projectRoot);
  const registry = loadSourceVideoRegistry(root);
  const importFiles = new Set(listImportVideoFiles(root));
  const records: SourceVideoCoverageRecord[] = [];

  for (const entry of registry?.source_videos ?? []) {
    records.push(
      auditSourceVideo(
        root,
        entry.source_video_id,
        entry.filename,
        entry.import_path,
        entry.duration_seconds
      )
    );
    importFiles.delete(entry.filename);
  }

  for (const orphan of importFiles) {
    const id = orphan.replace(/\.[^.]+$/, '');
    records.push({
      source_video_id: id,
      phase: SOURCE_VIDEO_AUDIT_PHASE,
      filename: orphan,
      import_path: `${SOURCE_VIDEO_IMPORT_DIR}/${orphan}`,
      file_present: true,
      file_size_bytes: fs.statSync(path.join(root, SOURCE_VIDEO_IMPORT_DIR, orphan)).size,
      duration_seconds: null,
      category_coverage: emptyCategoryMap(),
      audit_status: 'unregistered',
      audited_at: new Date().toISOString(),
    });
  }

  return records;
}

export function getRegisteredAuditRecords(
  records: SourceVideoCoverageRecord[]
): SourceVideoCoverageRecord[] {
  return records.filter((r) =>
    (REGISTERED_SOURCE_VIDEO_IDS as readonly string[]).includes(r.source_video_id)
  );
}
