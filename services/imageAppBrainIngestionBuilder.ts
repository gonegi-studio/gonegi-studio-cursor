import fs from 'node:fs';
import path from 'node:path';
import { BRAIN_DATASET_V3_HARBOR_CALIBRATED_PATH } from './brainDatasetV3HarborCalibration.js';
import {
  IMAGE_APP_LATEST_DATASET_NAME,
  IMAGE_APP_LATEST_DATASET_PATH,
  IMAGE_APP_REPORTS_DIR,
  LEGACY_IMAGE_APP_BRAIN_INGESTION_PATH,
  publishGovernedExport,
  writeGovernedReport,
  type ExportValidationResult,
} from './exportGovernance.js';
import type { BrainDatasetV3HarborCalibratedPackage } from './brainDatasetV3HarborCalibration.js';
import { resolveExportAssetPathOrThrow } from './projectRootResolver.js';
import type { LocationPatternPriority } from './brainDatasetV3HarborCalibration.js';
import type { MediterraneanWorldBalance, MediterraneanWorldConstraints, MediterraneanWorldIdentity } from './brainDatasetV3MediterraneanSovereignty.js';
import type { BrainDatasetV3Pattern } from './brainDatasetV3MoriMergeBuilder.js';
import type {
  TestKikiActingGrammar,
  TestKikiCameraGrammar,
  TestKikiDailyLifeGrammar,
  TestKikiLocationGrammar,
} from './testKikiExtractionSchema.js';
import type {
  MoriAnimalCandidate,
  MoriExtraActorCandidate,
  MoriObjectInteractionCandidate,
} from './moriGrammarCatalog.js';

export const IMAGE_APP_BRAIN_INGESTION_PACKAGE_PATH = IMAGE_APP_LATEST_DATASET_PATH;
export const IMAGE_APP_BRAIN_INGESTION_REPORT_PATH =
  `${IMAGE_APP_REPORTS_DIR}/image-app-brain-ingestion-report.json` as const;
export const LEGACY_IMAGE_APP_BRAIN_INGESTION_PACKAGE_PATH = LEGACY_IMAGE_APP_BRAIN_INGESTION_PATH;
export const IMAGE_APP_BRAIN_INGESTION_VERSION = '105A' as const;
export const IMAGE_APP_BRAIN_INGESTION_TYPE = 'image_app_brain_ingestion' as const;

export const IMAGE_APP_BRAIN_TARGETS = Object.freeze([
  'Story Engine',
  'Scene Generator',
  'Music Drama Studio',
] as const);

export type ImageAppPatternPriority = {
  pattern_id: string;
  priority_score: number;
  tier: 'high' | 'medium' | 'low';
};

export type ImageAppBrainIngestionPackage = {
  package_type: typeof IMAGE_APP_BRAIN_INGESTION_TYPE;
  package_version: typeof IMAGE_APP_BRAIN_INGESTION_VERSION;
  app_targets: typeof IMAGE_APP_BRAIN_TARGETS;
  camera_grammar_library: BrainDatasetV3HarborCalibratedPackage['camera_grammar_library'];
  acting_grammar_library: BrainDatasetV3HarborCalibratedPackage['acting_grammar_library'];
  daily_life_grammar_library: BrainDatasetV3HarborCalibratedPackage['daily_life_grammar_library'];
  location_grammar_library: BrainDatasetV3HarborCalibratedPackage['location_grammar_library'];
  object_interaction_library: readonly BrainDatasetV3Pattern<MoriObjectInteractionCandidate>[];
  extra_actor_library: readonly BrainDatasetV3Pattern<MoriExtraActorCandidate>[];
  animal_library: readonly BrainDatasetV3Pattern<MoriAnimalCandidate>[];
  world_identity: MediterraneanWorldIdentity;
  world_balance: MediterraneanWorldBalance;
  world_constraints: MediterraneanWorldConstraints;
  pattern_priorities: {
    daily_life: readonly ImageAppPatternPriority[];
    object_interaction: readonly ImageAppPatternPriority[];
    extra_actor: readonly ImageAppPatternPriority[];
    animal: readonly ImageAppPatternPriority[];
  };
  location_pattern_priorities: readonly LocationPatternPriority[];
};

const ALLOWED_PACKAGE_KEYS = new Set([
  'package_type',
  'package_version',
  'app_targets',
  'camera_grammar_library',
  'acting_grammar_library',
  'daily_life_grammar_library',
  'location_grammar_library',
  'object_interaction_library',
  'extra_actor_library',
  'animal_library',
  'world_identity',
  'world_balance',
  'world_constraints',
  'pattern_priorities',
  'location_pattern_priorities',
]);

export { ALLOWED_PACKAGE_KEYS };

function loadHarborCalibrated(projectRoot: string): BrainDatasetV3HarborCalibratedPackage {
  const packagePath = resolveExportAssetPathOrThrow(
    BRAIN_DATASET_V3_HARBOR_CALIBRATED_PATH,
    projectRoot
  );
  return JSON.parse(fs.readFileSync(packagePath, 'utf8')) as BrainDatasetV3HarborCalibratedPackage;
}

export function buildImageAppBrainIngestionPackage(
  projectRoot: string
): ImageAppBrainIngestionPackage {
  const source = loadHarborCalibrated(projectRoot);

  return Object.freeze({
    package_type: IMAGE_APP_BRAIN_INGESTION_TYPE,
    package_version: IMAGE_APP_BRAIN_INGESTION_VERSION,
    app_targets: IMAGE_APP_BRAIN_TARGETS,
    camera_grammar_library: source.camera_grammar_library,
    acting_grammar_library: source.acting_grammar_library,
    daily_life_grammar_library: source.daily_life_grammar_library,
    location_grammar_library: source.location_grammar_library,
    object_interaction_library: source.object_interaction_grammar_library,
    extra_actor_library: source.extra_actor_grammar_library,
    animal_library: source.animal_grammar_library,
    world_identity: source.world_identity,
    world_balance: source.world_balance,
    world_constraints: source.world_constraints,
    pattern_priorities: Object.freeze({
      daily_life: Object.freeze([...source.pattern_priorities.daily_life]),
      object_interaction: Object.freeze([...source.pattern_priorities.object_interaction]),
      extra_actor: Object.freeze([...source.pattern_priorities.extra_actor]),
      animal: Object.freeze([...source.pattern_priorities.animal]),
    }),
    location_pattern_priorities: Object.freeze([...source.location_pattern_priorities]),
  });
}

export function writeImageAppBrainIngestionPackage(
  projectRoot: string
): { packageDoc: ImageAppBrainIngestionPackage; validation: ExportValidationResult } {
  const packageDoc = buildImageAppBrainIngestionPackage(projectRoot);
  const validation = publishGovernedExport({
    projectRoot,
    relativePath: IMAGE_APP_LATEST_DATASET_PATH,
    datasetName: IMAGE_APP_LATEST_DATASET_NAME,
    datasetVersion: IMAGE_APP_BRAIN_INGESTION_VERSION,
    datasetType: IMAGE_APP_BRAIN_INGESTION_TYPE,
    content: packageDoc,
  });
  return { packageDoc, validation };
}

export function countIngestionPatterns(
  packageDoc: ImageAppBrainIngestionPackage
): Record<string, number> {
  return {
    camera: packageDoc.camera_grammar_library.length,
    acting: packageDoc.acting_grammar_library.length,
    daily_life: packageDoc.daily_life_grammar_library.length,
    location: packageDoc.location_grammar_library.length,
    object_interaction: packageDoc.object_interaction_library.length,
    extra_actor: packageDoc.extra_actor_library.length,
    animal: packageDoc.animal_library.length,
  };
}
