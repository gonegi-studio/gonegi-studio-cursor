import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import { runPbrpRuntimeExecutionPreparation } from '../services/pbrpRuntimeOrchestrator.js';
import {
  translatePbrpOutputToAiStudioInput,
  NOT_DERIVABLE_PLACEHOLDER,
} from '../services/pbrpAiStudioInputTranslator.js';

/**
 * PHASE-PBRP-AI-STUDIO-INPUT-TRANSLATION-002: AI Studio Input Translation
 * Integration Validation V1.
 *
 * Validates PHASE-001's translator against the REAL pre-generation code in
 * `E:\Gonegi-AIStudio\AIStudio-App\services\geminiService.ts` (read-only --
 * never modified, never called, never imported). Real image generation is
 * explicitly out of scope here, deferred to a separate human validation
 * step, per this phase's own "실제 이미지 생성은 별도 Human Validation으로
 * 분리" instruction.
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
// Real verification: AIStudio-App read-only analysis, evidenced by exact
// grep results against the real file (not paraphrased from memory)
// =========================================================================
const AI_STUDIO_GEMINI_SERVICE = 'E:/Gonegi-AIStudio/AIStudio-App/services/geminiService.ts';
let realFileContent = '';
try {
  realFileContent = fs.readFileSync(AI_STUDIO_GEMINI_SERVICE, 'utf8');
  check('real_analysis.ai_studio_source_readable', true);
} catch (e) {
  check('real_analysis.ai_studio_source_readable', false, e instanceof Error ? e.message : 'read error');
}

if (realFileContent) {
  // Finding 1: the real layoutContext template unconditionally interpolates
  // all five dna.* fields -- this is the exact real code this phase's fix
  // targets. Confirmed present, byte for byte.
  const realLayoutTemplateLine = realFileContent.includes(
    '` [LAYOUT DNA: PERSPECTIVE: ${layoutBlueprint.dna.perspective} | COMPOSITION: ${layoutBlueprint.dna.composition} | GEOMETRY: ${layoutBlueprint.dna.structuralGeometry} | LAYERS: ${layoutBlueprint.dna.depthLayers} | SCALE: ${layoutBlueprint.dna.scale}]`'
  );
  check('real_analysis.confirmed_unguarded_layout_template', realLayoutTemplateLine);

  // Finding 2: negative_prompt is never referenced in this file at all --
  // the real live-generation call has no negative-prompt channel.
  const hasNegativePrompt = /negative_prompt|negativePrompt/.test(realFileContent);
  check('real_analysis.confirmed_no_negative_prompt_channel', !hasNegativePrompt, 'geminiService.ts should contain zero negative_prompt/negativePrompt references');

  // Finding 3: dnaCore is declared as a parameter but never referenced
  // again in the file.
  const dnaCoreOccurrences = (realFileContent.match(/dnaCore/g) || []).length;
  check('real_analysis.confirmed_dnaCore_unused', dnaCoreOccurrences === 1, `expected exactly 1 occurrence (the parameter declaration itself), found ${dnaCoreOccurrences}`);

  // scenario and timeKey ARE real, referenced inputs (positive control --
  // confirms the file we're reading really is the one that matters, and
  // that not everything in it is unused).
  check('real_analysis.confirmed_scenario_is_used', realFileContent.includes('NARRATIVE: ${scenario}'));
  check('real_analysis.confirmed_timeKey_is_used', realFileContent.includes('environmentDNA?.[timeKey'));
}

/**
 * A faithful, minimal, read-only reproduction of the REAL layoutContext
 * construction logic from `geminiService.ts` (the exact line quoted above),
 * used ONLY to test what would happen to the translator's output if it
 * really were fed into that real code -- this file never imports from or
 * calls the real app.
 */
function simulateRealLayoutContextTemplate(dna: { perspective: string; composition: string; structuralGeometry: string; depthLayers: string; scale: string }): string {
  return ` [LAYOUT DNA: PERSPECTIVE: ${dna.perspective} | COMPOSITION: ${dna.composition} | GEOMETRY: ${dna.structuralGeometry} | LAYERS: ${dna.depthLayers} | SCALE: ${dna.scale}]`;
}

// =========================================================================
// 1. Translator 출력 -> AI Studio 입력 필드 매핑
// =========================================================================
{
  const titanicRun = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_INPUT, 'ai_studio', 'titanic');
  const t = translatePbrpOutputToAiStudioInput(titanicRun);
  check('1_mapping.pass', t.pass === true);
  check('1_mapping.layoutBlueprint_all_fields_are_strings', !!t.contract?.layoutBlueprint && Object.values(t.contract.layoutBlueprint).every((v) => typeof v === 'string' && v.length > 0), JSON.stringify(t.contract?.layoutBlueprint));
  // Titanic's style descriptor has no perspective data -- confirm that
  // field is exactly the exported placeholder constant (not some other
  // ad-hoc empty-ish value that would also happen to be a non-empty string).
  check('1_mapping.titanic_perspective_is_exact_placeholder_constant', t.contract?.layoutBlueprint?.perspective === NOT_DERIVABLE_PLACEHOLDER, t.contract?.layoutBlueprint?.perspective);
}

// =========================================================================
// 2. Scenario / Time / Layout 전달 -- simulated against the REAL template
//    logic, not just checked for presence
// =========================================================================
{
  for (const [label, input, source] of [['titanic', TITANIC_INPUT, 'titanic'], ['spirited_away', SPIRITED_INPUT, 'spirited_away']] as const) {
    const run = runPbrpRuntimeExecutionPreparation(projectRoot, input, 'ai_studio', source);
    const t = translatePbrpOutputToAiStudioInput(run);
    check(`2_delivery.${label}.scenario_nonempty`, !!t.contract?.scenario && t.contract.scenario.length > 0);
    check(`2_delivery.${label}.timeKey_present`, !!t.contract?.timeKey);
    if (t.contract?.layoutBlueprint) {
      const simulated = simulateRealLayoutContextTemplate(t.contract.layoutBlueprint);
      check(`2_delivery.${label}.simulated_real_template_has_no_literal_undefined`, !simulated.includes('undefined'), simulated);
    } else {
      check(`2_delivery.${label}.layoutBlueprint_present`, false, 'expected a non-null layoutBlueprint for a passing run with a resolved style');
    }
  }
}

// =========================================================================
// 3. Character Reference 경계 유지
// =========================================================================
{
  const titanicRun = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_INPUT, 'ai_studio', 'titanic');
  const t = translatePbrpOutputToAiStudioInput(titanicRun);
  const contractKeys = t.contract ? Object.keys(t.contract) : [];
  check('3_character_boundary.no_visual_dna_key', !contractKeys.includes('visual_dna'));
  check('3_character_boundary.character_reference_shape_distinct_from_visual_dna', !!t.contract?.character_reference && 'pbrp_anchor_id' in t.contract.character_reference && 'semantic_note' in t.contract.character_reference);
  // Confirmed via §real_analysis above: even if character_reference were
  // plugged into the real dnaCore parameter slot, it has zero effect on
  // real generation -- documented, not silently assumed.
  check('3_character_boundary.inertness_documented_in_traceability', !!t.traceability?.character_reference_source.includes('NOT mapped to visual_dna'));
}

// =========================================================================
// 4. Fixed StyleCore 유지
// =========================================================================
{
  const titanicRun = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_INPUT, 'ai_studio', 'titanic');
  const t = translatePbrpOutputToAiStudioInput(titanicRun);
  const contractKeys = t.contract ? Object.keys(t.contract) : [];
  check('4_style_core.never_produced', !contractKeys.includes('styleCore') && !contractKeys.includes('art_style'));
  check('4_style_core.listed_as_omitted', !!t.traceability?.omitted_fields.includes('styleCore'), JSON.stringify(t.traceability?.omitted_fields));
}

// =========================================================================
// 5. 누락/오염 입력 차단
// =========================================================================
{
  const failedRun = runPbrpRuntimeExecutionPreparation(projectRoot, 'A quiet abstract scene about mathematics and geometry.', 'ai_studio', 'titanic');
  const t1 = translatePbrpOutputToAiStudioInput(failedRun);
  check('5_input_guard.rejects_failed_run', t1.pass === false && t1.contract === null);

  const okRun = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_INPUT, 'ai_studio', 'titanic');
  const corrupted = { ...okRun, scene_context: null };
  const t2 = translatePbrpOutputToAiStudioInput(corrupted);
  check('5_input_guard.rejects_missing_scene_context', t2.pass === false && t2.validation_errors.includes('MISSING_SCENE_CONTEXT'));
}

// =========================================================================
// 6. Deterministic 반복성
// =========================================================================
{
  const runs = Array.from({ length: 5 }, () => {
    const r = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_INPUT, 'ai_studio', 'titanic');
    return translatePbrpOutputToAiStudioInput(r);
  });
  const serialized = runs.map((t) => JSON.stringify(t));
  check('6_determinism.5x_identical', serialized.every((s) => s === serialized[0]));
}

// =========================================================================
// Compliance
// =========================================================================
{
  const translatorContent = fs.readFileSync(path.join(projectRoot, 'services/pbrpAiStudioInputTranslator.ts'), 'utf8');
  const importLines = translatorContent.split('\n').filter((l) => /^\s*import\b/.test(l));
  check('compliance.no_ai_studio_app_import', !importLines.some((l) => l.includes('AIStudio-App') || l.includes('Gonegi-AIStudio')));
  const apiPattern = /fetch\(|axios|http\.request|https\.request|openai|anthropic|XMLHttpRequest|WebSocket|process\.env\.[A-Z_]*KEY/i;
  check('compliance.api_free', !apiPattern.test(translatorContent));
  check('compliance.no_path_b_reference', !translatorContent.includes('parseRuntimeSpatialGraph') && !translatorContent.includes('movieDataset:'));
}

// --- Report ---------------------------------------------------------------
const REPORT_DIR = 'reports/project_brain_integration';
const REPORT_PATH = 'reports/project_brain_integration/pbrp-ai-studio-input-translation-v2-integration-report.json';
fs.mkdirSync(path.join(projectRoot, REPORT_DIR), { recursive: true });
fs.writeFileSync(
  path.join(projectRoot, REPORT_PATH),
  `${JSON.stringify({ phase: 'PHASE-PBRP-AI-STUDIO-INPUT-TRANSLATION-002', generated_at: new Date().toISOString(), results, issues }, null, 2)}\n`,
  'utf8'
);

const checkCount = Object.keys(results).length;
const failCount = issues.length;

console.log(issues.length === 0 ? 'PASS_PBRP_AI_STUDIO_INPUT_TRANSLATION_002_V1' : 'FAIL_PBRP_AI_STUDIO_INPUT_TRANSLATION_002_V1');
console.log([`total_checks=${checkCount}`, `pass_count=${checkCount - failCount}`, `fail_count=${failCount}`].join(' | '));

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`[error] ${issue}`);
  }
  process.exit(1);
}

process.exit(0);
