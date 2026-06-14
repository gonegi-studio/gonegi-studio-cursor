import fs from 'node:fs';
import path from 'node:path';
import { detectArtStyleIdOnly } from './imageAppPromptLoader.js';
import {
  copySourceOfTruthArtStyle,
  SOURCE_OF_TRUTH_ARTSTYLE_PATH,
  SOURCE_OF_TRUTH_ARTSTYLE_REF,
} from './sourceOfTruthLoader.js';
import { ensureSourceOfTruthFrozen } from './sourceOfTruthFreezeBuilder.js';
import {
  CANONICAL_GONEGI_ARTSTYLE_CONSTANT_KEY,
  collectArtStyleVariants,
  detectArtStyleExpansion,
  isForbiddenGeneratedArtStyle,
  loadCanonicalArtStyleRecord,
  loadCanonicalGonegiArtStyle,
} from './canonicalGonegiArtStyle.js';
import {
  loadAllMovieImageAppNativeImportDatasets,
  writeMovieImageAppNativeImports,
} from './movieImageAppNativeImportBuilder.js';
import {
  loadAllMovieMasterDatasetBindingDatasets,
  writeMovieMasterDatasetBindings,
} from './movieMasterDatasetBinding.js';
import { writeMovieMasterDatasetBindingReport } from './movieMasterDatasetBindingValidation.js';
import {
  SCENARIO_TEST_OUTPUT_DIR,
  SCENARIO_TEST_SCENES,
  writeMovieScenarioQualityReport,
} from './movieScenarioTestBuilder.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_ARTSTYLE_LOCK_PHASE = 'PHASE-MOVIE-SPATIAL-013A' as const;
export const MOVIE_ARTSTYLE_LOCK_SYSTEM_ID = 'MOVIE_ARTSTYLE_LOCK_V1' as const;
export const MOVIE_ARTSTYLE_LOCK_PASS_VERDICT = 'PASS_MOVIE_ARTSTYLE_LOCK_V1' as const;
export const MOVIE_ARTSTYLE_LOCK_FAIL_VERDICT = 'FAIL_MOVIE_ARTSTYLE_LOCK_V1' as const;

export const MOVIE_ARTSTYLE_LOCK_REPORT_PATH =
  'reports/movie_spatial/MOVIE_ARTSTYLE_LOCK_REPORT.json' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface MovieArtstyleLockReport {
  report_id: string;
  phase: typeof MOVIE_ARTSTYLE_LOCK_PHASE;
  system_id: typeof MOVIE_ARTSTYLE_LOCK_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  canonical_artstyle_locked: boolean;
  gonegi_identity_locked: boolean;
  canonical_artstyle_path: typeof SOURCE_OF_TRUTH_ARTSTYLE_PATH;
  canonical_artstyle_ref: string;
  CANONICAL_GONEGI_ARTSTYLE: string;
  upstream_master_dataset_binding_verdict: string;
  checks: {
    artStyle_exact_match: boolean;
    artStyle_generated: boolean;
    artStyle_expansion_detected: boolean;
    artStyle_variant_count: number;
  };
  metrics: {
    binding_scene_count: number;
    native_import_slot_count: number;
    scenario_test_count: number;
    artStyle_sample_count: number;
  };
  issues: ValidationIssue[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function loadScenarioTestArtStyles(root: string): string[] {
  const values: string[] = [];
  for (const spec of SCENARIO_TEST_SCENES) {
    const full = path.join(root, SCENARIO_TEST_OUTPUT_DIR, spec.json_filename);
    if (!fs.existsSync(full)) continue;
    const dataset = JSON.parse(fs.readFileSync(full, 'utf8')) as {
      slots?: Array<{ artStyle?: string }>;
    };
    for (const slot of dataset.slots ?? []) {
      if (typeof slot.artStyle === 'string') values.push(slot.artStyle);
    }
  }
  return values;
}

function validateArtStyleSamples(
  prefix: string,
  artStyle: string,
  canonical: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (artStyle !== canonical) {
    issues.push({
      code: 'ARTSTYLE_NOT_CANONICAL',
      message: `${prefix}: artStyle does not exactly match CANONICAL_GONEGI_ARTSTYLE`,
      severity: 'error',
    });
  }

  if (detectArtStyleExpansion(artStyle)) {
    issues.push({
      code: 'ARTSTYLE_EXPANSION_DETECTED',
      message: `${prefix}: artStyle contains forbidden master_style_core expansion markers`,
      severity: 'error',
    });
  }

  if (isForbiddenGeneratedArtStyle(artStyle) && artStyle !== canonical) {
    issues.push({
      code: 'ARTSTYLE_SERIALIZER_GENERATED',
      message: `${prefix}: artStyle matches forbidden serializer-generated style`,
      severity: 'error',
    });
  }

  return issues;
}

export function runMovieArtstyleLockValidation(root: string): MovieArtstyleLockReport {
  const canonicalRecord = loadCanonicalArtStyleRecord(root);
  const canonical = copySourceOfTruthArtStyle(root);
  const canonicalRef = SOURCE_OF_TRUTH_ARTSTYLE_REF;

  if (canonicalRecord.constant_key !== CANONICAL_GONEGI_ARTSTYLE_CONSTANT_KEY) {
    throw new Error('canonical-artstyle.json constant_key mismatch');
  }

  ensureSourceOfTruthFrozen(root);
  writeMovieMasterDatasetBindings(root);
  const bindingReport = writeMovieMasterDatasetBindingReport(root);
  writeMovieImageAppNativeImports(root);
  writeMovieScenarioQualityReport(root);

  const bindingDatasets = loadAllMovieMasterDatasetBindingDatasets(root);
  const nativeImportDatasets = loadAllMovieImageAppNativeImportDatasets(root);

  const issues: ValidationIssue[] = [];
  const artStyleSamples: string[] = [];
  let artStyleGeneratedDetected = false;

  for (const dataset of bindingDatasets) {
    for (const binding of dataset.scene_bindings) {
      artStyleSamples.push(binding.image_app_native_format.artStyle);
      if (binding.field_binding.artStyle.generated) {
        artStyleGeneratedDetected = true;
        issues.push({
          code: 'ARTSTYLE_GENERATED_IN_BINDING',
          message: `${binding.scene_id}: field_binding.artStyle.generated must be false`,
          severity: 'error',
        });
      }
      if (binding.field_binding.artStyle.source_ref !== canonicalRef) {
        issues.push({
          code: 'ARTSTYLE_SOURCE_REF_NOT_CANONICAL',
          message: `${binding.scene_id}: artStyle source_ref must be ${canonicalRef}`,
          severity: 'error',
        });
      }
      issues.push(
        ...validateArtStyleSamples(
          `binding:${binding.scene_id}`,
          binding.image_app_native_format.artStyle,
          canonical
        )
      );
    }
  }

  for (const dataset of nativeImportDatasets) {
    dataset.slots.forEach((slot, index) => {
      artStyleSamples.push(slot.artStyle);
      issues.push(
        ...validateArtStyleSamples(
          `native_import:${dataset.movie_id}[${index}]`,
          slot.artStyle,
          canonical
        )
      );
    });
  }

  for (const artStyle of loadScenarioTestArtStyles(root)) {
    artStyleSamples.push(artStyle);
    issues.push(...validateArtStyleSamples('scenario_test', artStyle, canonical));
  }

  const variants = collectArtStyleVariants(artStyleSamples);
  if (variants.length !== 1) {
    issues.push({
      code: 'ARTSTYLE_VARIANT_COUNT_INVALID',
      message: `Expected artStyle_variant_count=1, found ${variants.length}`,
      severity: 'error',
    });
  }

  const expansionDetected = artStyleSamples.some((artStyle) => detectArtStyleExpansion(artStyle));
  const exactMatch =
    artStyleSamples.length > 0 && artStyleSamples.every((artStyle) => artStyle === canonical);
  const artStyleGenerated = artStyleGeneratedDetected;
  const artStyleVariantCount = variants.length;

  const errors = issues.filter((issue) => issue.severity === 'error');
  const canonicalArtstyleLocked =
    exactMatch && !expansionDetected && artStyleVariantCount === 1 && !artStyleGenerated;
  const gonegiIdentityLocked =
    canonicalArtstyleLocked &&
    !detectArtStyleIdOnly(canonical) &&
    canonicalRecord.identity_lock.expansion_forbidden === true;

  const validationPassed =
    errors.length === 0 &&
    canonicalArtstyleLocked &&
    gonegiIdentityLocked &&
    bindingReport.final_verdict.startsWith('PASS');

  return {
    report_id: `movie_artstyle_lock_report_${Date.now().toString(36)}`,
    phase: MOVIE_ARTSTYLE_LOCK_PHASE,
    system_id: MOVIE_ARTSTYLE_LOCK_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed ? MOVIE_ARTSTYLE_LOCK_PASS_VERDICT : MOVIE_ARTSTYLE_LOCK_FAIL_VERDICT,
    validation_passed: validationPassed,
    canonical_artstyle_locked: canonicalArtstyleLocked,
    gonegi_identity_locked: gonegiIdentityLocked,
    canonical_artstyle_path: SOURCE_OF_TRUTH_ARTSTYLE_PATH,
    canonical_artstyle_ref: canonicalRef,
    CANONICAL_GONEGI_ARTSTYLE: canonical,
    upstream_master_dataset_binding_verdict: bindingReport.final_verdict,
    checks: {
      artStyle_exact_match: exactMatch,
      artStyle_generated: artStyleGenerated,
      artStyle_expansion_detected: expansionDetected,
      artStyle_variant_count: artStyleVariantCount,
    },
    metrics: {
      binding_scene_count: bindingDatasets.reduce(
        (sum, dataset) => sum + dataset.scene_bindings.length,
        0
      ),
      native_import_slot_count: nativeImportDatasets.reduce(
        (sum, dataset) => sum + dataset.slots.length,
        0
      ),
      scenario_test_count: SCENARIO_TEST_SCENES.length,
      artStyle_sample_count: artStyleSamples.length,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeMovieArtstyleLockReport(projectRoot?: string): MovieArtstyleLockReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runMovieArtstyleLockValidation(root);
  writeJson(root, MOVIE_ARTSTYLE_LOCK_REPORT_PATH, report);
  return report;
}

export { loadCanonicalGonegiArtStyle, CANONICAL_GONEGI_ARTSTYLE_CONSTANT_KEY, SAFE_CREATE_POLICY };
