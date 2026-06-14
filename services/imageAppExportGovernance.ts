import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  IMAGE_APP_ARCHIVE_DIR,
  IMAGE_APP_LATEST_DIR,
  IMAGE_APP_REPORTS_DIR,
  ensureGovernanceDirectories,
  writeGovernedReport,
} from './exportGovernance.js';
import {
  assertLatestOutdoorLayoutAdapterIsV2Safe,
  CHARACTER_FIRST_CONTRACT_LATEST_PATH,
  CHARACTER_FIRST_CONTRACT_PATH,
  OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH,
  OUTDOOR_LAYOUT_LOCK_V2_ADAPTER_PATH,
  publishOutdoorLayoutLockProductionArtifacts,
} from './outdoorLayoutLock.js';
import {
  IDENTITY_PROTECTION_FINAL_VERDICT_PASS,
  runIdentityProtectionFrameworkAudit,
} from './identityProtectionFramework.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const IMAGE_APP_LATEST_CONTRACT_FILES = ['character-first-contract.json'] as const;

export const IMAGE_APP_EXPORT_GOVERNANCE_VERSION = 'EXPORT-001-v1' as const;
export const IMAGE_APP_EXPORT_GOVERNANCE_PHASE = 'PHASE-EXPORT-001' as const;

export const IMAGE_APP_UPLOAD_BUNDLE_DIR = 'exports/image_app/upload_bundle' as const;
export const IMAGE_APP_ADAPTERS_DIR = 'exports/image_app/adapters' as const;
export const IMAGE_APP_TEST_BATCHES_DIR = 'exports/image_app/test_batches' as const;
export const RENDER_FEEDBACK_DIR = 'datasets/render_feedback' as const;
export const RKB_005_SCORECARD_PATH = 'datasets/render_feedback/RKB-005_SCORECARD.json' as const;
export const IMAGE_APP_UPLOAD_MANIFEST_PATH =
  'exports/image_app/upload_bundle/image-app-upload-manifest.json' as const;

export const IMAGE_APP_LATEST_ALLOWLIST = [
  'cinematic-dna-library-import.json',
  'image-app-brain-ingestion-package.json',
  'living-world-core-v1-package.json',
  'living-world-image-adapter.json',
  'music-drama-image-adapter.json',
  'location-lighting-image-adapter.json',
  'indoor-location-anchor-adapter.json',
  'lighting-anchor-adapter.json',
  'shot-grammar-adapter.json',
  'emotion-acting-adapter.json',
  'instrumental-mv-adapter.json',
  'ballad-mv-adapter.json',
  'prop-anchor-adapter.json',
  'room-layout-lock-adapter.json',
  'scene-asset-composition-adapter.json',
  'outdoor-layout-lock-adapter.json',
  'character-first-contract.json',
] as const;

export const IMAGE_APP_UPLOAD_FILE_COUNT = IMAGE_APP_LATEST_ALLOWLIST.length;

export type ImageAppLatestAllowlistFile = (typeof IMAGE_APP_LATEST_ALLOWLIST)[number];

export const IMAGE_APP_ADAPTER_FILENAMES = [
  'living-world-image-adapter.json',
  'music-drama-image-adapter.json',
  'location-lighting-image-adapter.json',
  'indoor-location-anchor-adapter.json',
  'lighting-anchor-adapter.json',
  'shot-grammar-adapter.json',
  'emotion-acting-adapter.json',
  'instrumental-mv-adapter.json',
  'ballad-mv-adapter.json',
  'prop-anchor-adapter.json',
  'room-layout-lock-adapter.json',
  'scene-asset-composition-adapter.json',
  'outdoor-layout-lock-adapter.json',
] as const;

export const IMAGE_APP_GOVERNANCE_DIRECTORY_PATHS = [
  IMAGE_APP_UPLOAD_BUNDLE_DIR,
  IMAGE_APP_ADAPTERS_DIR,
  IMAGE_APP_TEST_BATCHES_DIR,
  IMAGE_APP_LATEST_DIR,
  IMAGE_APP_ARCHIVE_DIR,
  IMAGE_APP_REPORTS_DIR,
] as const;

const LATEST_FORBIDDEN_PATTERNS: readonly RegExp[] = [
  /^rkb-/i,
  /^qa-/i,
  /^audit-/i,
  /-report\./i,
  /-scorecard\./i,
  /-visual-comparison\./i,
  /-test-batch\./i,
  /^verification-/i,
  /^validation-/i,
];

const TEST_BATCH_FILENAME_PATTERN = /-test-batch\.json$/i;
const REPORT_FILENAME_PATTERN = /-report\.json$/i;

export type ImageAppExportGovernanceVerdict =
  | 'PASS_IMAGE_APP_EXPORT_GOVERNANCE_V1'
  | 'FAIL_PRECHECK'
  | 'FAIL_FORBIDDEN_IN_LATEST'
  | 'FAIL_TEST_BATCH_MISPLACED'
  | 'FAIL_REPORT_MISPLACED'
  | 'FAIL_LATEST_INCOMPLETE'
  | 'FAIL_OUTDOOR_LAYOUT_NOT_V2'
  | 'FAIL_IDENTITY_PROTECTION';

export type ImageAppExportGovernanceViolation = {
  code: ImageAppExportGovernanceVerdict;
  message: string;
  field?: string;
};

export type ImageAppExportGovernanceReport = {
  phase: typeof IMAGE_APP_EXPORT_GOVERNANCE_PHASE;
  governance_version: typeof IMAGE_APP_EXPORT_GOVERNANCE_VERSION;
  generated_at: string;
  precheck: {
    latest_dir_present: boolean;
    render_feedback_present: boolean;
    rkb_005_verdict: string | null;
    pass: boolean;
  };
  latest_policy: {
    allowlist: readonly string[];
    files_present: readonly string[];
    forbidden_found: readonly string[];
    extra_files: readonly string[];
    missing_required: readonly string[];
    pass: boolean;
  };
  test_batches: {
    files_in_test_batches: readonly string[];
    misplaced_in_latest: readonly string[];
    pass: boolean;
  };
  reports: {
    files_in_reports: readonly string[];
    misplaced_in_latest: readonly string[];
    pass: boolean;
  };
  adapters: {
    files_in_adapters: readonly string[];
    pass: boolean;
  };
  upload_manifest_path: typeof IMAGE_APP_UPLOAD_MANIFEST_PATH;
  outdoor_layout_v2_guard: {
    latest_adapter_path: typeof OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH;
    pass: boolean;
    violations: readonly string[];
  };
  dataset_16: {
    upload_filename: 'outdoor-layout-lock-adapter.json';
    production_variant: 'v2';
    full_reference_path: 'exports/image_app/adapters/full_reference/outdoor-layout-lock-adapter-full.json';
    character_first_contract_path: typeof CHARACTER_FIRST_CONTRACT_LATEST_PATH;
  };
  identity_protection: {
    final_verdict: string;
    pass: boolean;
    violations: readonly string[];
  };
  final_verdict: ImageAppExportGovernanceVerdict;
  violations: readonly ImageAppExportGovernanceViolation[];
};

function isForbiddenLatestFilename(filename: string): boolean {
  return LATEST_FORBIDDEN_PATTERNS.some((pattern) => pattern.test(filename));
}

const IMAGE_APP_LATEST_CORE_FILES = [
  'cinematic-dna-library-import.json',
  'image-app-brain-ingestion-package.json',
  'living-world-core-v1-package.json',
] as const;

function listJsonFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.endsWith('.json'));
}

function sha256File(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function moveFileIfExists(source: string, target: string, moved: string[]): void {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target)) {
    fs.unlinkSync(source);
    return;
  }
  fs.renameSync(source, target);
  moved.push(target);
}

export function adapterPath(filename: string): string {
  return `${IMAGE_APP_ADAPTERS_DIR}/${filename}`;
}

export function latestPath(filename: string): string {
  return `${IMAGE_APP_LATEST_DIR}/${filename}`;
}

export function testBatchPath(filename: string): string {
  return `${IMAGE_APP_TEST_BATCHES_DIR}/${filename}`;
}

export function runImageAppExportPrecheck(projectRoot?: string): {
  pass: boolean;
  violations: string[];
  rkb005Verdict: string | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const violations: string[] = [];

  if (!fs.existsSync(path.join(root, IMAGE_APP_LATEST_DIR))) {
    violations.push(`Missing ${IMAGE_APP_LATEST_DIR}`);
  }
  if (!fs.existsSync(path.join(root, RENDER_FEEDBACK_DIR))) {
    violations.push(`Missing ${RENDER_FEEDBACK_DIR}`);
  }

  const scorecardPath = path.join(root, RKB_005_SCORECARD_PATH);
  let rkb005Verdict: string | null = null;
  if (!fs.existsSync(scorecardPath)) {
    violations.push(`Missing ${RKB_005_SCORECARD_PATH}`);
  } else {
    const scorecard = JSON.parse(fs.readFileSync(scorecardPath, 'utf8')) as {
      final_verdict?: string;
    };
    rkb005Verdict = scorecard.final_verdict ?? null;
    if (rkb005Verdict !== 'PASS_RKB_005_LIGHTING_VALIDATION') {
      violations.push(
        `Expected PASS_RKB_005_LIGHTING_VALIDATION, got ${rkb005Verdict ?? 'missing'}`
      );
    }
  }

  return { pass: violations.length === 0, violations, rkb005Verdict };
}

export function migrateImageAppExportLayout(projectRoot?: string): {
  moved_to_test_batches: string[];
  moved_to_reports: string[];
  moved_to_adapters: string[];
  removed_from_latest: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  ensureGovernanceDirectories(root);

  for (const relativeDir of IMAGE_APP_GOVERNANCE_DIRECTORY_PATHS) {
    fs.mkdirSync(path.join(root, relativeDir), { recursive: true });
  }

  const latestDir = path.join(root, IMAGE_APP_LATEST_DIR);
  const adaptersDir = path.join(root, IMAGE_APP_ADAPTERS_DIR);
  const testBatchesDir = path.join(root, IMAGE_APP_TEST_BATCHES_DIR);
  const reportsDir = path.join(root, IMAGE_APP_REPORTS_DIR);
  const renderFeedbackDir = path.join(root, RENDER_FEEDBACK_DIR);

  const movedToTestBatches: string[] = [];
  const movedToReports: string[] = [];
  const movedToAdapters: string[] = [];
  const removedFromLatest: string[] = [];

  for (const filename of listJsonFiles(latestDir)) {
    const source = path.join(latestDir, filename);

    if (TEST_BATCH_FILENAME_PATTERN.test(filename) || /^rkb-/i.test(filename)) {
      moveFileIfExists(source, path.join(testBatchesDir, filename), movedToTestBatches);
      removedFromLatest.push(filename);
      continue;
    }

    if (REPORT_FILENAME_PATTERN.test(filename) || /-report\./i.test(filename)) {
      moveFileIfExists(source, path.join(reportsDir, filename), movedToReports);
      removedFromLatest.push(filename);
      continue;
    }

    if (isForbiddenLatestFilename(filename)) {
      const target = TEST_BATCH_FILENAME_PATTERN.test(filename)
        ? path.join(testBatchesDir, filename)
        : path.join(reportsDir, filename);
      moveFileIfExists(source, target, movedToTestBatches);
      removedFromLatest.push(filename);
      continue;
    }

    if ((IMAGE_APP_ADAPTER_FILENAMES as readonly string[]).includes(filename)) {
      const adapterTarget = path.join(adaptersDir, filename);
      if (!fs.existsSync(adapterTarget)) {
        fs.copyFileSync(source, adapterTarget);
        movedToAdapters.push(adapterTarget);
      }
    }
  }

  for (const filename of listJsonFiles(renderFeedbackDir)) {
    if (TEST_BATCH_FILENAME_PATTERN.test(filename)) {
      moveFileIfExists(
        path.join(renderFeedbackDir, filename),
        path.join(testBatchesDir, filename),
        movedToTestBatches
      );
    }
  }

  const knownTestBatches = [
    'rkb-004-indoor-location-test-batch.json',
    'rkb-005-lighting-validation-test-batch.json',
    'rkb-006-coverage-validation-test-batch.json',
    'rkb-007-emotion-validation-test-batch.json',
    'rkb-008-instrumental-mv-validation.json',
    'rkb-009-ballad-mv-validation.json',
    'mds-001-ballad-mv-production-package.json',
    'mds-002-instrumental-full-length-package.json',
    'mds-002-ballad-full-length-package.json',
    'rkb-010-prop-validation-test-batch.json',
    'rkb-011-room-layout-validation-test-batch.json',
    'rkb-012-scene-composition-validation-test-batch.json',
    'rkb-013-outdoor-layout-validation-test-batch.json',
  ];
  for (const filename of knownTestBatches) {
    const rfSource = path.join(renderFeedbackDir, filename);
    moveFileIfExists(rfSource, path.join(testBatchesDir, filename), movedToTestBatches);
  }

  syncImageAppLatestUploadBundle(root);

  return {
    moved_to_test_batches: movedToTestBatches,
    moved_to_reports: movedToReports,
    moved_to_adapters: movedToAdapters,
    removed_from_latest: removedFromLatest,
  };
}

export function syncImageAppLatestUploadBundle(projectRoot?: string): void {
  const root = resolveProjectRoot(projectRoot);
  const latestDir = path.join(root, IMAGE_APP_LATEST_DIR);
  const adaptersDir = path.join(root, IMAGE_APP_ADAPTERS_DIR);
  fs.mkdirSync(latestDir, { recursive: true });
  fs.mkdirSync(adaptersDir, { recursive: true });

  const keep = new Set<string>();

  for (const filename of IMAGE_APP_LATEST_CORE_FILES) {
    const latestFile = path.join(latestDir, filename);
    if (fs.existsSync(latestFile)) {
      keep.add(filename);
    }
  }

  for (const filename of IMAGE_APP_ADAPTER_FILENAMES) {
    if (filename === 'outdoor-layout-lock-adapter.json') {
      continue;
    }
    const adapterSource = path.join(adaptersDir, filename);
    const latestTarget = path.join(latestDir, filename);
    if (fs.existsSync(adapterSource)) {
      fs.copyFileSync(adapterSource, latestTarget);
      keep.add(filename);
    } else if (fs.existsSync(latestTarget)) {
      fs.copyFileSync(latestTarget, adapterSource);
      keep.add(filename);
    }
  }

  if (
    fs.existsSync(path.join(root, OUTDOOR_LAYOUT_LOCK_V2_ADAPTER_PATH)) ||
    fs.existsSync(path.join(root, CHARACTER_FIRST_CONTRACT_PATH))
  ) {
    publishOutdoorLayoutLockProductionArtifacts(root);
  }

  if (fs.existsSync(path.join(root, OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH))) {
    keep.add('outdoor-layout-lock-adapter.json');
  }
  if (fs.existsSync(path.join(root, CHARACTER_FIRST_CONTRACT_LATEST_PATH))) {
    keep.add('character-first-contract.json');
  }

  for (const filename of listJsonFiles(latestDir)) {
    if (!keep.has(filename)) {
      fs.unlinkSync(path.join(latestDir, filename));
    }
  }
}

export function buildImageAppUploadManifest(projectRoot?: string): Record<string, unknown> {
  const root = resolveProjectRoot(projectRoot);
  const latestDir = path.join(root, IMAGE_APP_LATEST_DIR);
  const files = listJsonFiles(latestDir)
    .filter((name) => (IMAGE_APP_LATEST_ALLOWLIST as readonly string[]).includes(name))
    .filter((name) => fs.existsSync(path.join(latestDir, name)))
    .sort();

  const outdoorEntry = files.find((name) => name === 'outdoor-layout-lock-adapter.json');
  const contractEntry = files.find((name) => name === 'character-first-contract.json');

  return {
    manifest_type: 'image_app_upload_bundle',
    manifest_version: IMAGE_APP_EXPORT_GOVERNANCE_VERSION,
    phase: 'PHASE-16-PUBLISH-V2-LOCK-001',
    generated_at: new Date().toISOString(),
    purpose: 'Image App upload source — files listed here must match exports/image_app/latest exactly',
    upload_file_count: files.length,
    policy: {
      latest_dir: IMAGE_APP_LATEST_DIR,
      adapters_canonical_dir: IMAGE_APP_ADAPTERS_DIR,
      test_batches_dir: IMAGE_APP_TEST_BATCHES_DIR,
      reports_dir: IMAGE_APP_REPORTS_DIR,
      render_feedback_dir: RENDER_FEEDBACK_DIR,
      forbidden_in_latest: LATEST_FORBIDDEN_PATTERNS.map((p) => p.source),
      outdoor_full_reference_only:
        'exports/image_app/adapters/full_reference/outdoor-layout-lock-adapter-full.json',
      outdoor_latest_must_be_v2: true,
    },
    dataset_16: {
      upload_filename: 'outdoor-layout-lock-adapter.json',
      production_variant: 'v2',
      upload_index: 16,
      full_reference_path:
        'exports/image_app/adapters/full_reference/outdoor-layout-lock-adapter-full.json',
      character_first_contract_path: CHARACTER_FIRST_CONTRACT_LATEST_PATH,
      marked_in_manifest: outdoorEntry
        ? { token_mode: 'v2', adapter_version: 'v2' }
        : { token_mode: 'missing', adapter_version: 'missing' },
    },
    upload_files: files.map((filename) => {
      const entry: Record<string, unknown> = {
        filename,
        relative_path: latestPath(filename),
        sha256: sha256File(path.join(latestDir, filename)),
      };
      if (filename === 'outdoor-layout-lock-adapter.json') {
        entry.dataset_index = 16;
        entry.production_variant = 'v2';
      }
      if (filename === 'character-first-contract.json') {
        entry.role = 'character_first_contract';
        entry.pairs_with_dataset_16 = true;
      }
      return entry;
    }),
    character_first_contract_present: Boolean(contractEntry),
  };
}

export function auditImageAppExportGovernance(
  projectRoot?: string
): ImageAppExportGovernanceReport {
  const root = resolveProjectRoot(projectRoot);
  const violations: ImageAppExportGovernanceViolation[] = [];

  const precheck = runImageAppExportPrecheck(root);
  if (!precheck.pass) {
    for (const message of precheck.violations) {
      violations.push({ code: 'FAIL_PRECHECK', message });
    }
    return finalizeGovernanceReport(violations, precheck, root);
  }

  migrateImageAppExportLayout(root);

  const latestDir = path.join(root, IMAGE_APP_LATEST_DIR);
  const testBatchesDir = path.join(root, IMAGE_APP_TEST_BATCHES_DIR);
  const reportsDir = path.join(root, IMAGE_APP_REPORTS_DIR);
  const adaptersDir = path.join(root, IMAGE_APP_ADAPTERS_DIR);

  const latestFiles = listJsonFiles(latestDir);
  const forbiddenInLatest = latestFiles.filter(isForbiddenLatestFilename);
  const extraFiles = latestFiles.filter(
    (name) => !(IMAGE_APP_LATEST_ALLOWLIST as readonly string[]).includes(name)
  );

  const requiredCore = [
    'cinematic-dna-library-import.json',
    'image-app-brain-ingestion-package.json',
    'living-world-core-v1-package.json',
    'living-world-image-adapter.json',
    'music-drama-image-adapter.json',
    'location-lighting-image-adapter.json',
    'indoor-location-anchor-adapter.json',
    'lighting-anchor-adapter.json',
    'shot-grammar-adapter.json',
    'emotion-acting-adapter.json',
    'instrumental-mv-adapter.json',
    'ballad-mv-adapter.json',
    'prop-anchor-adapter.json',
    'room-layout-lock-adapter.json',
    'scene-asset-composition-adapter.json',
    'outdoor-layout-lock-adapter.json',
    'character-first-contract.json',
  ] as const;

  const missingRequired = requiredCore.filter(
    (name) => !fs.existsSync(path.join(latestDir, name))
  );
  const filesPresent = requiredCore.filter((name) =>
    fs.existsSync(path.join(latestDir, name))
  );

  if (forbiddenInLatest.length > 0) {
    for (const file of forbiddenInLatest) {
      violations.push({
        code: 'FAIL_FORBIDDEN_IN_LATEST',
        message: `Forbidden file in latest: ${file}`,
        field: file,
      });
    }
  }

  if (extraFiles.length > 0) {
    for (const file of extraFiles) {
      violations.push({
        code: 'FAIL_FORBIDDEN_IN_LATEST',
        message: `Non-allowlisted file in latest: ${file}`,
        field: file,
      });
    }
  }

  if (missingRequired.length > 0) {
    for (const file of missingRequired) {
      violations.push({
        code: 'FAIL_LATEST_INCOMPLETE',
        message: `Missing required upload file in latest: ${file}`,
        field: file,
      });
    }
  }

  const misplacedTestBatches = latestFiles.filter(
    (name) => TEST_BATCH_FILENAME_PATTERN.test(name) || /^rkb-/i.test(name)
  );
  const testBatchFiles = listJsonFiles(testBatchesDir).filter(
    (name) => TEST_BATCH_FILENAME_PATTERN.test(name) || /^rkb-/i.test(name)
  );

  if (misplacedTestBatches.length > 0) {
    for (const file of misplacedTestBatches) {
      violations.push({
        code: 'FAIL_TEST_BATCH_MISPLACED',
        message: `Test batch must not live in latest: ${file}`,
        field: file,
      });
    }
  }

  const misplacedReports = latestFiles.filter(
    (name) => REPORT_FILENAME_PATTERN.test(name) || /-report\./i.test(name)
  );
  const reportFiles = listJsonFiles(reportsDir);

  if (misplacedReports.length > 0) {
    for (const file of misplacedReports) {
      violations.push({
        code: 'FAIL_REPORT_MISPLACED',
        message: `Report must not live in latest: ${file}`,
        field: file,
      });
    }
  }

  const adapterFiles = listJsonFiles(adaptersDir);
  const requiredAdapters = [
    'living-world-image-adapter.json',
    'music-drama-image-adapter.json',
    'location-lighting-image-adapter.json',
    'indoor-location-anchor-adapter.json',
    'lighting-anchor-adapter.json',
  ] as const;
  const missingAdapters = requiredAdapters.filter(
    (name) => !fs.existsSync(path.join(adaptersDir, name))
  );
  if (missingAdapters.length > 0) {
    for (const file of missingAdapters) {
      violations.push({
        code: 'FAIL_LATEST_INCOMPLETE',
        message: `Missing adapter in adapters/: ${file}`,
        field: file,
      });
    }
  }

  let outdoorV2Guard = {
    latest_adapter_path: OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH,
    pass: false,
    violations: Object.freeze(['latest outdoor adapter file missing']) as readonly string[],
  };

  const latestOutdoorAbsolute = path.join(root, OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH);
  if (fs.existsSync(latestOutdoorAbsolute)) {
    const guard = assertLatestOutdoorLayoutAdapterIsV2Safe(
      fs.readFileSync(latestOutdoorAbsolute, 'utf8')
    );
    outdoorV2Guard = {
      latest_adapter_path: OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH,
      pass: guard.pass,
      violations: guard.violations,
    };
    if (!guard.pass) {
      for (const message of guard.violations) {
        violations.push({
          code: 'FAIL_OUTDOOR_LAYOUT_NOT_V2',
          message,
          field: 'outdoor-layout-lock-adapter.json',
        });
      }
    }
  } else {
    violations.push({
      code: 'FAIL_LATEST_INCOMPLETE',
      message: `Missing required upload file in latest: outdoor-layout-lock-adapter.json`,
      field: 'outdoor-layout-lock-adapter.json',
    });
  }

  const manifest = buildImageAppUploadManifest(root);
  fs.mkdirSync(path.join(root, IMAGE_APP_UPLOAD_BUNDLE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, IMAGE_APP_UPLOAD_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  if (manifest.upload_file_count !== IMAGE_APP_UPLOAD_FILE_COUNT) {
    violations.push({
      code: 'FAIL_LATEST_INCOMPLETE',
      message: `Expected ${IMAGE_APP_UPLOAD_FILE_COUNT} upload files in manifest, got ${manifest.upload_file_count}`,
      field: 'upload_file_count',
    });
  }

  const identityProtectionReport = runIdentityProtectionFrameworkAudit(root);
  const identityProtectionPass =
    identityProtectionReport.final_verdict === IDENTITY_PROTECTION_FINAL_VERDICT_PASS;

  if (!fs.existsSync(path.join(root, CHARACTER_FIRST_CONTRACT_LATEST_PATH))) {
    violations.push({
      code: 'FAIL_IDENTITY_PROTECTION',
      message: `Missing ${CHARACTER_FIRST_CONTRACT_LATEST_PATH}`,
      field: 'character-first-contract.json',
    });
  }

  if (!identityProtectionPass) {
    for (const message of identityProtectionReport.violations) {
      violations.push({
        code: 'FAIL_IDENTITY_PROTECTION',
        message,
      });
    }
  }

  const latestPass =
    forbiddenInLatest.length === 0 &&
    extraFiles.length === 0 &&
    missingRequired.length === 0 &&
    outdoorV2Guard.pass &&
    identityProtectionPass;
  const testBatchPass = misplacedTestBatches.length === 0 && testBatchFiles.length >= 2;
  const reportPass = misplacedReports.length === 0;
  const adaptersPass = missingAdapters.length === 0;

  const finalVerdict: ImageAppExportGovernanceVerdict =
    violations.length === 0 &&
    latestPass &&
    testBatchPass &&
    reportPass &&
    adaptersPass
      ? 'PASS_IMAGE_APP_EXPORT_GOVERNANCE_V1'
      : violations[0]?.code ?? 'FAIL_LATEST_INCOMPLETE';

  return {
    phase: IMAGE_APP_EXPORT_GOVERNANCE_PHASE,
    governance_version: IMAGE_APP_EXPORT_GOVERNANCE_VERSION,
    generated_at: new Date().toISOString(),
    precheck: {
      latest_dir_present: fs.existsSync(latestDir),
      render_feedback_present: fs.existsSync(path.join(root, RENDER_FEEDBACK_DIR)),
      rkb_005_verdict: precheck.rkb005Verdict,
      pass: precheck.pass,
    },
    latest_policy: {
      allowlist: IMAGE_APP_LATEST_ALLOWLIST,
      files_present: filesPresent,
      forbidden_found: forbiddenInLatest,
      extra_files: extraFiles,
      missing_required: missingRequired,
      pass: latestPass,
    },
    test_batches: {
      files_in_test_batches: testBatchFiles,
      misplaced_in_latest: misplacedTestBatches,
      pass: testBatchPass,
    },
    reports: {
      files_in_reports: reportFiles,
      misplaced_in_latest: misplacedReports,
      pass: reportPass,
    },
    adapters: {
      files_in_adapters: adapterFiles,
      pass: adaptersPass,
    },
    upload_manifest_path: IMAGE_APP_UPLOAD_MANIFEST_PATH,
    outdoor_layout_v2_guard: outdoorV2Guard,
    dataset_16: {
      upload_filename: 'outdoor-layout-lock-adapter.json',
      production_variant: 'v2',
      full_reference_path:
        'exports/image_app/adapters/full_reference/outdoor-layout-lock-adapter-full.json',
      character_first_contract_path: CHARACTER_FIRST_CONTRACT_LATEST_PATH,
    },
    identity_protection: {
      final_verdict: identityProtectionReport.final_verdict,
      pass: identityProtectionPass,
      violations: identityProtectionReport.violations,
    },
    final_verdict: finalVerdict,
    violations: Object.freeze([...violations]),
  };
}

function finalizeGovernanceReport(
  violations: ImageAppExportGovernanceViolation[],
  precheck: ReturnType<typeof runImageAppExportPrecheck>,
  root: string
): ImageAppExportGovernanceReport {
  return {
    phase: IMAGE_APP_EXPORT_GOVERNANCE_PHASE,
    governance_version: IMAGE_APP_EXPORT_GOVERNANCE_VERSION,
    generated_at: new Date().toISOString(),
    precheck: {
      latest_dir_present: fs.existsSync(path.join(root, IMAGE_APP_LATEST_DIR)),
      render_feedback_present: fs.existsSync(path.join(root, RENDER_FEEDBACK_DIR)),
      rkb_005_verdict: precheck.rkb005Verdict,
      pass: precheck.pass,
    },
    latest_policy: {
      allowlist: IMAGE_APP_LATEST_ALLOWLIST,
      files_present: [],
      forbidden_found: [],
      extra_files: [],
      missing_required: [],
      pass: false,
    },
    test_batches: {
      files_in_test_batches: [],
      misplaced_in_latest: [],
      pass: false,
    },
    reports: {
      files_in_reports: [],
      misplaced_in_latest: [],
      pass: false,
    },
    adapters: {
      files_in_adapters: [],
      pass: false,
    },
    upload_manifest_path: IMAGE_APP_UPLOAD_MANIFEST_PATH,
    outdoor_layout_v2_guard: {
      latest_adapter_path: OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH,
      pass: false,
      violations: Object.freeze([]),
    },
    dataset_16: {
      upload_filename: 'outdoor-layout-lock-adapter.json',
      production_variant: 'v2',
      full_reference_path:
        'exports/image_app/adapters/full_reference/outdoor-layout-lock-adapter-full.json',
      character_first_contract_path: CHARACTER_FIRST_CONTRACT_LATEST_PATH,
    },
    identity_protection: {
      final_verdict: 'FAIL_IDENTITY_PROTECTION_FRAMEWORK_V1',
      pass: false,
      violations: Object.freeze([]),
    },
    final_verdict: 'FAIL_PRECHECK',
    violations: Object.freeze([...violations]),
  };
}

export function runImageAppExportGovernanceAudit(
  projectRoot?: string
): ImageAppExportGovernanceReport {
  const root = resolveProjectRoot(projectRoot);
  const report = auditImageAppExportGovernance(root);
  writeGovernedReport(root, IMAGE_APP_REPORTS_DIR, 'image-app-export-governance-report.json', report);
  return report;
}
