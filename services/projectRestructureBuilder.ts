import fs from 'node:fs';
import path from 'node:path';
import {
  ACTIVE_PROJECT_MAP_PATH,
  PROJECT_CLASSIFICATION_REGISTRY_PATH,
  PROJECT_RESTRUCTURE_PHASE,
  PROJECT_RESTRUCTURE_SYSTEM_ID,
  RESTRucture_ROOTS,
  classifyProjectAssets,
  writeProjectClassificationRegistry,
  buildActiveProjectMap,
  type ClassifiedAsset,
  type ProjectClassificationRegistry,
} from './projectClassificationBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_RESTRUCTURE_REPORT_PATH =
  'reports/project_governance/PROJECT_RESTRUCTURE_REPORT.json' as const;

export interface RelocationRecord {
  source_path: string;
  destination_path: string;
  category: string;
  relocated: boolean;
}

export interface ProjectRestructureResult {
  phase: typeof PROJECT_RESTRUCTURE_PHASE;
  system_id: typeof PROJECT_RESTRUCTURE_SYSTEM_ID;
  generated_at: string;
  folders_created: string[];
  relocations: RelocationRecord[];
  skipped_existing: string[];
  errors: string[];
}

function ensureRestructureFolders(root: string): string[] {
  const created: string[] = [];
  for (const folder of Object.values(RESTRucture_ROOTS)) {
    const full = path.join(root, folder);
    if (!fs.existsSync(full)) {
      fs.mkdirSync(full, { recursive: true });
      created.push(`${folder}/`);
    }
    fs.mkdirSync(path.join(full, '.governance'), { recursive: true });
  }
  return created;
}

function relocateAsset(root: string, asset: ClassifiedAsset): RelocationRecord {
  if (!asset.relocated_to || asset.relocated_to === asset.path) {
    return {
      source_path: asset.path,
      destination_path: asset.path,
      category: asset.category,
      relocated: false,
    };
  }

  const sourceFull = path.join(root, asset.path);
  const destinationFull = path.join(root, asset.relocated_to);

  if (!fs.existsSync(sourceFull)) {
    return {
      source_path: asset.path,
      destination_path: asset.relocated_to,
      category: asset.category,
      relocated: fs.existsSync(destinationFull),
    };
  }

  fs.mkdirSync(path.dirname(destinationFull), { recursive: true });

  if (fs.existsSync(destinationFull)) {
    return {
      source_path: asset.path,
      destination_path: asset.relocated_to,
      category: asset.category,
      relocated: true,
    };
  }

  fs.renameSync(sourceFull, destinationFull);
  return {
    source_path: asset.path,
    destination_path: asset.relocated_to,
    category: asset.category,
    relocated: true,
  };
}

export function executeProjectRestructure(projectRoot?: string): {
  registry: ProjectClassificationRegistry;
  restructure: ProjectRestructureResult;
} {
  const root = resolveProjectRoot(projectRoot);
  const { registry } = writeProjectClassificationRegistry(root);
  const foldersCreated = ensureRestructureFolders(root);

  const relocations: RelocationRecord[] = [];
  const skippedExisting: string[] = [];
  const errors: string[] = [];

  const relocationCandidates = registry.assets.filter(
    (asset) => asset.relocated_to !== null && asset.category === 'LEGACY'
  );

  for (const asset of relocationCandidates) {
    try {
      const record = relocateAsset(root, asset);
      relocations.push(record);
      if (record.relocated && record.source_path !== record.destination_path) {
        const sourceFull = path.join(root, asset.path);
        if (fs.existsSync(sourceFull)) {
          skippedExisting.push(asset.path);
        }
      }
    } catch (error) {
      errors.push(
        `${asset.path}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  const activeMap = buildActiveProjectMap(root);
  fs.mkdirSync(path.dirname(path.join(root, ACTIVE_PROJECT_MAP_PATH)), { recursive: true });
  fs.writeFileSync(
    path.join(root, ACTIVE_PROJECT_MAP_PATH),
    `${JSON.stringify(activeMap, null, 2)}\n`,
    'utf8'
  );

  const restructure: ProjectRestructureResult = {
    phase: PROJECT_RESTRUCTURE_PHASE,
    system_id: PROJECT_RESTRUCTURE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    folders_created: foldersCreated,
    relocations,
    skipped_existing: skippedExisting,
    errors,
  };

  fs.mkdirSync(path.dirname(path.join(root, PROJECT_RESTRUCTURE_REPORT_PATH)), { recursive: true });
  fs.writeFileSync(
    path.join(root, PROJECT_RESTRUCTURE_REPORT_PATH),
    `${JSON.stringify(restructure, null, 2)}\n`,
    'utf8'
  );

  return { registry, restructure };
}

export { RESTRucture_ROOTS, PROJECT_CLASSIFICATION_REGISTRY_PATH, ACTIVE_PROJECT_MAP_PATH };
