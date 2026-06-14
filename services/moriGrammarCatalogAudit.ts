import fs from 'node:fs';
import path from 'node:path';
import {
  MORI_GRAMMAR_CATALOG_PATH,
  MORI_GRAMMAR_CATALOG_REPORT_PATH,
  MORI_GRAMMAR_CATALOG_VERSION,
  writeMoriGrammarCatalog,
  type MoriGrammarCatalog,
} from './moriGrammarCatalog.js';

export type MoriGrammarCatalogAuditResult = 'PASS' | 'FAIL';

export type MoriGrammarCatalogViolation = {
  code: string;
  message: string;
  field?: string;
};

export type MoriGrammarCatalogReport = {
  auditTimestamp: string;
  auditResult: MoriGrammarCatalogAuditResult;
  catalog_version: typeof MORI_GRAMMAR_CATALOG_VERSION;
  sources: MoriGrammarCatalog['sources'];
  candidate_counts: MoriGrammarCatalog['candidate_counts'];
  source_candidate_counts: MoriGrammarCatalog['source_candidate_counts'];
  quality_targets: {
    daily_life: number;
    object_interaction: number;
    animal: number;
    extra_actor: number;
  };
  forbidden_field_scan: {
    passed: boolean;
    hits: readonly string[];
  };
  violations: readonly MoriGrammarCatalogViolation[];
  audit_codes: readonly string[];
  grammar_only_ready: boolean;
};

const QUALITY_MINIMUMS = Object.freeze({
  daily_life: 20,
  object_interaction: 15,
  animal: 5,
  extra_actor: 5,
});

const FORBIDDEN_CHECKS: Array<[readonly string[], string]> = [
  [
    ['image_prompt', 'negative_prompt', 'prompt_intent', 'compiled_image_prompt', 'prompt'],
    'FAIL_PROMPT_FIELD',
  ],
  [['scene_function', 'story_grammar', 'narrative_beat', 'storyboard'], 'FAIL_STORY_FIELD'],
  [
    ['character_dna', 'gonegi', 'dana', 'character_key', 'outfit_key'],
    'FAIL_CHARACTER_DNA',
  ],
  [['style_core', 'master_style_core', 'master_style', 'brushwork'], 'FAIL_STYLE_CORE'],
  [['env_dna', 'environment_dna', 'atmosphere_profile'], 'FAIL_ENV_DNA'],
  [['render_rule', 'render_law', 'render_rules', 'renderer_input'], 'FAIL_RENDER_RULE'],
];

function containsAny(haystack: string, tokens: readonly string[]): string | null {
  for (const token of tokens) {
    if (haystack.includes(token)) {
      return token;
    }
  }
  return null;
}

export function auditMoriGrammarCatalog(catalog: MoriGrammarCatalog): MoriGrammarCatalogReport {
  const violations: MoriGrammarCatalogViolation[] = [];
  const serialized = JSON.stringify(catalog).toLowerCase();
  const forbiddenHits: string[] = [];

  for (const key of Object.keys(QUALITY_MINIMUMS) as Array<keyof typeof QUALITY_MINIMUMS>) {
    const minimum = QUALITY_MINIMUMS[key];
    const count = catalog.candidate_counts[key];
    if (count < minimum) {
      violations.push({
        code: 'FAIL_QUALITY_TARGET',
        message: `${key} count ${count} below minimum ${minimum}`,
        field: key,
      });
    }
  }

  for (const [tokens, code] of FORBIDDEN_CHECKS) {
    const hit = containsAny(serialized, tokens);
    if (hit !== null) {
      forbiddenHits.push(hit);
      violations.push({
        code,
        message: `Forbidden token detected: ${hit}`,
      });
    }
  }

  if (serialized.includes('negative_prompt')) {
    forbiddenHits.push('negative_prompt');
    violations.push({
      code: 'FAIL_PROMPT_FIELD',
      message: 'Negative prompt field detected',
    });
  }

  const auditCodes = [...new Set(violations.map((violation) => violation.code))];
  const auditResult: MoriGrammarCatalogAuditResult = violations.length === 0 ? 'PASS' : 'FAIL';

  return Object.freeze({
    auditTimestamp: new Date().toISOString(),
    auditResult,
    catalog_version: MORI_GRAMMAR_CATALOG_VERSION,
    sources: catalog.sources,
    candidate_counts: catalog.candidate_counts,
    source_candidate_counts: catalog.source_candidate_counts,
    quality_targets: QUALITY_MINIMUMS,
    forbidden_field_scan: Object.freeze({
      passed: forbiddenHits.length === 0,
      hits: Object.freeze(forbiddenHits),
    }),
    violations: Object.freeze(violations),
    audit_codes: Object.freeze(auditCodes),
    grammar_only_ready: forbiddenHits.length === 0,
  });
}

export function runMoriGrammarCatalogAudit(projectRoot: string): MoriGrammarCatalogReport {
  const catalog = writeMoriGrammarCatalog(projectRoot);
  const report = auditMoriGrammarCatalog(catalog);
  fs.writeFileSync(
    path.join(projectRoot, MORI_GRAMMAR_CATALOG_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
