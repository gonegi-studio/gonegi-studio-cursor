import fs from 'node:fs';
import path from 'node:path';
import {
  APPROVED_ORIGINALS_MANIFEST_PATH,
  ARTSTYLE_APPROVED_PATH,
  CHARACTER_APPROVED_PATH,
  FINAL_SOURCE_LOCK_PHASE,
  FINAL_SOURCE_LOCK_SYSTEM_ID,
  REQUIRED_APPROVED_ORIGINAL_PATHS,
  REQUIRED_APPROVED_CHARACTER_IDS,
  assertApprovedOriginalsPresent,
  copyApprovedOriginalArtStyle,
  copyApprovedOriginalCharacterPrompt,
  copyApprovedOriginalTimeSettingPrompt,
  loadApprovedOriginalCharacterPrompts,
  loadApprovedOriginalTimeSettingPrompts,
  loadApprovedOriginalsManifest,
  TIMESETTING_APPROVED_PATH,
} from './approvedOriginalsLoader.js';
import {
  FORBIDDEN_LEGACY_SOURCE_PREFIXES,
  isForbiddenLegacySourceRef,
} from './forbiddenLegacySourcePaths.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const FINAL_SOURCE_LOCK_PASS_VERDICT = 'PASS_FINAL_SOURCE_LOCK_V1' as const;
export const FINAL_SOURCE_LOCK_FAIL_VERDICT = 'FAIL_FINAL_SOURCE_LOCK_V1' as const;

export const FINAL_SOURCE_LOCK_BUILDER_PATHS = [
  'services/movieMasterDatasetBinding.ts',
  'services/movieMasterScenarioPackageBuilder.ts',
  'services/sourceOfTruthLoader.ts',
] as const;

type IssueSeverity = 'error' | 'warning';

export interface FinalSourceLockValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface FinalSourceLockValidationResult {
  phase: typeof FINAL_SOURCE_LOCK_PHASE;
  system_id: typeof FINAL_SOURCE_LOCK_SYSTEM_ID;
  generated_at: string;
  validation_passed: boolean;
  final_verdict: string;
  checks: {
    artstyle_exists: boolean;
    character_exists: boolean;
    timesetting_exists: boolean;
    approved_originals_only: boolean;
    legacy_source_usage: boolean;
    builder_source_integrity: boolean;
  };
  issues: FinalSourceLockValidationIssue[];
}

function fileExists(root: string, rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

function scanBuilderForForbiddenLegacyImports(
  root: string,
  builderRel: string,
  issues: FinalSourceLockValidationIssue[]
): boolean {
  const full = path.join(root, builderRel);
  if (!fs.existsSync(full)) {
    issues.push({
      code: 'BUILDER_FILE_MISSING',
      message: `Missing builder file ${builderRel}`,
      severity: 'error',
    });
    return false;
  }

  const content = fs.readFileSync(full, 'utf8');
  let clean = true;

  for (const forbidden of FORBIDDEN_LEGACY_SOURCE_PREFIXES) {
    if (content.includes(forbidden)) {
      issues.push({
        code: 'BUILDER_LEGACY_SOURCE_REFERENCE',
        message: `${builderRel} references forbidden legacy source ${forbidden}`,
        severity: 'error',
      });
      clean = false;
    }
  }

  const forbiddenImportPatterns = [
    /from '\.\/imageAppPromptLoader\.js'/,
    /from '\.\/generationContextLoader\.js'/,
    /loadTimeSettingLibrary\(/,
    /loadCharacterSimpleLibrary\(/,
    /copyImageAppArtStylePrompt\(/,
    /copyImageAppCharacterFieldFromGraph\(/,
    /copyImageAppTimeSettingPrompt\(/,
  ];

  for (const pattern of forbiddenImportPatterns) {
    if (pattern.test(content)) {
      issues.push({
        code: 'BUILDER_LEGACY_IMPORT',
        message: `${builderRel} contains forbidden legacy builder usage (${pattern})`,
        severity: 'error',
      });
      clean = false;
    }
  }

  return clean;
}

export function runFinalSourceLockValidation(root: string): FinalSourceLockValidationResult {
  const issues: FinalSourceLockValidationIssue[] = [];

  const artstyleExists = fileExists(root, ARTSTYLE_APPROVED_PATH);
  const characterExists = fileExists(root, CHARACTER_APPROVED_PATH);
  const timesettingExists = fileExists(root, TIMESETTING_APPROVED_PATH);
  const manifestExists = fileExists(root, APPROVED_ORIGINALS_MANIFEST_PATH);

  if (!artstyleExists) {
    issues.push({ code: 'ARTSTYLE_MISSING', message: ARTSTYLE_APPROVED_PATH, severity: 'error' });
  }
  if (!characterExists) {
    issues.push({ code: 'CHARACTER_MISSING', message: CHARACTER_APPROVED_PATH, severity: 'error' });
  }
  if (!timesettingExists) {
    issues.push({ code: 'TIMESETTING_MISSING', message: TIMESETTING_APPROVED_PATH, severity: 'error' });
  }
  if (!manifestExists) {
    issues.push({
      code: 'MANIFEST_MISSING',
      message: APPROVED_ORIGINALS_MANIFEST_PATH,
      severity: 'error',
    });
  }

  let approvedOriginalsOnly = artstyleExists && characterExists && timesettingExists && manifestExists;
  if (approvedOriginalsOnly) {
    try {
      assertApprovedOriginalsPresent(root);
      const manifest = loadApprovedOriginalsManifest(root);
      if (manifest.cursor_modification_allowed !== false || manifest.cursor_regeneration_allowed !== false) {
        approvedOriginalsOnly = false;
        issues.push({
          code: 'MANIFEST_NOT_LOCKED',
          message: 'APPROVED_ORIGINALS_MANIFEST.json must lock cursor modification/regeneration',
          severity: 'error',
        });
      }

      copyApprovedOriginalArtStyle(root);
      const characters = loadApprovedOriginalCharacterPrompts(root);
      for (const characterId of REQUIRED_APPROVED_CHARACTER_IDS) {
        copyApprovedOriginalCharacterPrompt(characterId, root);
        if (!characters[characterId]) {
          approvedOriginalsOnly = false;
        }
      }
      const timeSettings = loadApprovedOriginalTimeSettingPrompts(root);
      if (Object.keys(timeSettings).length === 0) {
        approvedOriginalsOnly = false;
        issues.push({
          code: 'TIMESETTING_EMPTY',
          message: 'timesetting-approved.json has no entries',
          severity: 'error',
        });
      }
    } catch (error) {
      approvedOriginalsOnly = false;
      issues.push({
        code: 'APPROVED_ORIGINALS_INVALID',
        message: error instanceof Error ? error.message : String(error),
        severity: 'error',
      });
    }
  }

  const missingApproved = REQUIRED_APPROVED_ORIGINAL_PATHS.filter((rel) => !fileExists(root, rel));
  if (missingApproved.length > 0) {
    issues.push({
      code: 'APPROVED_ORIGINALS_INCOMPLETE',
      message: `Missing approved originals: ${missingApproved.join(', ')}`,
      severity: 'error',
    });
  }

  let legacySourceUsageClean = true;
  let builderSourceIntegrity = true;
  for (const builderPath of FINAL_SOURCE_LOCK_BUILDER_PATHS) {
    const clean = scanBuilderForForbiddenLegacyImports(root, builderPath, issues);
    builderSourceIntegrity = builderSourceIntegrity && clean;
  }

  legacySourceUsageClean = builderSourceIntegrity;

  const validationPassed =
    artstyleExists &&
    characterExists &&
    timesettingExists &&
    approvedOriginalsOnly &&
    legacySourceUsageClean &&
    builderSourceIntegrity &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  return {
    phase: FINAL_SOURCE_LOCK_PHASE,
    system_id: FINAL_SOURCE_LOCK_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    validation_passed: validationPassed,
    final_verdict: validationPassed ? FINAL_SOURCE_LOCK_PASS_VERDICT : FINAL_SOURCE_LOCK_FAIL_VERDICT,
    checks: {
      artstyle_exists: artstyleExists,
      character_exists: characterExists,
      timesetting_exists: timesettingExists,
      approved_originals_only: approvedOriginalsOnly,
      legacy_source_usage: legacySourceUsageClean,
      builder_source_integrity: builderSourceIntegrity,
    },
    issues,
  };
}

export function validateFinalSourceLock(projectRoot?: string): FinalSourceLockValidationResult {
  return runFinalSourceLockValidation(resolveProjectRoot(projectRoot));
}
