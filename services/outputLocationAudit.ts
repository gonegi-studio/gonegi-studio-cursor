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
  MOVIE_SPATIAL_EXPORT_ROOT,
  MOVIE_SPATIAL_MANUAL_DIR,
  MOVIE_SPATIAL_TEST_DIR,
  NATIVE_IMPORT_V8_ACTIVE_OUTPUTS,
  REAL_IMAGE_APP_MANUAL_ASSETS,
  REGISTERED_IMAGE_APP_EXPORT_PATHS,
  isControlledMovieSpatialPath,
  isForbiddenImageAppOutputPath,
  isUnderMovieSpatialExportRoot,
} from './generationOutputPaths.js';
import { runGenerationOutputLock } from './generationOutputLockBuilder.js';
import {
  MovieImageAppNativeImportV8Dataset,
  NATIVE_IMPORT_REQUIRED_SLOT_FIELDS,
} from './movieImageAppNativeImportBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const OUTPUT_LOCATION_AUDIT_REPORT_PATH =
  'reports/project_governance/OUTPUT_LOCATION_AUDIT_REPORT.json' as const;
export const GENERATION_OUTPUT_LOCK_PASS_VERDICT = 'PASS_GENERATION_OUTPUT_LOCK_V1' as const;
export const GENERATION_OUTPUT_LOCK_FAIL_VERDICT = 'FAIL_GENERATION_OUTPUT_LOCK_V1' as const;

const BUILDER_SCAN_DIR = 'services' as const;

const ALLOWED_BUILDER_OUTPUT_PATTERNS = [
  /^exports\/movie_spatial\/(ACTIVE|TEST|MANUAL|ARCHIVE)\//,
  /^legacy\/exports\/movie_spatial\//,
  /^datasets\/movie_spatial\//,
  /^reports\/(project_governance|generation_context|movie_spatial)\//,
] as const;

const BUILDER_SCAN_EXCLUDED_FILES = ['generationOutputLockBuilder.ts'] as const;

const IMAGE_APP_BUILDER_FILES = [
  'movieImageAppNativeImportBuilder.ts',
  'generationOutputLockBuilder.ts',
  'generationOutputPaths.ts',
  'imageAppRealTestAudit.ts',
  'realImageAppManualValidation.ts',
  'movieImageImportTestBuilder.ts',
  'movieImageGenerationValidation.ts',
  'movieImageAppExportBuilder.ts',
  'movieRealImageAppValidation.ts',
  'movieRealImageAudit.ts',
] as const;

interface AuditIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

interface GenerationOutputRules {
  generation_output_locked: boolean;
  single_output_root_required: boolean;
  arbitrary_output_forbidden: boolean;
  official_output_root: string;
}

export interface OutputLocationAuditReport {
  report_id: string;
  phase: typeof GENERATION_OUTPUT_LOCK_PHASE;
  system_id: typeof GENERATION_OUTPUT_LOCK_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  output_root_locked: boolean;
  single_output_location_enforced: boolean;
  test_pack_created: boolean;
  future_output_pollution_prevented: boolean;
  image_app_testing_ready: boolean;
  metrics: {
    compliant_exports: number;
    illegal_exports: number;
    active_exports: number;
    test_exports: number;
    manual_exports: number;
    archive_exports: number;
    uncontrolled_root_exports: number;
    builder_violations: number;
  };
  controlled_directories: string[];
  registered_exports: string[];
  illegal_paths: string[];
  builder_violations: string[];
  issues: AuditIssue[];
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function loadGenerationOutputRules(root: string): GenerationOutputRules {
  return JSON.parse(
    fs.readFileSync(path.join(root, GENERATION_OUTPUT_RULES_PATH), 'utf8')
  ) as GenerationOutputRules;
}

function listFilesRecursive(dir: string, base = dir): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries: string[] = [];

  for (const entry of fs.readdirSync(dir)) {
    if (entry.startsWith('.')) continue;
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      entries.push(...listFilesRecursive(full, base));
    } else {
      entries.push(full.slice(base.length + 1).replace(/\\/g, '/'));
    }
  }

  return entries;
}

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateTestPackAgainstActive(
  root: string,
  testPath: string,
  activePath: string,
  issues: AuditIssue[]
): boolean {
  const testFull = path.join(root, testPath);
  const activeFull = path.join(root, activePath);

  if (!fs.existsSync(testFull) || !fs.existsSync(activeFull)) {
    return false;
  }

  const testDataset = JSON.parse(fs.readFileSync(testFull, 'utf8')) as MovieImageAppNativeImportV8Dataset;
  const activeDataset = JSON.parse(fs.readFileSync(activeFull, 'utf8')) as MovieImageAppNativeImportV8Dataset;

  let valid = true;

  if (testDataset.slots.length > activeDataset.slots.length) {
    valid = false;
    issues.push({
      code: 'TEST_PACK_SLOT_OVERFLOW',
      message: `${testPath} has more slots than ${activePath}`,
      severity: 'error',
    });
  }

  for (let index = 0; index < testDataset.slots.length; index += 1) {
    const testSlot = testDataset.slots[index];
    const activeSlot = activeDataset.slots[index];
    const prefix = `${testPath}[${index}]`;

    for (const field of NATIVE_IMPORT_REQUIRED_SLOT_FIELDS) {
      if (testSlot[field] !== activeSlot[field]) {
        valid = false;
        issues.push({
          code: 'TEST_PACK_FIELD_MISMATCH',
          message: `${prefix}.${field} must match active export slot content exactly`,
          severity: 'error',
        });
      }
    }
  }

  if (testDataset.slot_count !== testDataset.slots.length) {
    valid = false;
    issues.push({
      code: 'TEST_PACK_SLOT_COUNT_MISMATCH',
      message: `${testPath} slot_count does not match slots.length`,
      severity: 'error',
    });
  }

  return valid;
}

function scanBuilderViolations(root: string, issues: AuditIssue[]): string[] {
  const violations: string[] = [];
  const servicesDir = path.join(root, BUILDER_SCAN_DIR);

  for (const fileName of IMAGE_APP_BUILDER_FILES) {
    if (BUILDER_SCAN_EXCLUDED_FILES.includes(fileName as (typeof BUILDER_SCAN_EXCLUDED_FILES)[number])) {
      continue;
    }
    const full = path.join(servicesDir, fileName);
    if (!fs.existsSync(full)) continue;

    const content = fs.readFileSync(full, 'utf8');
    const matches = content.matchAll(/['"](exports\/movie_spatial\/[^'"]+)['"]/g);

    for (const match of matches) {
      const outputPath = match[1];
      if (isForbiddenImageAppOutputPath(outputPath)) {
        violations.push(`${fileName}:${outputPath}`);
        issues.push({
          code: 'BUILDER_FORBIDDEN_OUTPUT_PATH',
          message: `${fileName} references forbidden output path ${outputPath}`,
          severity: 'error',
        });
      }
    }
  }

  return violations;
}

function auditFilesystem(root: string, issues: AuditIssue[]): {
  compliant_exports: number;
  illegal_exports: number;
  active_exports: number;
  test_exports: number;
  manual_exports: number;
  archive_exports: number;
  uncontrolled_root_exports: number;
  illegal_paths: string[];
} {
  const illegal_paths: string[] = [];
  let active_exports = 0;
  let test_exports = 0;
  let manual_exports = 0;
  let archive_exports = 0;
  let uncontrolled_root_exports = 0;

  const exportRoot = path.join(root, MOVIE_SPATIAL_EXPORT_ROOT);
  if (!fs.existsSync(exportRoot)) {
    issues.push({
      code: 'EXPORT_ROOT_MISSING',
      message: `Missing ${MOVIE_SPATIAL_EXPORT_ROOT}/`,
      severity: 'error',
    });
    return {
      compliant_exports: 0,
      illegal_exports: 0,
      active_exports,
      test_exports,
      manual_exports,
      archive_exports,
      uncontrolled_root_exports,
      illegal_paths,
    };
  }

  for (const entry of fs.readdirSync(exportRoot)) {
    if (entry.startsWith('.')) continue;
    const entryRel = `${MOVIE_SPATIAL_EXPORT_ROOT}/${entry}`.replace(/\\/g, '/');
    const full = path.join(exportRoot, entry);
    const isDir = fs.statSync(full).isDirectory();

    if (isDir) {
      if (!MOVIE_SPATIAL_CONTROLLED_DIRS.some((dir) => dir.endsWith(`/${entry}`))) {
        uncontrolled_root_exports += 1;
        illegal_paths.push(`${entryRel}/`);
        issues.push({
          code: 'UNCONTROLLED_EXPORT_DIRECTORY',
          message: `${entryRel}/ is not under ACTIVE/TEST/MANUAL/ARCHIVE`,
          severity: 'error',
        });
      }
      continue;
    }

    uncontrolled_root_exports += 1;
    illegal_paths.push(entryRel);
    issues.push({
      code: 'UNCONTROLLED_ROOT_EXPORT',
      message: `${entryRel} must be relocated under ACTIVE/TEST/MANUAL/ARCHIVE`,
      severity: 'error',
    });
  }

  const activeFiles = listFilesRecursive(path.join(root, MOVIE_SPATIAL_ACTIVE_DIR));
  active_exports = activeFiles.length;

  const testFiles = listFilesRecursive(path.join(root, MOVIE_SPATIAL_TEST_DIR));
  test_exports = testFiles.length;

  const manualFiles = listFilesRecursive(path.join(root, MOVIE_SPATIAL_MANUAL_DIR));
  manual_exports = manualFiles.length;

  const archiveFiles = listFilesRecursive(path.join(root, MOVIE_SPATIAL_ARCHIVE_DIR));
  archive_exports = archiveFiles.length;

  for (const required of NATIVE_IMPORT_V8_ACTIVE_OUTPUTS.map((spec) => spec.output_path)) {
    if (!fs.existsSync(path.join(root, required))) {
      illegal_paths.push(required);
      issues.push({
        code: 'ACTIVE_EXPORT_MISSING',
        message: `Missing required active export ${required}`,
        severity: 'error',
      });
    }
  }

  for (const required of IMAGE_APP_TEST_PACK_OUTPUTS.map((spec) => spec.output_path)) {
    if (!fs.existsSync(path.join(root, required))) {
      illegal_paths.push(required);
      issues.push({
        code: 'TEST_PACK_MISSING',
        message: `Missing required test pack ${required}`,
        severity: 'error',
      });
    }
  }

  const compliant_exports = active_exports + test_exports + manual_exports + archive_exports;
  const illegal_exports = uncontrolled_root_exports;

  return {
    compliant_exports,
    illegal_exports,
    active_exports,
    test_exports,
    manual_exports,
    archive_exports,
    uncontrolled_root_exports,
    illegal_paths,
  };
}

export function runOutputLocationAudit(projectRoot?: string): OutputLocationAuditReport {
  const root = resolveProjectRoot(projectRoot);
  runGenerationOutputLock(root);

  const issues: AuditIssue[] = [];
  const rules = loadGenerationOutputRules(root);

  const output_root_locked =
    rules.generation_output_locked === true &&
    rules.single_output_root_required === true &&
    rules.arbitrary_output_forbidden === true;

  if (!output_root_locked) {
    issues.push({
      code: 'GENERATION_OUTPUT_RULES_INVALID',
      message: 'GENERATION_OUTPUT_RULES.json must lock generation output policy',
      severity: 'error',
    });
  }

  if (rules.official_output_root !== `${MOVIE_SPATIAL_EXPORT_ROOT}/`) {
    issues.push({
      code: 'OFFICIAL_OUTPUT_ROOT_MISMATCH',
      message: `official_output_root must be ${MOVIE_SPATIAL_EXPORT_ROOT}/`,
      severity: 'error',
    });
  }

  const filesystem = auditFilesystem(root, issues);
  const builder_violations = scanBuilderViolations(root, issues);

  for (const testSpec of IMAGE_APP_TEST_PACK_OUTPUTS) {
    const activeSpec = NATIVE_IMPORT_V8_ACTIVE_OUTPUTS.find(
      (entry) => entry.movie_id === testSpec.movie_id
    );
    if (!activeSpec) continue;
    validateTestPackAgainstActive(root, testSpec.output_path, activeSpec.output_path, issues);
  }

  const single_output_location_enforced = filesystem.uncontrolled_root_exports === 0;
  const test_pack_created =
    IMAGE_APP_TEST_PACK_OUTPUTS.every((spec) => fs.existsSync(path.join(root, spec.output_path))) &&
    filesystem.test_exports >= IMAGE_APP_TEST_PACK_OUTPUTS.length;

  const future_output_pollution_prevented =
    output_root_locked &&
    single_output_location_enforced &&
    builder_violations.length === 0 &&
    filesystem.illegal_exports === 0;

  const image_app_testing_ready =
    test_pack_created &&
    NATIVE_IMPORT_V8_ACTIVE_OUTPUTS.every((spec) =>
      fs.existsSync(path.join(root, spec.output_path))
    ) &&
    fs.existsSync(path.join(root, MOVIE_SPATIAL_MANUAL_DIR));

  const validation_passed =
    output_root_locked &&
    single_output_location_enforced &&
    test_pack_created &&
    future_output_pollution_prevented &&
    image_app_testing_ready &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  return {
    report_id: 'OUTPUT_LOCATION_AUDIT_REPORT',
    phase: GENERATION_OUTPUT_LOCK_PHASE,
    system_id: GENERATION_OUTPUT_LOCK_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? GENERATION_OUTPUT_LOCK_PASS_VERDICT
      : GENERATION_OUTPUT_LOCK_FAIL_VERDICT,
    validation_passed,
    output_root_locked,
    single_output_location_enforced,
    test_pack_created,
    future_output_pollution_prevented,
    image_app_testing_ready,
    metrics: {
      ...filesystem,
      builder_violations: builder_violations.length,
    },
    controlled_directories: [...MOVIE_SPATIAL_CONTROLLED_DIRS],
    registered_exports: [...REGISTERED_IMAGE_APP_EXPORT_PATHS],
    illegal_paths: filesystem.illegal_paths,
    builder_violations,
    issues,
  };
}

export function writeOutputLocationAuditReport(projectRoot?: string): OutputLocationAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runOutputLocationAudit(root);
  writeJson(root, OUTPUT_LOCATION_AUDIT_REPORT_PATH, report);
  return report;
}

export {
  GENERATION_OUTPUT_RULES_PATH,
  REAL_IMAGE_APP_MANUAL_ASSETS,
  isControlledMovieSpatialPath,
  isForbiddenImageAppOutputPath,
  isUnderMovieSpatialExportRoot,
};
