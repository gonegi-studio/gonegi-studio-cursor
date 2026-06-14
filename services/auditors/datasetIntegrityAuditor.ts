import fs from 'node:fs';
import path from 'node:path';
import {
  type AuditError,
  type AuditWarning,
  type SubmoduleAuditResult,
  buildSubmoduleResult,
  listJsonFiles,
  readJsonRecord,
  relativeFromRoot,
} from './auditorShared.js';

/** Library/index pairs and standalone contracts the auditor treats as required. */
export const REQUIRED_DATASET_PAIRS = Object.freeze([
  {
    library: 'datasets/location/location-dna-library-v1.json',
    index: 'datasets/location/location-dna-index-v1.json',
    id_field: 'location_id',
    collection: 'locations',
  },
  {
    library: 'datasets/lighting/lighting-dna-library-v1.json',
    index: 'datasets/lighting/lighting-dna-index-v1.json',
    id_field: 'lighting_id',
    collection: 'lighting_profiles',
  },
  {
    library: 'datasets/location/indoor-location-anchor-library-v1.json',
    index: 'datasets/location/indoor-location-anchor-index-v1.json',
    id_field: 'anchor_id',
    collection: 'anchors',
  },
] as const);

export const REQUIRED_STANDALONE_FILES = Object.freeze([
  'datasets/character/character-simple-v1.json',
  'exports/image_app/latest/character-first-contract.json',
  'exports/image_app/latest/location-lighting-image-adapter.json',
] as const);

export function runDatasetIntegrityAudit(projectRoot: string): SubmoduleAuditResult {
  const errors: AuditError[] = [];
  const warnings: AuditWarning[] = [];

  for (const rel of REQUIRED_STANDALONE_FILES) {
    if (!fs.existsSync(path.join(projectRoot, rel))) {
      errors.push({
        code: 'REQUIRED_FILE_MISSING',
        message: `Required file missing: ${rel}`,
        severity: 'critical',
        source: rel,
      });
    }
  }

  for (const pair of REQUIRED_DATASET_PAIRS) {
    auditLibraryIndexPair(projectRoot, pair, errors, warnings);
  }

  auditBrokenReferences(projectRoot, warnings);
  auditDuplicateIdsInDatasets(projectRoot, errors, warnings);

  return buildSubmoduleResult(errors, warnings, {
    integrity_risk_score: buildSubmoduleResult(errors, warnings).risk_score,
    required_pairs_checked: REQUIRED_DATASET_PAIRS.length,
    dataset_json_files: listJsonFiles(path.join(projectRoot, 'datasets')).length,
  });
}

type PairSpec = (typeof REQUIRED_DATASET_PAIRS)[number];

function auditLibraryIndexPair(
  projectRoot: string,
  pair: PairSpec,
  errors: AuditError[],
  warnings: AuditWarning[]
): void {
  const libraryPath = path.join(projectRoot, pair.library);
  const indexPath = path.join(projectRoot, pair.index);

  if (!fs.existsSync(libraryPath)) {
    errors.push({
      code: 'LIBRARY_MISSING',
      message: `Library missing: ${pair.library}`,
      severity: 'critical',
      source: pair.library,
    });
    return;
  }
  if (!fs.existsSync(indexPath)) {
    errors.push({
      code: 'INDEX_MISSING',
      message: `Index missing: ${pair.index}`,
      severity: 'critical',
      source: pair.index,
    });
    return;
  }

  const library = readJsonRecord(projectRoot, pair.library);
  const index = readJsonRecord(projectRoot, pair.index);
  if (!library || !index) {
    errors.push({
      code: 'JSON_PARSE_FAILED',
      message: `Invalid JSON in ${pair.library} or ${pair.index}`,
      severity: 'critical',
    });
    return;
  }

  const indexLibraryRef = index.library_path;
  if (typeof indexLibraryRef === 'string' && indexLibraryRef !== pair.library) {
    warnings.push({
      code: 'INDEX_LIBRARY_PATH_DRIFT',
      message: `${pair.index} library_path "${indexLibraryRef}" !== expected "${pair.library}"`,
      severity: 'moderate',
      source: pair.index,
    });
  }

  const indexRows = (index.entries ?? index.index_entries) as unknown;
  const libraryRows = library[pair.collection] as unknown;

  if (!Array.isArray(indexRows)) {
    errors.push({
      code: 'INDEX_ENTRIES_INVALID',
      message: `${pair.index} missing entries array`,
      severity: 'high',
      source: pair.index,
    });
    return;
  }
  if (!Array.isArray(libraryRows)) {
    errors.push({
      code: 'LIBRARY_COLLECTION_INVALID',
      message: `${pair.library} missing ${pair.collection} array`,
      severity: 'high',
      source: pair.library,
    });
    return;
  }

  const libraryIds = new Set<string>();
  for (const row of libraryRows) {
    if (!row || typeof row !== 'object') continue;
    const id = (row as Record<string, string>)[pair.id_field];
    if (id) libraryIds.add(id);
  }

  const indexIds = new Set<string>();
  for (const row of indexRows) {
    if (!row || typeof row !== 'object') continue;
    const id = (row as Record<string, string>)[pair.id_field];
    if (!id) continue;
    if (indexIds.has(id)) {
      errors.push({
        code: 'DUPLICATE_INDEX_ID',
        message: `Duplicate ${pair.id_field} "${id}" in ${pair.index}`,
        severity: 'critical',
        source: pair.index,
      });
    }
    indexIds.add(id);
    if (!libraryIds.has(id)) {
      errors.push({
        code: 'DANGLING_INDEX_ID',
        message: `${pair.id_field} "${id}" in index but missing from library`,
        severity: 'high',
        source: pair.index,
      });
    }
  }

  for (const id of libraryIds) {
    if (!indexIds.has(id)) {
      warnings.push({
        code: 'LIBRARY_ID_NOT_INDEXED',
        message: `${pair.id_field} "${id}" in library but missing from index`,
        severity: 'low',
        source: pair.library,
      });
    }
  }
}

function auditBrokenReferences(projectRoot: string, warnings: AuditWarning[]): void {
  const datasetsDir = path.join(projectRoot, 'datasets');
  for (const file of listJsonFiles(datasetsDir)) {
    const rel = relativeFromRoot(projectRoot, file);
    const doc = readJsonRecord(projectRoot, rel);
    if (!doc) continue;

    for (const key of ['library_path', 'index_path', 'parent_adapter_reference', 'library_reference', 'index_reference']) {
      const ref = doc[key];
      if (typeof ref === 'string' && !fs.existsSync(path.join(projectRoot, ref))) {
        warnings.push({
          code: 'BROKEN_REFERENCE',
          message: `${rel} references missing path ${ref}`,
          severity: 'moderate',
          source: rel,
        });
      }
    }
  }
}

function auditDuplicateIdsInDatasets(
  projectRoot: string,
  errors: AuditError[],
  warnings: AuditWarning[]
): void {
  for (const file of listJsonFiles(path.join(projectRoot, 'datasets'))) {
    const rel = relativeFromRoot(projectRoot, file);
    if (
      rel.includes('render_feedback/') ||
      rel.endsWith('-index-v1.json') ||
      rel.includes('SCORECARD') ||
      rel.includes('REPORT')
    ) {
      continue;
    }
    const doc = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
    const localIds = new Map<string, number>();

    const register = (id: string, field: string) => {
      localIds.set(id, (localIds.get(id) ?? 0) + 1);
      if ((localIds.get(id) ?? 0) > 1) {
        warnings.push({
          code: 'DUPLICATE_ID_IN_FILE',
          message: `Duplicate ${field} "${id}" within ${rel}`,
          severity: 'moderate',
          source: rel,
        });
      }
    };

    const collections = ['locations', 'anchors', 'profiles', 'locks', 'props', 'entries'];
    for (const key of collections) {
      const rows = doc[key];
      if (!Array.isArray(rows)) continue;
      for (const row of rows) {
        if (!row || typeof row !== 'object') continue;
        const r = row as Record<string, string>;
        for (const field of ['location_id', 'anchor_id', 'lighting_id', 'prop_id']) {
          if (r[field]) register(r[field], field);
        }
      }
    }
  }
}
