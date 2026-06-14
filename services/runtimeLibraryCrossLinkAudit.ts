import fs from 'node:fs';
import path from 'node:path';
import {
  getShotFingerprintLibrary,
} from './shotFingerprintContractDefinitions.js';
import {
  getTransitionDnaLibrary,
} from './transitionDnaContractDefinitions.js';
import {
  buildRuntimeLibraryCrossLinkFingerprint,
  getRuntimeLibraryCategoryMappings,
  getRuntimeLibraryCrossLinks,
  type RuntimeLibraryCrossLink,
  type RuntimeLibraryCrossLinkFingerprint,
} from './runtimeLibraryCrossLinkDefinitions.js';

export type RuntimeLibraryCrossLinkAuditResult =
  | 'PASS'
  | 'FAIL_ORPHAN_SHOT'
  | 'FAIL_ORPHAN_TRANSITION'
  | 'FAIL_INVALID_LINK'
  | 'FAIL_DUPLICATE_LINK'
  | 'FAIL_CATEGORY_MAPPING'
  | 'FAIL_SCHEMA_COMPATIBILITY';

export interface RuntimeLibraryCrossLinkViolation {
  code: RuntimeLibraryCrossLinkAuditResult;
  message: string;
  field?: string;
}

export interface RuntimeLibraryCrossLinkReport {
  auditTimestamp: string;
  auditResult: RuntimeLibraryCrossLinkAuditResult;
  violations: RuntimeLibraryCrossLinkViolation[];
}

const FINGERPRINT_FILE = 'runtime-library-cross-link-fingerprint.json';
const REPORT_FILE = 'runtime-library-cross-link-report.json';

function linkKey(link: RuntimeLibraryCrossLink): string {
  return `${link.shot_id}::${link.transition_id}`;
}

function sortedArrayEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return leftSorted.every((value, index) => value === rightSorted[index]);
}

function crossLinksEqual(
  left: RuntimeLibraryCrossLink[],
  right: RuntimeLibraryCrossLink[]
): boolean {
  if (left.length !== right.length) return false;
  const leftSorted = [...left].sort((a, b) => linkKey(a).localeCompare(linkKey(b)));
  const rightSorted = [...right].sort((a, b) => linkKey(a).localeCompare(linkKey(b)));
  return leftSorted.every(
    (link, index) =>
      link.shot_id === rightSorted[index]?.shot_id &&
      link.transition_id === rightSorted[index]?.transition_id
  );
}

function categoryMappingsEqual(
  left: Record<string, string[]>,
  right: Record<string, string[]>
): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (!sortedArrayEqual(leftKeys, rightKeys)) return false;
  return leftKeys.every((key) => sortedArrayEqual(left[key] ?? [], right[key] ?? []));
}

function schemaVersionsEqual(
  left: RuntimeLibraryCrossLinkFingerprint['schemaVersions'],
  right: RuntimeLibraryCrossLinkFingerprint['schemaVersions']
): boolean {
  return (
    left.shotFingerprint === right.shotFingerprint &&
    left.transitionDna === right.transitionDna &&
    left.shotFingerprintContract === right.shotFingerprintContract &&
    left.transitionDnaContract === right.transitionDnaContract
  );
}

function findDuplicateLinkViolations(
  crossLinks: readonly RuntimeLibraryCrossLink[]
): RuntimeLibraryCrossLinkViolation[] {
  const seen = new Set<string>();
  const violations: RuntimeLibraryCrossLinkViolation[] = [];

  for (const link of crossLinks) {
    const key = linkKey(link);
    if (seen.has(key)) {
      violations.push({
        code: 'FAIL_DUPLICATE_LINK',
        message: `Duplicate cross link detected: ${link.shot_id} -> ${link.transition_id}`,
        field: 'crossLinks',
      });
    }
    seen.add(key);
  }

  return violations;
}

function findStructuralViolations(
  fingerprint: RuntimeLibraryCrossLinkFingerprint
): RuntimeLibraryCrossLinkViolation[] {
  const violations: RuntimeLibraryCrossLinkViolation[] = [];
  const shotCategories = Object.fromEntries(
    getShotFingerprintLibrary().map((entry) => [entry.fingerprint_id, entry.category])
  );
  const transitionCategories = Object.fromEntries(
    getTransitionDnaLibrary().map((entry) => [entry.transition_id, entry.category])
  );
  const shotIdSet = new Set(fingerprint.shotIds);
  const transitionIdSet = new Set(fingerprint.transitionIds);
  const linkedShots = new Set<string>();
  const linkedTransitions = new Set<string>();

  violations.push(...findDuplicateLinkViolations(fingerprint.crossLinks));

  for (const link of fingerprint.crossLinks) {
    if (!shotIdSet.has(link.shot_id) || !transitionIdSet.has(link.transition_id)) {
      violations.push({
        code: 'FAIL_INVALID_LINK',
        message: `Invalid cross link: ${link.shot_id} -> ${link.transition_id}`,
        field: 'crossLinks',
      });
      continue;
    }

    linkedShots.add(link.shot_id);
    linkedTransitions.add(link.transition_id);

    const shotCategory = shotCategories[link.shot_id];
    const transitionCategory = transitionCategories[link.transition_id];
    const allowedTransitionCategories = fingerprint.categoryMappings[shotCategory] ?? [];

    if (!allowedTransitionCategories.includes(transitionCategory)) {
      violations.push({
        code: 'FAIL_CATEGORY_MAPPING',
        message: `Missing category mapping for ${link.shot_id} (${shotCategory}) -> ${link.transition_id} (${transitionCategory})`,
        field: 'categoryMappings',
      });
    }
  }

  for (const shotId of fingerprint.shotIds) {
    if (!linkedShots.has(shotId)) {
      violations.push({
        code: 'FAIL_ORPHAN_SHOT',
        message: `Orphan shot fingerprint detected: ${shotId}`,
        field: 'shotIds',
      });
    }
  }

  for (const transitionId of fingerprint.transitionIds) {
    if (!linkedTransitions.has(transitionId)) {
      violations.push({
        code: 'FAIL_ORPHAN_TRANSITION',
        message: `Orphan transition dna detected: ${transitionId}`,
        field: 'transitionIds',
      });
    }
  }

  const expectedCategoryMappings = getRuntimeLibraryCategoryMappings();
  const uniqueShotCategories = [...new Set(Object.values(shotCategories))];
  for (const shotCategory of uniqueShotCategories) {
    if (!expectedCategoryMappings[shotCategory]) {
      violations.push({
        code: 'FAIL_CATEGORY_MAPPING',
        message: `Missing category mapping entry for shot category: ${shotCategory}`,
        field: 'categoryMappings',
      });
    }
  }

  return violations;
}

export function compareRuntimeLibraryCrossLinkFingerprints(
  current: RuntimeLibraryCrossLinkFingerprint,
  frozen: RuntimeLibraryCrossLinkFingerprint
): RuntimeLibraryCrossLinkViolation[] {
  const violations = findStructuralViolations(current);

  if (current.schemaVersion !== frozen.schemaVersion) {
    violations.push({
      code: 'FAIL_SCHEMA_COMPATIBILITY',
      message: 'Cross-link schema version drift detected',
      field: 'schemaVersion',
    });
  }

  if (!schemaVersionsEqual(current.schemaVersions, frozen.schemaVersions)) {
    violations.push({
      code: 'FAIL_SCHEMA_COMPATIBILITY',
      message: 'Library schema compatibility drift detected',
      field: 'schemaVersions',
    });
  }

  if (!sortedArrayEqual(current.shotIds, frozen.shotIds)) {
    violations.push({
      code: 'FAIL_ORPHAN_SHOT',
      message: 'Shot id set drift detected',
      field: 'shotIds',
    });
  }

  if (!sortedArrayEqual(current.transitionIds, frozen.transitionIds)) {
    violations.push({
      code: 'FAIL_ORPHAN_TRANSITION',
      message: 'Transition id set drift detected',
      field: 'transitionIds',
    });
  }

  if (!crossLinksEqual(current.crossLinks, frozen.crossLinks)) {
    violations.push({
      code: 'FAIL_INVALID_LINK',
      message: 'Cross link set drift detected',
      field: 'crossLinks',
    });
  }

  if (!categoryMappingsEqual(current.categoryMappings, frozen.categoryMappings)) {
    violations.push({
      code: 'FAIL_CATEGORY_MAPPING',
      message: 'Category mapping drift detected',
      field: 'categoryMappings',
    });
  }

  return violations;
}

function primaryFailure(
  violations: RuntimeLibraryCrossLinkViolation[]
): RuntimeLibraryCrossLinkAuditResult {
  const priority: RuntimeLibraryCrossLinkAuditResult[] = [
    'FAIL_ORPHAN_SHOT',
    'FAIL_ORPHAN_TRANSITION',
    'FAIL_INVALID_LINK',
    'FAIL_DUPLICATE_LINK',
    'FAIL_CATEGORY_MAPPING',
    'FAIL_SCHEMA_COMPATIBILITY',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function loadRuntimeLibraryCrossLinkFingerprint(
  projectRoot: string
): RuntimeLibraryCrossLinkFingerprint | null {
  const fingerprintPath = path.join(projectRoot, 'exports', FINGERPRINT_FILE);
  if (!fs.existsSync(fingerprintPath)) return null;
  return JSON.parse(
    fs.readFileSync(fingerprintPath, 'utf8')
  ) as RuntimeLibraryCrossLinkFingerprint;
}

export function writeRuntimeLibraryCrossLinkFingerprint(
  projectRoot: string,
  fingerprint: RuntimeLibraryCrossLinkFingerprint
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const fingerprintPath = path.join(exportsDir, FINGERPRINT_FILE);
  fs.writeFileSync(fingerprintPath, `${JSON.stringify(fingerprint, null, 2)}\n`, 'utf8');
  return fingerprintPath;
}

export function writeRuntimeLibraryCrossLinkReport(
  projectRoot: string,
  report: RuntimeLibraryCrossLinkReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runRuntimeLibraryCrossLinkAudit(
  projectRoot: string
): RuntimeLibraryCrossLinkReport {
  const auditTimestamp = new Date().toISOString();
  const shotIds = getShotFingerprintLibrary().map((entry) => entry.fingerprint_id);
  const transitionIds = getTransitionDnaLibrary().map((entry) => entry.transition_id);
  const current = buildRuntimeLibraryCrossLinkFingerprint(shotIds, transitionIds, auditTimestamp);
  const frozen = loadRuntimeLibraryCrossLinkFingerprint(projectRoot);

  if (!frozen) {
    const violations = findStructuralViolations(current);
    if (violations.length === 0) {
      writeRuntimeLibraryCrossLinkFingerprint(projectRoot, current);
    }
    return {
      auditTimestamp,
      auditResult: violations.length === 0 ? 'PASS' : primaryFailure(violations),
      violations,
    };
  }

  const violations = compareRuntimeLibraryCrossLinkFingerprints(current, frozen);
  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  return {
    auditTimestamp,
    auditResult,
    violations,
  };
}

export function buildCurrentRuntimeLibraryCrossLinkSnapshot(): RuntimeLibraryCrossLinkFingerprint {
  const shotIds = getShotFingerprintLibrary().map((entry) => entry.fingerprint_id);
  const transitionIds = getTransitionDnaLibrary().map((entry) => entry.transition_id);
  return buildRuntimeLibraryCrossLinkFingerprint(shotIds, transitionIds, new Date().toISOString());
}

export function getRuntimeLibraryCrossLinkSourceLinks(): RuntimeLibraryCrossLink[] {
  return getRuntimeLibraryCrossLinks();
}
