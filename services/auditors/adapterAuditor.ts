import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  type AuditError,
  type AuditWarning,
  type SubmoduleAuditResult,
  buildSubmoduleResult,
  listJsonFiles,
  readJsonRecord,
  relativeFromRoot,
} from './auditorShared.js';

const LATEST_DIR = 'exports/image_app/latest' as const;
const ADAPTERS_DIR = 'exports/image_app/adapters' as const;

export function runAdapterAudit(projectRoot: string): SubmoduleAuditResult {
  const errors: AuditError[] = [];
  const warnings: AuditWarning[] = [];

  const latestFiles = listAdapterFilenames(projectRoot, LATEST_DIR);
  const adapterFiles = listAdapterFilenames(projectRoot, ADAPTERS_DIR);

  auditDuplicateAdapterNames(projectRoot, latestFiles, errors);
  auditShadowedAdapters(latestFiles, adapterFiles, warnings, errors);
  auditOrphanAdapters(latestFiles, adapterFiles, warnings);
  auditLatestAdaptersMismatch(projectRoot, latestFiles, adapterFiles, warnings);

  return buildSubmoduleResult(errors, warnings, {
    adapter_risk_score: buildSubmoduleResult(errors, warnings).risk_score,
    latest_adapter_count: latestFiles.length,
    adapters_dir_count: adapterFiles.length,
    shadowed_count: latestFiles.filter((name) => adapterFiles.includes(name)).length,
  });
}

function listAdapterFilenames(projectRoot: string, relDir: string): string[] {
  const dir = path.join(projectRoot, relDir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json') && name.includes('adapter'))
    .sort();
}

function resolveAdapterName(filename: string, doc: Record<string, unknown>): string {
  const metadata = doc.adapter_metadata as { adapter_name?: string } | undefined;
  if (metadata?.adapter_name) return metadata.adapter_name;
  if (doc.contract_type === 'character_first_image_app_contract') {
    return 'character-first-contract';
  }
  return filename.replace(/\.json$/i, '');
}

function auditDuplicateAdapterNames(
  projectRoot: string,
  latestFiles: string[],
  errors: AuditError[]
): void {
  const names = new Map<string, string[]>();

  for (const filename of latestFiles) {
    const rel = `${LATEST_DIR}/${filename}`;
    const doc = readJsonRecord(projectRoot, rel);
    if (!doc) continue;
    const adapterName = resolveAdapterName(filename, doc);
    const list = names.get(adapterName) ?? [];
    list.push(filename);
    names.set(adapterName, list);
  }

  for (const [adapterName, files] of names) {
    if (files.length > 1) {
      errors.push({
        code: 'DUPLICATE_ADAPTER_NAME',
        message: `adapter_name "${adapterName}" declared in multiple latest files: ${files.join(', ')}`,
        severity: 'critical',
        source: adapterName,
      });
    }
  }
}

function auditShadowedAdapters(
  latestFiles: string[],
  adapterFiles: string[],
  warnings: AuditWarning[],
  errors: AuditError[]
): void {
  const overlap = latestFiles.filter((name) => adapterFiles.includes(name));
  for (const filename of overlap) {
    if (
      filename === 'outdoor-layout-lock-adapter.json' &&
      adapterFiles.includes('outdoor-layout-lock-adapter-v2.json')
    ) {
      warnings.push({
        code: 'ADAPTER_VERSION_SHADOW',
        message:
          'outdoor-layout-lock exists in latest and adapters/ with v2 variant — ensure latest points to v2-safe build',
        severity: 'moderate',
        source: filename,
      });
      continue;
    }
    warnings.push({
      code: 'SHADOWED_ADAPTER',
      message: `${filename} present in both latest/ and adapters/ — latest takes runtime precedence`,
      severity: 'low',
      source: filename,
    });
  }

  const v2Only = adapterFiles.filter(
    (name) => name.includes('outdoor-layout-lock-adapter-v2') && !latestFiles.includes(name)
  );
  if (
    latestFiles.includes('outdoor-layout-lock-adapter.json') &&
    v2Only.length > 0 &&
    !latestFiles.some((n) => n.includes('v2'))
  ) {
    warnings.push({
      code: 'OUTDOOR_LAYOUT_V2_NOT_IN_LATEST',
      message:
        'adapters/ has outdoor-layout-lock-adapter-v2.json; latest/ still ships legacy filename (v2 referenced via character-first-contract)',
      severity: 'moderate',
      source: 'outdoor-layout-lock-adapter.json',
    });
  }
}

function auditOrphanAdapters(
  latestFiles: string[],
  adapterFiles: string[],
  warnings: AuditWarning[]
): void {
  const latestSet = new Set(latestFiles);
  for (const filename of adapterFiles) {
    if (filename.endsWith('-v2.json') || filename.endsWith('-lite.json')) {
      const base = filename.replace(/-v2\.json$/, '.json').replace(/-lite\.json$/, '.json');
      if (latestSet.has(base) || latestSet.has(filename)) continue;
    }
    if (!latestSet.has(filename)) {
      warnings.push({
        code: 'ORPHAN_ADAPTER',
        message: `${filename} in adapters/ but not promoted to latest/`,
        severity: 'moderate',
        source: filename,
      });
    }
  }
}

function auditLatestAdaptersMismatch(
  projectRoot: string,
  latestFiles: string[],
  adapterFiles: string[],
  warnings: AuditWarning[]
): void {
  const overlap = latestFiles.filter((name) => adapterFiles.includes(name));
  for (const filename of overlap) {
    const latestPath = path.join(projectRoot, LATEST_DIR, filename);
    const adapterPath = path.join(projectRoot, ADAPTERS_DIR, filename);
    const latestHash = fileSha256(latestPath);
    const adapterHash = fileSha256(adapterPath);
    if (latestHash && adapterHash && latestHash !== adapterHash) {
      warnings.push({
        code: 'LATEST_ADAPTERS_MISMATCH',
        message: `${filename} differs between latest/ and adapters/ (hash mismatch — verify promotion)`,
        severity: 'moderate',
        source: filename,
      });
    }
  }
}

function fileSha256(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}
