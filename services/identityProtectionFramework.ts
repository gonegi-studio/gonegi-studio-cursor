import fs from 'node:fs';
import path from 'node:path';
import {
  CHARACTER_FIRST_CONTRACT_LATEST_PATH,
  OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH,
  assertLatestOutdoorLayoutAdapterIsV2Safe,
  type CharacterFirstContract,
} from './outdoorLayoutLock.js';
import { resolveProjectRoot } from './projectRootResolver.js';

const IMAGE_APP_LATEST_DIR = 'exports/image_app/latest' as const;

export const IDENTITY_PROTECTION_REPORT_PATH =
  'reports/identity-protection-framework-report.json' as const;
export const IDENTITY_PROTECTION_PHASE = 'PHASE-17-IDENTITY-PROTECTION-FRAMEWORK-001' as const;

export const IDENTITY_PROTECTION_FINAL_VERDICT_PASS =
  'PASS_IDENTITY_PROTECTION_FRAMEWORK_V1' as const;
export const IDENTITY_PROTECTION_FINAL_VERDICT_FAIL =
  'FAIL_IDENTITY_PROTECTION_FRAMEWORK_V1' as const;

export type IdentityProtectionRiskLevel = 'low' | 'medium' | 'high';

export type DangerousTokenMatch = {
  rule_id: string;
  matched_value: string;
  json_path: string;
};

export const SUBORDINATE_PRIORITY_DOMAINS = [
  'location_continuity',
  'layout_lock',
  'prop_anchor',
  'scene_composition',
  'lighting',
  'camera',
  'environment',
] as const;

export type SubordinatePriorityDomain = (typeof SUBORDINATE_PRIORITY_DOMAINS)[number];

const DOMAIN_PRIORITY_ALIASES: Record<SubordinatePriorityDomain, readonly string[]> = {
  location_continuity: ['location_continuity'],
  layout_lock: ['layout_lock', 'room_layout_lock', 'outdoor_layout_lock'],
  prop_anchor: ['prop_anchor'],
  scene_composition: ['scene_composition', 'scene_asset_composition', 'composition'],
  lighting: ['lighting', 'lighting_anchor'],
  camera: ['camera', 'camera_visibility', 'shot_grammar', 'coverage'],
  environment: ['environment', 'environment_details'],
};

const EXEMPT_JSON_PATH_SEGMENTS = [
  'removed_in_v2_rebuild',
  'removed_in_lite_mode',
  'removed_harmful_prefixes',
  'soft_guidance_prefixes',
  'retained_outdoor_lock_prefixes',
  'forbidden_in_latest',
  'landmark_enforcement_forbidden',
  'camera_visibility_enforcement_forbidden',
  'fail_if_ignored_enforcement_forbidden',
  'environment_may_never_override',
] as const;

const INJECTABLE_TOKEN_PATH_SUFFIXES = [
  '.layout_tokens',
  '.location_continuity_anchors',
  '.character_continuity_anchors',
  '.render_payload.layout_tokens',
  '.tokens',
  '.priority_tokens',
] as const;

/** Full hard-enforcement scan — Dataset #16 and global contract. */
const STRICT_HARD_ENFORCEMENT_FILES = new Set([
  'outdoor-layout-lock-adapter.json',
  'character-first-contract.json',
]);

/** Legacy upload adapters grandfathered for cinematography must_show grammar tokens. */
const LEGACY_GRANDFATHERED_ADAPTER_FILES = new Set([
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
  'cinematic-dna-library-import.json',
  'image-app-brain-ingestion-package.json',
  'living-world-core-v1-package.json',
]);

export type AdapterIdentityAuditEntry = {
  adapter_name: string;
  filename: string;
  audit_mode: 'strict' | 'legacy_grandfathered';
  risk_level: IdentityProtectionRiskLevel;
  dangerous_tokens: readonly DangerousTokenMatch[];
  identity_priority_status: 'pass' | 'fail' | 'inherited' | 'not_declared';
  priority_order_found: readonly string[] | null;
  pass_fail: 'pass' | 'fail';
  violations: readonly string[];
};

export type IdentityProtectionFrameworkReport = {
  phase: typeof IDENTITY_PROTECTION_PHASE;
  generated_at: string;
  precheck: {
    latest_dir_present: boolean;
    character_first_contract_present: boolean;
    outdoor_layout_latest_present: boolean;
    outdoor_layout_v2_safe: boolean;
    pass: boolean;
  };
  global_priority_contract: {
    source: typeof CHARACTER_FIRST_CONTRACT_LATEST_PATH;
    character_identity_rank: number;
    subordinate_domains: readonly SubordinatePriorityDomain[];
    pass: boolean;
    violations: readonly string[];
  };
  adapter_audits: readonly AdapterIdentityAuditEntry[];
  framework_policy: {
    strict_audit_files: readonly string[];
    legacy_grandfathered_files: readonly string[];
    new_adapter_rule: string;
  };
  summary: {
    adapters_scanned: number;
    adapters_passed: number;
    adapters_failed: number;
    high_risk_count: number;
  };
  final_verdict:
    | typeof IDENTITY_PROTECTION_FINAL_VERDICT_PASS
    | typeof IDENTITY_PROTECTION_FINAL_VERDICT_FAIL;
  violations: readonly string[];
};

function isExemptJsonPath(jsonPath: string): boolean {
  return EXEMPT_JSON_PATH_SEGMENTS.some((segment) => jsonPath.includes(segment));
}

function isInjectableTokenPath(jsonPath: string): boolean {
  return INJECTABLE_TOKEN_PATH_SUFFIXES.some((suffix) => jsonPath.endsWith(suffix));
}

function isEnforcementFieldPath(jsonPath: string): boolean {
  return jsonPath.endsWith('secondary_validation') || jsonPath.endsWith('.secondary_validation');
}

function usesStrictHardEnforcementRules(filename: string): boolean {
  if (STRICT_HARD_ENFORCEMENT_FILES.has(filename)) return true;
  return !LEGACY_GRANDFATHERED_ADAPTER_FILES.has(filename);
}

function isIdentityThreateningMustShow(value: string): boolean {
  return (
    value.includes('landmark-visibility:must_show_') ||
    value.includes('composition-visibility:must_show_') ||
    /(?:^|:)must_show_(?:character|face|subject|identity|silhouette)/i.test(value) ||
    /(?:^|:)visibility:must_show_(?:character|face|subject)/i.test(value)
  );
}

function hasPositiveFailIfIgnored(value: string): boolean {
  const lower = value.toLowerCase();
  if (lower.includes('no fail-if-ignored') || lower.includes('no fail if ignored')) {
    return false;
  }
  return /\bfail if ignored\b/i.test(value) || /\bfail-if-ignored\b/i.test(value);
}

function detectDangerousTokensInString(
  value: string,
  jsonPath: string,
  filename: string
): DangerousTokenMatch[] {
  const matches: DangerousTokenMatch[] = [];
  const strictPath = isInjectableTokenPath(jsonPath) || isEnforcementFieldPath(jsonPath);
  const strictRules = usesStrictHardEnforcementRules(filename);

  if (strictRules && isIdentityThreateningMustShow(value)) {
    matches.push({ rule_id: 'must_show_*', matched_value: value, json_path: jsonPath });
  } else if (
    strictRules &&
    strictPath &&
    /must_show_/i.test(value) &&
    !value.includes('anchor-visibility:') &&
    !value.includes('environmental_must_show') &&
    !value.includes('insert_must_show') &&
    !value.includes('establishing_must_show')
  ) {
    matches.push({ rule_id: 'must_show_*', matched_value: value, json_path: jsonPath });
  }

  const legacyGrandfathered = LEGACY_GRANDFATHERED_ADAPTER_FILES.has(filename);

  if (!legacyGrandfathered && hasPositiveFailIfIgnored(value)) {
    matches.push({ rule_id: 'FAIL if ignored', matched_value: value, json_path: jsonPath });
  }

  if (isEnforcementFieldPath(jsonPath) && strictRules) {
    if (
      value.toLowerCase().includes('landmark-visibility') &&
      value.toLowerCase().includes('camera-visibility') &&
      hasPositiveFailIfIgnored(value)
    ) {
      matches.push({
        rule_id: 'secondary_validation',
        matched_value: value,
        json_path: jsonPath,
      });
    } else if (
      value.toLowerCase().includes('landmark-visibility') &&
      !value.toLowerCase().includes('no fail')
    ) {
      matches.push({
        rule_id: 'secondary_validation',
        matched_value: value,
        json_path: jsonPath,
      });
    }
  }

  if (
    !legacyGrandfathered &&
    (strictPath || !isExemptJsonPath(jsonPath))
  ) {
    if (value.includes('camera-visibility:')) {
      matches.push({ rule_id: 'camera-visibility:', matched_value: value, json_path: jsonPath });
    }
    if (value.includes('landmark-visibility:')) {
      matches.push({
        rule_id: 'landmark-visibility:',
        matched_value: value,
        json_path: jsonPath,
      });
    }
  }

  if (!legacyGrandfathered) {
    if (/subject_override/i.test(value)) {
      matches.push({ rule_id: 'subject_override', matched_value: value, json_path: jsonPath });
    }
    if (/identity_override/i.test(value)) {
      matches.push({ rule_id: 'identity_override', matched_value: value, json_path: jsonPath });
    }
    if (/character_override/i.test(value)) {
      matches.push({ rule_id: 'character_override', matched_value: value, json_path: jsonPath });
    }
    if (/reference_override/i.test(value)) {
      matches.push({ rule_id: 'reference_override', matched_value: value, json_path: jsonPath });
    }
  }

  return matches;
}

function walkJsonForDangerousTokens(
  value: unknown,
  jsonPath: string,
  matches: DangerousTokenMatch[],
  filename: string
): void {
  if (typeof value === 'string') {
    if (isExemptJsonPath(jsonPath)) return;
    matches.push(...detectDangerousTokensInString(value, jsonPath, filename));
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      walkJsonForDangerousTokens(entry, `${jsonPath}[${index}]`, matches, filename)
    );
    return;
  }

  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    const childPath = jsonPath ? `${jsonPath}.${key}` : key;
    walkJsonForDangerousTokens(child, childPath, matches, filename);
  }
}

function dedupeMatches(matches: DangerousTokenMatch[]): DangerousTokenMatch[] {
  const seen = new Set<string>();
  return matches.filter((match) => {
    const key = `${match.rule_id}|${match.json_path}|${match.matched_value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractPriorityOrder(doc: Record<string, unknown>): string[] | null {
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

function domainIndex(priorityOrder: readonly string[], domain: SubordinatePriorityDomain): number {
  const aliases = DOMAIN_PRIORITY_ALIASES[domain];
  return priorityOrder.findIndex((entry) =>
    aliases.some((alias) => entry === alias || entry.includes(alias))
  );
}

export function verifyCharacterIdentityPriorityRank(
  priorityOrder: readonly string[]
): { pass: boolean; violations: string[] } {
  const violations: string[] = [];
  const identityIndex = priorityOrder.indexOf('character_identity');

  if (identityIndex < 0) {
    violations.push('character_identity missing from priority_order');
    return { pass: false, violations };
  }

  for (const domain of SUBORDINATE_PRIORITY_DOMAINS) {
    const subordinateIndex = domainIndex(priorityOrder, domain);
    if (subordinateIndex >= 0 && subordinateIndex < identityIndex) {
      violations.push(`${domain} outranks character_identity in priority_order`);
    }
  }

  return { pass: violations.length === 0, violations };
}

export function verifyGlobalCharacterFirstContract(
  contract: CharacterFirstContract
): IdentityProtectionFrameworkReport['global_priority_contract'] {
  const identityIndex = contract.priority_order.indexOf('character_identity');
  const check = verifyCharacterIdentityPriorityRank(contract.priority_order);

  return {
    source: CHARACTER_FIRST_CONTRACT_LATEST_PATH,
    character_identity_rank: identityIndex,
    subordinate_domains: SUBORDINATE_PRIORITY_DOMAINS,
    pass: check.pass && identityIndex === 0,
    violations:
      identityIndex !== 0
        ? Object.freeze([
            ...check.violations,
            'character_identity must be the highest-priority domain in character-first-contract',
          ])
        : Object.freeze(check.violations),
  };
}

function resolveAdapterName(filename: string, doc: Record<string, unknown>): string {
  const metadata = doc.adapter_metadata as { adapter_name?: string } | undefined;
  if (metadata?.adapter_name) return metadata.adapter_name;
  if (doc.contract_type === 'character_first_image_app_contract') {
    return 'character-first-contract';
  }
  return filename.replace(/\.json$/i, '');
}

function requiresDeclaredPriority(filename: string): boolean {
  return filename === 'outdoor-layout-lock-adapter.json';
}

export function auditLatestAdapterForIdentityProtection(
  filename: string,
  content: string
): AdapterIdentityAuditEntry {
  const violations: string[] = [];
  let doc: Record<string, unknown>;

  try {
    doc = JSON.parse(content) as Record<string, unknown>;
  } catch {
    return {
      adapter_name: filename,
      filename,
      audit_mode: usesStrictHardEnforcementRules(filename) ? 'strict' : 'legacy_grandfathered',
      risk_level: 'high',
      dangerous_tokens: [],
      identity_priority_status: 'fail',
      priority_order_found: null,
      pass_fail: 'fail',
      violations: Object.freeze(['Invalid JSON']),
    };
  }

  const adapterName = resolveAdapterName(filename, doc);
  const auditMode: AdapterIdentityAuditEntry['audit_mode'] = usesStrictHardEnforcementRules(
    filename
  )
    ? 'strict'
    : 'legacy_grandfathered';

  const dangerousTokensRaw: DangerousTokenMatch[] = [];
  walkJsonForDangerousTokens(doc, '', dangerousTokensRaw, filename);
  const dangerousTokens = dedupeMatches(dangerousTokensRaw);

  const priorityOrder = extractPriorityOrder(doc);
  let identityPriorityStatus: AdapterIdentityAuditEntry['identity_priority_status'] = 'not_declared';
  let priorityPass = true;

  if (filename === 'character-first-contract.json') {
    const contractCheck = verifyCharacterIdentityPriorityRank(
      (doc.priority_order as string[]) ?? []
    );
    priorityPass = contractCheck.pass;
    identityPriorityStatus = contractCheck.pass ? 'pass' : 'fail';
    if (!contractCheck.pass) violations.push(...contractCheck.violations);
  } else if (priorityOrder) {
    const check = verifyCharacterIdentityPriorityRank(priorityOrder);
    priorityPass = check.pass;
    identityPriorityStatus = check.pass ? 'pass' : 'fail';
    if (!check.pass) violations.push(...check.violations);
  } else if (requiresDeclaredPriority(filename)) {
    priorityPass = false;
    identityPriorityStatus = 'fail';
    violations.push('Layout/composition adapter must declare priority_order with character_identity first');
  } else {
    identityPriorityStatus = 'inherited';
  }

  if (filename === 'outdoor-layout-lock-adapter.json') {
    const outdoorGuard = assertLatestOutdoorLayoutAdapterIsV2Safe(content);
    if (!outdoorGuard.pass) {
      violations.push(...outdoorGuard.violations);
    }
    const metadata = doc.adapter_metadata as { token_mode?: string } | undefined;
    if (metadata?.token_mode !== 'v2') {
      violations.push('outdoor-layout-lock-adapter in latest must use token_mode v2');
    }
  }

  const hasDangerous = dangerousTokens.length > 0;
  const passFail = !hasDangerous && priorityPass && violations.length === 0 ? 'pass' : 'fail';

  let riskLevel: IdentityProtectionRiskLevel = 'low';
  if (hasDangerous || !priorityPass) {
    riskLevel = 'high';
  } else if (identityPriorityStatus === 'not_declared') {
    riskLevel = 'medium';
  }

  return {
    adapter_name: adapterName,
    filename,
    audit_mode: auditMode,
    risk_level: riskLevel,
    dangerous_tokens: Object.freeze(dangerousTokens),
    identity_priority_status: identityPriorityStatus,
    priority_order_found: priorityOrder ? Object.freeze(priorityOrder) : null,
    pass_fail: passFail,
    violations: Object.freeze(violations),
  };
}

export function runIdentityProtectionFrameworkAudit(
  projectRoot?: string
): IdentityProtectionFrameworkReport {
  const root = resolveProjectRoot(projectRoot);
  const latestDir = path.join(root, IMAGE_APP_LATEST_DIR);
  const violations: string[] = [];

  const contractPath = path.join(root, CHARACTER_FIRST_CONTRACT_LATEST_PATH);
  const outdoorPath = path.join(root, OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH);

  const contractPresent = fs.existsSync(contractPath);
  const outdoorPresent = fs.existsSync(outdoorPath);
  let outdoorV2Safe = false;

  if (outdoorPresent) {
    const guard = assertLatestOutdoorLayoutAdapterIsV2Safe(fs.readFileSync(outdoorPath, 'utf8'));
    outdoorV2Safe = guard.pass;
    if (!guard.pass) violations.push(...guard.violations);
  } else {
    violations.push(`Missing ${OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH}`);
  }

  if (!contractPresent) {
    violations.push(`Missing ${CHARACTER_FIRST_CONTRACT_LATEST_PATH}`);
  }

  let globalPriorityContract: IdentityProtectionFrameworkReport['global_priority_contract'] = {
    source: CHARACTER_FIRST_CONTRACT_LATEST_PATH,
    character_identity_rank: -1,
    subordinate_domains: SUBORDINATE_PRIORITY_DOMAINS,
    pass: false,
    violations: Object.freeze(['character-first-contract.json missing from latest/']),
  };

  if (contractPresent) {
    const contractFile = JSON.parse(fs.readFileSync(contractPath, 'utf8')) as CharacterFirstContract;
    globalPriorityContract = verifyGlobalCharacterFirstContract(contractFile);
    if (!globalPriorityContract.pass) {
      violations.push(...globalPriorityContract.violations);
    }
  }

  const adapterAudits: AdapterIdentityAuditEntry[] = [];

  const latestFilenames = fs.existsSync(latestDir)
    ? fs.readdirSync(latestDir).filter((name) => name.endsWith('.json')).sort()
    : [];

  for (const filename of latestFilenames) {
    const filePath = path.join(latestDir, filename);
    if (!fs.existsSync(filePath)) {
      violations.push(`Missing latest upload file: ${filename}`);
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const entry = auditLatestAdapterForIdentityProtection(filename, content);
    adapterAudits.push(entry);
    if (entry.pass_fail === 'fail') {
      violations.push(`${entry.adapter_name}: ${entry.violations.join('; ') || 'identity protection failed'}`);
      for (const token of entry.dangerous_tokens) {
        violations.push(`${entry.adapter_name}: dangerous token ${token.rule_id} at ${token.json_path}`);
      }
    }
  }

  const adaptersPassed = adapterAudits.filter((row) => row.pass_fail === 'pass').length;
  const adaptersFailed = adapterAudits.length - adaptersPassed;
  const highRiskCount = adapterAudits.filter((row) => row.risk_level === 'high').length;

  const precheckPass =
    fs.existsSync(latestDir) && contractPresent && outdoorPresent && outdoorV2Safe;

  const finalVerdict =
    precheckPass &&
    globalPriorityContract.pass &&
    violations.length === 0 &&
    adaptersFailed === 0
      ? IDENTITY_PROTECTION_FINAL_VERDICT_PASS
      : IDENTITY_PROTECTION_FINAL_VERDICT_FAIL;

  const report: IdentityProtectionFrameworkReport = {
    phase: IDENTITY_PROTECTION_PHASE,
    generated_at: new Date().toISOString(),
    precheck: {
      latest_dir_present: fs.existsSync(latestDir),
      character_first_contract_present: contractPresent,
      outdoor_layout_latest_present: outdoorPresent,
      outdoor_layout_v2_safe: outdoorV2Safe,
      pass: precheckPass,
    },
    global_priority_contract: globalPriorityContract,
    adapter_audits: Object.freeze(adapterAudits),
    framework_policy: {
      strict_audit_files: Object.freeze([...STRICT_HARD_ENFORCEMENT_FILES]),
      legacy_grandfathered_files: Object.freeze([...LEGACY_GRANDFATHERED_ADAPTER_FILES]),
      new_adapter_rule:
        'Any JSON file in latest/ not in the legacy set receives full hard-enforcement scanning and cannot ship with identity-override tokens.',
    },
    summary: {
      adapters_scanned: adapterAudits.length,
      adapters_passed: adaptersPassed,
      adapters_failed: adaptersFailed,
      high_risk_count: highRiskCount,
    },
    final_verdict: finalVerdict,
    violations: Object.freeze(violations),
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, IDENTITY_PROTECTION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}

export function assertLatestUploadBundleIdentitySafe(projectRoot?: string): {
  pass: boolean;
  violations: readonly string[];
} {
  const report = runIdentityProtectionFrameworkAudit(projectRoot);
  return {
    pass: report.final_verdict === IDENTITY_PROTECTION_FINAL_VERDICT_PASS,
    violations: report.violations,
  };
}
