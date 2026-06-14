import { BRAIN_DATASET_V3_HARBOR_CALIBRATED_PATH } from './brainDatasetV3HarborCalibration.js';
import {
  assertExportReadyForPass,
  IMAGE_APP_LATEST_DATASET_PATH,
  IMAGE_APP_REPORTS_DIR,
  writeGovernedReport,
  type ExportValidationResult,
} from './exportGovernance.js';
import {
  ALLOWED_PACKAGE_KEYS,
  IMAGE_APP_BRAIN_INGESTION_PACKAGE_PATH,
  IMAGE_APP_BRAIN_INGESTION_REPORT_PATH,
  IMAGE_APP_BRAIN_INGESTION_TYPE,
  IMAGE_APP_BRAIN_INGESTION_VERSION,
  IMAGE_APP_BRAIN_TARGETS,
  countIngestionPatterns,
  writeImageAppBrainIngestionPackage,
  type ImageAppBrainIngestionPackage,
} from './imageAppBrainIngestionBuilder.js';

export type ImageAppBrainIngestionVerdict =
  | 'PASS_FOR_IMAGE_APP_UPLOAD'
  | 'NEEDS_REFINEMENT'
  | 'FAIL_EXPORT_NOT_GENERATED';

export type ImageAppBrainIngestionViolation = {
  code: string;
  message: string;
  field?: string;
};

export type ImageAppBrainIngestionReport = {
  auditTimestamp: string;
  final_verdict: ImageAppBrainIngestionVerdict;
  package_type: typeof IMAGE_APP_BRAIN_INGESTION_TYPE;
  package_version: typeof IMAGE_APP_BRAIN_INGESTION_VERSION;
  source_package: typeof BRAIN_DATASET_V3_HARBOR_CALIBRATED_PATH;
  app_targets: typeof IMAGE_APP_BRAIN_TARGETS;
  grammar_pattern_counts: ReturnType<typeof countIngestionPatterns>;
  world_identity: ImageAppBrainIngestionPackage['world_identity'];
  world_balance: ImageAppBrainIngestionPackage['world_balance'];
  harbor_primary: boolean;
  mediterranean_sovereignty_retained: boolean;
  forbidden_field_scan: {
    passed: boolean;
    hits: readonly string[];
  };
  violations: readonly ImageAppBrainIngestionViolation[];
  audit_codes: readonly string[];
  grammar_only_ready: boolean;
  app_ingestion_ready: boolean;
  export_validation: ExportValidationResult;
};

const FORBIDDEN_CHECKS: Array<[readonly string[], string]> = [
  [
    [
      'image_prompt',
      'negative_prompt',
      'prompt_intent',
      'compiled_image_prompt',
      'prompt_compiler',
      'image_generation_payload',
      'generation_payload',
      'midjourney',
      'runway',
      'kling',
    ],
    'FAIL_PROMPT_FIELD',
  ],
  [['character_dna', 'dana', 'outfit_key', 'silhouette_key', 'character_key'], 'FAIL_CHARACTER_DNA'],
  [['style_core', 'master_style_core', 'master_style', 'brushwork'], 'FAIL_STYLE_CORE'],
  [['env_dna', 'environment_dna', 'atmosphere_profile', 'dominant_palette'], 'FAIL_ENV_DNA'],
  [['render_rule', 'render_law', 'render_rules', 'renderer_input'], 'FAIL_RENDER_RULE'],
];

const REQUIRED_LIBRARIES = [
  'camera_grammar_library',
  'acting_grammar_library',
  'daily_life_grammar_library',
  'location_grammar_library',
  'object_interaction_library',
  'extra_actor_library',
  'animal_library',
] as const;

function containsAny(haystack: string, tokens: readonly string[]): string | null {
  for (const token of tokens) {
    if (haystack.includes(token)) {
      return token;
    }
  }
  return null;
}

export function auditImageAppBrainIngestionPackage(
  packageDoc: ImageAppBrainIngestionPackage,
  projectRoot: string
): ImageAppBrainIngestionReport {
  const violations: ImageAppBrainIngestionViolation[] = [];
  const grammarSerialized = JSON.stringify({
    camera_grammar_library: packageDoc.camera_grammar_library,
    acting_grammar_library: packageDoc.acting_grammar_library,
    daily_life_grammar_library: packageDoc.daily_life_grammar_library,
    location_grammar_library: packageDoc.location_grammar_library,
    object_interaction_library: packageDoc.object_interaction_library,
    extra_actor_library: packageDoc.extra_actor_library,
    animal_library: packageDoc.animal_library,
  }).toLowerCase();

  const forbiddenHits: string[] = [];
  for (const [tokens, code] of FORBIDDEN_CHECKS) {
    const hit = containsAny(grammarSerialized, tokens);
    if (hit !== null) {
      forbiddenHits.push(hit);
      violations.push({ code, message: `Forbidden token detected: ${hit}` });
    }
  }

  if (grammarSerialized.includes('negative_prompt')) {
    forbiddenHits.push('negative_prompt');
    violations.push({
      code: 'FAIL_PROMPT_FIELD',
      message: 'Negative prompt field detected',
    });
  }

  const extraKeys = Object.keys(packageDoc).filter((key) => !ALLOWED_PACKAGE_KEYS.has(key));
  if (extraKeys.length > 0) {
    violations.push({
      code: 'FAIL_PACKAGE_SHAPE',
      message: `Unexpected package keys: ${extraKeys.join(', ')}`,
    });
  }

  if (packageDoc.package_type !== IMAGE_APP_BRAIN_INGESTION_TYPE) {
    violations.push({
      code: 'FAIL_PACKAGE_TYPE',
      message: `Expected package_type ${IMAGE_APP_BRAIN_INGESTION_TYPE}`,
    });
  }

  for (const library of REQUIRED_LIBRARIES) {
    const entries = packageDoc[library as keyof ImageAppBrainIngestionPackage];
    if (!Array.isArray(entries) || entries.length === 0) {
      violations.push({
        code: 'FAIL_EMPTY_LIBRARY',
        message: `${library} is empty or missing`,
        field: library,
      });
    }
  }

  if (packageDoc.world_identity.world_region !== 'mediterranean-harbor-town') {
    violations.push({
      code: 'FAIL_WORLD_IDENTITY',
      message: 'Harbor-calibrated Mediterranean world identity not retained',
      field: 'world_identity',
    });
  }

  if (packageDoc.world_balance.mediterranean_harbor < 0.35) {
    violations.push({
      code: 'FAIL_HARBOR_CALIBRATION',
      message: `Harbor balance ${packageDoc.world_balance.mediterranean_harbor} below calibrated minimum`,
      field: 'world_balance',
    });
  }

  if (!packageDoc.world_constraints.protected_harbor_identity) {
    violations.push({
      code: 'FAIL_MEDITERRANEAN_SOVEREIGNTY',
      message: 'Mediterranean sovereignty constraints not retained',
      field: 'world_constraints',
    });
  }

  if (packageDoc.location_pattern_priorities.length === 0) {
    violations.push({
      code: 'FAIL_LOCATION_PRIORITIES',
      message: 'location_pattern_priorities is empty',
      field: 'location_pattern_priorities',
    });
  }

  const auditCodes = [...new Set(violations.map((violation) => violation.code))];
  const grammarOnlyReady = forbiddenHits.length === 0;
  const exportValidation = assertExportReadyForPass(projectRoot, IMAGE_APP_LATEST_DATASET_PATH);

  if (exportValidation.verdict !== 'PASS') {
    violations.push({
      code: 'FAIL_EXPORT_NOT_GENERATED',
      message: `Governed export failed validation: ${exportValidation.failures.join(', ')}`,
      field: IMAGE_APP_LATEST_DATASET_PATH,
    });
  }

  const appIngestionReady = grammarOnlyReady && violations.length === 0;
  const final_verdict: ImageAppBrainIngestionVerdict = exportValidation.verdict !== 'PASS'
    ? 'FAIL_EXPORT_NOT_GENERATED'
    : appIngestionReady
      ? 'PASS_FOR_IMAGE_APP_UPLOAD'
      : 'NEEDS_REFINEMENT';

  return Object.freeze({
    auditTimestamp: new Date().toISOString(),
    final_verdict,
    package_type: IMAGE_APP_BRAIN_INGESTION_TYPE,
    package_version: IMAGE_APP_BRAIN_INGESTION_VERSION,
    source_package: BRAIN_DATASET_V3_HARBOR_CALIBRATED_PATH,
    app_targets: IMAGE_APP_BRAIN_TARGETS,
    grammar_pattern_counts: countIngestionPatterns(packageDoc),
    world_identity: packageDoc.world_identity,
    world_balance: packageDoc.world_balance,
    harbor_primary: packageDoc.world_balance.mediterranean_harbor >= 0.35,
    mediterranean_sovereignty_retained: packageDoc.world_constraints.protected_harbor_identity,
    forbidden_field_scan: Object.freeze({
      passed: forbiddenHits.length === 0,
      hits: Object.freeze(forbiddenHits),
    }),
    violations: Object.freeze(violations),
    audit_codes: Object.freeze(auditCodes),
    grammar_only_ready: grammarOnlyReady,
    app_ingestion_ready: appIngestionReady,
    export_validation: exportValidation,
  });
}

export function runImageAppBrainIngestionAudit(
  projectRoot: string
): ImageAppBrainIngestionReport {
  const { packageDoc } = writeImageAppBrainIngestionPackage(projectRoot);
  const report = auditImageAppBrainIngestionPackage(packageDoc, projectRoot);
  writeGovernedReport(
    projectRoot,
    IMAGE_APP_REPORTS_DIR,
    'image-app-brain-ingestion-report.json',
    report
  );
  return report;
}
