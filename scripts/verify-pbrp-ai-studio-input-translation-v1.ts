import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import { runPbrpRuntimeExecutionPreparation } from '../services/pbrpRuntimeOrchestrator.js';
import {
  translatePbrpOutputToAiStudioInput,
  NOT_DERIVABLE_PLACEHOLDER,
  type AiStudioTimeOfDay,
} from '../services/pbrpAiStudioInputTranslator.js';

/**
 * PHASE-PBRP-AI-STUDIO-INPUT-TRANSLATION-001: PBRP -> AI Studio Path-A
 * Input Translation V1.
 *
 * Validates the translator against real PBRP pipeline output (Titanic +
 * Spirited Away sources), the real AI Studio Path-A schema (as documented
 * in PBRP_AI_STUDIO_INPUT_SCHEMA_MAPPING_DESIGN_V1.md), field-loss/
 * mis-mapping blocking, the Character DNA meaning boundary, TimeKey
 * translation, layout data preservation, determinism, and regression. No
 * network call, no AI Studio code touched, no real generation triggered.
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
const GOLDEN_HOUR_INPUT = 'A tenderness and longing farewell scene at golden hour, with grief and impermanence, gentle rain in the air.';
const NO_MATCH_INPUT = 'A quiet abstract scene about mathematics and geometry.';

// =========================================================================
// 1. Real AI Studio Schema 기준 매핑 -- the mirrored schema's real values,
//    cross-checked against the actual AIStudio-App/types.ts values recorded
//    in the design doc (not re-read from that project here -- this repo
//    does not depend on it; the check is against the *documented* schema)
// =========================================================================
{
  const REAL_TIME_OF_DAY_VALUES: AiStudioTimeOfDay[] = ['dawn', 'morning', 'afternoon', 'late_afternoon', 'sunset', 'night', 'dream', 'spiritual', 'global'];
  const titanicRun = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_INPUT, 'ai_studio', 'titanic');
  const translation = translatePbrpOutputToAiStudioInput(titanicRun);
  check('1_schema.translation_pass', translation.pass === true, JSON.stringify(translation.validation_errors));
  check('1_schema.timeKey_is_real_enum_value', !!translation.contract && REAL_TIME_OF_DAY_VALUES.includes(translation.contract.timeKey), translation.contract?.timeKey);
  check('1_schema.contract_version_present', translation.contract?.contract_version === 'ai_studio_input_contract_v1');
}

// =========================================================================
// 2. 필드 누락/오매핑 차단 -- incomplete PBRP results must be rejected, not
//    silently translated into a partial/misleading contract
// =========================================================================
{
  const failedRun = runPbrpRuntimeExecutionPreparation(projectRoot, NO_MATCH_INPUT, 'ai_studio', 'titanic');
  check('2_validation.failed_pbrp_run_precondition', failedRun.pass === false, 'test setup: this run must itself fail for the check below to be meaningful');
  const translation = translatePbrpOutputToAiStudioInput(failedRun);
  check('2_validation.rejects_failed_pbrp_run', translation.pass === false);
  check('2_validation.contract_null_on_rejection', translation.contract === null);
  check('2_validation.error_identifies_cause', translation.validation_errors.some((e) => e.includes('PBRP_RESULT_NOT_PASSING')), JSON.stringify(translation.validation_errors));

  // A synthetic, malformed "passing" result (missing selection) must also
  // be rejected -- not just results where result.pass is already false.
  const passingRun = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_INPUT, 'ai_studio', 'titanic');
  const tampered = { ...passingRun, selection: null };
  const tamperedTranslation = translatePbrpOutputToAiStudioInput(tampered);
  check('2_validation.rejects_missing_selection_even_if_pass_true', tamperedTranslation.pass === false && tamperedTranslation.validation_errors.some((e) => e.includes('MISSING_CHARACTER_SELECTION')), JSON.stringify(tamperedTranslation.validation_errors));
}

// =========================================================================
// 3. Character DNA 의미 혼동 방지 -- the contract must never contain a
//    field literally named/shaped like visual_dna, and character_reference
//    must be clearly, structurally distinct from it
// =========================================================================
{
  const titanicRun = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_INPUT, 'ai_studio', 'titanic');
  const translation = translatePbrpOutputToAiStudioInput(titanicRun);
  const contractKeys = translation.contract ? Object.keys(translation.contract) : [];
  check('3_character_boundary.no_visual_dna_field', !contractKeys.includes('visual_dna') && !contractKeys.includes('characterBook'));
  check('3_character_boundary.character_reference_present', !!translation.contract?.character_reference);
  check('3_character_boundary.character_reference_uses_pbrp_anchor_id_not_visual_dna', translation.contract?.character_reference?.pbrp_anchor_id === titanicRun.selection?.character?.anchor_id);
  check('3_character_boundary.omitted_fields_lists_visual_dna', !!translation.traceability?.omitted_fields.some((f) => f.includes('visual_dna')), JSON.stringify(translation.traceability?.omitted_fields));
  check('3_character_boundary.traceability_discloses_boundary', !!translation.traceability?.character_reference_source.includes('NOT mapped to visual_dna'), translation.traceability?.character_reference_source);
}

// =========================================================================
// 4. TimeKey 변환 검증 -- all 4 real PBRP time_of_day values, exact
//    expected mapping per the disclosed table
// =========================================================================
{
  const cases: Array<{ input: string; source: 'titanic' | 'spirited_away'; expected: AiStudioTimeOfDay; label: string }> = [
    { input: TITANIC_INPUT, source: 'titanic', expected: 'afternoon', label: 'day->afternoon' },
    { input: GOLDEN_HOUR_INPUT, source: 'titanic', expected: 'sunset', label: 'golden_hour->sunset' },
    { input: SPIRITED_INPUT, source: 'spirited_away', expected: 'night', label: 'night->night' },
  ];
  for (const c of cases) {
    const run = runPbrpRuntimeExecutionPreparation(projectRoot, c.input, 'ai_studio', c.source);
    const translation = translatePbrpOutputToAiStudioInput(run);
    check(`4_timekey.${c.label}`, translation.contract?.timeKey === c.expected, `got ${translation.contract?.timeKey}`);
  }
  // unspecified -> global: craft an input with an emotion match but no lighting keyword.
  // Deliberately avoids the substring "day" anywhere (pbrpIntentAnalyzer.ts's
  // TIME_OF_DAY_KEYWORDS matches via plain substring inclusion, so a phrase
  // like "no time of day mentioned" would incidentally self-defeat this
  // negative case by containing "day" inside "time of day" -- caught during
  // this phase's own first run, fixed here rather than papered over).
  const noLightingRun = runPbrpRuntimeExecutionPreparation(projectRoot, 'A scene of freedom, romance and wonder, indoors.', 'ai_studio', 'titanic');
  const noLightingTranslation = translatePbrpOutputToAiStudioInput(noLightingRun);
  check('4_timekey.unspecified->global', noLightingTranslation.contract?.timeKey === 'global', `got ${noLightingTranslation.contract?.timeKey}`);
}

// =========================================================================
// 5. Layout 데이터 보존 -- source-specific real data must survive into the
//    contract unaltered, not fabricated or dropped
// =========================================================================
{
  const spiritedRun = runPbrpRuntimeExecutionPreparation(projectRoot, SPIRITED_INPUT, 'ai_studio', 'spirited_away');
  const spiritedTranslation = translatePbrpOutputToAiStudioInput(spiritedRun);
  const realStyle = spiritedRun.selection?.style;
  check('5_layout.spirited_depthLayers_populated', !!spiritedTranslation.contract?.layoutBlueprint?.depthLayers);
  check('5_layout.spirited_perspective_uses_placeholder_not_fabricated', spiritedTranslation.contract?.layoutBlueprint?.perspective === NOT_DERIVABLE_PLACEHOLDER, 'perspective has no PBRP data source; must be the explicit placeholder, never fabricated, and never undefined (see PHASE-002 finding on AIStudio-App\'s unguarded template interpolation)');
  if (realStyle) {
    const fmbMatch = realStyle.descriptor.match(/foreground=([^,]+), midground=([^,]+), background=(.+)/);
    const depthLayers = spiritedTranslation.contract?.layoutBlueprint?.depthLayers ?? '';
    check('5_layout.spirited_values_traceable_to_real_style_descriptor', !!fmbMatch && depthLayers.includes(fmbMatch[1].trim()), depthLayers);
  }

  const titanicRun = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_INPUT, 'ai_studio', 'titanic');
  const titanicTranslation = translatePbrpOutputToAiStudioInput(titanicRun);
  check('5_layout.titanic_composition_populated', !!titanicTranslation.contract?.layoutBlueprint?.composition);
  check('5_layout.titanic_depthLayers_uses_placeholder_not_fabricated', titanicTranslation.contract?.layoutBlueprint?.depthLayers === NOT_DERIVABLE_PLACEHOLDER, 'Titanic source has no foreground/midground/background data; must be the explicit placeholder, never fabricated, and never undefined');
}

// =========================================================================
// 6. Deterministic Translation
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
// Compliance: no import from AIStudio-App, no network/API pattern
// =========================================================================
{
  const content = fs.readFileSync(path.join(projectRoot, 'services/pbrpAiStudioInputTranslator.ts'), 'utf8');
  const importLines = content.split('\n').filter((l) => /^\s*import\b/.test(l));
  const anyImportReferencesAiStudioApp = importLines.some((l) => l.includes('AIStudio-App') || l.includes('Gonegi-AIStudio'));
  check('compliance.no_ai_studio_app_import', !anyImportReferencesAiStudioApp, JSON.stringify(importLines));
  const apiPattern = /fetch\(|axios|http\.request|https\.request|openai|anthropic|XMLHttpRequest|WebSocket|process\.env\.[A-Z_]*KEY/i;
  check('compliance.api_free', !apiPattern.test(content));
}

// --- Report ---------------------------------------------------------------
const REPORT_DIR = 'reports/project_brain_integration';
const REPORT_PATH = 'reports/project_brain_integration/pbrp-ai-studio-input-translation-v1-report.json';
fs.mkdirSync(path.join(projectRoot, REPORT_DIR), { recursive: true });
fs.writeFileSync(
  path.join(projectRoot, REPORT_PATH),
  `${JSON.stringify({ phase: 'PHASE-PBRP-AI-STUDIO-INPUT-TRANSLATION-001', generated_at: new Date().toISOString(), results, issues }, null, 2)}\n`,
  'utf8'
);

const checkCount = Object.keys(results).length;
const failCount = issues.length;

console.log(issues.length === 0 ? 'PASS_PBRP_AI_STUDIO_INPUT_TRANSLATION_001_V1' : 'FAIL_PBRP_AI_STUDIO_INPUT_TRANSLATION_001_V1');
console.log([`total_checks=${checkCount}`, `pass_count=${checkCount - failCount}`, `fail_count=${failCount}`].join(' | '));

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`[error] ${issue}`);
  }
  process.exit(1);
}

process.exit(0);
