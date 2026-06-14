import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import {
  DIRECTOR_GRAMMAR_PHASE,
  DIRECTOR_GRAMMAR_REGISTRY_PATH,
  DIRECTOR_GRAMMAR_SCHEMA_PATH,
  EXTRACTABLE_FAMILIES,
  FAMILY_GRAMMAR_PATHS,
  type DirectorGrammarProfile,
  type ExtractableFamily,
  type GrammarBlock,
  extractAllDirectorGrammarProfiles,
  familyForVideoId,
  loadSourceVideoFinalSet,
} from './directorGrammarExtractor.js';
import {
  FINALIZATION_PASS_VERDICT,
  FINALIZATION_REPORT_PATH,
} from './sourceVideoFinalSetValidator.js';
import { FINAL_SET_PATH } from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DIRECTOR_GRAMMAR_PASS_VERDICT = 'PASS_DIRECTOR_GRAMMAR_EXTRACTION_V1' as const;
export const DIRECTOR_GRAMMAR_FAIL_VERDICT = 'FAIL_DIRECTOR_GRAMMAR_EXTRACTION_V1' as const;
export const DIRECTOR_GRAMMAR_REPORT_PATH =
  'reports/director-grammar-extraction-report.json' as const;
export const DIRECTOR_GRAMMAR_MD_PATH = 'reports/DIRECTOR_GRAMMAR_EXTRACTION_SUMMARY.md' as const;

const REQUIRED_GRAMMAR_FIELDS = [
  'grammar_id',
  'source_family',
  'visual_style',
  'camera_grammar',
  'lighting_grammar',
  'blocking_grammar',
  'emotion_grammar',
  'environment_grammar',
  'motion_grammar',
  'transition_grammar',
  'use_case',
] as const;

const FORBIDDEN_ARCHIVE_IDS = ['TEST_KIKI_25S'] as const;

export type ValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
};

export type FamilyValidationResult = {
  source_family: ExtractableFamily;
  status: 'PASS' | 'FAIL';
  issues: ValidationIssue[];
};

export type DirectorGrammarExtractionReport = {
  extraction_id: string;
  phase: typeof DIRECTOR_GRAMMAR_PHASE;
  timestamp: string;
  families: number;
  family_results: Record<ExtractableFamily, 'PASS' | 'FAIL'>;
  family_validations: FamilyValidationResult[];
  registry_status: 'PASS' | 'FAIL';
  source_links_status: 'PASS' | 'FAIL';
  no_gpu: true;
  design_only: true;
  final_verdict: typeof DIRECTOR_GRAMMAR_PASS_VERDICT | typeof DIRECTOR_GRAMMAR_FAIL_VERDICT;
  issues: ValidationIssue[];
};

function validateGrammarBlock(block: GrammarBlock, field: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!block.summary?.trim()) {
    issues.push({
      code: 'MISSING_FIELD',
      message: `${field}.summary required`,
      severity: 'error',
      field,
    });
  }
  if (!block.patterns?.length) {
    issues.push({
      code: 'MISSING_FIELD',
      message: `${field}.patterns required`,
      severity: 'error',
      field,
    });
  }
  return issues;
}

function validateUpstreamFinalization(projectRoot: string): ValidationIssue[] {
  const root = resolveProjectRoot(projectRoot);
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, FINAL_SET_PATH))) {
    issues.push({
      code: 'MISSING_FINAL_SET',
      message: `Missing ${FINAL_SET_PATH}`,
      severity: 'error',
    });
    return issues;
  }

  const reportPath = path.join(root, FINALIZATION_REPORT_PATH);
  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'MISSING_UPSTREAM_REPORT',
      message: `Missing ${FINALIZATION_REPORT_PATH}`,
      severity: 'error',
    });
    return issues;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as { final_verdict?: string };
  if (report.final_verdict !== FINALIZATION_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_NOT_PASS',
      message: `Final set report must be ${FINALIZATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return issues;
}

export function validateDirectorGrammarProfile(
  projectRoot: string,
  profile: DirectorGrammarProfile
): FamilyValidationResult {
  const issues: ValidationIssue[] = [];
  const finalSet = loadSourceVideoFinalSet(projectRoot);

  if (!finalSet) {
    issues.push({
      code: 'MISSING_FINAL_SET',
      message: 'Cannot validate source links without final set',
      severity: 'error',
    });
    return { source_family: profile.source_family, status: 'FAIL', issues };
  }

  for (const field of REQUIRED_GRAMMAR_FIELDS) {
    const value = profile[field as keyof DirectorGrammarProfile];
    if (value == null || (Array.isArray(value) && value.length === 0)) {
      issues.push({
        code: 'MISSING_FIELD',
        message: `Missing required field: ${field}`,
        severity: 'error',
        field,
      });
    }
  }

  for (const blockField of [
    'visual_style',
    'camera_grammar',
    'lighting_grammar',
    'blocking_grammar',
    'emotion_grammar',
    'environment_grammar',
    'motion_grammar',
    'transition_grammar',
  ] as const) {
    issues.push(...validateGrammarBlock(profile[blockField], blockField));
  }

  if (profile.design_only !== true) {
    issues.push({
      code: 'PRODUCTION_MUTATION',
      message: 'design_only must be true',
      severity: 'error',
    });
  }
  if (profile.gpu_execution !== false) {
    issues.push({
      code: 'GPU_FORBIDDEN',
      message: 'gpu_execution must be false',
      severity: 'error',
    });
  }

  for (const videoId of profile.source_video_ids) {
    if ((FORBIDDEN_ARCHIVE_IDS as readonly string[]).includes(videoId)) {
      issues.push({
        code: 'FORBIDDEN_SOURCE_MIX',
        message: `Archive source ${videoId} must not appear in active grammar`,
        severity: 'error',
      });
    }

    const category = familyForVideoId(videoId, finalSet);
    if (!category) {
      issues.push({
        code: 'SOURCE_LINK_INVALID',
        message: `${videoId} not found in final set`,
        severity: 'error',
      });
      continue;
    }

    if (category !== profile.source_family) {
      issues.push({
        code: 'FORBIDDEN_SOURCE_MIX',
        message: `${videoId} is ${category} but profile is ${profile.source_family}`,
        severity: 'error',
      });
    }

    const entry = finalSet.videos.find((v) => v.source_video_id === videoId);
    if (!entry?.file_present) {
      issues.push({
        code: 'SOURCE_LINK_INVALID',
        message: `${videoId} file not present on disk`,
        severity: 'error',
      });
    }
  }

  const expectedActive = finalSet.videos.filter(
    (v) => v.tier === 'active' && v.category === profile.source_family
  );
  if (profile.source_video_ids.length !== expectedActive.length) {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `${profile.source_family} expected ${expectedActive.length} sources, got ${profile.source_video_ids.length}`,
      severity: 'error',
    });
  }

  return {
    source_family: profile.source_family,
    status: issues.filter((i) => i.severity === 'error').length === 0 ? 'PASS' : 'FAIL',
    issues,
  };
}

function validateRegistry(
  projectRoot: string,
  profiles: DirectorGrammarProfile[]
): ValidationIssue[] {
  const root = resolveProjectRoot(projectRoot);
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, DIRECTOR_GRAMMAR_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `Missing ${DIRECTOR_GRAMMAR_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  const registry = readJsonRecord(root, DIRECTOR_GRAMMAR_REGISTRY_PATH) as {
    grammar_profiles?: Array<{
      grammar_id: string;
      source_family: ExtractableFamily;
      profile_path: string;
      expected_source_count: number;
    }>;
  } | null;

  if (!registry?.grammar_profiles?.length) {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `Missing ${DIRECTOR_GRAMMAR_REGISTRY_PATH}`,
      severity: 'error',
    });
    return issues;
  }

  if (registry.grammar_profiles.length !== 4) {
    issues.push({
      code: 'REGISTRY_COUNT',
      message: `Expected 4 grammar profiles in registry, got ${registry.grammar_profiles.length}`,
      severity: 'error',
    });
  }

  for (const entry of registry.grammar_profiles) {
    const profile = profiles.find((p) => p.grammar_id === entry.grammar_id);
    if (!profile) {
      issues.push({
        code: 'REGISTRY_ORPHAN',
        message: `Registry missing built profile: ${entry.grammar_id}`,
        severity: 'error',
      });
    }
    if (!fs.existsSync(path.join(root, entry.profile_path))) {
      issues.push({
        code: 'MISSING_PROFILE_FILE',
        message: `Profile file missing: ${entry.profile_path}`,
        severity: 'error',
      });
    }
    if (profile && profile.source_video_ids.length !== entry.expected_source_count) {
      issues.push({
        code: 'REGISTRY_SOURCE_COUNT',
        message: `${entry.grammar_id} expected ${entry.expected_source_count} sources`,
        severity: 'error',
      });
    }
    const expectedPath = FAMILY_GRAMMAR_PATHS[entry.source_family];
    if (entry.profile_path !== expectedPath) {
      issues.push({
        code: 'REGISTRY_PATH_MISMATCH',
        message: `${entry.source_family} path mismatch`,
        severity: 'error',
      });
    }
  }

  return issues;
}

export function runDirectorGrammarValidation(
  projectRoot: string,
  profiles: DirectorGrammarProfile[]
): DirectorGrammarExtractionReport {
  const issues: ValidationIssue[] = [...validateUpstreamFinalization(projectRoot)];
  issues.push(...validateRegistry(projectRoot, profiles));

  const family_validations = profiles.map((p) =>
    validateDirectorGrammarProfile(projectRoot, p)
  );
  issues.push(...family_validations.flatMap((v) => v.issues));

  if (profiles.length !== 4) {
    issues.push({
      code: 'FAMILY_COUNT',
      message: `Expected 4 families, got ${profiles.length}`,
      severity: 'error',
    });
  }

  for (const family of EXTRACTABLE_FAMILIES) {
    if (!profiles.some((p) => p.source_family === family)) {
      issues.push({
        code: 'MISSING_FAMILY',
        message: `Missing grammar profile for ${family}`,
        severity: 'error',
      });
    }
  }

  const family_results = Object.fromEntries(
    EXTRACTABLE_FAMILIES.map((family) => {
      const validation = family_validations.find((v) => v.source_family === family);
      return [family, validation?.status ?? 'FAIL'];
    })
  ) as Record<ExtractableFamily, 'PASS' | 'FAIL'>;

  const registry_status = issues.some((i) =>
    ['MISSING_REGISTRY', 'REGISTRY_ORPHAN', 'REGISTRY_PATH_MISMATCH', 'REGISTRY_COUNT'].includes(
      i.code
    )
  )
    ? 'FAIL'
    : 'PASS';

  const source_links_status = issues.some((i) =>
    ['SOURCE_LINK_INVALID', 'FORBIDDEN_SOURCE_MIX', 'SOURCE_COUNT_MISMATCH'].includes(i.code)
  )
    ? 'FAIL'
    : 'PASS';

  const errors = issues.filter((i) => i.severity === 'error');
  const allFamiliesPass = EXTRACTABLE_FAMILIES.every((f) => family_results[f] === 'PASS');
  const pass =
    errors.length === 0 &&
    profiles.length === 4 &&
    allFamiliesPass &&
    registry_status === 'PASS' &&
    source_links_status === 'PASS';

  return {
    extraction_id: `director_grammar_${Date.now().toString(36)}`,
    phase: DIRECTOR_GRAMMAR_PHASE,
    timestamp: new Date().toISOString(),
    families: profiles.length,
    family_results: {
      GHIBLI: family_results.GHIBLI,
      SHINKAI: family_results.SHINKAI,
      LIVE_ACTION: family_results.LIVE_ACTION,
      MORI: family_results.MORI,
    },
    family_validations,
    registry_status,
    source_links_status,
    no_gpu: true,
    design_only: true,
    final_verdict: pass ? DIRECTOR_GRAMMAR_PASS_VERDICT : DIRECTOR_GRAMMAR_FAIL_VERDICT,
    issues,
  };
}

export function renderDirectorGrammarMarkdown(
  profiles: DirectorGrammarProfile[],
  report: DirectorGrammarExtractionReport
): string {
  const familyLines = profiles
    .map(
      (p) =>
        `- **${p.source_family}** (\`${p.grammar_id}\`): ${report.family_results[p.source_family]} · sources=${p.source_video_ids.join(', ')}`
    )
    .join('\n');

  return [
    '# Director Grammar Extraction Summary',
    '',
    '## Verdict',
    '',
    '| Field | Value |',
    '|-------|-------|',
    `| **Verdict** | ${report.final_verdict} |`,
    `| **Families** | ${report.families} |`,
    `| **GHIBLI** | ${report.family_results.GHIBLI} |`,
    `| **SHINKAI** | ${report.family_results.SHINKAI} |`,
    `| **LIVE_ACTION** | ${report.family_results.LIVE_ACTION} |`,
    `| **MORI** | ${report.family_results.MORI} |`,
    `| **Registry** | ${report.registry_status} |`,
    `| **Design only** | ${report.design_only} |`,
    `| **No GPU** | ${report.no_gpu} |`,
    '',
    '## Extracted Families',
    '',
    familyLines,
    '',
    '## Grammar Dimensions',
    '',
    'Each profile includes design-level blocks for:',
    '- visual_style',
    '- camera_grammar',
    '- lighting_grammar',
    '- blocking_grammar',
    '- emotion_grammar',
    '- environment_grammar',
    '- motion_grammar',
    '- transition_grammar',
    '',
    '## Safety',
    '',
    '- Design only — no frame extraction, OCR, GPU, generation, or production asset changes.',
    '- Source links validated against canonical final set only.',
    '- Next phase: Movie Scene Coordinate System (PHASE-SOURCE-VIDEO-004).',
    '',
    `*Generated ${report.timestamp} · ${report.phase}*`,
    '',
  ].join('\n');
}

export function writeDirectorGrammarExtractionReport(projectRoot: string): {
  profiles: DirectorGrammarProfile[];
  report: DirectorGrammarExtractionReport;
} {
  const root = resolveProjectRoot(projectRoot);
  const profiles = extractAllDirectorGrammarProfiles(root);
  const report = runDirectorGrammarValidation(root, profiles);

  const payload = {
    ...report,
    report_type: 'director_grammar_extraction_report',
    report_version: 'v1',
    export_path: DIRECTOR_GRAMMAR_REPORT_PATH,
    markdown_path: DIRECTOR_GRAMMAR_MD_PATH,
    schema_path: DIRECTOR_GRAMMAR_SCHEMA_PATH,
    registry_path: DIRECTOR_GRAMMAR_REGISTRY_PATH,
    final_set_path: FINAL_SET_PATH,
    profile_paths: profiles.map((p) => FAMILY_GRAMMAR_PATHS[p.source_family]),
    next_phase: 'PHASE-SOURCE-VIDEO-004 MOVIE_SCENE_COORDINATE_SYSTEM_V1',
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, DIRECTOR_GRAMMAR_REPORT_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, DIRECTOR_GRAMMAR_MD_PATH),
    `${renderDirectorGrammarMarkdown(profiles, report)}\n`,
    'utf8'
  );

  return { profiles, report };
}
