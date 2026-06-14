import fs from 'node:fs';
import path from 'node:path';
import {
  extractPriorityOrder,
  listJsonFiles,
  readJsonRecord,
  relativeFromRoot,
} from '../auditorShared.js';

export const IDENTITY_DRIFT_PHASE = 'PHASE-AUDITOR-003' as const;
export const IDENTITY_DRIFT_PASS_VERDICT = 'PASS_IDENTITY_DRIFT_PREDICTOR_V1' as const;
export const IDENTITY_DRIFT_FAIL_VERDICT = 'FAIL_IDENTITY_DRIFT_PREDICTOR_V1' as const;
export const IDENTITY_DRIFT_REPORT_PATH = 'reports/identity-drift-predictor-report.json' as const;

export const CHARACTER_SIMPLE_PATH = 'datasets/character/character-simple-v1.json' as const;
export const CHARACTER_FIRST_CONTRACT_PATH =
  'exports/image_app/latest/character-first-contract.json' as const;
export const LATEST_ADAPTER_DIR = 'exports/image_app/latest' as const;

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type DriftFinding = {
  code: string;
  message: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  source?: string;
};

export type DriftDimensionResult = {
  risk_score: number;
  risk_level: RiskLevel;
  findings: readonly DriftFinding[];
  details: Record<string, unknown>;
};

export type CharacterProfile = {
  character_id: string;
  display_name_en: string;
  role_type: string;
  visual_identity: string;
  hair: string;
  eyes: string;
  clothing: string;
  scenario_usage_rule: string;
};

export type TokenBucketCounts = {
  character: number;
  environment: number;
  camera: number;
  composition: number;
  location: number;
  total: number;
};

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 61) return 'CRITICAL';
  if (score >= 41) return 'HIGH';
  if (score >= 21) return 'MODERATE';
  return 'LOW';
}

export function computeDimensionScore(findings: DriftFinding[]): number {
  let score = 0;
  for (const f of findings) {
    if (f.severity === 'critical') score += 25;
    else if (f.severity === 'high') score += 12;
    else if (f.severity === 'moderate') score += 5;
    else score += 2;
  }
  return Math.min(100, score);
}

export function buildDimensionResult(
  findings: DriftFinding[],
  details: Record<string, unknown> = {}
): DriftDimensionResult {
  const risk_score = computeDimensionScore(findings);
  return {
    risk_score,
    risk_level: riskLevelFromScore(risk_score),
    findings: Object.freeze(findings),
    details,
  };
}

export function loadCharacterProfiles(projectRoot: string): CharacterProfile[] {
  const doc = readJsonRecord(projectRoot, CHARACTER_SIMPLE_PATH);
  if (!doc || !Array.isArray(doc.characters)) return [];

  return doc.characters
    .filter((row) => row && typeof row === 'object')
    .map((row) => {
      const r = row as Record<string, string>;
      return {
        character_id: r.character_id ?? '',
        display_name_en: r.display_name_en ?? '',
        role_type: r.role_type ?? '',
        visual_identity: r.visual_identity ?? '',
        hair: r.hair ?? '',
        eyes: r.eyes ?? '',
        clothing: r.clothing ?? '',
        scenario_usage_rule: r.scenario_usage_rule ?? '',
      };
    })
    .filter((c) => c.character_id.length > 0);
}

export function loadLatestAdapterDocuments(
  projectRoot: string
): { path: string; doc: Record<string, unknown> }[] {
  const dir = path.join(projectRoot, LATEST_ADAPTER_DIR);
  if (!fs.existsSync(dir)) return [];

  return listJsonFiles(dir, false).map((abs) => {
    const rel = relativeFromRoot(projectRoot, abs);
    return {
      path: rel,
      doc: readJsonRecord(projectRoot, rel) ?? {},
    };
  });
}

export function collectStringsFromJson(value: unknown, strings: string[], depth = 0): void {
  if (depth > 14) return;
  if (typeof value === 'string') {
    strings.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStringsFromJson(item, strings, depth + 1);
    return;
  }
  if (value && typeof value === 'object') {
    for (const child of Object.values(value as Record<string, unknown>)) {
      collectStringsFromJson(child, strings, depth + 1);
    }
  }
}

export function classifyToken(token: string): keyof TokenBucketCounts | null {
  const lower = token.toLowerCase();
  if (
    lower.includes('character_identity') ||
    lower.includes('character-priority') ||
    lower.includes('character_reference') ||
    lower.includes('character_continuity') ||
    lower.startsWith('character:') ||
    /\b(gonegi|gonagi|dana|gamja|bardo|mare)\b/.test(lower)
  ) {
    return 'character';
  }
  if (
    lower.includes('environment') ||
    lower.includes('landmark-preference') ||
    lower.includes('environment-supporting')
  ) {
    return 'environment';
  }
  if (
    lower.includes('camera') ||
    lower.includes('shot_grammar') ||
    lower.includes('coverage') ||
    lower.includes('shot-type')
  ) {
    return 'camera';
  }
  if (
    lower.includes('composition') ||
    lower.includes('scene_composition') ||
    lower.includes('must_show') ||
    lower.includes('visibility')
  ) {
    return 'composition';
  }
  if (
    lower.includes('location') ||
    lower.includes('outdoor-layout') ||
    lower.includes('indoor_anchor') ||
    lower.includes('lighting') ||
    lower.includes('landmark-position')
  ) {
    return 'location';
  }
  return null;
}

const INJECTABLE_TOKEN_KEYS = new Set([
  'layout_tokens',
  'priority_tokens',
  'tokens',
  'visual_memory_tokens',
  'spatial_tokens',
]);

const EXCLUDED_TOKEN_PARENT_KEYS = new Set([
  'removed_harmful_prefixes',
  'forbidden_in_latest',
  'retained_outdoor_lock_prefixes',
  'soft_guidance_prefixes',
  'forbidden_mutation_rules',
  'removed_in_v2_rebuild',
  'removed_in_lite_mode',
]);

export function collectInjectableTokens(doc: Record<string, unknown>): string[] {
  const tokens: string[] = [];

  function walk(value: unknown, key: string | null, depth = 0): void {
    if (depth > 12) return;
    if (key && EXCLUDED_TOKEN_PARENT_KEYS.has(key)) return;
    if (key && INJECTABLE_TOKEN_KEYS.has(key) && Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') tokens.push(item);
      }
      return;
    }
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        for (const item of value) walk(item, key, depth + 1);
        return;
      }
      for (const [childKey, child] of Object.entries(value as Record<string, unknown>)) {
        walk(child, childKey, depth + 1);
      }
    }
  }

  walk(doc, null);
  return tokens;
}

export function countTokenBuckets(projectRoot: string): TokenBucketCounts {
  const counts: TokenBucketCounts = {
    character: 0,
    environment: 0,
    camera: 0,
    composition: 0,
    location: 0,
    total: 0,
  };

  for (const { doc } of loadLatestAdapterDocuments(projectRoot)) {
    const injectable = collectInjectableTokens(doc);
    for (const token of injectable) {
      const bucket = classifyToken(token);
      if (!bucket || bucket === 'total') continue;
      counts[bucket] += 1;
      counts.total += 1;
    }

    const priorityOrder = extractPriorityOrder(doc);
    if (priorityOrder) {
      for (const entry of priorityOrder) {
        const bucket = classifyToken(entry);
        if (bucket && bucket !== 'total') {
          counts[bucket] += 1;
          counts.total += 1;
        }
      }
    }
  }

  const contract = readJsonRecord(projectRoot, CHARACTER_FIRST_CONTRACT_PATH);
  if (contract) {
    const priorityTokens = contract.priority_tokens;
    if (Array.isArray(priorityTokens)) {
      for (const token of priorityTokens) {
        if (typeof token === 'string') {
          counts.character += 1;
          counts.total += 1;
        }
      }
    }
  }

  return counts;
}

export function hasHarmfulEnforcementToken(text: string): boolean {
  const lower = text.toLowerCase();
  if (lower.includes('removed_harmful') || lower.includes('forbidden')) return false;
  if (!text.includes(':') && !/\bfail if ignored\b/i.test(text)) return false;
  return (
    /^landmark-visibility:must_show_/i.test(text) ||
    /^camera-visibility:/i.test(text) ||
    (/\bfail if ignored\b/i.test(text) && !lower.includes('no fail')) ||
    /^walkable-zone:/i.test(text)
  );
}

export function scanInjectableHarmfulTokens(doc: Record<string, unknown>): string[] {
  return collectInjectableTokens(doc).filter(hasHarmfulEnforcementToken);
}

export function loadCharacterFirstContract(projectRoot: string): Record<string, unknown> | null {
  return readJsonRecord(projectRoot, CHARACTER_FIRST_CONTRACT_PATH);
}

export function mainCharacters(profiles: CharacterProfile[]): CharacterProfile[] {
  return profiles.filter((c) => c.role_type === 'main');
}
