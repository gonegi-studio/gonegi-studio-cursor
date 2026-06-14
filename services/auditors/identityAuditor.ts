import fs from 'node:fs';
import path from 'node:path';
import { verifyCharacterIdentityPriorityRank } from '../identityProtectionFramework.js';
import { CHARACTER_FIRST_CONTRACT_LATEST_PATH } from '../outdoorLayoutLock.js';
import {
  type AuditError,
  type AuditWarning,
  type SubmoduleAuditResult,
  buildSubmoduleResult,
  listJsonFiles,
  readJsonRecord,
  relativeFromRoot,
  extractPriorityOrder,
} from './auditorShared.js';

const LATEST_ADAPTER_DIR = 'exports/image_app/latest' as const;
const CHARACTER_DATASET_PATH = 'datasets/character/character-simple-v1.json' as const;

const OVERRIDE_RULE_MARKERS = [
  'override',
  'do not override',
  'must not override',
  'never override',
] as const;

export function runIdentityAudit(projectRoot: string): SubmoduleAuditResult {
  const errors: AuditError[] = [];
  const warnings: AuditWarning[] = [];

  const characterIds = collectCharacterDefinitions(projectRoot, warnings);
  const duplicateIds = findDuplicateCharacterSources(characterIds);
  for (const [characterId, sources] of duplicateIds) {
    errors.push({
      code: 'DUPLICATE_CHARACTER_DEFINITION',
      message: `character_id "${characterId}" defined in multiple sources: ${sources.join(', ')}`,
      severity: 'critical',
      source: characterId,
    });
  }

  auditCharacterOverrideRules(projectRoot, warnings, errors);
  auditCharacterFirstContract(projectRoot, errors, warnings);
  auditAdapterIdentityPriority(projectRoot, errors, warnings);

  return buildSubmoduleResult(errors, warnings, {
    identity_risk_score: computeIdentityRisk(errors, warnings),
    character_definition_count: characterIds.length,
    duplicate_character_ids: duplicateIds.size,
    adapters_with_priority_declared: countAdaptersWithPriority(projectRoot),
  });
}

function computeIdentityRisk(errors: AuditError[], warnings: AuditWarning[]): number {
  const base = buildSubmoduleResult(errors, warnings);
  return base.risk_score;
}

function collectCharacterDefinitions(
  projectRoot: string,
  warnings: AuditWarning[]
): { character_id: string; source: string }[] {
  const rows: { character_id: string; source: string }[] = [];

  const simple = readJsonRecord(projectRoot, CHARACTER_DATASET_PATH);
  if (simple && Array.isArray(simple.characters)) {
    for (const entry of simple.characters) {
      if (!entry || typeof entry !== 'object') continue;
      const id = (entry as { character_id?: string }).character_id;
      if (id) rows.push({ character_id: id, source: CHARACTER_DATASET_PATH });
    }
  } else {
    warnings.push({
      code: 'CHARACTER_SIMPLE_MISSING',
      message: `${CHARACTER_DATASET_PATH} missing or invalid`,
      severity: 'moderate',
    });
  }

  const datasetsDir = path.join(projectRoot, 'datasets');
  for (const file of listJsonFiles(datasetsDir)) {
    const rel = relativeFromRoot(projectRoot, file);
    if (rel === CHARACTER_DATASET_PATH) continue;
    const doc = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
    if (Array.isArray(doc.characters)) {
      for (const entry of doc.characters) {
        if (!entry || typeof entry !== 'object') continue;
        const id = (entry as { character_id?: string }).character_id;
        if (id) rows.push({ character_id: id, source: rel });
      }
    }
    if (typeof doc.character_id === 'string') {
      rows.push({ character_id: doc.character_id, source: rel });
    }
  }

  return rows;
}

function findDuplicateCharacterSources(
  rows: { character_id: string; source: string }[]
): Map<string, string[]> {
  const byId = new Map<string, Set<string>>();
  for (const row of rows) {
    const set = byId.get(row.character_id) ?? new Set<string>();
    set.add(row.source);
    byId.set(row.character_id, set);
  }
  const dupes = new Map<string, string[]>();
  for (const [id, sources] of byId) {
    if (sources.size > 1) dupes.set(id, [...sources]);
  }
  return dupes;
}

function auditCharacterOverrideRules(
  projectRoot: string,
  warnings: AuditWarning[],
  errors: AuditError[]
): void {
  const simple = readJsonRecord(projectRoot, CHARACTER_DATASET_PATH);
  const rules = simple?.injection_rules;
  if (!rules || typeof rules !== 'object') return;

  const forbidden = (rules as { forbidden?: string }).forbidden;
  if (typeof forbidden === 'string') {
    const lower = forbidden.toLowerCase();
    if (!lower.includes('override')) {
      warnings.push({
        code: 'CHARACTER_OVERRIDE_RULE_WEAK',
        message: 'character-simple injection_rules.forbidden should explicitly forbid DNA override',
        severity: 'low',
        source: CHARACTER_DATASET_PATH,
      });
    }
  } else {
    errors.push({
      code: 'CHARACTER_OVERRIDE_RULE_MISSING',
      message: 'character-simple-v1 missing injection_rules.forbidden override guard',
      severity: 'high',
      source: CHARACTER_DATASET_PATH,
    });
  }

  walkForDangerousOverrides(projectRoot, warnings);
}

function walkForDangerousOverrides(projectRoot: string, warnings: AuditWarning[]): void {
  const latestDir = path.join(projectRoot, LATEST_ADAPTER_DIR);
  if (!fs.existsSync(latestDir)) return;

  for (const file of listJsonFiles(latestDir, false)) {
    const rel = relativeFromRoot(projectRoot, file);
    const doc = readJsonRecord(projectRoot, rel);
    if (!doc) continue;
    const text = JSON.stringify(doc).toLowerCase();
    for (const marker of OVERRIDE_RULE_MARKERS) {
      if (text.includes(marker) && text.includes('character') && text.includes('identity')) {
        if (text.includes('never override') || text.includes('may_never_override')) {
          continue;
        }
      }
    }
    const rules = doc.rules as { environment_may_never_override?: unknown } | undefined;
    if (rules?.environment_may_never_override) continue;
    if (rel.includes('layout') && !extractPriorityOrder(doc)) {
      warnings.push({
        code: 'LAYOUT_ADAPTER_NO_PRIORITY',
        message: `${rel} is layout-sensitive but does not declare priority_order`,
        severity: 'moderate',
        source: rel,
      });
    }
  }
}

function auditCharacterFirstContract(
  projectRoot: string,
  errors: AuditError[],
  warnings: AuditWarning[]
): void {
  const contract = readJsonRecord(projectRoot, CHARACTER_FIRST_CONTRACT_LATEST_PATH);
  if (!contract) {
    errors.push({
      code: 'CHARACTER_FIRST_CONTRACT_MISSING',
      message: `${CHARACTER_FIRST_CONTRACT_LATEST_PATH} missing`,
      severity: 'critical',
    });
    return;
  }

  const priorityOrder = extractPriorityOrder(contract);
  if (!priorityOrder) {
    errors.push({
      code: 'CHARACTER_FIRST_PRIORITY_MISSING',
      message: 'character-first-contract missing priority_order',
      severity: 'critical',
      source: CHARACTER_FIRST_CONTRACT_LATEST_PATH,
    });
    return;
  }

  const check = verifyCharacterIdentityPriorityRank(priorityOrder);
  if (!check.pass || priorityOrder.indexOf('character_identity') !== 0) {
    for (const violation of check.violations) {
      errors.push({
        code: 'CHARACTER_FIRST_VIOLATION',
        message: violation,
        severity: 'critical',
        source: CHARACTER_FIRST_CONTRACT_LATEST_PATH,
      });
    }
    if (priorityOrder.indexOf('character_identity') !== 0) {
      errors.push({
        code: 'CHARACTER_IDENTITY_NOT_FIRST',
        message: 'character_identity must rank first in character-first-contract',
        severity: 'critical',
        source: CHARACTER_FIRST_CONTRACT_LATEST_PATH,
      });
    }
  }

  if (contract.contract_type !== 'character_first_image_app_contract') {
    warnings.push({
      code: 'CHARACTER_FIRST_CONTRACT_TYPE',
      message: 'unexpected contract_type on character-first-contract',
      severity: 'low',
      source: CHARACTER_FIRST_CONTRACT_LATEST_PATH,
    });
  }
}

function auditAdapterIdentityPriority(
  projectRoot: string,
  errors: AuditError[],
  warnings: AuditWarning[]
): void {
  const latestDir = path.join(projectRoot, LATEST_ADAPTER_DIR);
  if (!fs.existsSync(latestDir)) {
    errors.push({
      code: 'LATEST_ADAPTER_DIR_MISSING',
      message: `${LATEST_ADAPTER_DIR} missing`,
      severity: 'critical',
    });
    return;
  }

  const layoutAdapters = [
    'outdoor-layout-lock-adapter.json',
    'room-layout-lock-adapter.json',
    'scene-asset-composition-adapter.json',
    'indoor-location-anchor-adapter.json',
  ];

  for (const filename of layoutAdapters) {
    const rel = `${LATEST_ADAPTER_DIR}/${filename}`;
    const doc = readJsonRecord(projectRoot, rel);
    if (!doc) continue;
    const priorityOrder = extractPriorityOrder(doc);
    if (!priorityOrder) {
      warnings.push({
        code: 'ADAPTER_PRIORITY_NOT_DECLARED',
        message: `${filename} has no priority_order — identity precedence unverified`,
        severity: 'moderate',
        source: rel,
      });
      continue;
    }
    const check = verifyCharacterIdentityPriorityRank(priorityOrder);
    if (!check.pass) {
      for (const violation of check.violations) {
        errors.push({
          code: 'ADAPTER_IDENTITY_PRIORITY_VIOLATION',
          message: `${filename}: ${violation}`,
          severity: 'high',
          source: rel,
        });
      }
    }
  }
}

function countAdaptersWithPriority(projectRoot: string): number {
  const latestDir = path.join(projectRoot, LATEST_ADAPTER_DIR);
  if (!fs.existsSync(latestDir)) return 0;
  return listJsonFiles(latestDir, false).filter((file) => {
    const doc = readJsonRecord(projectRoot, relativeFromRoot(projectRoot, file));
    return doc ? extractPriorityOrder(doc) !== null : false;
  }).length;
}
