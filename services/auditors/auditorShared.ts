import fs from 'node:fs';
import path from 'node:path';

export const PROJECT_AUDITOR_PHASE = 'PHASE-AUDITOR-001' as const;
export const PROJECT_AUDITOR_PASS_VERDICT = 'PASS_PROJECT_AUDITOR_FOUNDATION_V1' as const;
export const PROJECT_AUDITOR_FAIL_VERDICT = 'FAIL_PROJECT_AUDITOR_FOUNDATION_V1' as const;

export const PROJECT_AUDITOR_REPORT_PATH = 'reports/project-auditor-report.json' as const;
export const PROJECT_AUDITOR_BASELINE_PATH = 'reports/project-auditor-baseline.json' as const;

/** Phase-spec field priority (highest → lowest). */
export const CANONICAL_FIELD_PRIORITY = Object.freeze([
  'character',
  'emotion',
  'relationship',
  'camera',
  'composition',
  'location',
  'environment',
] as const);

export type CanonicalPriorityField = (typeof CANONICAL_FIELD_PRIORITY)[number];

export const PRIORITY_TOKEN_ALIASES: Readonly<Record<CanonicalPriorityField, readonly string[]>> =
  Object.freeze({
    character: [
      'character',
      'character_identity',
      'character_reference',
      'character_continuity',
    ],
    emotion: ['emotion', 'emotion_id', 'emotion_acting', 'emotion_dna'],
    relationship: ['relationship', 'relationship_id', 'relationship_dna', 'relationship_stage'],
    camera: ['camera', 'camera_visibility', 'shot_grammar', 'coverage', 'shot_type'],
    composition: [
      'composition',
      'scene_composition',
      'scene_asset_composition',
      'room_layout',
      'layout_lock',
    ],
    location: [
      'location',
      'location_continuity',
      'location_id',
      'indoor_anchor',
      'outdoor_layout',
      'lighting_anchor',
    ],
    environment: ['environment', 'environment_details', 'environment_dna'],
  });

export type AuditSeverity = 'critical' | 'high' | 'moderate' | 'low';

export type AuditWarning = {
  code: string;
  message: string;
  severity: AuditSeverity;
  source?: string;
};

export type AuditError = {
  code: string;
  message: string;
  severity: 'critical' | 'high';
  source?: string;
};

export type SubmoduleAuditResult = {
  status: 'pass' | 'fail';
  risk_score: number;
  risk_level: RiskLevelLabel;
  warnings: readonly AuditWarning[];
  errors: readonly AuditError[];
  details: Record<string, unknown>;
};

export type RiskLevelLabel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export function riskLevelFromScore(score: number): RiskLevelLabel {
  if (score >= 61) return 'CRITICAL';
  if (score >= 41) return 'HIGH';
  if (score >= 21) return 'MODERATE';
  return 'LOW';
}

export function computeRiskScore(
  errors: readonly AuditError[],
  warnings: readonly AuditWarning[]
): number {
  let score = 0;
  for (const err of errors) {
    score += err.severity === 'critical' ? 25 : 12;
  }
  for (const warn of warnings) {
    if (warn.severity === 'high') score += 8;
    else if (warn.severity === 'moderate') score += 4;
    else score += 2;
  }
  return Math.min(100, score);
}

export function buildSubmoduleResult(
  errors: AuditError[],
  warnings: AuditWarning[],
  details: Record<string, unknown> = {}
): SubmoduleAuditResult {
  const risk_score = computeRiskScore(errors, warnings);
  const hasCritical = errors.some((e) => e.severity === 'critical');
  return {
    status: hasCritical || risk_score >= 61 ? 'fail' : 'pass',
    risk_score,
    risk_level: riskLevelFromScore(risk_score),
    warnings: Object.freeze(warnings),
    errors: Object.freeze(errors),
    details,
  };
}

export function readJsonRecord(
  projectRoot: string,
  relativePath: string
): Record<string, unknown> | null {
  const filePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function listJsonFiles(dir: string, recursive = true): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];

  function walk(current: string): void {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (recursive) walk(full);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith('.json')) {
        results.push(full);
      }
    }
  }

  walk(dir);
  return results.sort();
}

export function relativeFromRoot(projectRoot: string, absolutePath: string): string {
  return path.relative(projectRoot, absolutePath).split(path.sep).join('/');
}

export function extractPriorityOrder(doc: Record<string, unknown>): string[] | null {
  const contract = doc.image_app_token_contract as { priority_order?: string[] } | undefined;
  if (Array.isArray(contract?.priority_order) && contract.priority_order.length > 0) {
    return contract.priority_order;
  }
  if (Array.isArray(doc.priority_order) && doc.priority_order.length > 0) {
    return doc.priority_order as string[];
  }
  const runtime = doc.runtime_verification_fields as { priority_order?: string[] } | undefined;
  if (Array.isArray(runtime?.priority_order) && runtime.priority_order.length > 0) {
    return runtime.priority_order;
  }
  return null;
}

export function mapTokenToCanonicalField(token: string): CanonicalPriorityField | null {
  const normalized = token.toLowerCase().replace(/-/g, '_');
  for (const field of CANONICAL_FIELD_PRIORITY) {
    const aliases = PRIORITY_TOKEN_ALIASES[field];
    if (
      aliases.some(
        (alias) =>
          normalized === alias ||
          normalized.includes(alias) ||
          alias.includes(normalized)
      )
    ) {
      return field;
    }
  }
  return null;
}

export function verifyCanonicalPriorityOrder(priorityOrder: readonly string[]): {
  pass: boolean;
  violations: string[];
  mapped_order: (CanonicalPriorityField | 'unknown')[];
} {
  const mapped_order: (CanonicalPriorityField | 'unknown')[] = [];
  const seen = new Set<CanonicalPriorityField>();
  const violations: string[] = [];

  for (const token of priorityOrder) {
    const field = mapTokenToCanonicalField(token);
    mapped_order.push(field ?? 'unknown');
    if (field) seen.add(field);
  }

  const indices: Partial<Record<CanonicalPriorityField, number>> = {};
  for (let i = 0; i < mapped_order.length; i++) {
    const field = mapped_order[i];
    if (field && field !== 'unknown' && indices[field] === undefined) {
      indices[field] = i;
    }
  }

  for (let i = 0; i < CANONICAL_FIELD_PRIORITY.length; i++) {
    for (let j = i + 1; j < CANONICAL_FIELD_PRIORITY.length; j++) {
      const higher = CANONICAL_FIELD_PRIORITY[i];
      const lower = CANONICAL_FIELD_PRIORITY[j];
      const hi = indices[higher];
      const lo = indices[lower];
      if (hi !== undefined && lo !== undefined && hi > lo) {
        violations.push(`${lower} outranks ${higher} in priority_order (${tokenLabel(priorityOrder, lo)} before ${tokenLabel(priorityOrder, hi)})`);
      }
    }
  }

  if (indices.character === undefined) {
    violations.push('character domain missing from priority_order');
  } else if (indices.character !== 0) {
    violations.push('character must be highest priority (index 0) in priority_order');
  }

  return {
    pass: violations.length === 0,
    violations,
    mapped_order,
  };
}

function tokenLabel(order: readonly string[], index: number): string {
  return order[index] ?? '?';
}

export type ScanInventory = {
  dataset_json_count: number;
  export_json_count: number;
  service_ts_count: number;
  report_json_count: number;
  latest_json_count: number;
  adapters_json_count: number;
  verify_script_count: number;
  scan_roots: readonly string[];
};

export function collectScanInventory(projectRoot: string): ScanInventory {
  const scan_roots = Object.freeze([
    'datasets',
    'exports',
    'services',
    'reports',
    'exports/image_app/latest',
    'exports/image_app/adapters',
    'scripts',
  ] as const);

  const datasetsDir = path.join(projectRoot, 'datasets');
  const exportsDir = path.join(projectRoot, 'exports');
  const servicesDir = path.join(projectRoot, 'services');
  const reportsDir = path.join(projectRoot, 'reports');
  const latestDir = path.join(projectRoot, 'exports/image_app/latest');
  const adaptersDir = path.join(projectRoot, 'exports/image_app/adapters');
  const scriptsDir = path.join(projectRoot, 'scripts');

  const verify_script_count = fs.existsSync(scriptsDir)
    ? fs.readdirSync(scriptsDir).filter((name) => name.startsWith('verify-') && name.endsWith('.ts'))
        .length
    : 0;

  return {
    dataset_json_count: listJsonFiles(datasetsDir).length,
    export_json_count: listJsonFiles(exportsDir).length,
    service_ts_count: listTsFiles(servicesDir).length,
    report_json_count: fs.existsSync(reportsDir)
      ? listJsonFiles(reportsDir, false).length
      : 0,
    latest_json_count: fs.existsSync(latestDir)
      ? listJsonFiles(latestDir, false).length
      : 0,
    adapters_json_count: fs.existsSync(adaptersDir)
      ? listJsonFiles(adaptersDir, false).length
      : 0,
    verify_script_count,
    scan_roots,
  };
}

function listTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  function walk(current: string): void {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith('.ts')) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}
