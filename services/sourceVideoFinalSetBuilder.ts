import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const FINAL_SET_PHASE =
  'PHASE-SOURCE-VIDEO-002-SOURCE_VIDEO_SET_FINALIZATION_V1' as const;
export const FINAL_SET_REGISTRY_PATH =
  'datasets/source_video/source-video-final-set-registry.json' as const;
export const FINAL_SET_SCHEMA_PATH =
  'datasets/source_video/source-video-final-set.schema.json' as const;
export const FINAL_SET_PATH = 'datasets/source_video/source-video-final-set.json' as const;
export const SOURCE_VIDEO_IMPORT_ROOT = 'imports/source_videos' as const;

export type SourceVideoCategory = 'GHIBLI' | 'SHINKAI' | 'LIVE_ACTION' | 'MORI' | 'ARCHIVE';
export type SourceVideoTier = 'active' | 'archive';

export type FinalSetVideoEntry = {
  source_video_id: string;
  category: SourceVideoCategory;
  tier: SourceVideoTier;
  filename: string;
  import_path: string;
  file_present: boolean;
  file_size_bytes: number;
};

export type SourceVideoFinalSet = {
  final_set_id: string;
  phase: typeof FINAL_SET_PHASE;
  finalized_at: string;
  import_root: typeof SOURCE_VIDEO_IMPORT_ROOT;
  active_count: number;
  archive_count: number;
  total_locked_videos: number;
  category_counts: Record<SourceVideoCategory, number>;
  videos: FinalSetVideoEntry[];
  read_only: true;
  gpu_execution: false;
};

type RegistryShape = {
  import_root: string;
  active_categories: Record<
    string,
    { folder: string; video_ids: string[] }
  >;
  archive_categories: Record<
    string,
    { folder: string; video_ids: string[] }
  >;
};

export function loadFinalSetRegistry(projectRoot?: string): RegistryShape | null {
  return readJsonRecord(resolveProjectRoot(projectRoot), FINAL_SET_REGISTRY_PATH) as
    | RegistryShape
    | null;
}

function buildVideoEntry(
  projectRoot: string,
  sourceVideoId: string,
  category: SourceVideoCategory,
  tier: SourceVideoTier,
  relativeFolder: string
): FinalSetVideoEntry {
  const root = resolveProjectRoot(projectRoot);
  const filename = `${sourceVideoId}.mp4`;
  const import_path = `${SOURCE_VIDEO_IMPORT_ROOT}/${relativeFolder}/${filename}`;
  const absPath = path.join(root, import_path);
  const file_present = fs.existsSync(absPath);
  const file_size_bytes = file_present ? fs.statSync(absPath).size : 0;

  return {
    source_video_id: sourceVideoId,
    category,
    tier,
    filename,
    import_path,
    file_present,
    file_size_bytes,
  };
}

export function buildSourceVideoFinalSet(projectRoot?: string): SourceVideoFinalSet {
  const root = resolveProjectRoot(projectRoot);
  const registry = loadFinalSetRegistry(root);
  if (!registry) {
    throw new Error(`Missing final set registry: ${FINAL_SET_REGISTRY_PATH}`);
  }

  const videos: FinalSetVideoEntry[] = [];
  const category_counts: Record<SourceVideoCategory, number> = {
    GHIBLI: 0,
    SHINKAI: 0,
    LIVE_ACTION: 0,
    MORI: 0,
    ARCHIVE: 0,
  };

  for (const [category, spec] of Object.entries(registry.active_categories)) {
    const cat = category as SourceVideoCategory;
    for (const videoId of spec.video_ids) {
      videos.push(buildVideoEntry(root, videoId, cat, 'active', spec.folder));
      category_counts[cat] += 1;
    }
  }

  for (const [category, spec] of Object.entries(registry.archive_categories)) {
    const cat = category as SourceVideoCategory;
    for (const videoId of spec.video_ids) {
      videos.push(buildVideoEntry(root, videoId, cat, 'archive', spec.folder));
      category_counts[cat] += 1;
    }
  }

  videos.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier === 'active' ? -1 : 1;
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.source_video_id.localeCompare(b.source_video_id);
  });

  const active_count = videos.filter((v) => v.tier === 'active').length;
  const archive_count = videos.filter((v) => v.tier === 'archive').length;

  return {
    final_set_id: 'source-video-final-set-v1',
    phase: FINAL_SET_PHASE,
    finalized_at: new Date().toISOString(),
    import_root: SOURCE_VIDEO_IMPORT_ROOT,
    active_count,
    archive_count,
    total_locked_videos: videos.length,
    category_counts,
    videos,
    read_only: true,
    gpu_execution: false,
  };
}

export function writeSourceVideoFinalSet(projectRoot?: string): SourceVideoFinalSet {
  const root = resolveProjectRoot(projectRoot);
  const finalSet = buildSourceVideoFinalSet(root);
  fs.writeFileSync(
    path.join(root, FINAL_SET_PATH),
    `${JSON.stringify(finalSet, null, 2)}\n`,
    'utf8'
  );
  return finalSet;
}
