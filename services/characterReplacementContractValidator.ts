import fs from 'node:fs';
import path from 'node:path';
import { TRANSLATION_PASS_VERDICT, TRANSLATION_REPORT_PATH } from './gonegiWorldTranslationValidator.js';
import { IDENTITY_CONTRACT_SOURCE } from './sceneStateBuilder.js';
import {
  CHARACTER_ANCHOR_INDEX_PATH,
  REPLACEMENT_CONTRACT_ID,
  REPLACEMENT_CONTRACT_PATH,
  REPLACEMENT_PHASE,
  REPLACEMENT_REGISTRY_PATH,
  REPLACEMENT_SCHEMA_PATH,
  REPLACEMENT_STATIC_CONTRACT_PATH,
  type CharacterReplacementContract,
  loadCharacterReplacementContract,
} from './characterReplacementContractBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REPLACEMENT_PASS_VERDICT = 'PASS_CHARACTER_REPLACEMENT_CONTRACT_V1' as const;
export const REPLACEMENT_FAIL_VERDICT = 'FAIL_CHARACTER_REPLACEMENT_CONTRACT_V1' as const;
export const REPLACEMENT_REPORT_PATH = 'reports/character-replacement-contract-report.json' as const;
export const REPLACEMENT_MD_PATH = 'reports/CHARACTER_REPLACEMENT_CONTRACT_SUMMARY.md' as const;

const CORE_IDS = ['gonegi', 'dana', 'gamja', 'aengdu'] as const;
const REQUIRED_CORE_MAPPINGS = [
  'protagonist_a',
  'protagonist_b',
  'solitary_figure',
  'child_observer',
  'animal_companion_a',
  'animal_companion_b',
  'background_adult',
  'crowd_member',
] as const;

export type ReplacementValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
};

export type CharacterReplacementContractReport = {
  report_id: string;
  phase: typeof REPLACEMENT_PHASE;
  timestamp: string;
  replacement_contract: 'PASS' | 'FAIL';
  gonegi: 'linked' | 'missing';
  dana: 'linked' | 'missing';
  gamja: 'linked' | 'missing';
  aengdu: 'linked' | 'missing';
  companion_rules: 'PASS' | 'FAIL';
  identity_priority: 'PASS' | 'FAIL';
  duplication_guard: 'PASS' | 'FAIL';
  design_only: true;
  gpu_execution: false;
  final_verdict: typeof REPLACEMENT_PASS_VERDICT | typeof REPLACEMENT_FAIL_VERDICT;
  issues: ReplacementValidationIssue[];
};

function loadCharacterIds(projectRoot: string): Set<string> {
  const abs = path.join(projectRoot, CHARACTER_ANCHOR_INDEX_PATH);
  if (!fs.existsSync(abs)) return new Set();
  const index = JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    characters?: Array<{ character_id: string }>;
  };
  return new Set((index.characters ?? []).map((c) => c.character_id));
}

export function validateCharacterReplacementContract(
  projectRoot?: string
): CharacterReplacementContractReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ReplacementValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const translationReportPath = path.join(root, TRANSLATION_REPORT_PATH);
  if (!fs.existsSync(translationReportPath)) {
    issues.push({
      code: 'MISSING_TRANSLATION_REPORT',
      message: `Missing ${TRANSLATION_REPORT_PATH}. Run npm run verify:gonegi-world-translation first.`,
      severity: 'error',
    });
  } else {
    const translationReport = JSON.parse(fs.readFileSync(translationReportPath, 'utf8')) as {
      final_verdict?: string;
    };
    if (translationReport.final_verdict !== TRANSLATION_PASS_VERDICT) {
      issues.push({
        code: 'UPSTREAM_TRANSLATION_NOT_PASS',
        message: `World translation verdict is not ${TRANSLATION_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  if (!fs.existsSync(path.join(root, REPLACEMENT_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `Missing ${REPLACEMENT_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, REPLACEMENT_STATIC_CONTRACT_PATH))) {
    issues.push({
      code: 'MISSING_STATIC_CONTRACT',
      message: `Missing ${REPLACEMENT_STATIC_CONTRACT_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, IDENTITY_CONTRACT_SOURCE))) {
    issues.push({
      code: 'MISSING_CHARACTER_FIRST_CONTRACT',
      message: `Missing ${IDENTITY_CONTRACT_SOURCE}`,
      severity: 'error',
    });
  }

  let replacementContract: 'PASS' | 'FAIL' = 'FAIL';
  const registryPath = path.join(root, REPLACEMENT_REGISTRY_PATH);
  if (!fs.existsSync(registryPath)) {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `Missing ${REPLACEMENT_REGISTRY_PATH}`,
      severity: 'error',
    });
  } else {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as {
      replacement_contracts?: Array<{ contract_id: string; contract_path: string }>;
    };
    if (registry.replacement_contracts?.length === 1) {
      const entry = registry.replacement_contracts[0];
      if (
        entry.contract_id === REPLACEMENT_CONTRACT_ID &&
        entry.contract_path === REPLACEMENT_CONTRACT_PATH
      ) {
        replacementContract = 'PASS';
      } else {
        issues.push({
          code: 'REGISTRY_CONTRACT_MISMATCH',
          message: 'Registry contract path or id does not match built contract',
          severity: 'error',
        });
      }
    } else {
      issues.push({
        code: 'REGISTRY_CONTRACT_COUNT',
        message: 'Registry must contain exactly one replacement contract',
        severity: 'error',
      });
    }
  }

  const contract = loadCharacterReplacementContract(root);
  if (!contract) {
    issues.push({
      code: 'MISSING_BUILT_CONTRACT',
      message: `Missing ${REPLACEMENT_CONTRACT_PATH}`,
      severity: 'error',
    });
  }

  const characterIds = loadCharacterIds(root);
  const coreLinks: Record<(typeof CORE_IDS)[number], 'linked' | 'missing'> = {
    gonegi: 'missing',
    dana: 'missing',
    gamja: 'missing',
    aengdu: 'missing',
  };

  let companionRules: 'PASS' | 'FAIL' = 'FAIL';
  let identityPriority: 'PASS' | 'FAIL' = 'FAIL';
  let duplicationGuard: 'PASS' | 'FAIL' = 'FAIL';

  if (contract) {
    for (const id of CORE_IDS) {
      const hasReplacement = contract.replacements.some((r) => r.target_character_id === id);
      const inLinks = contract.core_character_links[id] === 'linked';
      const inAnchor = characterIds.has(id);
      if (hasReplacement && inLinks && inAnchor) {
        coreLinks[id] = 'linked';
      } else {
        issues.push({
          code: 'CORE_CHARACTER_NOT_LINKED',
          message: `Core character ${id} not fully linked`,
          severity: 'error',
          field: `core_character_links.${id}`,
        });
      }
    }

    for (const role of REQUIRED_CORE_MAPPINGS) {
      if (!contract.replacements.some((r) => r.source_role === role)) {
        issues.push({
          code: 'MISSING_CORE_MAPPING',
          message: `Missing replacement rule for ${role}`,
          severity: 'error',
        });
      }
    }

    const targetIds = new Set<string>();
    for (const rule of contract.replacements) {
      if (CORE_IDS.includes(rule.target_character_id as (typeof CORE_IDS)[number])) {
        if (!characterIds.has(rule.target_character_id)) {
          issues.push({
            code: 'TARGET_CHARACTER_MISSING',
            message: `target_character_id ${rule.target_character_id} not in anchor index`,
            severity: 'error',
            field: rule.replacement_id,
          });
        }
        if (rule.identity_anchor_required !== true) {
          issues.push({
            code: 'IDENTITY_ANCHOR_NOT_REQUIRED',
            message: `Canonical target ${rule.target_character_id} must have identity_anchor_required=true`,
            severity: 'error',
            field: rule.replacement_id,
          });
        }
        if (!rule.continuity_locks.some((l) => l.includes('identity'))) {
          issues.push({
            code: 'CONTINUITY_LOCKS_INCOMPLETE',
            message: `${rule.replacement_id} missing identity continuity locks`,
            severity: 'error',
          });
        }
      }

      if (targetIds.has(rule.target_character_id) && CORE_IDS.includes(rule.target_character_id as (typeof CORE_IDS)[number])) {
        const dupRule = contract.replacements.filter((r) => r.target_character_id === rule.target_character_id);
        if (dupRule.length > 1 && rule.replacement_priority === 1) {
          issues.push({
            code: 'DUPLICATE_REPLACEMENT_BLOCKED',
            message: `Duplicate priority-1 replacement for ${rule.target_character_id}`,
            severity: 'error',
          });
        }
      }
      targetIds.add(rule.target_character_id);

      if (rule.forbidden_replacements.includes('gamja_to_aengdu') || rule.forbidden_replacements.includes('aengdu_to_gamja')) {
        // ok
      } else if (rule.target_character_id === 'gamja' || rule.target_character_id === 'aengdu') {
        issues.push({
          code: 'FORBIDDEN_SWAP_NOT_LISTED',
          message: `${rule.replacement_id} must forbid companion swaps`,
          severity: 'error',
        });
      }
    }

    const cr = contract.companion_rules;
    if (
      !cr.rules.includes('gonegi_must_keep_gamja_nearby_when_scene_allows') ||
      !cr.rules.includes('dana_must_keep_aengdu_nearby_when_scene_allows') ||
      !cr.rules.includes('do_not_swap_gamja_and_aengdu') ||
      cr.gonegi_gamja_pair !== true ||
      cr.dana_aengdu_pair !== true ||
      cr.no_companion_swap !== true
    ) {
      issues.push({
        code: 'COMPANION_RULES_INCOMPLETE',
        message: 'companion_rules must include Gonegi/Gamja and Dana/Aengdu pairing with no swap',
        severity: 'error',
      });
      companionRules = 'FAIL';
    } else {
      companionRules = 'PASS';
    }

    if (
      contract.identity_rules.identity_priority_rank !== 1 ||
      contract.identity_rules.no_source_override_of_canonical_cast !== true ||
      contract.identity_rules.no_extra_gonegi_dana_duplication !== true ||
      contract.identity_rules.absent_roles_must_not_appear !== true
    ) {
      issues.push({
        code: 'IDENTITY_RULES_INCOMPLETE',
        message: 'identity_rules must preserve rank 1 and canonical cast protection',
        severity: 'error',
      });
      identityPriority = 'FAIL';
    } else {
      identityPriority = 'PASS';
    }

    if (
      contract.duplication_guard.enabled !== true ||
      contract.duplication_guard.max_instances_per_character !== 1 ||
      !contract.duplication_guard.blocked_duplicate_roles.includes('gonegi') ||
      !contract.duplication_guard.blocked_duplicate_roles.includes('dana')
    ) {
      issues.push({
        code: 'DUPLICATION_GUARD_INCOMPLETE',
        message: 'duplication_guard must block duplicate canonical cast instances',
        severity: 'error',
      });
      duplicationGuard = 'FAIL';
    } else {
      duplicationGuard = 'PASS';
    }

    if (contract.absent_character_rule.strategy !== 'inject_only_active_scene_characters') {
      issues.push({
        code: 'ABSENT_CHARACTER_RULE_MISSING',
        message: 'absent_character_rule must use inject_only_active_scene_characters strategy',
        severity: 'error',
      });
    }

    const flags = contract.execution_flags;
    if (
      flags.design_only !== true ||
      flags.gpu_execution !== false ||
      flags.external_call_allowed !== false ||
      flags.frame_extraction !== false ||
      flags.ocr !== false ||
      flags.generation !== false
    ) {
      issues.push({
        code: 'EXECUTION_FLAGS_INVALID',
        message: 'execution_flags must be design-only with all execution disabled',
        severity: 'error',
      });
    }
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const final_verdict =
    errors.length === 0 &&
    contract !== null &&
    replacementContract === 'PASS' &&
    Object.values(coreLinks).every((s) => s === 'linked') &&
    companionRules === 'PASS' &&
    identityPriority === 'PASS' &&
    duplicationGuard === 'PASS'
      ? REPLACEMENT_PASS_VERDICT
      : REPLACEMENT_FAIL_VERDICT;

  return {
    report_id: 'character-replacement-contract-report-v1',
    phase: REPLACEMENT_PHASE,
    timestamp,
    replacement_contract: replacementContract,
    gonegi: coreLinks.gonegi,
    dana: coreLinks.dana,
    gamja: coreLinks.gamja,
    aengdu: coreLinks.aengdu,
    companion_rules: companionRules,
    identity_priority: identityPriority,
    duplication_guard: duplicationGuard,
    design_only: true,
    gpu_execution: false,
    final_verdict,
    issues,
  };
}

function buildMarkdown(
  report: CharacterReplacementContractReport,
  contract: CharacterReplacementContract | null
): string {
  const lines = [
    '# Character Replacement Contract Summary',
    '',
    `**Phase:** ${REPLACEMENT_PHASE}`,
    `**Verdict:** ${report.final_verdict}`,
    `**Timestamp:** ${report.timestamp}`,
    '',
    '## Pass Metrics',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| replacement_contract | ${report.replacement_contract} |`,
    `| gonegi | ${report.gonegi} |`,
    `| dana | ${report.dana} |`,
    `| gamja | ${report.gamja} |`,
    `| aengdu | ${report.aengdu} |`,
    `| companion_rules | ${report.companion_rules} |`,
    `| identity_priority | ${report.identity_priority} |`,
    `| duplication_guard | ${report.duplication_guard} |`,
    `| design_only | ${report.design_only} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    '',
    '## Core Mappings',
    '',
    '| Source Role | Target Character |',
    '|-------------|------------------|',
    '| protagonist_a | Gonegi |',
    '| protagonist_b | Dana |',
    '| solitary_figure | Dana |',
    '| child_observer | Gonegi |',
    '| animal_companion_a | Gamja |',
    '| animal_companion_b | Aengdu |',
    '| background_adult | living_world_background_actor |',
    '| crowd_member | living_world_crowd_actor |',
    '',
    '## Companion Rules',
    '',
    '- Gonegi must keep Gamja nearby when scene allows',
    '- Dana must keep Aengdu nearby when scene allows',
    '- Do not swap Gamja and Aengdu',
    '',
  ];

  if (contract) {
    lines.push('## Replacement Rules', '');
    for (const rule of contract.replacements) {
      lines.push(
        `- **${rule.source_role}** → ${rule.target_character_name} (${rule.target_character_id})`
      );
    }
    lines.push('');
  }

  lines.push('## Pipeline Chain', '', '```');
  lines.push(
    'source character role → gonegi character identity → identity-safe scene state → video generation-ready state'
  );
  lines.push('```', '');

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] **${issue.code}**: ${issue.message}`);
    }
    lines.push('');
  }

  lines.push('## Artifacts', '');
  lines.push(`- Static Contract: \`${REPLACEMENT_STATIC_CONTRACT_PATH}\``);
  lines.push(`- Built Contract: \`${REPLACEMENT_CONTRACT_PATH}\``);
  lines.push(`- Registry: \`${REPLACEMENT_REGISTRY_PATH}\``);
  lines.push(`- Report: \`${REPLACEMENT_REPORT_PATH}\``);
  lines.push('');

  return lines.join('\n');
}

export function writeCharacterReplacementContractReport(projectRoot?: string): {
  report: CharacterReplacementContractReport;
  contract: CharacterReplacementContract | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const report = validateCharacterReplacementContract(root);
  const contract = loadCharacterReplacementContract(root);

  fs.writeFileSync(path.join(root, REPLACEMENT_REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, REPLACEMENT_MD_PATH), buildMarkdown(report, contract), 'utf8');

  return { report, contract };
}
