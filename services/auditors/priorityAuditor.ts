import fs from 'node:fs';
import path from 'node:path';
import {
  CANONICAL_FIELD_PRIORITY,
  type AuditError,
  type AuditWarning,
  type SubmoduleAuditResult,
  buildSubmoduleResult,
  extractPriorityOrder,
  listJsonFiles,
  readJsonRecord,
  relativeFromRoot,
  verifyCanonicalPriorityOrder,
} from './auditorShared.js';

const LATEST_DIR = 'exports/image_app/latest' as const;
const CHARACTER_FIRST_PATH = 'exports/image_app/latest/character-first-contract.json' as const;

const LAYOUT_ADAPTERS_REQUIRING_PRIORITY = [
  'outdoor-layout-lock-adapter.json',
  'room-layout-lock-adapter.json',
  'scene-asset-composition-adapter.json',
  'prop-anchor-adapter.json',
  'indoor-location-anchor-adapter.json',
  'lighting-anchor-adapter.json',
  'shot-grammar-adapter.json',
  'emotion-acting-adapter.json',
] as const;

export function runPriorityAudit(projectRoot: string): SubmoduleAuditResult {
  const errors: AuditError[] = [];
  const warnings: AuditWarning[] = [];

  auditGlobalContract(projectRoot, errors, warnings);
  auditLatestAdapters(projectRoot, errors, warnings);

  return buildSubmoduleResult(errors, warnings, {
    priority_risk_score: buildSubmoduleResult(errors, warnings).risk_score,
    canonical_priority: CANONICAL_FIELD_PRIORITY,
    adapters_checked: LAYOUT_ADAPTERS_REQUIRING_PRIORITY.length,
  });
}

function auditGlobalContract(
  projectRoot: string,
  errors: AuditError[],
  warnings: AuditWarning[]
): void {
  const contract = readJsonRecord(projectRoot, CHARACTER_FIRST_PATH);
  if (!contract) {
    errors.push({
      code: 'PRIORITY_CONTRACT_MISSING',
      message: 'character-first-contract missing for priority baseline',
      severity: 'critical',
    });
    return;
  }

  const priorityOrder = extractPriorityOrder(contract);
  if (!priorityOrder) {
    errors.push({
      code: 'PRIORITY_ORDER_MISSING',
      message: 'character-first-contract has no priority_order',
      severity: 'critical',
      source: CHARACTER_FIRST_PATH,
    });
    return;
  }

  const check = verifyCanonicalPriorityOrder(priorityOrder);
  if (!check.pass) {
    for (const violation of check.violations) {
      warnings.push({
        code: 'GLOBAL_PRIORITY_PARTIAL',
        message: `character-first-contract: ${violation}`,
        severity: 'moderate',
        source: CHARACTER_FIRST_PATH,
      });
    }
  }

  if (priorityOrder.indexOf('character_identity') !== 0) {
    errors.push({
      code: 'CHARACTER_NOT_HIGHEST',
      message: 'character_identity must be index 0 in global priority contract',
      severity: 'critical',
      source: CHARACTER_FIRST_PATH,
    });
  }
}

function auditLatestAdapters(
  projectRoot: string,
  errors: AuditError[],
  warnings: AuditWarning[]
): void {
  const latestDir = path.join(projectRoot, LATEST_DIR);
  if (!fs.existsSync(latestDir)) return;

  for (const filename of LAYOUT_ADAPTERS_REQUIRING_PRIORITY) {
    const rel = `${LATEST_DIR}/${filename}`;
    const doc = readJsonRecord(projectRoot, rel);
    if (!doc) {
      warnings.push({
        code: 'PRIORITY_ADAPTER_MISSING',
        message: `${filename} not found — priority chain incomplete`,
        severity: 'low',
        source: rel,
      });
      continue;
    }

    const priorityOrder = extractPriorityOrder(doc);
    if (!priorityOrder) continue;

    const check = verifyCanonicalPriorityOrder(priorityOrder);
    if (!check.pass) {
      const severity =
        filename.includes('layout') || filename.includes('composition')
          ? 'high'
          : 'moderate';
      for (const violation of check.violations) {
        const payload = {
          code: 'ADAPTER_PRIORITY_VIOLATION',
          message: `${filename}: ${violation}`,
          severity: severity as 'high' | 'moderate',
          source: rel,
        };
        if (severity === 'high') {
          errors.push({
            code: payload.code,
            message: payload.message,
            severity: 'high',
            source: payload.source,
          });
        } else {
          warnings.push({
            code: payload.code,
            message: payload.message,
            severity: 'moderate',
            source: payload.source,
          });
        }
      }
    }
  }

  for (const file of listJsonFiles(latestDir, false)) {
    const rel = relativeFromRoot(projectRoot, file);
    if (!rel.endsWith('-adapter.json')) continue;
    const doc = readJsonRecord(projectRoot, rel);
    if (!doc) continue;
    const enforcement = doc.enforcement as { fail_if_ignored?: boolean } | undefined;
    if (enforcement?.fail_if_ignored && !extractPriorityOrder(doc)) {
      errors.push({
        code: 'ENFORCED_ADAPTER_NO_PRIORITY',
        message: `${path.basename(file)} declares fail_if_ignored but no priority_order`,
        severity: 'critical',
        source: rel,
      });
    }
  }
}
