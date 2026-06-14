import {
  assertExportReadyForPass,
  CINEMATIC_DNA_LIBRARY_IMPORT_PATH,
  IMAGE_APP_REPORTS_DIR,
  writeGovernedReport,
  type ExportValidationResult,
} from './exportGovernance.js';
import {
  CINEMATIC_DNA_LIBRARY_REPORT_NAME,
  CINEMATIC_DNA_LIBRARY_TYPE,
  CINEMATIC_DNA_LIBRARY_VERSION,
  DIRECTOR_FAMILY,
  countCinematicDnaCollectionItems,
  writeCinematicDnaLibraryImport,
  type CinematicDnaCollections,
  type CinematicDnaLibraryImport,
} from './cinematicDnaLibraryAdapter.js';

export type CinematicDnaLibraryVerdict =
  | 'PASS_FOR_CINEMATIC_DNA_LAB_UPLOAD'
  | 'NEEDS_REFINEMENT'
  | 'FAIL_FORBIDDEN_FIELDS_FOUND'
  | 'FAIL_EXPORT_NOT_GENERATED';

export type CinematicDnaLibraryViolation = {
  code: string;
  message: string;
  field?: string;
};

export type CinematicDnaLibraryReport = {
  auditTimestamp: string;
  final_verdict: CinematicDnaLibraryVerdict;
  dataset_type: typeof CINEMATIC_DNA_LIBRARY_TYPE;
  dataset_version: typeof CINEMATIC_DNA_LIBRARY_VERSION;
  source_dataset: string;
  collection_counts: ReturnType<typeof countCinematicDnaCollectionItems>;
  total_items: number;
  world_balance: CinematicDnaLibraryImport['metadata']['world_balance'];
  mediterranean_sovereignty: {
    world_identity_present: boolean;
    gonegi_present_on_all_items: boolean;
    harbor_anchor_count: number;
    forbidden_japanese_cottage_tokens: number;
    normalization_preserved: boolean;
  };
  harbor_calibration: {
    harbor_share: number;
    village_share: number;
    domestic_share: number;
    woodland_share: number;
    calibration_preserved: boolean;
  };
  forbidden_field_scan: {
    passed: boolean;
    hits: readonly string[];
  };
  collection_audit: {
    passed: boolean;
    missing: readonly string[];
  };
  schema_valid: boolean;
  export_validation: ExportValidationResult;
  violations: readonly CinematicDnaLibraryViolation[];
  audit_codes: readonly string[];
};

const REQUIRED_COLLECTIONS: Array<keyof CinematicDnaCollections> = [
  'camera_grammar',
  'acting_grammar',
  'daily_life_grammar',
  'location_grammar',
  'object_interaction_grammar',
  'extra_actor_grammar',
  'animal_grammar',
];

const FORBIDDEN_TOKENS = [
  'character_dna',
  'character_book',
  'elite_image_id',
  'style_core',
  'style_dna',
  'environment_dna',
  'render_rules',
  'master_prompt',
  'prompt_compiler',
  'identity_lock',
  'reference_image',
  'story_script',
  'dialogue',
] as const;

const FORBIDDEN_JAPANESE_COTTAGE_TOKENS = [
  'torii',
  'tatami',
  'forest-floor',
  'woodland-path',
] as const;

const EXPECTED_WORLD_BALANCE = Object.freeze({
  mediterranean_harbor: 0.4124,
  mediterranean_village: 0.2783,
  mediterranean_domestic_life: 0.2371,
  mediterranean_woodland: 0.0722,
});

function collectJsonKeys(value: unknown, keys: Set<string>): void {
  if (Array.isArray(value)) {
    for (const entry of value) {
      collectJsonKeys(entry, keys);
    }
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      keys.add(key.toLowerCase());
      collectJsonKeys(nested, keys);
    }
  }
}

function scanForbiddenFields(library: CinematicDnaLibraryImport): string[] {
  const keys = new Set<string>();
  collectJsonKeys(library.collections, keys);
  return FORBIDDEN_TOKENS.filter((token) => keys.has(token));
}

function countForbiddenJapaneseCottageTokens(library: CinematicDnaLibraryImport): number {
  const serialized = JSON.stringify(library.collections).toLowerCase();
  return FORBIDDEN_JAPANESE_COTTAGE_TOKENS.reduce(
    (count, token) => count + (serialized.includes(token) ? 1 : 0),
    0
  );
}

function countHarborAnchors(library: CinematicDnaLibraryImport): number {
  return library.collections.location_grammar.filter((item) => {
    const serialized = JSON.stringify(item).toLowerCase();
    return (
      serialized.includes('mediterranean-harbor') ||
      serialized.includes('mediterranean_harbor') ||
      serialized.includes('harbor-') ||
      item.core_features.harbor_priority_score !== undefined
    );
  }).length;
}

function allItemsHaveGonegi(library: CinematicDnaLibraryImport): boolean {
  for (const collectionName of REQUIRED_COLLECTIONS) {
    for (const item of library.collections[collectionName]) {
      if (item.scene_indexing.director_family !== DIRECTOR_FAMILY) {
        return false;
      }
      if (item.core_features.world_identity !== DIRECTOR_FAMILY) {
        return false;
      }
    }
  }
  return true;
}

function balanceMatchesExpected(
  actual: CinematicDnaLibraryImport['metadata']['world_balance']
): boolean {
  return (
    Math.abs(actual.mediterranean_harbor - EXPECTED_WORLD_BALANCE.mediterranean_harbor) < 0.0001 &&
    Math.abs(actual.mediterranean_village - EXPECTED_WORLD_BALANCE.mediterranean_village) < 0.0001 &&
    Math.abs(actual.mediterranean_domestic_life - EXPECTED_WORLD_BALANCE.mediterranean_domestic_life) <
      0.0001 &&
    Math.abs(actual.mediterranean_woodland - EXPECTED_WORLD_BALANCE.mediterranean_woodland) < 0.0001
  );
}

function validateSchema(library: CinematicDnaLibraryImport): boolean {
  if (!library.metadata || !library.collections) {
    return false;
  }
  if (library.metadata.version !== CINEMATIC_DNA_LIBRARY_VERSION) {
    return false;
  }
  if (library.metadata.dataset_type !== CINEMATIC_DNA_LIBRARY_TYPE) {
    return false;
  }
  if (library.metadata.world_identity !== DIRECTOR_FAMILY) {
    return false;
  }
  return true;
}

function validateItemShape(item: CinematicDnaLibraryImport['collections']['camera_grammar'][number]): boolean {
  return (
    typeof item.scene_indexing === 'object' &&
    typeof item.core_features === 'object' &&
    typeof item.visual_description === 'string' &&
    typeof item.category === 'string' &&
    typeof item.confidence_score === 'number' &&
    typeof item.prompt_bridge === 'object' &&
    item.prompt_bridge.sdxl === '' &&
    item.prompt_bridge.midjourney === ''
  );
}

export function auditCinematicDnaLibraryImport(
  library: CinematicDnaLibraryImport,
  projectRoot: string
): CinematicDnaLibraryReport {
  const violations: CinematicDnaLibraryViolation[] = [];

  const forbiddenHits = scanForbiddenFields(library);
  if (forbiddenHits.length > 0) {
    violations.push({
      code: 'FAIL_FORBIDDEN_FIELDS_FOUND',
      message: `Forbidden fields detected: ${forbiddenHits.join(', ')}`,
    });
  }

  const missingCollections = REQUIRED_COLLECTIONS.filter((collectionName) => {
    const entries = library.collections[collectionName];
    return !Array.isArray(entries) || entries.length === 0;
  });
  if (missingCollections.length > 0) {
    violations.push({
      code: 'FAIL_COLLECTION_MISSING',
      message: `Missing or empty collections: ${missingCollections.join(', ')}`,
    });
  }

  if (!validateSchema(library)) {
    violations.push({
      code: 'FAIL_SCHEMA',
      message: 'Root schema or metadata layer invalid',
      field: 'metadata',
    });
  }

  for (const collectionName of REQUIRED_COLLECTIONS) {
    for (const item of library.collections[collectionName]) {
      if (!validateItemShape(item)) {
        violations.push({
          code: 'FAIL_ITEM_SHAPE',
          message: `Invalid CinematicDnaItem in ${collectionName}`,
          field: item.scene_indexing?.scene_id,
        });
        break;
      }
    }
  }

  const harborAnchorCount = countHarborAnchors(library);
  if (harborAnchorCount < 4) {
    violations.push({
      code: 'FAIL_MEDITERRANEAN_SOVEREIGNTY',
      message: `Harbor anchors ${harborAnchorCount} below minimum 4`,
      field: 'collections.location_grammar',
    });
  }

  const forbiddenJapaneseCottageTokens = countForbiddenJapaneseCottageTokens(library);
  if (forbiddenJapaneseCottageTokens > 0) {
    violations.push({
      code: 'FAIL_MEDITERRANEAN_SOVEREIGNTY',
      message: `Forbidden Japanese cottage tokens found: ${forbiddenJapaneseCottageTokens}`,
    });
  }

  if (!library.metadata.world_constraints.normalize_cottage_forest_to_mediterranean) {
    violations.push({
      code: 'FAIL_MEDITERRANEAN_SOVEREIGNTY',
      message: 'Mediterranean normalization flag not preserved',
      field: 'metadata.world_constraints',
    });
  }

  if (!allItemsHaveGonegi(library)) {
    violations.push({
      code: 'FAIL_MEDITERRANEAN_SOVEREIGNTY',
      message: 'GONEGI_MEDITERRANEAN not present on all items',
    });
  }

  const calibrationPreserved = balanceMatchesExpected(library.metadata.world_balance);
  if (!calibrationPreserved) {
    violations.push({
      code: 'FAIL_HARBOR_CALIBRATION',
      message: 'Harbor calibration world_balance not preserved',
      field: 'metadata.world_balance',
    });
  }

  const exportValidation = assertExportReadyForPass(projectRoot, CINEMATIC_DNA_LIBRARY_IMPORT_PATH);
  if (exportValidation.verdict !== 'PASS') {
    violations.push({
      code: 'FAIL_EXPORT_NOT_GENERATED',
      message: `Governed export failed: ${exportValidation.failures.join(', ')}`,
      field: CINEMATIC_DNA_LIBRARY_IMPORT_PATH,
    });
  }

  const auditCodes = [...new Set(violations.map((violation) => violation.code))];
  const forbiddenScanPassed = forbiddenHits.length === 0;
  const collectionAuditPassed = missingCollections.length === 0;

  let final_verdict: CinematicDnaLibraryVerdict;
  if (!forbiddenScanPassed) {
    final_verdict = 'FAIL_FORBIDDEN_FIELDS_FOUND';
  } else if (exportValidation.verdict !== 'PASS') {
    final_verdict = 'FAIL_EXPORT_NOT_GENERATED';
  } else if (violations.length === 0) {
    final_verdict = 'PASS_FOR_CINEMATIC_DNA_LAB_UPLOAD';
  } else {
    final_verdict = 'NEEDS_REFINEMENT';
  }

  return Object.freeze({
    auditTimestamp: new Date().toISOString(),
    final_verdict,
    dataset_type: CINEMATIC_DNA_LIBRARY_TYPE,
    dataset_version: CINEMATIC_DNA_LIBRARY_VERSION,
    source_dataset: library.metadata.source_dataset,
    collection_counts: countCinematicDnaCollectionItems(library),
    total_items: library.metadata.total_items,
    world_balance: library.metadata.world_balance,
    mediterranean_sovereignty: Object.freeze({
      world_identity_present: library.metadata.world_identity === DIRECTOR_FAMILY,
      gonegi_present_on_all_items: allItemsHaveGonegi(library),
      harbor_anchor_count: harborAnchorCount,
      forbidden_japanese_cottage_tokens: forbiddenJapaneseCottageTokens,
      normalization_preserved: library.metadata.world_constraints.normalize_cottage_forest_to_mediterranean,
    }),
    harbor_calibration: Object.freeze({
      harbor_share: library.metadata.world_balance.mediterranean_harbor,
      village_share: library.metadata.world_balance.mediterranean_village,
      domestic_share: library.metadata.world_balance.mediterranean_domestic_life,
      woodland_share: library.metadata.world_balance.mediterranean_woodland,
      calibration_preserved: calibrationPreserved,
    }),
    forbidden_field_scan: Object.freeze({
      passed: forbiddenScanPassed,
      hits: Object.freeze(forbiddenHits),
    }),
    collection_audit: Object.freeze({
      passed: collectionAuditPassed,
      missing: Object.freeze(missingCollections),
    }),
    schema_valid: validateSchema(library),
    export_validation: exportValidation,
    violations: Object.freeze(violations),
    audit_codes: Object.freeze(auditCodes),
  });
}

export function runCinematicDnaLibraryAudit(projectRoot: string): CinematicDnaLibraryReport {
  const { library } = writeCinematicDnaLibraryImport(projectRoot);
  const report = auditCinematicDnaLibraryImport(library, projectRoot);
  writeGovernedReport(
    projectRoot,
    IMAGE_APP_REPORTS_DIR,
    CINEMATIC_DNA_LIBRARY_REPORT_NAME,
    report
  );
  return report;
}
