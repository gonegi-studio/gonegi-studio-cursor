import {
  ANIMAL_BEHAVIOR_GROUPS,
  ANIMAL_BEHAVIOR_EXAMPLE_VALUES,
  buildLivingWorldLibraryScaffold,
  FORBIDDEN_WORLD_TOKENS,
  getAllDefinedAnimalTypes,
  LIVING_WORLD_IDENTITY,
  LIVING_WORLD_LIBRARY_NAMES,
  LIVING_WORLD_SCAFFOLD_TYPE,
  LIVING_WORLD_SCAFFOLD_VERSION,
  LIVING_WORLD_TYPE,
  REQUIRED_POULTRY_HARBOR_BIRD_TYPES,
  type LivingWorldLibraryScaffold,
} from './livingWorldLibrarySchema.js';

export type LivingWorldScaffoldVerdict =
  | 'PASS_LIVING_WORLD_SCAFFOLD_READY'
  | 'NEEDS_REFINEMENT';

export type LivingWorldScaffoldViolation = {
  code: string;
  message: string;
  field?: string;
};

export type LivingWorldScaffoldReport = {
  auditTimestamp: string;
  final_verdict: LivingWorldScaffoldVerdict;
  scaffold_version: typeof LIVING_WORLD_SCAFFOLD_VERSION;
  scaffold_type: typeof LIVING_WORLD_SCAFFOLD_TYPE;
  library_names_present: readonly string[];
  libraries_empty: boolean;
  total_patterns: number;
  animal_behavior_groups_present: boolean;
  required_poultry_harbor_birds_defined: readonly string[];
  forbidden_world_tokens: typeof FORBIDDEN_WORLD_TOKENS;
  world_identity: typeof LIVING_WORLD_IDENTITY;
  world_type: typeof LIVING_WORLD_TYPE;
  forbidden_field_scan_passed: boolean;
  violations: readonly LivingWorldScaffoldViolation[];
};

const FORBIDDEN_CONTENT_TOKENS = [
  'character_dna',
  'style_core',
  'env_dna',
  'environment_dna',
  'render_rules',
  'master_prompt',
  'image_prompt',
  'negative_prompt',
] as const;

export function auditLivingWorldScaffold(
  scaffold: LivingWorldLibraryScaffold = buildLivingWorldLibraryScaffold()
): LivingWorldScaffoldReport {
  const violations: LivingWorldScaffoldViolation[] = [];
  const serialized = JSON.stringify(scaffold).toLowerCase();

  for (const token of FORBIDDEN_CONTENT_TOKENS) {
    if (serialized.includes(token)) {
      violations.push({
        code: 'FAIL_FORBIDDEN_CONTENT',
        message: `Forbidden token detected: ${token}`,
      });
    }
  }

  if (scaffold.scaffold_version !== LIVING_WORLD_SCAFFOLD_VERSION) {
    violations.push({
      code: 'FAIL_SCAFFOLD_VERSION',
      message: `Expected scaffold version ${LIVING_WORLD_SCAFFOLD_VERSION}`,
    });
  }

  if (scaffold.world_identity !== LIVING_WORLD_IDENTITY) {
    violations.push({
      code: 'FAIL_WORLD_IDENTITY',
      message: 'Missing GONEGI_MEDITERRANEAN world identity',
    });
  }

  if (scaffold.world_type !== LIVING_WORLD_TYPE) {
    violations.push({
      code: 'FAIL_WORLD_TYPE',
      message: 'Missing Mediterranean world type',
    });
  }

  for (const libraryName of LIVING_WORLD_LIBRARY_NAMES) {
    if (!Array.isArray(scaffold.libraries[libraryName])) {
      violations.push({
        code: 'FAIL_LIBRARY_MISSING',
        message: `Library missing: ${libraryName}`,
        field: libraryName,
      });
    }
  }

  const totalPatterns = LIVING_WORLD_LIBRARY_NAMES.reduce(
    (sum, libraryName) => sum + scaffold.libraries[libraryName].length,
    0
  );
  if (totalPatterns !== 0) {
    violations.push({
      code: 'FAIL_DATASET_INFLATION',
      message: `Scaffold must remain empty; found ${totalPatterns} patterns`,
    });
  }

  const definedAnimalTypes = getAllDefinedAnimalTypes();
  const missingBirds = REQUIRED_POULTRY_HARBOR_BIRD_TYPES.filter(
    (animalType) => !definedAnimalTypes.includes(animalType)
  );
  if (missingBirds.length > 0) {
    violations.push({
      code: 'FAIL_ANIMAL_BEHAVIOR_SCHEMA',
      message: `Missing required animal types: ${missingBirds.join(', ')}`,
      field: 'animal_behavior_groups',
    });
  }

  if (ANIMAL_BEHAVIOR_EXAMPLE_VALUES.length < 10) {
    violations.push({
      code: 'FAIL_ANIMAL_BEHAVIOR_EXAMPLES',
      message: 'Animal behavior example values insufficient',
    });
  }

  const groupKeys = Object.keys(ANIMAL_BEHAVIOR_GROUPS);
  if (groupKeys.length < 5) {
    violations.push({
      code: 'FAIL_ANIMAL_BEHAVIOR_GROUPS',
      message: 'Animal behavior groups incomplete',
    });
  }

  const final_verdict: LivingWorldScaffoldVerdict =
    violations.length === 0 ? 'PASS_LIVING_WORLD_SCAFFOLD_READY' : 'NEEDS_REFINEMENT';

  return Object.freeze({
    auditTimestamp: new Date().toISOString(),
    final_verdict,
    scaffold_version: LIVING_WORLD_SCAFFOLD_VERSION,
    scaffold_type: LIVING_WORLD_SCAFFOLD_TYPE,
    library_names_present: LIVING_WORLD_LIBRARY_NAMES,
    libraries_empty: totalPatterns === 0,
    total_patterns: totalPatterns,
    animal_behavior_groups_present: groupKeys.length >= 5,
    required_poultry_harbor_birds_defined: REQUIRED_POULTRY_HARBOR_BIRD_TYPES,
    forbidden_world_tokens: FORBIDDEN_WORLD_TOKENS,
    world_identity: LIVING_WORLD_IDENTITY,
    world_type: LIVING_WORLD_TYPE,
    forbidden_field_scan_passed: !violations.some(
      (violation) => violation.code === 'FAIL_FORBIDDEN_CONTENT'
    ),
    violations: Object.freeze(violations),
  });
}

export function runLivingWorldScaffoldAudit(): LivingWorldScaffoldReport {
  return auditLivingWorldScaffold(buildLivingWorldLibraryScaffold());
}

export function getCombinedPhase108Verdict(
  relocationVerdict: string,
  scaffoldVerdict: string
): 'PASS_PROJECT_ROOT_CORRECTED' | 'NEEDS_REFINEMENT' {
  if (
    relocationVerdict === 'PASS_PROJECT_ROOT_CORRECTED' &&
    scaffoldVerdict === 'PASS_LIVING_WORLD_SCAFFOLD_READY'
  ) {
    return 'PASS_PROJECT_ROOT_CORRECTED';
  }
  return 'NEEDS_REFINEMENT';
}
