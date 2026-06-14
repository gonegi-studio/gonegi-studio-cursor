import fs from 'node:fs';
import path from 'node:path';
import {
  BLEND_CONTRACT_PATH,
  BLEND_PHASE,
  BLEND_PROFILE_PATH,
  BLEND_REGISTRY_PATH,
  BLEND_SCHEMA_PATH,
  type DirectorGrammarBlendProfile,
  loadAllDirectorGrammars,
  loadBlendContract,
  verifyDirectorGrammarPrecheck,
} from './directorGrammarBlendBuilder.js';
import {
  EXTRACTABLE_FAMILIES,
  FAMILY_GRAMMAR_PATHS,
  type ExtractableFamily,
} from './directorGrammarExtractor.js';
import { DIRECTOR_GRAMMAR_PASS_VERDICT, DIRECTOR_GRAMMAR_REPORT_PATH } from './directorGrammarValidator.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const BLEND_PASS_VERDICT = 'PASS_DIRECTOR_GRAMMAR_BLEND_CONTRACT_V1' as const;
export const BLEND_FAIL_VERDICT = 'FAIL_DIRECTOR_GRAMMAR_BLEND_CONTRACT_V1' as const;
export const BLEND_REPORT_PATH = 'reports/director-grammar-blend-report.json' as const;
export const BLEND_MD_PATH = 'reports/DIRECTOR_GRAMMAR_BLEND_SUMMARY.md' as const;

export type BlendValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
};

export type FamilyLinkStatus = 'linked' | 'missing' | 'unreferenced';

export type DirectorGrammarBlendReport = {
  report_id: string;
  phase: typeof BLEND_PHASE;
  timestamp: string;
  blend_profiles: number;
  family_links: Record<ExtractableFamily, FamilyLinkStatus>;
  conflicts: number;
  identity_priority: 'PASS' | 'FAIL';
  compatibility_score: number | null;
  registry_status: 'PASS' | 'FAIL';
  blend_references_valid: 'PASS' | 'FAIL';
  cyclic_overrides: 'PASS' | 'FAIL';
  design_only: true;
  gpu_execution: false;
  final_verdict: typeof BLEND_PASS_VERDICT | typeof BLEND_FAIL_VERDICT;
  issues: BlendValidationIssue[];
};

function loadBlendProfile(projectRoot: string): DirectorGrammarBlendProfile | null {
  const abs = path.join(projectRoot, BLEND_PROFILE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as DirectorGrammarBlendProfile;
}

function detectPriorityCycles(priorityOrder: string[]): boolean {
  const seen = new Set<string>();
  for (const item of priorityOrder) {
    if (seen.has(item)) return true;
    seen.add(item);
  }
  return false;
}

function familiesUsedInBlend(profile: DirectorGrammarBlendProfile): Set<ExtractableFamily> {
  return new Set([
    profile.base_style_family,
    profile.camera_family,
    profile.lighting_family,
    profile.blocking_family,
    profile.emotion_family,
    profile.motion_family,
    profile.environment_family,
  ]);
}

export function validateDirectorGrammarBlend(projectRoot?: string): DirectorGrammarBlendReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: BlendValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const precheckMissing = verifyDirectorGrammarPrecheck(root);
  if (precheckMissing.length > 0) {
    for (const rel of precheckMissing) {
      issues.push({
        code: 'MISSING_SOURCE_GRAMMAR',
        message: `Missing source grammar: ${rel}`,
        severity: 'error',
      });
    }
  }

  const grammarReportPath = path.join(root, DIRECTOR_GRAMMAR_REPORT_PATH);
  if (!fs.existsSync(grammarReportPath)) {
    issues.push({
      code: 'MISSING_UPSTREAM_REPORT',
      message: `Missing ${DIRECTOR_GRAMMAR_REPORT_PATH}. Run npm run verify:director-grammar first.`,
      severity: 'error',
    });
  } else {
    const grammarReport = JSON.parse(fs.readFileSync(grammarReportPath, 'utf8')) as {
      final_verdict?: string;
    };
    if (grammarReport.final_verdict !== DIRECTOR_GRAMMAR_PASS_VERDICT) {
      issues.push({
        code: 'UPSTREAM_GRAMMAR_NOT_PASS',
        message: `Director grammar extraction verdict is not ${DIRECTOR_GRAMMAR_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  const contract = loadBlendContract(root);
  if (!contract) {
    issues.push({
      code: 'MISSING_CONTRACT',
      message: `Missing ${BLEND_CONTRACT_PATH}`,
      severity: 'error',
    });
  }

  const grammars = loadAllDirectorGrammars(root);
  if (!grammars) {
    issues.push({
      code: 'INCOMPLETE_SOURCE_GRAMMARS',
      message: 'One or more director grammar profiles could not be loaded',
      severity: 'error',
    });
  }

  const profile = loadBlendProfile(root);
  if (!profile) {
    issues.push({
      code: 'MISSING_BLEND_PROFILE',
      message: `Missing ${BLEND_PROFILE_PATH}`,
      severity: 'error',
    });
  }

  const registryPath = path.join(root, BLEND_REGISTRY_PATH);
  let registryStatus: 'PASS' | 'FAIL' = 'FAIL';
  if (fs.existsSync(registryPath)) {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as {
      blend_profiles?: Array<{ blend_id: string; profile_path: string }>;
    };
    if (registry.blend_profiles?.length === 1) {
      const entry = registry.blend_profiles[0];
      if (entry.profile_path === BLEND_PROFILE_PATH && entry.blend_id === profile?.blend_id) {
        registryStatus = 'PASS';
      } else {
        issues.push({
          code: 'REGISTRY_PROFILE_MISMATCH',
          message: 'Registry blend profile path or id does not match built profile',
          severity: 'error',
        });
      }
    } else {
      issues.push({
        code: 'REGISTRY_BLEND_COUNT',
        message: 'Registry must contain exactly one blend profile',
        severity: 'error',
      });
    }
  } else {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `Missing ${BLEND_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const family_links: Record<ExtractableFamily, FamilyLinkStatus> = {
    GHIBLI: 'missing',
    SHINKAI: 'missing',
    LIVE_ACTION: 'missing',
    MORI: 'missing',
  };

  let blendReferencesValid: 'PASS' | 'FAIL' = 'FAIL';
  let cyclicOverrides: 'PASS' | 'FAIL' = 'FAIL';
  let identityPriority: 'PASS' | 'FAIL' = 'FAIL';
  let conflicts = 0;
  let compatibilityScore: number | null = null;

  if (profile && grammars) {
    for (const family of EXTRACTABLE_FAMILIES) {
      const refId = profile.source_grammar_refs[family];
      const grammar = grammars[family];
      if (!refId || refId !== grammar.grammar_id) {
        issues.push({
          code: 'INVALID_BLEND_REFERENCE',
          message: `Blend reference for ${family} does not match loaded grammar`,
          severity: 'error',
          field: `source_grammar_refs.${family}`,
        });
      } else if (!fs.existsSync(path.join(root, FAMILY_GRAMMAR_PATHS[family]))) {
        family_links[family] = 'missing';
      } else {
        family_links[family] = 'linked';
      }
    }

    const usedFamilies = familiesUsedInBlend(profile);
    for (const family of EXTRACTABLE_FAMILIES) {
      if (family_links[family] === 'linked' && !usedFamilies.has(family)) {
        family_links[family] = 'unreferenced';
        issues.push({
          code: 'FAMILY_UNREFERENCED',
          message: `${family} is linked but not assigned to any blend dimension`,
          severity: 'error',
        });
      }
    }

    blendReferencesValid = issues.some((i) => i.code === 'INVALID_BLEND_REFERENCE') ? 'FAIL' : 'PASS';

    if (profile.compatibility_score === undefined || profile.compatibility_score === null) {
      issues.push({
        code: 'MISSING_COMPATIBILITY_SCORE',
        message: 'compatibility_score is required',
        severity: 'error',
      });
    } else {
      compatibilityScore = profile.compatibility_score;
      if (contract && profile.compatibility_score < contract.minimum_compatibility_score) {
        issues.push({
          code: 'COMPATIBILITY_SCORE_LOW',
          message: `compatibility_score ${profile.compatibility_score} below minimum ${contract.minimum_compatibility_score}`,
          severity: 'error',
        });
      }
    }

    if (profile.priority_order[0] !== 'identity_priority') {
      issues.push({
        code: 'IDENTITY_PRIORITY_NOT_FIRST',
        message: 'identity_priority must be first in priority_order',
        severity: 'error',
      });
      identityPriority = 'FAIL';
    } else if (!profile.conflict_resolution.rules.includes('preserve_character_first_contract')) {
      issues.push({
        code: 'IDENTITY_PRIORITY_RULE_MISSING',
        message: 'conflict_resolution.rules must include preserve_character_first_contract',
        severity: 'error',
      });
      identityPriority = 'FAIL';
    } else {
      identityPriority = 'PASS';
    }

    conflicts = profile.conflict_resolution.unresolved_conflicts;
    if (conflicts !== 0) {
      issues.push({
        code: 'UNRESOLVED_CONFLICTS',
        message: `Expected conflicts=0, got ${conflicts}`,
        severity: 'error',
      });
    }

    if (detectPriorityCycles(profile.priority_order)) {
      issues.push({
        code: 'CYCLIC_PRIORITY_ORDER',
        message: 'priority_order contains duplicate entries (cyclic override risk)',
        severity: 'error',
      });
      cyclicOverrides = 'FAIL';
    } else if (profile.conflict_resolution.rules.includes('no_cyclic_family_override')) {
      cyclicOverrides = 'PASS';
    } else {
      issues.push({
        code: 'CYCLIC_OVERRIDE_RULE_MISSING',
        message: 'conflict_resolution.rules must include no_cyclic_family_override',
        severity: 'error',
      });
      cyclicOverrides = 'FAIL';
    }

    if (contract) {
      const expected = contract.family_assignment;
      const actual = {
        base_style_family: profile.base_style_family,
        camera_family: profile.camera_family,
        lighting_family: profile.lighting_family,
        blocking_family: profile.blocking_family,
        emotion_family: profile.emotion_family,
        motion_family: profile.motion_family,
        environment_family: profile.environment_family,
      };
      for (const [key, expectedFamily] of Object.entries(expected)) {
        if (actual[key as keyof typeof actual] !== expectedFamily) {
          issues.push({
            code: 'CONTRACT_FAMILY_MISMATCH',
            message: `${key} expected ${expectedFamily}, got ${actual[key as keyof typeof actual]}`,
            severity: 'error',
          });
        }
      }
    }

    for (const dim of [
      'visual_style',
      'camera_grammar',
      'lighting_grammar',
      'blocking_grammar',
      'emotion_grammar',
      'motion_grammar',
      'environment_grammar',
    ] as const) {
      const block = profile.blended_grammar[dim];
      if (!block.source_grammar_id || !block.source_family) {
        issues.push({
          code: 'INCOMPLETE_BLENDED_BLOCK',
          message: `${dim} missing source provenance`,
          severity: 'error',
          field: `blended_grammar.${dim}`,
        });
      }
    }

    if (profile.execution_flags.design_only !== true || profile.execution_flags.gpu_execution !== false) {
      issues.push({
        code: 'EXECUTION_FLAGS_INVALID',
        message: 'Blend profile must have design_only=true and gpu_execution=false',
        severity: 'error',
      });
    }
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const blendProfileCount = profile ? 1 : 0;

  const final_verdict =
    errors.length === 0 &&
    blendProfileCount === 1 &&
    Object.values(family_links).every((s) => s === 'linked') &&
    conflicts === 0 &&
    identityPriority === 'PASS' &&
    cyclicOverrides === 'PASS' &&
    blendReferencesValid === 'PASS' &&
    registryStatus === 'PASS'
      ? BLEND_PASS_VERDICT
      : BLEND_FAIL_VERDICT;

  return {
    report_id: 'director-grammar-blend-report-v1',
    phase: BLEND_PHASE,
    timestamp,
    blend_profiles: blendProfileCount,
    family_links,
    conflicts,
    identity_priority: identityPriority,
    compatibility_score: compatibilityScore,
    registry_status: registryStatus,
    blend_references_valid: blendReferencesValid,
    cyclic_overrides: cyclicOverrides,
    design_only: true,
    gpu_execution: false,
    final_verdict,
    issues,
  };
}

function buildMarkdown(report: DirectorGrammarBlendReport, profile: DirectorGrammarBlendProfile | null): string {
  const lines = [
    '# Director Grammar Blend Summary',
    '',
    `**Phase:** ${BLEND_PHASE}`,
    `**Verdict:** ${report.final_verdict}`,
    `**Timestamp:** ${report.timestamp}`,
    '',
    '## Pass Metrics',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| blend_profiles | ${report.blend_profiles} |`,
    `| ghibli | ${report.family_links.GHIBLI} |`,
    `| shinkai | ${report.family_links.SHINKAI} |`,
    `| live_action | ${report.family_links.LIVE_ACTION} |`,
    `| mori | ${report.family_links.MORI} |`,
    `| conflicts | ${report.conflicts} |`,
    `| identity_priority | ${report.identity_priority} |`,
    `| compatibility_score | ${report.compatibility_score ?? 'n/a'} |`,
    `| design_only | ${report.design_only} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    '',
    '## Canonical Blend Contract',
    '',
    '| Dimension | Source Family |',
    '|-----------|---------------|',
    '| visual_style | GHIBLI |',
    '| camera_grammar | SHINKAI |',
    '| lighting_grammar | SHINKAI |',
    '| blocking_grammar | LIVE_ACTION |',
    '| emotion_grammar | GHIBLI |',
    '| motion_grammar | MORI |',
    '| environment_grammar | GHIBLI |',
    '',
  ];

  if (profile) {
    lines.push('## Built Profile', '', `**blend_id:** ${profile.blend_id}`, '');
    lines.push('### Priority Order', '');
    for (const item of profile.priority_order) {
      lines.push(`- ${item}`);
    }
    lines.push('');
    lines.push('### Conflict Resolution', '');
    lines.push(`- strategy: ${profile.conflict_resolution.strategy}`);
    lines.push(`- resolved_conflicts: ${profile.conflict_resolution.resolved_conflicts}`);
    lines.push(`- unresolved_conflicts: ${profile.conflict_resolution.unresolved_conflicts}`);
    lines.push('');
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] **${issue.code}**: ${issue.message}`);
    }
    lines.push('');
  }

  lines.push('## Chain Position', '');
  lines.push('```');
  lines.push(
    'source videos → director grammar extraction → director grammar blend → [video state compiler]'
  );
  lines.push('```');
  lines.push('');
  lines.push('## Artifacts', '');
  lines.push(`- Contract: \`${BLEND_CONTRACT_PATH}\``);
  lines.push(`- Registry: \`${BLEND_REGISTRY_PATH}\``);
  lines.push(`- Profile: \`${BLEND_PROFILE_PATH}\``);
  lines.push(`- Report: \`${BLEND_REPORT_PATH}\``);
  lines.push('');

  return lines.join('\n');
}

export function writeDirectorGrammarBlendReport(projectRoot?: string): {
  report: DirectorGrammarBlendReport;
  profile: DirectorGrammarBlendProfile | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const report = validateDirectorGrammarBlend(root);
  const profile = loadBlendProfile(root);

  fs.writeFileSync(path.join(root, BLEND_REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, BLEND_MD_PATH), buildMarkdown(report, profile), 'utf8');

  return { report, profile };
}
