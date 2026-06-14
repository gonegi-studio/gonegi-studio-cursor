import fs from 'node:fs';
import path from 'node:path';
import {
  GENERATION_OUTPUT_LOCK_PHASE,
  GENERATION_OUTPUT_LOCK_SYSTEM_ID,
  GENERATION_OUTPUT_RULES_PATH,
  IMAGE_APP_TEST_PACK_OUTPUTS,
  MOVIE_SPATIAL_ACTIVE_DIR,
  MOVIE_SPATIAL_ARCHIVE_DIR,
  MOVIE_SPATIAL_CONTROLLED_DIRS,
  MOVIE_SPATIAL_MANUAL_DIR,
  MOVIE_SPATIAL_TEST_DIR,
  NATIVE_IMPORT_V8_ACTIVE_OUTPUTS,
} from './generationOutputPaths.js';
import {
  MovieImageAppNativeImportV8Dataset,
  buildAllMovieImageAppNativeImportV8Datasets,
  loadMovieImageAppNativeImportV8Dataset,
  writeMovieImageAppNativeImportV8Datasets,
} from './movieImageAppNativeImportBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export interface GenerationOutputRelocation {
  source_path: string;
  destination_path: string;
  relocated: boolean;
}

export interface GenerationOutputLockResult {
  phase: typeof GENERATION_OUTPUT_LOCK_PHASE;
  system_id: typeof GENERATION_OUTPUT_LOCK_SYSTEM_ID;
  generated_at: string;
  folders_created: string[];
  active_exports_written: string[];
  test_packs_written: string[];
  relocations: GenerationOutputRelocation[];
}

const LEGACY_ROOT_EXPORTS = [
  'exports/movie_spatial/titanic-image-app-native-import-v8.json',
  'exports/movie_spatial/spirited-away-image-app-native-import-v8.json',
] as const;

const ARCHIVE_RELOCATIONS = [
  {
    source: 'exports/movie_spatial/image_app_real_test',
    destination: 'exports/movie_spatial/ARCHIVE/image_app_real_test',
  },
  {
    source: 'exports/movie_spatial/image_app_manual',
    destination: 'exports/movie_spatial/MANUAL',
    skip_if_destination_has_files: true,
  },
  {
    source: 'exports/movie_spatial/test_generation',
    destination: 'exports/movie_spatial/ARCHIVE/test_generation',
  },
  {
    source: 'exports/movie_spatial/tests',
    destination: 'exports/movie_spatial/ARCHIVE/import_tests',
  },
  {
    source: 'exports/movie_spatial/test_scenarios',
    destination: 'exports/movie_spatial/ARCHIVE/test_scenarios',
  },
] as const;

const REPORT_ARCHIVE_RELOCATIONS = [
  {
    source: 'reports/movie_spatial/REAL_IMAGE_APP_MANUAL_REPORT.json',
    destination: 'exports/movie_spatial/MANUAL/REAL_IMAGE_APP_MANUAL_REPORT.json',
  },
] as const;

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function ensureControlledFolders(root: string): string[] {
  const created: string[] = [];
  for (const dir of MOVIE_SPATIAL_CONTROLLED_DIRS) {
    const full = path.join(root, dir);
    if (!fs.existsSync(full)) {
      fs.mkdirSync(full, { recursive: true });
      created.push(`${dir}/`);
    }
  }
  return created;
}

function relocateFile(root: string, sourceRel: string, destinationRel: string): GenerationOutputRelocation {
  const sourceFull = path.join(root, sourceRel);
  const destinationFull = path.join(root, destinationRel);

  if (!fs.existsSync(sourceFull)) {
    return {
      source_path: sourceRel,
      destination_path: destinationRel,
      relocated: fs.existsSync(destinationFull),
    };
  }

  fs.mkdirSync(path.dirname(destinationFull), { recursive: true });

  if (fs.existsSync(destinationFull)) {
    fs.rmSync(sourceFull, { force: true });
    return {
      source_path: sourceRel,
      destination_path: destinationRel,
      relocated: true,
    };
  }

  fs.renameSync(sourceFull, destinationFull);
  return {
    source_path: sourceRel,
    destination_path: destinationRel,
    relocated: true,
  };
}

function relocateDirectoryContents(
  root: string,
  sourceRel: string,
  destinationRel: string,
  skipIfDestinationHasFiles = false
): GenerationOutputRelocation[] {
  const sourceFull = path.join(root, sourceRel);
  const destinationFull = path.join(root, destinationRel);
  const relocations: GenerationOutputRelocation[] = [];

  if (!fs.existsSync(sourceFull)) {
    return relocations;
  }

  if (skipIfDestinationHasFiles && fs.existsSync(destinationFull)) {
    const existing = fs.readdirSync(destinationFull).filter((entry) => !entry.startsWith('.'));
    if (existing.length > 0) {
      return relocations;
    }
  }

  fs.mkdirSync(destinationFull, { recursive: true });

  for (const entry of fs.readdirSync(sourceFull)) {
    if (entry.startsWith('.')) continue;
    const sourceEntry = path.join(sourceFull, entry);
    const destinationEntry = path.join(destinationFull, entry);
    const sourceEntryRel = path.join(sourceRel, entry).replace(/\\/g, '/');
    const destinationEntryRel = path.join(destinationRel, entry).replace(/\\/g, '/');

    if (fs.existsSync(destinationEntry)) {
      if (fs.statSync(sourceEntry).isDirectory()) {
        relocations.push(
          ...relocateDirectoryContents(root, sourceEntryRel, destinationEntryRel, false)
        );
        if (fs.readdirSync(sourceEntry).length === 0) {
          fs.rmdirSync(sourceEntry);
        }
      } else {
        fs.rmSync(sourceEntry, { force: true });
        relocations.push({
          source_path: sourceEntryRel,
          destination_path: destinationEntryRel,
          relocated: true,
        });
      }
      continue;
    }

    fs.renameSync(sourceEntry, destinationEntry);
    relocations.push({
      source_path: sourceEntryRel,
      destination_path: destinationEntryRel,
      relocated: true,
    });
  }

  if (fs.existsSync(sourceFull) && fs.readdirSync(sourceFull).length === 0) {
    fs.rmdirSync(sourceFull);
  }

  return relocations;
}

function buildTestPack(
  dataset: MovieImageAppNativeImportV8Dataset,
  sceneCount: number,
  outputPath: string
): MovieImageAppNativeImportV8Dataset {
  const slots = dataset.slots.slice(0, sceneCount);
  if (slots.length !== sceneCount) {
    throw new Error(
      `Insufficient slots for ${dataset.movie_id}: requested ${sceneCount}, available ${dataset.slots.length}`
    );
  }

  return {
    ...dataset,
    slot_count: slots.length,
    slots,
    generated_at: new Date().toISOString(),
  };
}

export function runGenerationOutputLock(projectRoot?: string): GenerationOutputLockResult {
  const root = resolveProjectRoot(projectRoot);
  const foldersCreated = ensureControlledFolders(root);
  const relocations: GenerationOutputRelocation[] = [];

  writeMovieImageAppNativeImportV8Datasets(root);

  for (const sourceRel of LEGACY_ROOT_EXPORTS) {
    const spec = NATIVE_IMPORT_V8_ACTIVE_OUTPUTS.find((entry) =>
      entry.output_path.endsWith(path.basename(sourceRel))
    );
    if (!spec) continue;
    relocations.push(relocateFile(root, sourceRel, spec.output_path));
  }

  for (const rule of ARCHIVE_RELOCATIONS) {
    relocations.push(
      ...relocateDirectoryContents(
        root,
        rule.source,
        rule.destination,
        'skip_if_destination_has_files' in rule ? rule.skip_if_destination_has_files : false
      )
    );
  }

  for (const rule of REPORT_ARCHIVE_RELOCATIONS) {
    relocations.push(relocateFile(root, rule.source, rule.destination));
  }

  writeMovieImageAppNativeImportV8Datasets(root);

  const datasets = buildAllMovieImageAppNativeImportV8Datasets(root);
  const activeExportsWritten: string[] = [];
  const testPacksWritten: string[] = [];

  for (const spec of NATIVE_IMPORT_V8_ACTIVE_OUTPUTS) {
    const dataset = datasets.find((entry) => entry.movie_id === spec.movie_id);
    if (!dataset) {
      throw new Error(`Missing v8 dataset for movie_id=${spec.movie_id}`);
    }
    writeJson(root, spec.output_path, dataset);
    activeExportsWritten.push(spec.output_path);
  }

  for (const spec of IMAGE_APP_TEST_PACK_OUTPUTS) {
    const dataset = datasets.find((entry) => entry.movie_id === spec.movie_id);
    if (!dataset) {
      throw new Error(`Missing v8 dataset for test pack movie_id=${spec.movie_id}`);
    }
    const testPack = buildTestPack(dataset, spec.scene_count, spec.output_path);
    writeJson(root, spec.output_path, testPack);
    testPacksWritten.push(spec.output_path);
  }

  return {
    phase: GENERATION_OUTPUT_LOCK_PHASE,
    system_id: GENERATION_OUTPUT_LOCK_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    folders_created: foldersCreated,
    active_exports_written: activeExportsWritten,
    test_packs_written: testPacksWritten,
    relocations,
  };
}

export {
  GENERATION_OUTPUT_RULES_PATH,
  MOVIE_SPATIAL_ACTIVE_DIR,
  MOVIE_SPATIAL_TEST_DIR,
  MOVIE_SPATIAL_MANUAL_DIR,
  MOVIE_SPATIAL_ARCHIVE_DIR,
  loadMovieImageAppNativeImportV8Dataset,
};
