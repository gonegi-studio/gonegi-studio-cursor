import fs from 'node:fs';
import path from 'node:path';
import { BLEND_CONTRACT_PATH } from './directorGrammarBlendBuilder.js';
import { EXTRACTABLE_FAMILIES, type ExtractableFamily } from './directorGrammarExtractor.js';
import {
  STATE_COMPILER_PASS_VERDICT,
  STATE_COMPILER_REPORT_PATH,
} from './sourceVideoCoordinateToStateValidator.js';
import { STATE_DRAFT_REGISTRY_PATH } from './sourceVideoCoordinateToStateCompiler.js';
import {
  LIVING_WORLD_ADAPTER_BOUNDARY_PATH,
  LIVING_WORLD_CORE_PATH,
  LIVING_WORLD_FOUNDATION_INDEX_PATH,
  LIVING_WORLD_INTEGRITY_INDEX_PATH,
  TARGET_WORLD_IDENTITY,
  TRANSLATION_CONTRACT_PATH,
  TRANSLATION_PHASE,
  TRANSLATION_PROFILE_ID,
  TRANSLATION_PROFILE_PATH,
  TRANSLATION_REGISTRY_PATH,
  TRANSLATION_SCHEMA_PATH,
  type GonegiWorldTranslationProfile,
  loadGonegiWorldTranslation,
} from './gonegiWorldTranslationBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const TRANSLATION_PASS_VERDICT = 'PASS_GONEGI_WORLD_TRANSLATION_CONTRACT_V1' as const;
export const TRANSLATION_FAIL_VERDICT = 'FAIL_GONEGI_WORLD_TRANSLATION_CONTRACT_V1' as const;
export const TRANSLATION_REPORT_PATH = 'reports/gonegi-world-translation-report.json' as const;
export const TRANSLATION_MD_PATH = 'reports/GONEGI_WORLD_TRANSLATION_SUMMARY.md' as const;

const TRANSLATION_DIMENSIONS = [
  'character_translation',
  'location_translation',
  'prop_translation',
  'environment_translation',
  'emotion_translation',
  'relationship_translation',
  'camera_translation',
  'lighting_translation',
  'motion_translation',
] as const;

export type TranslationValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
};

export type GonegiWorldTranslationReport = {
  report_id: string;
  phase: typeof TRANSLATION_PHASE;
  timestamp: string;
  translation_profiles: number;
  ghibli: 'PASS' | 'FAIL';
  shinkai: 'PASS' | 'FAIL';
  live_action: 'PASS' | 'FAIL';
  mori: 'PASS' | 'FAIL';
  identity_priority: 'PASS' | 'FAIL';
  continuity_rules: 'PASS' | 'FAIL';
  target_world: typeof TARGET_WORLD_IDENTITY;
  registry: 'PASS' | 'FAIL';
  living_world_refs: 'PASS' | 'FAIL';
  design_only: true;
  gpu_execution: false;
  final_verdict: typeof TRANSLATION_PASS_VERDICT | typeof TRANSLATION_FAIL_VERDICT;
  issues: TranslationValidationIssue[];
};

function validateExecutionFlags(profile: GonegiWorldTranslationProfile): TranslationValidationIssue[] {
  const flags = profile.execution_flags;
  if (
    flags.design_only !== true ||
    flags.gpu_execution !== false ||
    flags.external_call_allowed !== false ||
    flags.frame_extraction !== false ||
    flags.ocr !== false ||
    flags.generation !== false
  ) {
    return [
      {
        code: 'EXECUTION_FLAGS_INVALID',
        message: 'execution_flags must be design-only with all execution disabled',
        severity: 'error',
      },
    ];
  }
  return [];
}

export function validateGonegiWorldTranslation(
  projectRoot?: string
): GonegiWorldTranslationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: TranslationValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const stateReportPath = path.join(root, STATE_COMPILER_REPORT_PATH);
  if (!fs.existsSync(stateReportPath)) {
    issues.push({
      code: 'MISSING_STATE_COMPILER_REPORT',
      message: `Missing ${STATE_COMPILER_REPORT_PATH}. Run npm run verify:source-video-coordinate-to-state first.`,
      severity: 'error',
    });
  } else {
    const stateReport = JSON.parse(fs.readFileSync(stateReportPath, 'utf8')) as {
      final_verdict?: string;
    };
    if (stateReport.final_verdict !== STATE_COMPILER_PASS_VERDICT) {
      issues.push({
        code: 'UPSTREAM_STATE_COMPILER_NOT_PASS',
        message: `State compiler verdict is not ${STATE_COMPILER_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  if (!fs.existsSync(path.join(root, TRANSLATION_CONTRACT_PATH))) {
    issues.push({
      code: 'MISSING_CONTRACT',
      message: `Missing ${TRANSLATION_CONTRACT_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, STATE_DRAFT_REGISTRY_PATH))) {
    issues.push({
      code: 'MISSING_STATE_DRAFT_REGISTRY',
      message: `Missing ${STATE_DRAFT_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, BLEND_CONTRACT_PATH))) {
    issues.push({
      code: 'MISSING_BLEND_CONTRACT',
      message: `Missing ${BLEND_CONTRACT_PATH}`,
      severity: 'error',
    });
  }

  let registryStatus: 'PASS' | 'FAIL' = 'FAIL';
  const registryPath = path.join(root, TRANSLATION_REGISTRY_PATH);
  if (!fs.existsSync(registryPath)) {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `Missing ${TRANSLATION_REGISTRY_PATH}`,
      severity: 'error',
    });
  } else {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as {
      translation_profiles?: Array<{ translation_id: string; profile_path: string }>;
    };
    if (registry.translation_profiles?.length === 1) {
      const entry = registry.translation_profiles[0];
      if (
        entry.translation_id === TRANSLATION_PROFILE_ID &&
        entry.profile_path === TRANSLATION_PROFILE_PATH
      ) {
        registryStatus = 'PASS';
      } else {
        issues.push({
          code: 'REGISTRY_PROFILE_MISMATCH',
          message: 'Registry profile path or id does not match built profile',
          severity: 'error',
        });
      }
    } else {
      issues.push({
        code: 'REGISTRY_PROFILE_COUNT',
        message: 'Registry must contain exactly one translation profile',
        severity: 'error',
      });
    }
  }

  const profile = loadGonegiWorldTranslation(root);
  if (!profile) {
    issues.push({
      code: 'MISSING_PROFILE',
      message: `Missing ${TRANSLATION_PROFILE_PATH}`,
      severity: 'error',
    });
  }

  let ghibli: 'PASS' | 'FAIL' = 'FAIL';
  let shinkai: 'PASS' | 'FAIL' = 'FAIL';
  let live_action: 'PASS' | 'FAIL' = 'FAIL';
  let mori: 'PASS' | 'FAIL' = 'FAIL';
  let identityPriority: 'PASS' | 'FAIL' = 'FAIL';
  let continuityRules: 'PASS' | 'FAIL' = 'FAIL';
  let livingWorldRefs: 'PASS' | 'FAIL' = 'FAIL';

  if (profile) {
    if (profile.target_world_identity !== TARGET_WORLD_IDENTITY) {
      issues.push({
        code: 'INVALID_TARGET_WORLD',
        message: `target_world_identity must be ${TARGET_WORLD_IDENTITY}`,
        severity: 'error',
      });
    }

    for (const family of EXTRACTABLE_FAMILIES) {
      const ft = profile.family_translations[family];
      if (!ft) {
        issues.push({
          code: 'MISSING_FAMILY_TRANSLATION',
          message: `Missing family_translations.${family}`,
          severity: 'error',
        });
        continue;
      }
      if (ft.target_world_identity !== TARGET_WORLD_IDENTITY) {
        issues.push({
          code: 'FAMILY_TARGET_MISMATCH',
          message: `${family} target_world_identity must be ${TARGET_WORLD_IDENTITY}`,
          severity: 'error',
        });
      }
    }

    ghibli = profile.family_translation_status.GHIBLI;
    shinkai = profile.family_translation_status.SHINKAI;
    live_action = profile.family_translation_status.LIVE_ACTION;
    mori = profile.family_translation_status.MORI;

    for (const family of EXTRACTABLE_FAMILIES) {
      if (profile.family_translation_status[family] !== 'PASS') {
        issues.push({
          code: 'FAMILY_TRANSLATION_FAIL',
          message: `family_translation_status.${family} must be PASS`,
          severity: 'error',
        });
      }
    }

    for (const dim of TRANSLATION_DIMENSIONS) {
      const block = profile[dim];
      if (!block?.rules?.length) {
        issues.push({
          code: 'MISSING_TRANSLATION_DIMENSION',
          message: `${dim} requires rules`,
          severity: 'error',
          field: dim,
        });
      }
    }

    if (profile.character_translation.replacement_supported !== true) {
      issues.push({
        code: 'CHARACTER_REPLACEMENT_NOT_SUPPORTED',
        message: 'character_translation.replacement_supported must be true',
        severity: 'error',
      });
    }

    if (profile.location_translation.replacement_supported !== true) {
      issues.push({
        code: 'LOCATION_REPLACEMENT_NOT_SUPPORTED',
        message: 'location_translation.replacement_supported must be true',
        severity: 'error',
      });
    }

    if (profile.identity_rules.identity_priority_rank !== 1) {
      issues.push({
        code: 'IDENTITY_PRIORITY_NOT_RANK_1',
        message: 'identity_rules.identity_priority_rank must be 1',
        severity: 'error',
      });
      identityPriority = 'FAIL';
    } else if (
      profile.identity_rules.preserve_identity_locks !== true ||
      profile.identity_rules.preserve_face_geometry !== true
    ) {
      issues.push({
        code: 'IDENTITY_RULES_INCOMPLETE',
        message: 'identity_rules must preserve locks and face geometry',
        severity: 'error',
      });
      identityPriority = 'FAIL';
    } else {
      identityPriority = 'PASS';
    }

    if (
      !profile.continuity_rules?.rules?.length ||
      profile.continuity_rules.lock_preservation !== true ||
      profile.continuity_rules.layout_lock_required !== true
    ) {
      issues.push({
        code: 'CONTINUITY_RULES_INCOMPLETE',
        message: 'continuity_rules must include rules with lock_preservation and layout_lock_required',
        severity: 'error',
      });
      continuityRules = 'FAIL';
    } else {
      continuityRules = 'PASS';
    }

    const lw = profile.living_world_refs;
    const lwPaths = [
      lw.foundation_index,
      lw.integrity_index,
      lw.adapter_boundary_plan,
      lw.living_world_core,
    ];
    const lwExist = lwPaths.every((p) => fs.existsSync(path.join(root, p)));
    if (!lwExist || lw.world_identity !== TARGET_WORLD_IDENTITY) {
      issues.push({
        code: 'LIVING_WORLD_REFS_INVALID',
        message: 'living_world_refs paths must exist and world_identity must match',
        severity: 'error',
      });
      livingWorldRefs = 'FAIL';
    } else {
      const foundation = JSON.parse(
        fs.readFileSync(path.join(root, LIVING_WORLD_FOUNDATION_INDEX_PATH), 'utf8')
      ) as { world_identity?: string; verdict?: string };
      if (foundation.world_identity !== TARGET_WORLD_IDENTITY) {
        issues.push({
          code: 'LIVING_WORLD_IDENTITY_MISMATCH',
          message: 'Living world foundation world_identity mismatch',
          severity: 'error',
        });
        livingWorldRefs = 'FAIL';
      } else {
        livingWorldRefs = 'PASS';
      }
    }

    if (profile.source_state_draft_refs.length !== 4) {
      issues.push({
        code: 'STATE_DRAFT_REF_COUNT',
        message: 'source_state_draft_refs must contain 4 entries',
        severity: 'error',
      });
    }

    const blendContract = JSON.parse(
      fs.readFileSync(path.join(root, BLEND_CONTRACT_PATH), 'utf8')
    ) as { blend_id: string };
    if (profile.director_blend_ref !== blendContract.blend_id) {
      issues.push({
        code: 'BLEND_REF_MISMATCH',
        message: 'director_blend_ref must match blend contract blend_id',
        severity: 'error',
      });
    }

    issues.push(...validateExecutionFlags(profile));
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const translationProfiles = profile ? 1 : 0;

  const final_verdict =
    errors.length === 0 &&
    translationProfiles === 1 &&
    registryStatus === 'PASS' &&
    ghibli === 'PASS' &&
    shinkai === 'PASS' &&
    live_action === 'PASS' &&
    mori === 'PASS' &&
    identityPriority === 'PASS' &&
    continuityRules === 'PASS' &&
    livingWorldRefs === 'PASS'
      ? TRANSLATION_PASS_VERDICT
      : TRANSLATION_FAIL_VERDICT;

  return {
    report_id: 'gonegi-world-translation-report-v1',
    phase: TRANSLATION_PHASE,
    timestamp,
    translation_profiles: translationProfiles,
    ghibli,
    shinkai,
    live_action,
    mori,
    identity_priority: identityPriority,
    continuity_rules: continuityRules,
    target_world: TARGET_WORLD_IDENTITY,
    registry: registryStatus,
    living_world_refs: livingWorldRefs,
    design_only: true,
    gpu_execution: false,
    final_verdict,
    issues,
  };
}

function buildMarkdown(
  report: GonegiWorldTranslationReport,
  profile: GonegiWorldTranslationProfile | null
): string {
  const lines = [
    '# Gonegi World Translation Summary',
    '',
    `**Phase:** ${TRANSLATION_PHASE}`,
    `**Verdict:** ${report.final_verdict}`,
    `**Timestamp:** ${report.timestamp}`,
    '',
    '## Pass Metrics',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| translation_profiles | ${report.translation_profiles} |`,
    `| ghibli | ${report.ghibli} |`,
    `| shinkai | ${report.shinkai} |`,
    `| live_action | ${report.live_action} |`,
    `| mori | ${report.mori} |`,
    `| identity_priority | ${report.identity_priority} |`,
    `| continuity_rules | ${report.continuity_rules} |`,
    `| target_world | ${report.target_world} |`,
    `| living_world_refs | ${report.living_world_refs} |`,
    `| design_only | ${report.design_only} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    '',
    '## Family Translation Routes',
    '',
    '| Source Family | Source World | Target World |',
    '|---------------|--------------|--------------|',
    '| GHIBLI | ghibli_pastoral_fantasy | GONEGI_MEDITERRANEAN |',
    '| SHINKAI | shinkai_urban_contemplative | GONEGI_MEDITERRANEAN |',
    '| LIVE_ACTION | live_action_period_domestic | GONEGI_MEDITERRANEAN |',
    '| MORI | mori_woodland_craft_life | GONEGI_MEDITERRANEAN |',
    '',
  ];

  if (profile) {
    lines.push('## Translation Profile', '');
    lines.push(`**translation_id:** ${profile.translation_id}`);
    lines.push(`**director_blend_ref:** ${profile.director_blend_ref}`);
    lines.push('');
    lines.push('### Character Replacement Mappings', '');
    for (const [src, tgt] of Object.entries(profile.character_translation.mappings ?? {})) {
      lines.push(`- ${src} → ${tgt}`);
    }
    lines.push('');
    lines.push('### Location Replacement Mappings', '');
    for (const [src, tgt] of Object.entries(profile.location_translation.mappings ?? {})) {
      lines.push(`- ${src} → ${tgt}`);
    }
    lines.push('');
  }

  lines.push('## Pipeline Chain', '', '```');
  lines.push(
    'movie scene state → gonegi world scene state → video shot state → keyframe → motion → gpu payload'
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
  lines.push(`- Contract: \`${TRANSLATION_CONTRACT_PATH}\``);
  lines.push(`- Registry: \`${TRANSLATION_REGISTRY_PATH}\``);
  lines.push(`- Profile: \`${TRANSLATION_PROFILE_PATH}\``);
  lines.push(`- Report: \`${TRANSLATION_REPORT_PATH}\``);
  lines.push('');

  return lines.join('\n');
}

export function writeGonegiWorldTranslationReport(projectRoot?: string): {
  report: GonegiWorldTranslationReport;
  profile: GonegiWorldTranslationProfile | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const report = validateGonegiWorldTranslation(root);
  const profile = loadGonegiWorldTranslation(root);

  fs.writeFileSync(path.join(root, TRANSLATION_REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, TRANSLATION_MD_PATH), buildMarkdown(report, profile), 'utf8');

  return { report, profile };
}
