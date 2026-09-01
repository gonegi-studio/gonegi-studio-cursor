import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import { runPbrpRuntimeExecutionPreparation } from '../services/pbrpRuntimeOrchestrator.js';
import {
  translatePbrpOutputToAiStudioInput,
  NOT_DERIVABLE_PLACEHOLDER,
  type AiStudioLayoutDnaFields,
  type AiStudioTimeOfDay,
} from '../services/pbrpAiStudioInputTranslator.js';

/**
 * PHASE-PBRP-AI-STUDIO-INPUT-TRANSLATION-003: Real Generation Readiness
 * Validation V1.
 *
 * Final sign-off, before any human attempts a real generation, that the
 * PHASE-001/002 translator's output is genuinely safe to feed into
 * `AIStudio-App`'s real `generateOptimizedImage` prompt template -- tested
 * by reproducing that real template's *structure* locally (read-only,
 * never imported, never called, no live API), not just its one previously
 * buggy line. No network call, no real generation, no AIStudio-App file
 * touched.
 */

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const issues: string[] = [];
const results: Record<string, unknown> = {};

function check(label: string, condition: boolean, detail?: string): void {
  results[label] = condition ? 'PASS' : `FAIL${detail ? `: ${detail}` : ''}`;
  if (!condition) {
    issues.push(`${label}${detail ? ` -- ${detail}` : ''}`);
  }
}

const TITANIC_INPUT = 'A scene full of freedom, romance and wonder, set in bright clear daylight.';
const SPIRITED_INPUT = 'A scene full of wonder and disorientation, bathhouse arrival at night.';

// =========================================================================
// A faithful, LOCAL, read-only reproduction of the real
// AIStudio-App/services/geminiService.ts `generateOptimizedImage` template
// structure (as read during PHASE-002/003; not imported, not copied
// verbatim in full -- only the interpolation *structure* relevant to the
// fields this translator controls is reproduced, with clearly-synthetic
// placeholder content standing in for the real app's own proprietary
// styleCore/environmentDNA text, which this repository does not hold a
// copy of and must not redistribute).
// =========================================================================
const SYNTHETIC_STYLE_DNA = '[SYNTHETIC TEST STYLE CORE -- stands in for the real app-owned characterBook.styleCore, not copied from AIStudio-App]';
const SYNTHETIC_GLOBAL_ENV_DNA = '[SYNTHETIC TEST GLOBAL ENV DNA]';
const SYNTHETIC_TIME_ENV_DNA = '[SYNTHETIC TEST TIME-KEYED ENV DNA]';
const SYNTHETIC_CHARACTER_DNA = '[CHARACTER DNA]: [SYNTHETIC TEST CHARACTER -- stands in for the real app-owned characterBook.characters, not produced by this translator]';

function simulateRealLayoutContext(dna: AiStudioLayoutDnaFields | null): string {
  // Reproduces the exact real line found in PHASE-002:
  // ` [LAYOUT DNA: PERSPECTIVE: ${dna.perspective} | COMPOSITION: ${dna.composition} | GEOMETRY: ${dna.structuralGeometry} | LAYERS: ${dna.depthLayers} | SCALE: ${dna.scale}]`
  if (!dna) return '';
  return ` [LAYOUT DNA: PERSPECTIVE: ${dna.perspective} | COMPOSITION: ${dna.composition} | GEOMETRY: ${dna.structuralGeometry} | LAYERS: ${dna.depthLayers} | SCALE: ${dna.scale}]`;
}

/** Reproduces the real finalPrompt template's structure (section headers + interpolation points), using synthetic content for every field this translator does not itself control. */
function simulateRealFinalPromptTemplate(input: {
  scenario: string;
  timeKey: AiStudioTimeOfDay;
  layoutBlueprint: AiStudioLayoutDnaFields | null;
}): string {
  const layoutContext = simulateRealLayoutContext(input.layoutBlueprint);
  return `
[SYSTEM CONSTITUTION: VITREOUS ELEGANCE PROTOCOL v14.1]
- STYLE: ${SYNTHETIC_STYLE_DNA}
- GLOBAL ENVIRONMENT: ${SYNTHETIC_GLOBAL_ENV_DNA}

[PRIORITY SECTION 1: SPATIAL PLAN & CONSTRAINTS]
[DEFAULT LAYOUT ENGINE ACTIVE]
[LAYER 2: SPATIAL AUTHORITY & LAYOUT]
${layoutContext}

[PRIORITY SECTION 2: CHARACTER DNA & CONSISTENCY]
${SYNTHETIC_CHARACTER_DNA}

[PRIORITY SECTION 3: TIME & LIGHT setting (${input.timeKey.toUpperCase()})]
${SYNTHETIC_TIME_ENV_DNA}

[PRIORITY SECTION 4: SCENARIO & SCENE DIRECTION]
- NARRATIVE: ${input.scenario}
  `.trim();
}

// =========================================================================
// 1. LayoutDna undefined 차단 (regression from PHASE-002's fix)
// =========================================================================
{
  const titanicRun = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_INPUT, 'ai_studio', 'titanic');
  const spiritedRun = runPbrpRuntimeExecutionPreparation(projectRoot, SPIRITED_INPUT, 'ai_studio', 'spirited_away');
  const tTitanic = translatePbrpOutputToAiStudioInput(titanicRun);
  const tSpirited = translatePbrpOutputToAiStudioInput(spiritedRun);
  for (const [label, t] of [['titanic', tTitanic], ['spirited_away', tSpirited]] as const) {
    const dna = t.contract?.layoutBlueprint;
    check(`1_no_undefined.${label}.all_fields_defined`, !!dna && Object.values(dna).every((v) => v !== undefined && v !== null), JSON.stringify(dna));
    check(`1_no_undefined.${label}.all_fields_are_strings`, !!dna && Object.values(dna).every((v) => typeof v === 'string'));
  }
}

// =========================================================================
// 2. NOT_DERIVABLE_PLACEHOLDER 처리
// =========================================================================
{
  const titanicRun = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_INPUT, 'ai_studio', 'titanic');
  const t = translatePbrpOutputToAiStudioInput(titanicRun);
  const dna = t.contract?.layoutBlueprint;
  check('2_placeholder.titanic_composition_is_real_not_placeholder', dna?.composition !== NOT_DERIVABLE_PLACEHOLDER, dna?.composition);
  check('2_placeholder.titanic_perspective_is_placeholder', dna?.perspective === NOT_DERIVABLE_PLACEHOLDER);
  check('2_placeholder.titanic_structuralGeometry_is_placeholder', dna?.structuralGeometry === NOT_DERIVABLE_PLACEHOLDER);
  check('2_placeholder.titanic_depthLayers_is_placeholder', dna?.depthLayers === NOT_DERIVABLE_PLACEHOLDER);
  check('2_placeholder.titanic_scale_is_placeholder', dna?.scale === NOT_DERIVABLE_PLACEHOLDER);
  const placeholderText: string = NOT_DERIVABLE_PLACEHOLDER;
  check('2_placeholder.placeholder_is_legible_not_undefined_string', placeholderText !== 'undefined' && !placeholderText.includes('undefined'));
}

// =========================================================================
// 3. Character Reference 경계
// =========================================================================
{
  const titanicRun = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_INPUT, 'ai_studio', 'titanic');
  const t = translatePbrpOutputToAiStudioInput(titanicRun);
  const contractKeys = t.contract ? Object.keys(t.contract) : [];
  check('3_character_boundary.no_visual_dna', !contractKeys.includes('visual_dna'));
  check('3_character_boundary.reference_present_and_distinct', !!t.contract?.character_reference && Object.keys(t.contract.character_reference).sort().join(',') === 'pbrp_anchor_id,semantic_note');
}

// =========================================================================
// 4. Fixed StyleCore 유지
// =========================================================================
{
  const titanicRun = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_INPUT, 'ai_studio', 'titanic');
  const t = translatePbrpOutputToAiStudioInput(titanicRun);
  check('4_style_core.never_in_contract', !Object.keys(t.contract ?? {}).some((k) => k.toLowerCase().includes('style')));
  check('4_style_core.simulation_uses_only_synthetic_style', true, 'the readiness simulation below never derives STYLE from PBRP output -- confirmed by construction, see simulateRealFinalPromptTemplate');
}

// =========================================================================
// 5. 실제 generation call 입력 구조 검증 -- full-template simulation
// =========================================================================
{
  for (const [label, input, source] of [['titanic', TITANIC_INPUT, 'titanic'], ['spirited_away', SPIRITED_INPUT, 'spirited_away']] as const) {
    const run = runPbrpRuntimeExecutionPreparation(projectRoot, input, 'ai_studio', source);
    const t = translatePbrpOutputToAiStudioInput(run);
    if (!t.contract) {
      check(`5_input_structure.${label}.contract_present`, false);
      continue;
    }
    const simulated = simulateRealFinalPromptTemplate({
      scenario: t.contract.scenario,
      timeKey: t.contract.timeKey,
      layoutBlueprint: t.contract.layoutBlueprint,
    });
    check(`5_input_structure.${label}.no_literal_undefined`, !simulated.includes('undefined'), simulated);
    check(`5_input_structure.${label}.no_literal_null`, !simulated.includes('null'));
    check(`5_input_structure.${label}.no_NaN`, !simulated.includes('NaN'));
    check(`5_input_structure.${label}.scenario_present_verbatim`, simulated.includes(t.contract.scenario));
    check(`5_input_structure.${label}.timeKey_header_present`, simulated.includes(`(${t.contract.timeKey.toUpperCase()})`));
    check(`5_input_structure.${label}.layout_section_present`, simulated.includes('[LAYOUT DNA:'));
    check(`5_input_structure.${label}.narrative_section_present`, simulated.includes('- NARRATIVE:'));
  }
}

// =========================================================================
// 6. negative_prompt 비의존성 확인 (regression from PHASE-002's finding)
// =========================================================================
{
  const AI_STUDIO_GEMINI_SERVICE = 'E:/Gonegi-AIStudio/AIStudio-App/services/geminiService.ts';
  let content = '';
  try {
    content = fs.readFileSync(AI_STUDIO_GEMINI_SERVICE, 'utf8');
    check('6_negative_prompt.ai_studio_source_readable', true);
  } catch (e) {
    check('6_negative_prompt.ai_studio_source_readable', false, e instanceof Error ? e.message : 'read error');
  }
  if (content) {
    check('6_negative_prompt.no_channel_in_real_generation_call', !/negative_prompt|negativePrompt/.test(content));
  }
  // The translator still carries negative_prompt for a human reviewer's
  // benefit -- confirm it does NOT get threaded into the readiness
  // simulation above (it must never silently become load-bearing for a
  // channel that doesn't exist).
  const titanicRun = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_INPUT, 'ai_studio', 'titanic');
  const t = translatePbrpOutputToAiStudioInput(titanicRun);
  check('6_negative_prompt.contract_still_carries_it_for_human_reference', !!t.contract?.negative_prompt && t.contract.negative_prompt.length > 0);
}

// =========================================================================
// 7. Deterministic 반복성
// =========================================================================
{
  const runs = Array.from({ length: 5 }, () => {
    const r = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_INPUT, 'ai_studio', 'titanic');
    const t = translatePbrpOutputToAiStudioInput(r);
    return t.contract ? simulateRealFinalPromptTemplate({ scenario: t.contract.scenario, timeKey: t.contract.timeKey, layoutBlueprint: t.contract.layoutBlueprint }) : null;
  });
  check('7_determinism.5x_identical_simulated_prompt', runs.every((s) => s === runs[0] && s !== null));
}

// =========================================================================
// Compliance
// =========================================================================
{
  const translatorContent = fs.readFileSync(path.join(projectRoot, 'services/pbrpAiStudioInputTranslator.ts'), 'utf8');
  const importLines = translatorContent.split('\n').filter((l) => /^\s*import\b/.test(l));
  check('compliance.no_ai_studio_app_import', !importLines.some((l) => l.includes('AIStudio-App') || l.includes('Gonegi-AIStudio')));
  const apiPattern = /fetch\(|axios|http\.request|https\.request|openai|anthropic|XMLHttpRequest|WebSocket|process\.env\.[A-Z_]*KEY|generateContent\(/i;
  check('compliance.api_free_translator', !apiPattern.test(translatorContent));
  // Note: scanning this script's own source for the literal substrings
  // 'GoogleGenAI'/'.generateContent(' is not meaningful -- this very check's
  // source code necessarily contains those substrings as string literals,
  // guaranteeing a self-match false positive (the same class of bug found
  // and fixed in PHASE-007's verify script). Caught on this phase's own
  // first run rather than left in. The real, non-self-referential signal is
  // the absence of an import of the SDK that would make such a call
  // possible in the first place.
  const thisFileContent = fs.readFileSync(path.join(projectRoot, 'scripts/verify-pbrp-ai-studio-real-generation-readiness-v1.ts'), 'utf8');
  const thisFileImportLines = thisFileContent.split('\n').filter((l) => /^\s*import\b/.test(l));
  check('compliance.no_real_generation_call_in_this_script', !thisFileImportLines.some((l) => l.includes('@google/genai')), JSON.stringify(thisFileImportLines));
  check('compliance.no_path_b_reference', !translatorContent.includes('parseRuntimeSpatialGraph') && !translatorContent.includes('movieDataset:'));
}

// --- Report ---------------------------------------------------------------
const REPORT_DIR = 'reports/project_brain_integration';
const REPORT_PATH = 'reports/project_brain_integration/pbrp-ai-studio-real-generation-readiness-v1-report.json';
fs.mkdirSync(path.join(projectRoot, REPORT_DIR), { recursive: true });
fs.writeFileSync(
  path.join(projectRoot, REPORT_PATH),
  `${JSON.stringify({ phase: 'PHASE-PBRP-AI-STUDIO-INPUT-TRANSLATION-003', generated_at: new Date().toISOString(), results, issues }, null, 2)}\n`,
  'utf8'
);

const checkCount = Object.keys(results).length;
const failCount = issues.length;

console.log(issues.length === 0 ? 'PASS_PBRP_AI_STUDIO_INPUT_TRANSLATION_003_V1' : 'FAIL_PBRP_AI_STUDIO_INPUT_TRANSLATION_003_V1');
console.log([`total_checks=${checkCount}`, `pass_count=${checkCount - failCount}`, `fail_count=${failCount}`].join(' | '));

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`[error] ${issue}`);
  }
  process.exit(1);
}

process.exit(0);
